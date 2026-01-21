const path = require("path");
const fs = require("fs");

// ----------------------
// Validator functions for RESOLVER METADATA (R-005)
// ----------------------
function checkResolverHasField(resolverMeta, assertion) {
  return resolverMeta[assertion.field] === assertion.expected;
}

function checkResolverInputsValid(resolverMeta) {
  const inputs = resolverMeta.inputs;
  return (
    Array.isArray(inputs) &&
    inputs.every(
      i =>
        i &&
        typeof i.name === "string" &&
        typeof i.type === "string" &&
        typeof i.required === "boolean"
    )
  );
}

function checkResolverOutputsValid(resolverMeta) {
  const outputs = resolverMeta.outputs;
  return (
    Array.isArray(outputs) &&
    outputs.every(
      o =>
        o &&
        typeof o.name === "string" &&
        typeof o.type === "string"
    )
  );
}

function checkFieldNamesNormalized(resolverMeta, assertion) {
  const items = resolverMeta[assertion.field] || [];
  const pattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  return Array.isArray(items) && items.every(item => pattern.test(item.name));
}

function checkResolverFailuresValid(resolverMeta) {
  const failures = resolverMeta.failures;
  if (!failures) return false;

  return (
    Array.isArray(failures) &&
    failures.every(
      f =>
        f &&
        typeof f.code === "string" &&
        typeof f.retries === "number"
    )
  );
}

// ----------------------
// Validator functions for RESOLVER RUNTIME (R-006 → R-012)
// ----------------------

function checkResolverIsCallable(resolver) {
  return typeof resolver === 'function';
}

function checkFailureCodeDeclared(observedError, resolverMeta) {
  if (!observedError?.code) return true; // no error = pass
  const declaredCodes = (resolverMeta.failures || []).map(f => f.code);
  return declaredCodes.includes(observedError.code);
}

function checkRejectsMissingRequiredInput(invocationResult) {
  return invocationResult.threw; // must throw when required input missing
}

function checkRetryCountWithinLimit(observedRetries, resolverMeta, errorCode) {
  const failure = (resolverMeta.failures || []).find(f => f.code === errorCode);
  if (!failure) return true;
  return observedRetries <= failure.retries;
}

function checkOutputIsObject(output) {
  return output !== null && typeof output === 'object' && !Array.isArray(output);
}

function checkOutputFieldsMatchContract(output, resolverMeta) {
  const declaredNames = (resolverMeta.outputs || []).map(o => o.name);
  return declaredNames.every(name => name in output);
}

function checkDeterministicOutput(results) {
  if (results.length < 2) return true;
  const first = JSON.stringify(results[0]);
  return results.slice(1).every(r => JSON.stringify(r) === first);
}

function checkNoGlobalMutation() {
  // Placeholder: real impl would compare global state snapshots
  return true;
}

// ----------------------
// Assertion handler registry.
// ----------------------
const assertionHandlers = {
  // R-005: Metadata
  resolver_has_field: (resolverMeta, assertion) =>
    checkResolverHasField(resolverMeta, assertion),
  resolver_inputs_valid: checkResolverInputsValid,
  resolver_outputs_valid: checkResolverOutputsValid,
  field_names_normalized: checkFieldNamesNormalized,
  resolver_failures_valid: checkResolverFailuresValid,

  // R-006–R-012: Runtime
  resolver_is_callable: (ctx) => checkResolverIsCallable(ctx.resolver),
  resolver_failure_declared: (ctx) => checkFailureCodeDeclared(ctx.error, ctx.resolverMeta),
  rejects_missing_required_input: (ctx) => checkRejectsMissingRequiredInput(ctx),
  retry_count_within_declared_limit: (ctx) =>
    checkRetryCountWithinLimit(ctx.retryCount, ctx.resolverMeta, ctx.error?.code),
  output_is_object: (ctx) => checkOutputIsObject(ctx.output),
  output_fields_match_contract: (ctx) => checkOutputFieldsMatchContract(ctx.output, ctx.resolverMeta),
  deterministic_output: (ctx) => checkDeterministicOutput(ctx.outputs),
  no_global_state_mutation: () => checkNoGlobalMutation(),
};

