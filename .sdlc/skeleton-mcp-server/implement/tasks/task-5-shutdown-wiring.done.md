# Task 5 Completion: Shutdown wiring and integration smoke test

## Summary
All shutdown wiring (SIGINT/SIGTERM handlers, port-in-use error handling) was already implemented during task-4 execution in `index.ts`. No new code changes were required. All 17 tests pass including the `start()` port-in-use rejection test and `stop()` port-freeing tests in `preview-server.test.ts`.

## Commits
- No new commits — implementation was completed as part of task-4.

## Deviations
- **Rule 1: Bug (pre-existing, carried forward)** — `shutdown` handler in `index.ts` also calls `await server.close()` (MCP server) in addition to `preview.stop()`. This is beyond the task spec but correct behaviour — added proactively during task-4.

## Difficulties
- None — the verification confirmed all done criteria already satisfied.

## Notes
All done criteria verified:
- `process.on('SIGINT', ...)` and `process.on('SIGTERM', ...)` registered in `index.ts` (lines 46–47)
- Both handlers await `PreviewServer.stop()` before `process.exit(0)` (lines 40–44)
- Port-in-use startup error logs to stderr and exits non-zero via `main().catch()` (lines 51–54)
- `preview-server.test.ts` has `start()` port-in-use test and `stop()` port-freeing tests
- 17/17 tests pass
