## Development Guide

### Quick Start
1. Install: `npm install`
2. Migrate DB: `npm run db:push`
3. Run dev: `npm run dev` → http://localhost:3000

### Useful Scripts
- Type check: `npm run check`
- All tests: `npm run test:all`
- Unit only: `npm run test:unit`
- Integration only: `npm run test:integration`
- Component tests: `npm run test:components`
- E2E: `npm run test:e2e` (or `:headed`/`:ui`)
- Build: `npm run build`

### Backend
- Entry: `server/index.ts` → `registerRoutes()`; dev uses Vite middleware
- Auth: `replitAuth.ts` (Replit OIDC) and `localAuth.ts` (email/password)
- Storage: Drizzle via `shared/schema.ts` and `server/storage.ts`
- WebSocket: `server/websocket.ts`

### Frontend
- Entry: `client/src/main.tsx` → `client/src/App.tsx`
- Routing: Wouter + `useAuth` gates
- State: TanStack Query in `client/src/lib/queryClient.ts`

### Environment
- See README for required vars; copy `.env.example` if available
- Port can be overridden via `PORT`

### Debugging
- Server: add breakpoints in VSCode, run `tsx` in inspect mode if needed
- Client: use React DevTools; network tab for API calls

### Testing Notes
- Keep tests colocated under `test/` (unit/integration) and component tests via Vitest
- Playwright E2E expects server on `http://localhost:3000`

### Conventions
- Use Zod validation for request payloads
- Enforce role and tenancy checks on all protected routes
- Prefer small, focused PRs and Conventional Commits

