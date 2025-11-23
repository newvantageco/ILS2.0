# Build Dependency & Technology Stack Review

**Date:** November 2025
**Platform:** ILS 2.0 Healthcare Operating System
**Review Type:** System Updates & Language Assessment

---

## Executive Summary

ILS 2.0 is built on a modern technology stack but has several dependencies that require updates. This review identifies **critical updates**, **recommended improvements**, and **future technology considerations** for this SaaS healthcare platform.

### Priority Summary

| Priority | Category | Items |
|----------|----------|-------|
| **Critical** | Python Services | FastAPI, NumPy, pandas outdated by 12+ months |
| **High** | Node.js Runtime | Node 20 → Node 22/24 LTS |
| **High** | TypeScript | 5.6.3 → 5.9.x |
| **Medium** | React | 18.3 → 19.x |
| **Medium** | Express | 4.21 → 5.x |
| **Low** | ESLint | 8.x → 9.x (flat config) |

---

## 1. Runtime & Language Versions

### Node.js

| Current | Available | Recommendation |
|---------|-----------|----------------|
| Node 20 (Dockerfile) | Node 22 LTS "Jod" (EOL: Apr 2027)<br>Node 24 LTS "Krypton" (EOL: Apr 2028) | **Upgrade to Node 22 LTS** |

**Why Node 22:**
- Active LTS with support through April 2027
- Native ES modules improvements
- Better V8 engine performance
- TypeScript compile cache support (2.5x faster `tsc --version`)
- Node 24 is newest but has a known Buffer.allocUnsafe issue

**Migration Steps:**
1. Update `Dockerfile` base image: `node:22-slim`
2. Update `engines` field in `package.json`
3. Test all dependencies for compatibility
4. Verify native modules (Rust bindings) work with Node 22

### TypeScript

| Current | Latest | Recommendation |
|---------|--------|----------------|
| 5.6.3 | 5.9.3 | **Upgrade to 5.8.x or 5.9.x** |

**Benefits of upgrading:**
- TypeScript 5.7: Improved uninitialized variable checks, module.enableCompileCache() support
- TypeScript 5.8: Enhanced type narrowing, better Go migration path preparation
- TypeScript 5.9: Latest features and bug fixes

**Future Note:** TypeScript 7 will be rewritten in Go with up to 10x faster builds.

### Python

| Current | Latest | Action |
|---------|--------|--------|
| 3.x (unspecified) | 3.12/3.13 | **Pin to Python 3.12** |

**Recommendation:** Explicitly specify Python 3.12 in requirements and Docker configurations for better reproducibility.

---

## 2. Framework Updates

### React

| Current | Latest Stable | Recommendation |
|---------|---------------|----------------|
| 18.3.1 | 19.2.0 | **Consider upgrading to React 19** |

**React 19 Key Features:**
- **Actions:** Async functions in `startTransition` for background state updates
- **Server Components:** RSC features now stable
- **Simplified refs:** No more `forwardRef` needed for function components
- **Built-in metadata:** Native `<title>` and `<meta>` management
- **Preloading APIs:** `preinit`, `preload`, `prefetchDNS`, `preconnect`

**Migration Path:**
1. First upgrade to React 18.3.1 (adds deprecation warnings)
2. Run tests and fix deprecation warnings
3. Upgrade to React 19.x
4. Update React DOM and related packages

**Risk Assessment:** Medium - Requires testing of all components, especially those using refs and context.

### Express

| Current | Latest | Recommendation |
|---------|--------|----------------|
| 4.21.2 | 5.x | **Evaluate Express 5 migration** |

**Express 5 Benefits:**
- Automatic async/await error handling (no manual `next(err)` required)
- Built-in body-parser (no separate dependency)
- Improved security via path-to-regexp 8.x (ReDoS protection)
- Valid HTTP status code enforcement
- Requires Node 18+ (already satisfied)

**Breaking Changes to Address:**
- Optional parameter syntax: `:name?` → `{/:name}`
- `req.body` default: `{}` → `undefined`
- Remove sub-expressions in regex routes

