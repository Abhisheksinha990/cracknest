import * as pdfjsLib from 'pdfjs-dist';

// Safely configure pdfjs worker without causing module evaluation failures
const ensureWorkerSrc = () => {
  try {
    if (typeof window !== 'undefined' && pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      }
    }
  } catch (e) {
    console.warn("[FileParser] pdfjs worker configuration warning:", e);
  }
};

/**
 * Native Pure-JS PDF Buffer Stream Text Extractor
 * Extracts readable text from PDF streams (Tj, TJ operators, BT...ET blocks, and printable ASCII text)
 * Works 100% offline without external network or worker dependencies
 */
export const extractPdfTextNative = (arrayBuffer) => {
  try {
    const bytes = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('latin1');
    const raw = decoder.decode(bytes);

    let extractedStrings = [];

    // 1. Match (string) Tj operators
    const tjRegex = /\(([^()\r\n]+)\)\s*Tj/g;
    let match;
    while ((match = tjRegex.exec(raw)) !== null) {
      const str = match[1].replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
                          .replace(/\\(.)/g, '$1')
                          .trim();
      if (str.length >= 2 && /[a-zA-Z0-9]/.test(str)) {
        extractedStrings.push(str);
      }
    }

    // 2. Match [(string1) -10 (string2)] TJ operators
    const tjArrayRegex = /\[([^\]]+)\]\s*TJ/gi;
    while ((match = tjArrayRegex.exec(raw)) !== null) {
      const inner = match[1];
      const innerStrRegex = /\(([^()\r\n]+)\)/g;
      let innerMatch;
      let linePart = '';
      while ((innerMatch = innerStrRegex.exec(inner)) !== null) {
        const str = innerMatch[1].replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
                                 .replace(/\\(.)/g, '$1');
        linePart += str;
      }
      const cleanLine = linePart.trim();
      if (cleanLine.length >= 2 && /[a-zA-Z0-9]/.test(cleanLine)) {
        extractedStrings.push(cleanLine);
      }
    }

    // 3. Fallback: Printable ASCII text blocks if stream operators were compressed
    if (extractedStrings.length < 10) {
      const textBlocks = raw.match(/[\x20-\x7E\t\r\n]{4,}/g) || [];
      const keywordsToExclude = [
        'obj', 'endobj', 'stream', 'endstream', 'xref', 'trailer', 'startxref',
        'Catalog', 'Pages', 'Page', 'Font', 'Encoding', 'MediaBox', 'Contents',
        'Type', 'Subtype', 'Filter', 'FlateDecode', 'Length', 'Parent', 'Resources'
      ];
      for (const block of textBlocks) {
        const trimmed = block.trim();
        if (
          trimmed.length >= 4 &&
          /[a-zA-Z]{2,}/.test(trimmed) &&
          !keywordsToExclude.some(kw => trimmed.startsWith('/' + kw) || trimmed === kw)
        ) {
          extractedStrings.push(trimmed);
        }
      }
    }

    const fullNativeText = extractedStrings.join(' ');

    // Filter out PDF stream noise and keep clean text words
    const cleanWords = fullNativeText.split(/\s+/).filter(w => {
      if (w.length < 2) return false;
      if (w.startsWith('/') || w.includes('<<') || w.includes('>>')) return false;
      if (/^[0-9.#]+$/.test(w)) return true;
      return /[a-zA-Z0-9]/.test(w);
    });

    const result = cleanWords.join(' ');
    if (result && result.length > 30) {
      return result;
    }
  } catch (err) {
    console.warn("[FileParser] Native PDF stream parsing warning:", err);
  }
  return "";
};

/**
 * High-precision PDF Text Extractor combining pdfjs-dist + Native Stream Parser
 */
export const extractTextFromPdf = async (file) => {
  try {
    ensureWorkerSrc();
    const arrayBuffer = await file.arrayBuffer();

    // Engine 1: pdfjs-dist Browser Parser
    let pdfjsText = "";
    try {
      if (pdfjsLib && pdfjsLib.getDocument) {
        const loadingTask = pdfjsLib.getDocument({ 
          data: new Uint8Array(arrayBuffer),
          useSystemFonts: true
        });
        const pdf = await loadingTask.promise;

        let pagesText = [];
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();

          let pageStr = textContent.items.map(item => item.str).filter(Boolean).join(' ');
          pagesText.push(pageStr);
        }
        pdfjsText = pagesText.join('\n\n');
      }
    } catch (e) {
      console.warn("[FileParser] pdfjs-dist engine failed, using native engine:", e);
    }

    // Engine 2: Native Stream Parser
    const nativeText = extractPdfTextNative(arrayBuffer);

    // Combine best available text
    const finalText = (pdfjsText && pdfjsText.trim().length > 50) 
      ? pdfjsText.trim() 
      : (nativeText && nativeText.trim().length > 30)
      ? nativeText.trim()
      : pdfjsText.trim();

    if (finalText && finalText.length > 20) {
      return finalText;
    }
  } catch (err) {
    console.error("[FileParser] Total PDF extraction error:", err);
  }

  // Fallback: UTF-8 FileReader text
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result || "";
      resolve(typeof text === 'string' ? text : "");
    };
    reader.onerror = () => resolve("");
    reader.readAsText(file);
  });
};

/**
 * Returns generative part for Gemini API plus extracted plain text
 */
export const fileToGenerativePart = async (file) => {
  try {
    const extractedText = await extractTextFromPdf(file);

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultString = typeof reader.result === 'string' ? reader.result : '';
        const base64Data = resultString.includes(',') ? resultString.split(',')[1] : resultString;
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file?.type || 'application/pdf'
          },
          extractedText: extractedText || ""
        });
      };
      reader.onerror = () => {
        resolve({
          inlineData: null,
          extractedText: extractedText || ""
        });
      };
      reader.readAsDataURL(file);
    });
  } catch (err) {
    console.error("[FileParser] fileToGenerativePart error:", err);
    return {
      inlineData: null,
      extractedText: ""
    };
  }
};
