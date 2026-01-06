const path = require("path");
const fs = require("fs");

// Reuse your assertion logic
function runAssertions(testSpec, resolverAST) {
  if (!testSpec.assertions || testSpec.assertions.length === 0) {
    return { ok: true, message: "No assertions defined" };
  }

  const failures = [];

  for (const assertion of testSpec.assertions) {
    const { id, type, severity = "fatal", message } = assertion;

    let passed = false;

    switch (type) {
      case "assert_allowlist":
        passed = checkAllowlist(resolverAST);
        break;
      case "assert_input_contract":
        passed = checkInputContract(resolverAST);
        break;
      case "assert_output_contract":
        passed = checkOutputContract(resolverAST);
        break;
      case "assert_failure_modes":
        passed = checkFailureModes(resolverAST);
        break;
      default:
        passed = false;
    }

    if (!passed) {
      failures.push({
        id,
        severity,
        message: message || `Assertion failed: ${type}`
      });
    }
  }

  return {
    ok: failures.length === 0,
    message: failures.length === 0
      ? "All assertions passed"
      : failures.map(f => `${f.id}: ${f.message}`).join("; "),
    failures
  };
}

// ----------------------
// Example checks
// ----------------------
function checkAllowlist(ast) {
  const allowedNodes = ["action", "prompt", "persist", "emit", "use", "ask"];
  if (!ast.steps) return false;
  return ast.steps.every(step => allowedNodes.includes(step.type));
}

function checkInputContract(ast) {
  return ast.inputs && Array.isArray(ast.inputs) && ast.inputs.length > 0;
}

function checkOutputContract(ast) {
  return ast.outputs && Array.isArray(ast.outputs) && ast.outputs.length > 0;
}

function checkFailureModes(ast) {
  return ast.failures && Array.isArray(ast.failures) && ast.failures.length > 0;
}

// ----------------------
// Add runAllTests for run.js
// ----------------------
async function runAllTests({ suites, resolver }) {
  let failed = 0;

  for (const suite of suites) {
    const suitePath = path.join(process.cwd(), suite, "test.json");
    if (!fs.existsSync(suitePath)) {
      console.error(`❌ Suite file not found: ${suitePath}`);
      failed++;
      continue;
    }

    const testSpec = require(suitePath);
    const result = runAssertions(testSpec, resolver);

    if (!result.ok) {
      console.error(`❌ ${suite} failed: ${result.message}`);
      failed++;
    } else {
      console.log(`✅ ${suite} passed`);
    }
  }

  return { failed };
}

module.exports = {
  runAssertions,
  runAllTests
};
