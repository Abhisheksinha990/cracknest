import { GoogleGenerativeAI } from '@google/generative-ai';
import { getActiveApiKey } from './aiService';

const CACHE_KEY = 'cracknest_company_val_cache_v1';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const AUDIT_LOG_KEY = 'cracknest_company_val_logs';

/**
 * Curated list of verified real-world companies with official website evidence.
 * Serves as Tier 2 fast-path (0ms, $0 cost).
 */
export const CURATED_COMPANIES = [
  { name: "Google", aliases: ["alphabet"], sourceUrl: "https://about.google", category: "product" },
  { name: "Microsoft", aliases: ["msft"], sourceUrl: "https://www.microsoft.com", category: "product" },
  { name: "Amazon", aliases: ["aws"], sourceUrl: "https://www.aboutamazon.com", category: "product" },
  { name: "Apple", aliases: ["apple inc"], sourceUrl: "https://www.apple.com", category: "product", isAmbiguousWord: true },
  { name: "Meta", aliases: ["facebook", "fb", "instagram"], sourceUrl: "https://about.meta.com", category: "product" },
  { name: "Netflix", aliases: [], sourceUrl: "https://about.netflix.com", category: "product" },
  { name: "Uber", aliases: ["uber technologies"], sourceUrl: "https://www.uber.com", category: "product" },
  { name: "Adobe", aliases: [], sourceUrl: "https://www.adobe.com", category: "product" },
  { name: "Accenture", aliases: [], sourceUrl: "https://www.accenture.com", category: "service" },
  { name: "Cognizant", aliases: ["cts"], sourceUrl: "https://www.cognizant.com", category: "service" },
  { name: "Capgemini", aliases: [], sourceUrl: "https://www.capgemini.com", category: "service" },
  { name: "Infosys", aliases: [], sourceUrl: "https://www.infosys.com", category: "service" },
  { name: "TCS", aliases: ["tata consultancy services"], sourceUrl: "https://www.tcs.com", category: "service" },
  { name: "Wipro", aliases: [], sourceUrl: "https://www.wipro.com", category: "service" },
  { name: "Deloitte", aliases: [], sourceUrl: "https://www.deloitte.com", category: "service" },
  { name: "Flipkart", aliases: [], sourceUrl: "https://www.flipkart.com", category: "product" },
  { name: "Atlassian", aliases: [], sourceUrl: "https://www.atlassian.com", category: "product" },
  { name: "Oracle", aliases: [], sourceUrl: "https://www.oracle.com", category: "product" },
  { name: "IBM", aliases: ["international business machines"], sourceUrl: "https://www.ibm.com", category: "service" },
  { name: "Cisco", aliases: ["cisco systems"], sourceUrl: "https://www.cisco.com", category: "product" },

  { name: "Salesforce", aliases: ["salesforce", "salesforc"], sourceUrl: "https://www.salesforce.com", category: "product" },
  { name: "Intel", aliases: ["intel", "intel corp"], sourceUrl: "https://www.intel.com", category: "hardware" },
  { name: "Nvidia", aliases: ["nvidia", "nvda"], sourceUrl: "https://www.nvidia.com", category: "hardware" },
  { name: "AMD", aliases: ["amd", "advanced micro devices"], sourceUrl: "https://www.amd.com", category: "hardware" },
  { name: "PayPal", aliases: ["paypal", "pay pal"], sourceUrl: "https://www.paypal.com", category: "fintech" },
  { name: "Paytm", aliases: ["paytm"], sourceUrl: "https://paytm.com", category: "fintech" },
  { name: "PhonePe", aliases: ["phonepe", "phone pe"], sourceUrl: "https://www.phonepe.com", category: "fintech" },
  { name: "Walmart", aliases: ["walmart", "walmart global tech"], sourceUrl: "https://www.walmart.com", category: "product" },
  { name: "Target", aliases: ["target", "target corporation"], sourceUrl: "https://corporate.target.com", category: "retail", isAmbiguousWord: true },
  { name: "JPMorgan Chase", aliases: ["jpmorgan", "jp morgan", "jpmorgan chase", "jpmc"], sourceUrl: "https://www.jpmorganchase.com", category: "finance" },
  { name: "Goldman Sachs", aliases: ["goldman sachs", "goldman", "gs"], sourceUrl: "https://www.goldmansachs.com", category: "finance" },
  { name: "Morgan Stanley", aliases: ["morgan stanley"], sourceUrl: "https://www.morganstanley.com", category: "finance" },
  { name: "Barclays", aliases: ["barclays"], sourceUrl: "https://home.barclays", category: "finance" },
  { name: "HSBC", aliases: ["hsbc"], sourceUrl: "https://www.hsbc.com", category: "finance" },
  { name: "Zomato", aliases: ["zomato"], sourceUrl: "https://www.zomato.com", category: "product" },
  { name: "Swiggy", aliases: ["swiggy"], sourceUrl: "https://www.swiggy.com", category: "product" },
  { name: "Razorpay", aliases: ["razorpay"], sourceUrl: "https://razorpay.com", category: "fintech" },
  { name: "Zerodha", aliases: ["zerodha"], sourceUrl: "https://zerodha.com", category: "fintech" },
  { name: "CRED", aliases: ["cred"], sourceUrl: "https://cred.club", category: "fintech" },
  { name: "Ola", aliases: ["ola", "ola cabs"], sourceUrl: "https://www.olacabs.com", category: "product" },
  { name: "Bloomberg", aliases: ["bloomberg", "bloomberg lp"], sourceUrl: "https://www.bloomberg.com", category: "finance" },
  { name: "Intuit", aliases: ["intuit"], sourceUrl: "https://www.intuit.com", category: "product" },
  { name: "Stripe", aliases: ["stripe"], sourceUrl: "https://stripe.com", category: "fintech" },
  { name: "Airbnb", aliases: ["airbnb"], sourceUrl: "https://www.airbnb.com", category: "product" },
  { name: "DoorDash", aliases: ["doordash"], sourceUrl: "https://www.doordash.com", category: "product" },
  { name: "Databricks", aliases: ["databricks"], sourceUrl: "https://www.databricks.com", category: "product" },
  { name: "Tesla", aliases: ["tesla"], sourceUrl: "https://www.tesla.com", category: "automotive" },
  { name: "Spotify", aliases: ["spotify"], sourceUrl: "https://www.spotify.com", category: "product" },
  { name: "X (Twitter)", aliases: ["twitter", "x", "x corp"], sourceUrl: "https://x.com", category: "product", isAmbiguousWord: true },
  { name: "LinkedIn", aliases: ["linkedin"], sourceUrl: "https://about.linkedin.com", category: "product" },
  { name: "GitHub", aliases: ["github"], sourceUrl: "https://github.com", category: "product" },
  { name: "GitLab", aliases: ["gitlab"], sourceUrl: "https://about.gitlab.com", category: "product" },
  { name: "Notion", aliases: ["notion"], sourceUrl: "https://www.notion.so", category: "product" },
  { name: "Figma", aliases: ["figma"], sourceUrl: "https://www.figma.com", category: "product" },
  { name: "Slack", aliases: ["slack"], sourceUrl: "https://slack.com", category: "product" },
  { name: "Zoom", aliases: ["zoom"], sourceUrl: "https://zoom.us", category: "product" },
  { name: "Shopify", aliases: ["shopify"], sourceUrl: "https://www.shopify.com", category: "product" },
  { name: "Canva", aliases: ["canva"], sourceUrl: "https://www.canva.com", category: "product" },
  { name: "Palantir", aliases: ["palantir"], sourceUrl: "https://www.palantir.com", category: "product" },
  { name: "Snowflake", aliases: ["snowflake"], sourceUrl: "https://www.snowflake.com", category: "product" },
  { name: "Twilio", aliases: ["twilio"], sourceUrl: "https://www.twilio.com", category: "product" },
  { name: "Block (Square)", aliases: ["square", "block"], sourceUrl: "https://block.xyz", category: "fintech", isAmbiguousWord: true },
  { name: "CrowdStrike", aliases: ["crowdstrike"], sourceUrl: "https://www.crowdstrike.com", category: "security" },
  { name: "Cloudflare", aliases: ["cloudflare"], sourceUrl: "https://www.cloudflare.com", category: "infrastructure" },
  { name: "Datadog", aliases: ["datadog"], sourceUrl: "https://www.datadoghq.com", category: "infrastructure" },
  { name: "MongoDB", aliases: ["mongodb"], sourceUrl: "https://www.mongodb.com", category: "database" },
  { name: "HashiCorp", aliases: ["hashicorp"], sourceUrl: "https://www.hashicorp.com", category: "infrastructure" },
  { name: "Unity", aliases: ["unity"], sourceUrl: "https://unity.com", category: "gaming" },
  { name: "Epic Games", aliases: ["epic games", "epic"], sourceUrl: "https://www.epicgames.com", category: "gaming" },
  { name: "Sony", aliases: ["sony"], sourceUrl: "https://www.sony.com", category: "hardware" },
  { name: "Samsung", aliases: ["samsung"], sourceUrl: "https://www.samsung.com", category: "hardware" },
  { name: "LG", aliases: ["lg"], sourceUrl: "https://www.lg.com", category: "hardware" },
  { name: "Dell", aliases: ["dell"], sourceUrl: "https://www.dell.com", category: "hardware" },
  { name: "HP", aliases: ["hp", "hewlett packard"], sourceUrl: "https://www.hp.com", category: "hardware" },
  { name: "Qualcomm", aliases: ["qualcomm"], sourceUrl: "https://www.qualcomm.com", category: "semiconductor" },
  { name: "Broadcom", aliases: ["broadcom"], sourceUrl: "https://www.broadcom.com", category: "semiconductor" },
  { name: "ARM", aliases: ["arm"], sourceUrl: "https://www.arm.com", category: "semiconductor" },
  { name: "TSMC", aliases: ["tsmc"], sourceUrl: "https://www.tsmc.com", category: "semiconductor" },
  { name: "Boeing", aliases: ["boeing"], sourceUrl: "https://www.boeing.com", category: "aerospace" },
  { name: "Airbus", aliases: ["airbus"], sourceUrl: "https://www.airbus.com", category: "aerospace" },
  { name: "Siemens", aliases: ["siemens"], sourceUrl: "https://www.siemens.com", category: "engineering" },
  { name: "Honeywell", aliases: ["honeywell"], sourceUrl: "https://www.honeywell.com", category: "engineering" },
  { name: "Ford", aliases: ["ford"], sourceUrl: "https://www.ford.com", category: "automotive" },
  { name: "General Motors", aliases: ["gm", "general motors"], sourceUrl: "https://www.gm.com", category: "automotive" },
  { name: "Toyota", aliases: ["toyota"], sourceUrl: "https://www.toyota.com", category: "automotive" },
  { name: "Honda", aliases: ["honda"], sourceUrl: "https://global.honda", category: "automotive" },
  { name: "Hyundai", aliases: ["hyundai"], sourceUrl: "https://www.hyundai.com", category: "automotive" },
  { name: "BMW", aliases: ["bmw"], sourceUrl: "https://www.bmw.com", category: "automotive" },
  { name: "Mercedes-Benz", aliases: ["mercedes", "mercedes-benz", "benz"], sourceUrl: "https://www.mercedes-benz.com", category: "automotive" },
  { name: "Audi", aliases: ["audi"], sourceUrl: "https://www.audi.com", category: "automotive" },
  { name: "Shell", aliases: ["shell"], sourceUrl: "https://www.shell.com", category: "energy", isAmbiguousWord: true },
  { name: "BP", aliases: ["bp"], sourceUrl: "https://www.bp.com", category: "energy" },
  { name: "TotalEnergies", aliases: ["total", "totalenergies"], sourceUrl: "https://totalenergies.com", category: "energy" },
  { name: "ExxonMobil", aliases: ["exxon", "exxonmobil"], sourceUrl: "https://corporate.exxonmobil.com", category: "energy" },
  { name: "Chevron", aliases: ["chevron"], sourceUrl: "https://www.chevron.com", category: "energy" },
  { name: "Reliance Industries", aliases: ["reliance", "jio", "reliance industries"], sourceUrl: "https://www.ril.com", category: "conglomerate" },
  { name: "Tata Group", aliases: ["tata", "tata group"], sourceUrl: "https://www.tata.com", category: "conglomerate" },
  { name: "Pfizer", aliases: ["pfizer"], sourceUrl: "https://www.pfizer.com", category: "pharma" },
  { name: "Moderna", aliases: ["moderna"], sourceUrl: "https://www.modernatx.com", category: "pharma" },
  { name: "Johnson & Johnson", aliases: ["jnj", "johnson", "johnson & johnson"], sourceUrl: "https://www.jnj.com", category: "pharma" },
  { name: "McKinsey & Company", aliases: ["mckinsey", "mckinsey & company"], sourceUrl: "https://www.mckinsey.com", category: "consulting" },
  { name: "Bain & Company", aliases: ["bain", "bain & company"], sourceUrl: "https://www.bain.com", category: "consulting" },
  { name: "BCG", aliases: ["bcg", "boston consulting group"], sourceUrl: "https://www.bcg.com", category: "consulting" },
  { name: "PwC", aliases: ["pwc", "pricewaterhousecoopers"], sourceUrl: "https://www.pwc.com", category: "consulting" },
  { name: "KPMG", aliases: ["kpmg"], sourceUrl: "https://home.kpmg", category: "consulting" },
  { name: "EY", aliases: ["ey", "ernst & young"], sourceUrl: "https://www.ey.com", category: "consulting" }
];

