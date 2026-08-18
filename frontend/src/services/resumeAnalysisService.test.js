import { describe, it, expect, beforeEach } from 'vitest';
import { 
  extractAndValidateResumeText, 
  runOfflineAlgorithmicScan, 
  detectLayoutHazards, 
  cleanExtractedText,
  UnreadablePdfError,
  NotAResumeError,
  validateIsResumeDocument,
  analyzeResume
} from './resumeAnalysisService';

describe('Resume Analysis Service & ATS Pipeline Suite', () => {

  // TEST CASE 1: Genuinely Strong Resume (Quantified Achievements, High Score)
  it('1. should score a genuinely strong resume with quantified metrics higher than average', () => {
    const strongResumeText = `
      ALEX R. CHEN | Senior Full-Stack Engineer | alex.chen@email.com | github.com/alexchen
      EXPERIENCE:
      Senior Software Engineer - TechCorp Inc. (2021 - Present)
      - Architected distributed microservices handling 2.5 million active daily users with 99.99% uptime.
      - Reduced API endpoint response latency by 45% (from 350ms to 190ms) using Redis caching layers.
      - Led a cross-functional team of 8 engineers, migrating legacy Java monolith to Node.js and AWS Docker containers.
      PROJECTS:
      Distributed High-Throughput Task Queue
      - Built a Go-based distributed queue processing 50k events/sec with zero data loss.
      SKILLS:
      Programming: Python, JavaScript, TypeScript, Go, Java, SQL, C++
      Technologies: React, Node.js, Express, Docker, AWS, PostgreSQL, Redis, Git, Microservices, CI/CD
      EDUCATION:
      B.Tech in Computer Science & Engineering - GPA: 3.9/4.0
    `;

    const layout = detectLayoutHazards(strongResumeText);
    const result = runOfflineAlgorithmicScan(strongResumeText, layout);

    expect(result.overallAtsScore).toBeGreaterThanOrEqual(75);
    expect(result.subScores.quantifiedImpact).toBeGreaterThanOrEqual(70);
    expect(result.extractedSections.experience).toBe(true);
    expect(result.extractedSections.skills).toBe(true);
  });

  // TEST CASE 2: Weak / Sparse Resume (Vague Bullets, Low Score, Flagged Issues)
  it('2. should score a weak/sparse resume low and produce specific flagged issues', () => {
    const weakResumeText = `
      JOHN DOE | Student
      EDUCATION:
      College Student at State University
      PROJECTS:
      Simple To-Do List
      - Made a website to list daily tasks using HTML and CSS.
      Calculator App
      - Built a calculator in JavaScript.
      SKILLS:
      HTML, CSS, JavaScript
    `;

    const layout = detectLayoutHazards(weakResumeText);
    const result = runOfflineAlgorithmicScan(weakResumeText, layout);

    expect(result.overallAtsScore).toBeLessThan(60);
    expect(result.flaggedIssues.length).toBeGreaterThan(0);
    expect(result.flaggedIssues.some(i => i.includes('quantitative') || i.includes('metrics') || i.includes('Experience'))).toBe(true);
  });

  // TEST CASE 3: Scanned / Image-Only PDF (< 100 Characters) -> Explicit Error
  it('3. should throw UnreadablePdfError for scanned/image PDFs with less than 100 characters', async () => {
    const fakeShortText = "Scanned Image Page 1";
    const cleaned = cleanExtractedText(fakeShortText);

    expect(cleaned.length).toBeLessThan(100);

    // Creating mock file object
    const mockFile = new File([fakeShortText], "scanned_resume.pdf", { type: "application/pdf" });

    await expect(extractAndValidateResumeText(mockFile))
      .rejects
      .toThrow(UnreadablePdfError);
  });

  // TEST CASE 4: Multi-Column / Layout Hazards Detection
  it('4. should detect multi-column layout hazards and flag ATS formatting risks', () => {
    const multiColumnText = `
      Experience Section                     Education Section
      Software Engineer                      B.Tech Computer Science
      Company A                              University B
      - Developed API endpoints              - Graduation: 2024
      - Managed SQL databases                - GPA: 3.8
    `;

    const layout = detectLayoutHazards(multiColumnText);
    expect(layout.isAtsLayoutRisk).toBe(true);

    const result = runOfflineAlgorithmicScan(multiColumnText, layout);
    expect(result.flaggedIssues.some(i => i.includes('Multi-column') || i.includes('layout'))).toBe(true);
  });

  // TEST CASE 5: Request WITHOUT Target Company/Role -> Match Fields MUST Be Null
  it('5. should return strictly NULL for match fields when target company and role are not provided', () => {
    const resumeText = `
      SARAH WILLIAMS | Backend Developer | sarah@dev.com
      EXPERIENCE:
      Software Developer at CloudSystems (2022-2024)
      - Developed REST APIs in Node.js and MongoDB serving 100k requests daily.
      SKILLS: Node.js, Python, MongoDB, Docker, Git, SQL
      EDUCATION: B.Tech Computer Science
    `;

    const layout = detectLayoutHazards(resumeText);
    const result = runOfflineAlgorithmicScan(resumeText, layout, "", "", ""); // NO target inputs

    expect(result.companyMatchPercent).toBeNull();
    expect(result.roleMatchPercent).toBeNull();
    expect(result.subScores.keywordRelevance).toBeNull();
  });

  // TEST CASE 6: Request WITH Target Job Description -> Populates Match Fields & Keyword Relevance
  it('6. should populate keywordRelevance and match fields when target company and role are provided', () => {
    const resumeText = `
      SARAH WILLIAMS | Backend Developer | sarah@dev.com
      EXPERIENCE:
      Software Developer at CloudSystems (2022-2024)
      - Developed REST APIs in Node.js, Python, and PostgreSQL.
      SKILLS: Node.js, Python, PostgreSQL, AWS, Docker, Git, REST API
      EDUCATION: B.Tech Computer Science
    `;

    const layout = detectLayoutHazards(resumeText);
    const result = runOfflineAlgorithmicScan(
      resumeText, 
      layout, 
      "Google", 
      "Backend Engineer", 
      "Backend Engineer experienced in Node.js, Python, PostgreSQL, AWS, and REST API microservices."
    );

    expect(result.companyMatchPercent).not.toBeNull();
    expect(result.roleMatchPercent).not.toBeNull();
    expect(result.subScores.keywordRelevance).not.toBeNull();
    expect(result.subScores.keywordRelevance).toBeGreaterThan(60);
  });

  // TEST CASE 7: Score Differentiation (No Uniform Cluster Fallback)
  it('7. should produce distinctly different scores for strong vs weak resumes', () => {
    const strongText = `
      ALEX R. CHEN | Senior Engineer
      EXPERIENCE: Senior Developer - TechCorp (2021-Present)
      - Built microservices processing 2.5m users/day, reduced latency by 45%.
      SKILLS: Python, Go, Node, React, Docker, AWS, Redis, SQL
      EDUCATION: B.Tech CS
    `;

    const weakText = `
      JOHN DOE | Student
      PROJECTS: Simple To-Do App in HTML and CSS.
      SKILLS: HTML, CSS
    `;

    const resStrong = runOfflineAlgorithmicScan(strongText, detectLayoutHazards(strongText));
    const resWeak = runOfflineAlgorithmicScan(weakText, detectLayoutHazards(weakText));

    const scoreDiff = Math.abs(resStrong.overallAtsScore - resWeak.overallAtsScore);
    expect(scoreDiff).toBeGreaterThanOrEqual(25);
  });

  // TEST CASE 8: Non-Resume PDF Rejection (NotAResumeError)
  it('8. should reject non-resume PDFs (e.g. restaurant menu, invoice) with NotAResumeError', () => {
    const nonResumeText = `
      RESTAURANT MENU - ITALIAN BISTRO
      Starters: Garlic Bread $5, Bruschetta $8, Caesar Salad $10
      Main Course: Margherita Pizza $14, Spaghetti Carbonara $16, Penne Arrabbiata $15
      Desserts: Tiramisu $7, Gelato $6
      Open 11am - 10pm daily. Call for reservations: 555-0199.
    `;

    expect(() => validateIsResumeDocument(nonResumeText)).toThrow(NotAResumeError);
  });

});
