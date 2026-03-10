# AX Test Dashboard

## Project
Real-time analytics dashboard with simulated metrics, dark glassmorphism UI, and Vercel deployment.

## Stack
- Node.js 20 + Express 4.x backend
- Vanilla HTML/CSS/JS + Canvas API frontend
- In-memory storage, no database
- Deployed to Vercel serverless

## Commands
- `node src/app.js` — run locally on port 3000
- `node --test test/unit/` — unit tests
- `node --test test/integration/` — integration tests
- `node --test test/scenarios/` — scenario tests

# Testing Requirements (AX)

Every feature implementation MUST include tests at all three tiers:

## Test Tiers
1. **Unit tests** — Test individual functions/methods in isolation. Mock external dependencies.
2. **Integration tests** — Test component interactions with real services via docker-compose.test.yml.
3. **Scenario tests** — Test full user workflows end-to-end.

## Test Naming
Use semantic names: `Test<Component>_<Behavior>[_<Condition>]`
- Good: `TestAuthService_LoginWithValidCredentials`, `TestFullCheckoutFlow`
- Bad: `TestShouldWork`, `Test1`, `TestGivenUserWhenLoginThenSuccess`

## Reference
- See `TEST_GUIDE.md` for requirement-to-test mapping
- See `.claude/ax/references/testing-pyramid.md` for full methodology
- Every requirement in ROADMAP.md must map to at least one scenario test