**Risk Assessment:** Medium-High - Requires route syntax updates and thorough API testing.

### FastAPI (Python Services)

| Current | Latest | Priority |
|---------|--------|----------|
| 0.104.1 | 0.121.3 | **CRITICAL** |

**python-service/requirements.txt:**
```
# Current (OUTDATED)
fastapi==0.104.1      # 12+ months old
uvicorn==0.24.0       # Outdated
pandas==2.1.3         # Outdated
numpy==1.26.2         # Major version behind
scikit-learn==1.3.2   # Outdated
```

**Recommended Updates:**
```
# Updated versions
fastapi>=0.121.0
uvicorn[standard]>=0.30.0
pandas>=2.2.0
numpy>=2.1.0  # Note: NumPy 2.x has breaking changes
scikit-learn>=1.5.0
scipy>=1.14.0
```

**NumPy 2.x Migration Note:**
NumPy 2.0+ includes ABI breaks and API changes. Test thoroughly before deploying.

### AI Service Requirements

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| torch | >=2.0.0 | 2.5.x | Pin to specific version |
| transformers | >=4.36.0 | 4.46.x | Update recommended |
| llama-index | >=0.9.0 | 0.11.x | Major updates available |
| anthropic | >=0.7.8 | 0.40.x | Significantly outdated |
| openai | >=1.6.0 | 1.55.x | Update recommended |

---

## 3. ORM & Database

### Drizzle ORM

| Current | Latest | Status |
|---------|--------|--------|
| 0.44.7 | 0.44.7 | **Up to date** |

**Notes:**
- Drizzle ORM is current
- Consider using identity columns over serial types (PostgreSQL best practice)
- drizzle-kit 0.31.6 is also current

### PostgreSQL

| Current | Recommended |
|---------|-------------|
| 15+ | PostgreSQL 16 or 17 |

**PostgreSQL 16/17 Benefits:**
- Better query performance
- Improved JSONB operations
- Enhanced parallel query execution
- Logical replication improvements

---

## 4. Build Tools & Development

### Vite

| Current | Status |
|---------|--------|
| 7.2.2 | **Current/Recent** |

Vite is up to date - no action needed.

### ESLint

| Current | Latest | Recommendation |
|---------|--------|----------------|
| 8.57.1 | 9.x | **Plan migration to ESLint 9** |

**ESLint 9 Changes:**
- Flat config is now default (no more `.eslintrc.*`)
- Must migrate to `eslint.config.js`
- Use `defineConfig()` from `eslint/config`
- Improved plugin system

**Migration Tool:**
```bash
npx @eslint/migrate-config .eslintrc.json
```

**Risk Assessment:** Low-Medium - Most plugins now support flat config. Migration tool available.

### Testing Libraries

| Package | Current | Latest | Action |
|---------|---------|--------|--------|
| Jest | 29.7.0 | 29.7.0 | Current |
| Vitest | 4.0.7 | Current | Current |
| Playwright | 1.56.1 | Current | Current |

Testing stack is well-maintained.

---

## 5. Rust Native Module

### Current Rust Dependencies

| Crate | Version | Status |
|-------|---------|--------|
| napi | 2.16 | Current |
| ndarray | 0.15 | Current |
| statrs | 0.16 | Current |
| rayon | 1.10 | Current |
| serde | 1.0 | Current |
| linfa | 0.7 | Current |

**Assessment:** Rust dependencies are well-maintained and current.

**Build Optimization:** Already optimized with:
- `lto = true` (Link-Time Optimization)
- `opt-level = 3`
- `codegen-units = 1`
- `strip = true`

---

## 6. Alternative Technology Considerations

### Bun as Node.js Alternative

**Bun Performance Advantages:**
- 4x HTTP throughput
- 30x faster package installs
- 10-30x faster test execution
- Microsecond cold starts for serverless

**Current Assessment for ILS 2.0:**
| Factor | Recommendation |
|--------|----------------|
| Production SaaS | **Stay with Node.js** |
| Internal Tooling | Consider Bun |
| New Microservices | Evaluate Bun |