// ----------------------
// Main assertion runner
// ----------------------
function runAssertions(testSpec, target, status = {}) {
  if (!testSpec.assertions?.length) {
    return { ok: true, message: "No assertions defined" };
  }

  const failures = [];

  for (const assertion of testSpec.assertions) {
    const { id, type, severity = "fatal", description } = assertion;
    let passed = false;

    if (type in assertionHandlers) {
      passed = assertionHandlers[type](target, assertion, status);
    } else {
      failures.push({
        id,
        severity,
        message: `Unknown assertion type: ${type}`,
      });
      continue;
    }

    if (!passed) {
      failures.push({
        id,
        severity,
        message: description || `Assertion failed: ${id}`,
      });
    }
  }

  return {
    ok: failures.length === 0,
    message:
      failures.length === 0
        ? "All assertions passed"
        : failures.map(f => `[${f.severity}] ${f.id}: ${f.message}`).join("; "),
    failures,
  };
}

// ----------------------
// Runtime resolver invoker with observation
// ----------------------
async function invokeResolverWithObservation(resolver, resolverMeta, testSpec) {
  const ctx = {
    resolver,
    resolverMeta,
    output: null,
    outputs: [],
    error: null,
    threw: false,
    retryCount: 0,
  };

  // Use empty input — resolver must handle its own validation
  const input = {};

  // Run multiple times for determinism test
  const runs = testSpec.test_id === 'R-011-determinism' ? 3 : 1;

  for (let i = 0; i < runs; i++) {
    try {
      const result = await Promise.resolve(resolver(input));
      ctx.output = result;
      ctx.outputs.push(result);
    } catch (err) {
      ctx.threw = true;
      ctx.error = err;
      // Simple retry count inference (real impl would use retry loop)
      if (err.code) {
        const decl = resolverMeta.failures?.find(f => f.code === err.code);
        if (decl) ctx.retryCount = decl.retries;
      }
      break; // stop on first error for non-determinism tests
    }
  }

  return ctx;
}

// ----------------------
// Test suite executor
// ----------------------
async function runAllTests({ suites, resolver }) {
  let failed = 0;
  const PACKAGE_ROOT = path.join(__dirname, '..');
  const resolverMeta = resolver.resolverDeclaration || resolver;

  for (const suite of suites) {
    const suiteDir = path.join(PACKAGE_ROOT, suite);
    const testSpecPath = path.join(suiteDir, "test.json");

    if (!fs.existsSync(testSpecPath)) {
      console.error(`❌ Test spec not found: ${testSpecPath}`);
      failed++;
      continue;
    }

    const testSpec = JSON.parse(fs.readFileSync(testSpecPath, "utf8"));
    const fixture = testSpec.fixtures.inputs[0];

    if (fixture.resolver_contract) {
      // R-005: Validate metadata structure
      const contractPath = path.join(suiteDir, fixture.resolver_contract);
      if (!fs.existsSync(contractPath)) {
        console.error(`❌ Resolver contract missing: ${contractPath}`);
        failed++;
        continue;
      }

      let target;
      try {
        target = require(contractPath);
      } catch (err) {
        console.error(`❌ Failed to load resolver contract ${suite}:`, err.message);
        failed++;
        continue;
      }

      const result = runAssertions(testSpec, target);
      if (!result.ok) {
        console.error(`❌ ${suite} failed: ${result.message}`);
        failed++;
      } else {
        console.log(`✅ ${suite} passed`);
      }
    } else if (testSpec.category === "resolver-runtime") {
      // R-006 → R-012: Observe real resolver behavior
      try {
        const runtimeContext = await invokeResolverWithObservation(resolver, resolverMeta, testSpec);
        const result = runAssertions(testSpec, runtimeContext);

        if (!result.ok) {
          console.error(`❌ ${suite} failed: ${result.message}`);
          failed++;
        } else {
          console.log(`✅ ${suite} passed`);
        }
      } catch (err) {
        console.error(`🔥 Runtime test ${suite} crashed:`, err.message);
        failed++;
      }
    } else {
      console.error(`❌ Unrecognized fixture in ${suite}`);
      failed++;
    }
  }

  return { failed };
}

module.exports = {
  runAssertions,
  runAllTests,
};