/**
 * Levenshtein distance between two strings
 */
export const levenshteinDistance = (a, b) => {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  const m = s1.length, n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = s1[i - 1] === s2[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
};

/**
 * Calculate Jaro-Winkler similarity score (0.0 to 1.0)
 */
export const jaroWinklerSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  if (s1 === s2) return 1.0;
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0.0;

  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);
    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3.0;
  
  // Winkler extension
  let prefix = 0;
  const maxPrefix = 4;
  for (let i = 0; i < Math.min(len1, len2, maxPrefix); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
};

// Internal Cache Helpers
const getCache = () => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(CACHE_KEY) : null;
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const setCacheEntry = (rawKey, val) => {
  try {
    if (typeof localStorage === 'undefined') return;
    const cache = getCache();
    cache[rawKey.trim().toLowerCase()] = {
      data: val,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn("Failed to write to validation cache:", e);
  }
};

const getCacheEntry = (rawKey) => {
  try {
    const cache = getCache();
    const entry = cache[rawKey.trim().toLowerCase()];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      return null; // Expired
    }
    return entry.data;
  } catch (e) {
    return null;
  }
};

/**
 * Log validation failures for auditing & identifying missing allowlist entries
 */
export const companyValidationLogger = {
  logFailure: (companyInput, reason, status = 'unverified') => {
    const logEntry = {
      companyInput,
      reason,
      status,
      timestamp: new Date().toISOString()
    };
    console.warn("[CompanyValidation AuditLog]", logEntry);
    try {
      if (typeof localStorage === 'undefined') return;
      const logsRaw = localStorage.getItem(AUDIT_LOG_KEY);
      const logs = logsRaw ? JSON.parse(logsRaw) : [];
      logs.unshift(logEntry);
      // Keep latest 100 entries
      localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs.slice(0, 100)));
    } catch (e) {
      // Ignore storage errors
    }
  }
};

