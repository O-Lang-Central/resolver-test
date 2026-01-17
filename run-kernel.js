#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const { writeFileSync } = require("fs");

// ----------------------
// Load kernel from npm
// ----------------------
let kernel;
try {
  kernel = require("@o-lang/olang"); // Published kernel
} catch (err) {
  console.error("❌ Failed to load @o-lang/olang kernel from node_modules");
  console.error(err);
  process.exit(1);
}

// ----------------------
// CLI arg parsing
// ----------------------
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    suites: [],
    json: false,
    badge: false
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--suite" && args[i + 1]) {
      opts.suites.push(args[++i]);
    }
    if (args[i] === "--json") {
      opts.json = true;
    }
    if (args[i] === "--badge") {
      opts.badge = true;
    }
  }

  return opts;
}

// ----------------------
// Import resolver-test runner
// ----------------------
const { runAllTests } = require("./lib/runner");

// ----------------------
// Badge generator
// ----------------------
function generateBadge(passed) {
  const color = passed ? "green" : "red";
  const text = passed ? "certified" : "failed";
  const badgeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20">
  <rect width="120" height="20" fill="${color}" rx="3" ry="3"/>
  <text x="60" y="14" fill="#fff" font-family="Verdana" font-size="12" text-anchor="middle">${text}</text>
</svg>
`.trim();

  return badgeSvg;
}

// ----------------------
// Main
// ----------------------
(async () => {
  try {
    const opts = parseArgs();

    const suites =
      opts.suites.length > 0
        ? opts.suites
        : [
            "R-001-allowlist",
            "R-002-io-contract",
            "R-003-failure-modes",
            "R-004-invalid-syntax",
            "R-005-resolver-metadata-contract"
          ];

    const result = await runAllTests({
      suites,
      resolver: kernel
    });

    // JSON output
    if (opts.json) {
      const report = {
        passed: result.failed === 0,
        failedTests: result.failed,
        suites
      };
      console.log(JSON.stringify(report, null, 2));
      writeFileSync("conformance-report.json", JSON.stringify(report, null, 2));
    }

    // Badge output
    if (opts.badge) {
      const svg = generateBadge(result.failed === 0);
      const badgePath = path.join("badges", "certified.svg");
      if (!fs.existsSync("badges")) fs.mkdirSync("badges");
      writeFileSync(badgePath, svg, "utf8");
      console.log(`🏷  Badge written to ${badgePath}`);
    }

    if (result.failed > 0) {
      console.error(`❌ ${result.failed} resolver test(s) failed`);
      process.exit(1);
    }

    console.log("✅ All resolver tests passed");
    process.exit(0);

  } catch (err) {
    console.error("🔥 Kernel test runner crashed");
    console.error(err);
    process.exit(1);
  }
})();
