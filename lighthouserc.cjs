// Run against an already-started production build. CI supplies localhost:3000;
// LHCI_BASE_URL lets a local review use its own port without stopping dev.
const base = (process.env.LHCI_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

module.exports = {
  ci: {
    collect: {
      url: [
        `${base}/`,
        `${base}/services/drink-driving`,
        `${base}/blog/what-happens-after-a-drink-driving-arrest`,
      ],
      numberOfRuns: 2,
      settings: {
        onlyCategories: ["performance", "accessibility", "best-practices"],
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.9, aggregationMethod: "median" }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500, aggregationMethod: "median" }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1, aggregationMethod: "median" }],
        // Lab responsiveness proxy only; this cannot establish field INP.
        "total-blocking-time": ["warn", { maxNumericValue: 200, aggregationMethod: "median" }],
      },
    },
    // Keep reports as local/CI artifacts; no LHCI server or public
    // temporary storage is contacted. Local noindex is intentional, so there
    // is no assertion that a localhost page should be indexed.
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci/reports",
    },
  },
};
