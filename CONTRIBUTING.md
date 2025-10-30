## Contributing Guidelines

### Workflow
- Create a feature branch: `feat/<scope>-<short-name>` or `fix/<scope>-<short-name>`
- Keep edits focused and small; open Draft PRs early
- Include tests where applicable (Jest/Vitest/Playwright)
- Ensure `npm run check` and `npm run test:all` pass

### Commit Messages
- Conventional Commits (recommended):
  - `feat(scope): add X`
  - `fix(scope): correct Y`
  - `docs(scope): update Z`

### Code Style
- TypeScript, explicit function signatures for exported APIs
- Prefer clear names over abbreviations; avoid 1–2 char identifiers
- Guard clauses over deep nesting; meaningful error handling

### Backend
- Enforce auth with `isAuthenticated`; honor tenancy via `companyId`
- Validate inputs with Zod schemas from `shared/`
- Use Drizzle ORM and shared enums/schemas for consistency

### Frontend
- Use TanStack Query for server state
- Keep components small; colocate component-specific hooks
- Follow existing Tailwind/shadcn/Radix patterns

### Security
- Never log secrets; use `.env` locally and secret stores in deployment
- Validate all inputs; respect role and subscription plan checks

### PR Checklist
- [ ] Linked issue or clear purpose
- [ ] Tests added/updated
- [ ] Docs updated (if user-facing change)
- [ ] Local smoke test done

