# O-Lang Resolver Test Suite

**Version:** 1.0.0  
**Maintained by:** O-Lang Core Team  
**Specification:** O-Lang Resolver Contract v1.x  
**License:** MIT

---

## Overview

This repository provides the **official O-Lang Resolver Test Harness**, designed to validate any O-Lang resolver implementation against:

- Allowlist compliance  
- Input/output contracts  
- Failure modes  

It mirrors the **kernel test philosophy**: deterministic, safe, and locked to a single entrypoint.  

All tests are **self-contained** in folders `R-001`, `R-002`, `R-003`, etc., each containing:

- `resolver.ol` — the resolver under test  
- `test.json` — the assertions for this test suite  
- `README.md` — notes for this suite  

---

![O-Lang Resolver Certification](badges/certified.svg)

This badge is **generated automatically** if all tests pass, signifying that a resolver is **fully certified** for O-Lang.

---

## Environment Setup

Set the resolver to test:

```bash
export OLANG_RESOLVER=./path-to-your-resolver

---
The resolver must export:

Runtime function (module.exports = capability)

Metadata (resolverName, resolverDeclaration)

Inputs, outputs, and failure policies as per resolver.js


#Usage
##Run all resolver tests
npm test
# or
olang-resolver-test

---

#Run specific suites

olang-resolver-test --suite R-001-allowlist --suite R-005-resolver-metadata-contract

#JSON Conformance Report

olang-resolver-test --json
# Output: conformance-report.json

#Generate Certification Badge
olang-resolver-test --badge
# Output: badges/certified.svg
olang-resolver-test --json --badge

resolver-test/
├─ R-001-allowlist/
│  ├─ workflow.ol
│  └─ test.json
├─ R-002-io-contract/
│  ├─ workflow.ol
│  └─ test.json
├─ R-003-failure-modes/
├─ R-004-invalid-syntax/
├─ R-005-resolver-metadata-contract/
│  ├─ resolver.js
│  └─ test.json
├─ lib/
│  └─ runner.js
├─ run.js
├─ run-kernel.js
├─ badges/
│  └─ certified.svg
└─ README.md

How to Certify a Resolver

Implement your resolver following the O-Lang resolver contract.

Set OLANG_RESOLVER to point to your resolver folder.

Run the test harness:

olang-resolver-test --json --badge


Verify results:

All tests must pass ✅

conformance-report.json summarizes each suite

badges/certified.svg is generated automatically if fully compliant

Publish certified resolver with badge for verification by other O-Lang users.

Integrating with CI/CD

Use the JSON output in your pipelines:

olang-resolver-test --json > conformance-report.json


Then fail builds if result.failed > 0.

Contributing

Ensure your resolver passes all tests before submitting.

Follow semantic versioning.

Keep metadata contract updated.

Use olang-resolver-test --json to integrate into automation or pipelines.

License

MIT © O-Lang Core Team


---