**Why stay with Node.js:**
- Better ecosystem maturity for healthcare/enterprise
- Full Windows support
- All npm packages guaranteed to work
- Node.js 22/24 has significant performance improvements

**When to consider Bun:**
- New standalone microservices
- Development tooling
- Internal tools where speed is critical

### Deno as Alternative

Not recommended for ILS 2.0 due to:
- npm compatibility complexity
- Healthcare ecosystem not well-supported
- Migration effort would be significant

---

## 7. Security Considerations

### Dependencies to Watch

| Package | Concern | Action |
|---------|---------|--------|
| express-session | Session security | Review session configuration |
| helmet | Security headers | Verify all headers enabled |
| bcryptjs | Password hashing | Current - continue using |
| stripe | Payment security | Keep updated |

### Recommended Security Updates

1. **Enable Dependabot** for automated security updates
2. **Run npm audit** regularly
3. **Pin Python dependencies** to specific versions
4. **Update AI service SDK versions** (anthropic, openai significantly outdated)

---

## 8. Recommended Action Plan

### Immediate (Next Sprint)

1. **Update Python Services** (Critical)
   ```txt
   fastapi>=0.121.0
   uvicorn[standard]>=0.30.0
   pandas>=2.2.0
   pydantic>=2.9.0
   ```

2. **Update AI Service SDKs**
   ```txt
   anthropic>=0.40.0
   openai>=1.50.0
   ```

3. **Run security audit**
   ```bash
   npm audit
   pip-audit
   cargo audit
   ```

### Short-term (1-2 months)

1. **Upgrade Node.js to 22 LTS**
   - Update Dockerfile
   - Test native modules
   - Verify all dependencies

2. **Upgrade TypeScript to 5.8+**
   - Update package.json
   - Fix any new type errors

3. **Migrate ESLint to 9.x**
   - Use migration tool
   - Convert to flat config

### Medium-term (3-6 months)

1. **Evaluate React 19 migration**
   - Test with React 18.3.1 first
   - Plan component updates
   - Test extensively

2. **Evaluate Express 5 migration**
   - Audit all routes for syntax changes
   - Update error handling patterns
   - Test all API endpoints

### Long-term Considerations

1. **Monitor TypeScript 7** (Go rewrite) for potential performance improvements
2. **Track Bun maturity** for future microservices
3. **Consider PostgreSQL 17** when stable on cloud providers

---

## 9. Version Update Summary

### package.json Updates

```json
{
  "dependencies": {
    "typescript": "~5.8.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "express": "^5.0.0"
  },
  "devDependencies": {
    "eslint": "^9.0.0",
    "@types/node": "^22.0.0"
  },
  "engines": {
    "node": ">=22.0.0"
  }
}
```

### Dockerfile Updates

```dockerfile
# Update base images
FROM node:22-slim AS builder
FROM node:22-slim AS production
```

### Python Requirements Updates

**python-service/requirements.txt:**
```txt
fastapi>=0.121.0
uvicorn[standard]>=0.30.0
pydantic>=2.9.0
pandas>=2.2.0
numpy>=2.1.0
scikit-learn>=1.5.0
scipy>=1.14.0
```

**ai-service/requirements.txt:**
```txt
torch>=2.4.0
transformers>=4.45.0
anthropic>=0.40.0
openai>=1.50.0
llama-index>=0.11.0
```

---

## 10. Conclusion

ILS 2.0 has a solid, modern architecture with recent commits showing active development. The primary areas requiring attention are:

1. **Python services** - Dependencies are significantly outdated (12+ months)
2. **Node.js runtime** - Should upgrade to Node 22 LTS
3. **TypeScript** - Minor version upgrade recommended
4. **Framework migrations** - React 19 and Express 5 should be evaluated

The Rust native module integration is excellent and well-optimized. The frontend build tooling (Vite, Tailwind) is current.

**Overall Health:** Good with targeted improvements needed in Python services and runtime upgrades.

---

*Report generated: November 2025*
*Next review recommended: February 2026*
