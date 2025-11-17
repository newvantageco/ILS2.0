# Archive Directory

This directory contains legacy code, tests, and documentation that have been archived for historical reference.

## Contents

### `/legacy-tests/` - Legacy Test Scripts (24 files)

Archived test scripts from early development phases. These tests were replaced by the current test suite using Jest, Vitest, and Playwright.

**Archived:** November 17, 2025
**Reason:**
- Replaced by modern test infrastructure
- No longer maintained or executed
- Kept for historical reference and migration context

**Files include:**
- Shell script-based API tests (`test-api-*.sh`)
- Early AI system tests (`test-ai-*.sh`, `test-ai-*.js`)
- Manual feature tests (`test-advanced-features*.sh`)
- Legacy integration tests (`test-e2e-api.sh`, `test-workflow-integration.sh`)
- Early business logic tests (`.cjs` files for marketplace, forecasting, etc.)

**Current test suite:** See `/test/` directory and `TESTING.md` for active test infrastructure.

---

## Guidelines

1. **Do not modify** files in this archive
2. **Do not import** archived code into active codebase
3. **Reference only** - Use for understanding historical context
4. Files may be deleted after 1 year if no longer needed

---

**Note:** If you need to reference specific functionality from archived tests, consider:
1. Reviewing current test suite for equivalent coverage
2. Consulting git history for context
3. Implementing fresh tests using current patterns
