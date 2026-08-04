import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker for browser environment
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
}

/**
 * Extracts plain text line-by-line from a PDF File object in browser
 */
export const extractTextFromPdf = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    
    let extractedPages = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Group text items into lines based on Y coordinates if available
      let lastY = null;
      let pageText = '';
      
      for (const item of textContent.items) {
        if (!item.str) continue;
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
          pageText += '\n';
        } else if (pageText.length > 0 && !pageText.endsWith('\n') && !pageText.endsWith(' ')) {
          pageText += ' ';
        }
        pageText += item.str;
        lastY = item.transform[5];
      }
      
      extractedPages.push(`--- Page ${pageNum} ---\n${pageText}`);
    }
    
    const result = extractedPages.join('\n\n');
    if (result && result.trim().length > 30) {
      return result.trim();
    }
  } catch (err) {
    console.warn("[FileParser] pdfjs-dist extraction failed, trying fallback text reader:", err);
  }

  // Fallback: Read as raw text/UTF-8
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
  const extractedText = await extractTextFromPdf(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        },
        extractedText
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
