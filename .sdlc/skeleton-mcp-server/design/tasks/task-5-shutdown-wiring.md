# Task 5: Shutdown wiring and integration smoke test

## Trace
- **FR-IDs:** FR-06
- **Depends on:** task-4
- **Design:** ../design.md

## Files
- `packages/skeleton-mcp-server/src/index.ts` — modify (add SIGINT/SIGTERM handlers)
- `packages/skeleton-mcp-server/src/preview-server.test.ts` — update (interface change)

## Design References
- design.md §Data Flow (Shutdown flow)
- design.md §Interface Contracts (Internal Interfaces: `PreviewServer.stop`)

## Contracts (task-specific)

### Internal Interfaces
- SIGINT / SIGTERM handler in `index.ts`:
  - Pre: `PreviewServer` is running
  - Post: `PreviewServer.stop()` resolves, then `process.exit(0)` is called
  - Constraint: handler is registered once on `process.on('SIGINT', ...)` and `process.on('SIGTERM', ...)`

## Acceptance Criteria

### FR-06: Clean shutdown on SIGINT
- GIVEN the MCP server is running and the HTTP server is listening on port 3333
- WHEN `SIGINT` is sent to the process
- THEN `PreviewServer.stop()` SHALL be awaited
- AND the process SHALL exit with code 0
- AND port 3333 SHALL be freed (verified by a subsequent `net.createServer().listen(3333)` succeeding)

### FR-06: Clean shutdown on SIGTERM
- GIVEN the MCP server is running
- WHEN `SIGTERM` is sent to the process
- THEN the same shutdown sequence as SIGINT SHALL execute

### FR-06 (edge case): Port already in use at startup
- GIVEN port 3333 is already bound by another process
- WHEN the MCP server starts and `PreviewServer.start()` rejects
- THEN a clear error message SHALL be logged to stderr
- AND the process SHALL exit with a non-zero code

## Done Criteria
- [ ] `process.on('SIGINT', ...)` and `process.on('SIGTERM', ...)` registered in `index.ts`
- [ ] Both handlers await `PreviewServer.stop()` before calling `process.exit(0)`
- [ ] Port-in-use error at startup logs a descriptive message to `stderr` and exits non-zero
- [ ] `preview-server.test.ts` updated for any interface changes introduced in this task
- [ ] Manual smoke test: `node dist/index.js` → browser opens → `Ctrl+C` → port freed (no EADDRINUSE on restart)