/**
 * Finds top N fuzzy match suggestions from curated database
 */
export const getFuzzySuggestions = (cleanInput, topN = 3) => {
  const scored = CURATED_COMPANIES.map(item => {
    let maxSim = jaroWinklerSimilarity(cleanInput, item.name.toLowerCase());
    for (const alias of item.aliases) {
      const sim = jaroWinklerSimilarity(cleanInput, alias);
      if (sim > maxSim) maxSim = sim;
    }
    return { company: item.name, score: maxSim };
  });

  scored.sort((a, b) => b.score - a.score);
  
  // Unique top N with similarity score >= 0.55
  const results = [];
  const seen = new Set();
  for (const item of scored) {
    if (item.score >= 0.55 && !seen.has(item.company)) {
      seen.add(item.company);
      results.push(item.company);
      if (results.length >= topN) break;
    }
  }
  return results;
};

/**
 * Fallback Level 3: Grounded search validation using Gemini API with Search Grounding tool
 */
async function validateWithGroundedSearch(inputName) {
  const apiKey = getActiveApiKey();
  if (!apiKey) {
    throw new Error("No Gemini API key available for search grounding validation.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  const systemInstruction = `You are a real-world company verification engine.
Your task is to determine whether the user-provided name corresponds to an actual, operating, legitimate real-world company or organization.
You MUST search for real evidence (official website, Wikipedia, Crunchbase, LinkedIn, Bloomberg, news sources).
If it is a fake, invented name (like "Zylotech Dynamics Inc" or gibberish), return status "unverified".
If it is a real company, return status "verified" along with the official canonical name and source URL.
Return ONLY valid JSON matching this exact format:
{
  "status": "verified" | "unverified" | "ambiguous",
  "matchedName": "Canonical Name" | null,
  "confidence": 0.0 to 1.0,
  "sourceUrl": "https://..." | null,
  "suggestions": ["Candidate1", "Candidate2"] | [],
  "reason": "Brief explanation"
}`;

  const prompt = `Validate company name: "${inputName}". Is this a real-world operating company? Provide proof link (official site, LinkedIn, Wikipedia, or Crunchbase).`;

  // Attempt using model with google_search tool
  const modelCandidates = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro'];

  let lastErr = null;

  for (const modelName of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        tools: [{ googleSearch: {} }] // Enable Google Search Grounding tool
      });

      const response = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Grounding search timed out")), 8000))
      ]);

      const text = response.response.text();
      let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(cleaned);

      // Inspect grounding metadata for search citations if present
      const candidate = response.response.candidates?.[0];
      const groundingChunks = candidate?.groundingMetadata?.groundingChunks;
      let groundingUrl = parsed.sourceUrl || null;
      if (!groundingUrl && groundingChunks && groundingChunks.length > 0) {
        const webChunk = groundingChunks.find(c => c.web?.uri);
        if (webChunk) groundingUrl = webChunk.web.uri;
      }

      return {
        status: parsed.status === "verified" ? "verified" : (parsed.status === "ambiguous" ? "ambiguous" : "unverified"),
        matchedName: parsed.status === "verified" ? (parsed.matchedName || inputName) : null,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : (parsed.status === 'verified' ? 0.9 : 0.0),
        sourceUrl: groundingUrl,
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : getFuzzySuggestions(inputName),
        reason: parsed.reason || (parsed.status === 'verified' ? 'Verified via Search Grounding.' : 'Unverified company name.')
      };
    } catch (err) {
      console.warn(`[Grounded Search] ${modelName} failed/timed out:`, err.message);
      lastErr = err;
    }
  }

  throw lastErr || new Error("Grounded search validation failed.");
}

/**
 * Main Validate Company API (Approach 2c: Hybrid approach)
 * 
 * Flow:
 * 1. Check local cache (30-day TTL)
 * 2. Sanitize & check curated company DB (0ms, $0)
 * 3. Pre-filter fuzzy match (Levenshtein / Jaro-Winkler)
 * 4. Fallback to Search-Grounded Gemini call for unknown names
 * 5. Fail closed on network/API failure
 * 
 * @param {string} inputName
 * @returns {Promise<{
 *   status: "verified" | "unverified" | "ambiguous",
 *   matchedName: string | null,
 *   confidence: number,
 *   sourceUrl: string | null,
 *   suggestions: string[],
 *   reason?: string
 * }>}
 */
export async function validateCompany(inputName) {
  if (!inputName || typeof inputName !== 'string' || !inputName.trim()) {
    return {
      status: "unverified",
      matchedName: null,
      confidence: 0,
      sourceUrl: null,
      suggestions: [],
      reason: "Company name cannot be empty."
    };
  }

  const rawTrimmed = inputName.trim();
  const clean = rawTrimmed.toLowerCase().replace(/\s+/g, ' ');

  // Level 1: Local Cache check
  const cached = getCacheEntry(clean);
  if (cached) {
    return cached;
  }

  // Level 2: Curated Company DB check & Fuzzy-match pre-filter
  
  // 2a. Direct exact match against curated company names or aliases
  for (const item of CURATED_COMPANIES) {
    const isExactName = item.name.toLowerCase() === clean;
    const isExactAlias = item.aliases.some(a => a.toLowerCase() === clean);

    if (isExactName || isExactAlias) {
      // Check if ambiguous word (e.g. "Apple" or "Target" or "Shell")
      if (item.isAmbiguousWord && clean.length <= 6 && clean === item.name.toLowerCase()) {
        const result = {
          status: "ambiguous",
          matchedName: null,
          confidence: 0.7,
          sourceUrl: item.sourceUrl,
          suggestions: [item.name, `${item.name} Inc.`, `${item.name} Corporation`],
          reason: `"${rawTrimmed}" could refer to the company ${item.name} or a general word/entity. Please confirm your target company.`
        };
        setCacheEntry(clean, result);
        return result;
      }

      const result = {
        status: "verified",
        matchedName: item.name,
        confidence: 0.98,
        sourceUrl: item.sourceUrl,
        suggestions: [],
        reason: `Matched verified enterprise: ${item.name}`
      };
      setCacheEntry(clean, result);
      return result;
    }
  }

  // 2b. Fuzzy edit distance pre-filter against curated DB (Levenshtein & Jaro-Winkler)
  let bestCandidate = null;
  let maxSimilarity = 0;
  let minLevenshtein = 999;

  for (const item of CURATED_COMPANIES) {
    const targets = [item.name, ...item.aliases];
    for (const t of targets) {
      const lev = levenshteinDistance(clean, t);
      const jw = jaroWinklerSimilarity(clean, t);

      if (jw > maxSimilarity) {
        maxSimilarity = jw;
        bestCandidate = item;
      }
      if (lev < minLevenshtein) {
        minLevenshtein = lev;
      }
    }
  }

  const maxLevAllowed = clean.length <= 4 ? 1 : clean.length <= 8 ? 2 : 3;

  // If high similarity misspelling (e.g. "Gogle", "Mircosoft", "Amaz0n")
  if (maxSimilarity >= 0.82 || minLevenshtein <= maxLevAllowed) {
    const suggestions = getFuzzySuggestions(clean, 3);
    if (!suggestions.includes(bestCandidate.name)) {
      suggestions.unshift(bestCandidate.name);
    }

    const result = {
      status: "unverified",
      matchedName: null,
      confidence: Math.round(maxSimilarity * 100) / 100,
      sourceUrl: null,
      suggestions: suggestions.slice(0, 3),
      reason: `Could not verify "${rawTrimmed}". Did you mean ${bestCandidate.name}?`
    };
    companyValidationLogger.logFailure(rawTrimmed, result.reason, "unverified");
    setCacheEntry(clean, result);
    return result;
  }

  // 2c. Heuristic checks for obviously fake names / gibberish before API hit
  const hasDigits = /\d/.test(clean);
  const consecutiveConsonants = /[bcdfghjklmnpqrstvwxyz]{4,}/i.test(clean);
  const repeatedChars = /(.)\1{2,}/.test(clean);
  const vowels = (clean.match(/[aeiou]/g) || []).length;
  const isGibberish = (clean.length >= 5 && vowels === 0) || consecutiveConsonants || repeatedChars;

  if (isGibberish) {
    const result = {
      status: "unverified",
      matchedName: null,
      confidence: 0.0,
      sourceUrl: null,
      suggestions: getFuzzySuggestions(clean, 3),
      reason: `"${rawTrimmed}" does not appear to be a real company name.`
    };
    companyValidationLogger.logFailure(rawTrimmed, "Gibberish pattern detected", "unverified");
    setCacheEntry(clean, result);
    return result;
  }

  // Level 3: Fallback to Search Grounded Gemini API call for unknown/obscure real companies
  try {
    const searchRes = await validateWithGroundedSearch(rawTrimmed);
    setCacheEntry(clean, searchRes);
    if (searchRes.status !== 'verified') {
      companyValidationLogger.logFailure(rawTrimmed, searchRes.reason, searchRes.status);
    }
    return searchRes;
  } catch (err) {
    // FAIL CLOSED: If API fails/times out, return unverified with clear message instead of proceeding
    console.error("[CompanyValidation] Search grounding failed:", err);
    const failClosedResult = {
      status: "unverified",
      matchedName: null,
      confidence: 0,
      sourceUrl: null,
      suggestions: getFuzzySuggestions(clean, 3),
      reason: "Unable to verify company at this time due to network or service error. Please check spelling or try again later.",
      isServiceError: true
    };
    companyValidationLogger.logFailure(rawTrimmed, `API Failure: ${err.message}`, "error");
    return failClosedResult;
  }
}
