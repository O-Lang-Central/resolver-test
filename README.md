# O-Lang Resolver Test Suite

**Version:** 1.0.0  
**Maintained by:** O-Lang Core Team  
**Specification:** O-Lang Resolver Contract v1.x  
**License:** MIT

---

## Certification Badge

[![O-Lang Resolver Certification](badges/certified.svg)](https://medium.com/@o-lang/olang-resolver-certification-essay)

Click the badge to read the official essay on Medium explaining your resolver certification process, conformance philosophy, and project vision.  

You can also link to the GitHub repo directly:

[![O-Lang Resolver Certification](badges/certified.svg)](https://github.com/O-Lang-Central/resolver-test)

---

## Overview

This repository provides the **official O-Lang Resolver Test Harness**, designed to validate any O-Lang resolver implementation against:

- Allowlist compliance  
- Input/output contracts  
- Failure modes  

It mirrors the **kernel test philosophy**: deterministic, safe, and locked to a single entrypoint.

All tests are **self-contained** in folders `R-001`, `R-002`, `R-003`, etc., each containing:

- `workflow.ol` — the workflow for the test  
- `test.json` — the assertions for this test suite  
- `resolver.js` — for metadata (if applicable)  
- `README.md` — notes for this suite  

---

## Environment Setup

Set the resolver to test:

```bash
export OLANG_RESOLVER=./path-to-your-resolver
