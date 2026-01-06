#!/usr/bin/env node

const path = require("path");
const fs = require("fs");

let resolverPath = process.env.OLANG_RESOLVER;

if (!resolverPath) {
  console.error("❌ OLANG_RESOLVER environment variable is not set");
  process.exit(1);
}

// Normalize relative paths
if (resolverPath.startsWith(".")) {
  resolverPath = path.resolve(process.cwd(), resolverPath);
}

// Verify resolver exists
if (!fs.existsSync(resolverPath)) {
  console.error(`❌ Resolver path does not exist: ${resolverPath}`);
  process.exit(1);
}

let resolver;
try {
  resolver = require(resolverPath);
} catch (err) {
  console.error(`❌ Failed to load resolver from ${resolverPath}`);
  console.error(err);
  process.exit(1);
}

// Import runner
const { runAllTests } = require("./lib/runner");

(async () => {
  try {
    const result = await runAllTests({
      suites: [
        "R-001-allowlist",
        "R-002-io-contract",
        "R-003-failure-modes"
      ],
      resolver
    });

    if (result.failed > 0) {
      console.error(`❌ ${result.failed} resolver tests failed`);
      process.exit(1);
    }

    console.log("✅ All resolver tests passed");
    process.exit(0);

  } catch (err) {
    console.error("🔥 Resolver test runner crashed");
    console.error(err);
    process.exit(1);
  }
})();
