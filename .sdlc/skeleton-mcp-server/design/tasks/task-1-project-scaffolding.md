# Task 1: Project scaffolding

## Trace
- **FR-IDs:** FR-01, FR-05
- **Depends on:** none
- **Design:** ../design.md

## Files
- `packages/skeleton-mcp-server/package.json` — create
- `packages/skeleton-mcp-server/tsconfig.json` — create
- `packages/skeleton-mcp-server/.gitignore` — create

## Design References
- design.md §Architecture (Components — all three source files)
- design.md §Design Decisions (Browser open: `open` npm package)

## Contracts (task-specific)

### Internal Interfaces
- `package.json` must declare: `name: "@repo/skeleton-mcp-server"`, `main: "dist/index.js"`, `scripts.build`, `scripts.start`, `scripts.test`
  - Dependencies: `@modelcontextprotocol/sdk`, `open`
  - DevDependencies: `typescript`, `@types/node`, `vitest` (or `jest`)

## Acceptance Criteria

### FR-01: MCP server project exists and can be built
- GIVEN the scaffolding task is complete
- WHEN `npm install && npm run build` is executed in `packages/skeleton-mcp-server`
- THEN the command succeeds with no errors
- AND `dist/index.js` is produced

### FR-05: No external API dependencies
- GIVEN the `package.json` is complete
- WHEN its `dependencies` are inspected
- THEN they SHALL contain only `@modelcontextprotocol/sdk` and `open`
- AND SHALL NOT contain any AI SDK or HTTP client to external services

## Done Criteria
- [ ] `packages/skeleton-mcp-server/package.json` exists with correct name, scripts, and dependencies
- [ ] `packages/skeleton-mcp-server/tsconfig.json` targets ES2022, `moduleResolution: node`, `outDir: dist`, `strict: true`
- [ ] `packages/skeleton-mcp-server/.gitignore` excludes `node_modules/` and `dist/`
- [ ] `npm install` succeeds in the package directory
- [ ] `npm run build` produces `dist/index.js` (after source files exist)
