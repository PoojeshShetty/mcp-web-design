# Task 4 Completion: MCP tool handler — serve_skeleton

## Summary
Created `src/index.ts` with `createToolHandler` (exported for testability) and a `main()` entry point that starts `PreviewServer`, registers the `serve_skeleton` tool via `McpServer.registerTool`, connects over stdio, and wires SIGINT/SIGTERM shutdown. Created `src/index.test.ts` with 4 unit tests covering empty html rejection, valid html flow, openOnce invocation, and subsequent-call confirmation.

## Commits
- `203d0b2` feat(skeleton-mcp-server): implement serve_skeleton MCP tool handler (FR-01, FR-02, FR-03, FR-04, FR-05)

## Deviations
- **Rule 1: Bug** — `main()` ran on module import, causing `process.exit(1)` in the test environment. Fixed by guarding with `if (require.main === module)`.

## Difficulties
- None beyond the import-side-effect fix above.

## Notes
`createToolHandler` is exported so tests can inject mock `PreviewServer` and `BrowserState` without spawning a real server. The guard `require.main === module` is the standard CommonJS idiom for this pattern.
