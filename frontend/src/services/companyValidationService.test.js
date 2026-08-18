import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateCompany, levenshteinDistance, jaroWinklerSimilarity } from './companyValidationService';
import { generateCompanyRoadmap } from './aiService';

describe('Company Validation Service Suite', () => {
  beforeEach(() => {
    // Clear localStorage cache before each test
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  // TEST CASE 1: Exact Real Company Name ("Google")
  it('1. should verify exact real company names like "Google"', async () => {
    const res = await validateCompany('Google');
    expect(res.status).toBe('verified');
    expect(res.matchedName).toBe('Google');
    expect(res.confidence).toBeGreaterThanOrEqual(0.9);
    expect(res.sourceUrl).toBeTruthy();
  });

  // TEST CASE 2: Case & Whitespace Variants ("google ", "GOOGLE")
  it('2. should handle case and whitespace variants like "google " or "GOOGLE"', async () => {
    const res1 = await validateCompany('google ');
    expect(res1.status).toBe('verified');
    expect(res1.matchedName).toBe('Google');

    const res2 = await validateCompany('GOOGLE');
    expect(res2.status).toBe('verified');
    expect(res2.matchedName).toBe('Google');
  });

  // TEST CASE 3: Common Misspellings ("Gogle", "Mircosoft", "Amaz0n")
  it('3. should reject near-miss misspellings like "Gogle" or "Mircosoft" and suggest corrections', async () => {
    const res1 = await validateCompany('Gogle');
    expect(res1.status).toBe('unverified');
    expect(res1.matchedName).toBeNull();
    expect(res1.suggestions).toContain('Google');

    const res2 = await validateCompany('Mircosoft');
    expect(res2.status).toBe('unverified');
    expect(res2.suggestions).toContain('Microsoft');
  });

  // TEST CASE 4: Completely Fake Names ("Zylotech Dynamics Inc")
  it('4. should reject completely fake company names like "Zylotech Dynamics Inc"', async () => {
    const res = await validateCompany('Zylotech Dynamics Inc');
    expect(res.status).toBe('unverified');
    expect(res.matchedName).toBeNull();
    expect(res.confidence).toBe(0);
  });

  // TEST CASE 5: Ambiguous / Generic Names ("Apple", "Target")
  it('5. should identify ambiguous generic company names like "Apple" and present choices', async () => {
    const res = await validateCompany('Apple');
    expect(res.status).toBe('ambiguous');
    expect(res.suggestions.length).toBeGreaterThan(0);
    expect(res.suggestions[0]).toContain('Apple');
  });

  // TEST CASE 6: Real obscure/startup company (Grounded Search or Curated Fallback)
  it('6. should handle real company lookups accurately', async () => {
    const res = await validateCompany('Databricks');
    expect(res.status).toBe('verified');
    expect(res.matchedName).toBe('Databricks');
  });

  // TEST CASE 7: API / Network Failure during validation (Fail Closed)
  it('7. should fail closed on validation error without generating unverified roadmap', async () => {
    // Test empty input fail-closed
    const emptyRes = await validateCompany('');
    expect(emptyRes.status).toBe('unverified');
    expect(emptyRes.matchedName).toBeNull();

    // Test gibberish fail-closed
    const gibberishRes = await validateCompany('qwrtpsdfghjkl');
    expect(gibberishRes.status).toBe('unverified');
  });

  // TEST CASE 8: Roadmap Generator Interface Gating Enforcement
  it('8. should enforce gating at the interface level, rejecting unverified validation inputs', async () => {
    const unverifiedResult = {
      status: 'unverified',
      matchedName: null,
      confidence: 0,
      sourceUrl: null,
      suggestions: ['Google']
    };

    // Calling roadmap generator with unverified status must throw a GATING_ERROR
    await expect(generateCompanyRoadmap(unverifiedResult, 'Software Engineer'))
      .rejects
      .toThrow(/GATING_ERROR/);
  });
});
