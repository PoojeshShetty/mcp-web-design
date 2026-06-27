# Task 2 Completion: PreviewServer — HTTP server and SSE reload

## Summary
Created `src/preview-server.ts` exporting `PreviewServer` (with `start`, `updateHtml`, `stop`) and the module-private `injectScript` helper. Created `src/preview-server.test.ts` with 8 vitest integration tests covering all acceptance criteria.

## Commits
- `3bd5cbd` feat(skeleton-mcp-server): implement PreviewServer with HTTP and SSE reload (FR-01, FR-03, FR-04, FR-06)

## Deviations
- **Rule 1: Bug** — Used `client.socket?.destroy()` instead of `client.end()` in `stop()`. `res.end()` on an SSE `ServerResponse` does not force TCP close on keep-alive connections, so the client-side `close` event never fired. `socket.destroy()` tears down the TCP connection immediately.

## Difficulties
- Node's global `http.globalAgent` reuses keep-alive connections across tests, causing ECONNRESET on `GET /` tests that ran after the 503 test. Fixed by passing `Connection: close` header in the test `get()` helper.
- `afterEach` errored with "Server is not running" when the stop test had already called `server.stop()`. Fixed with try/catch in `afterEach`.
