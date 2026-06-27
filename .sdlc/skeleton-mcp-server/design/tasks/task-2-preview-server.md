# Task 2: PreviewServer — HTTP server and SSE reload

## Trace
- **FR-IDs:** FR-01, FR-03, FR-04, FR-06
- **Depends on:** task-1
- **Design:** ../design.md

## Files
- `packages/skeleton-mcp-server/src/preview-server.ts` — create
- `packages/skeleton-mcp-server/src/preview-server.test.ts` — create

## Design References
- design.md §Architecture (preview-server.ts component)
- design.md §Data Models (`currentHtml`, `sseClients`, `browserOpened`)
- design.md §Interface Contracts (API Endpoints: `GET /`, `GET /events`; Internal Interfaces: `PreviewServer.start`, `PreviewServer.updateHtml`, `PreviewServer.stop`)
- design.md §Design Decisions (Refresh strategy: SSE + full page reload; SSE script injection)

## Contracts (task-specific)

### API Endpoints
- `GET /`: serve current preview page
  - Input: none
  - Output: `200 text/html` — `injectScript(currentHtml)`
  - Errors: `503 text/plain "No content yet"` if `currentHtml` is null
- `GET /events`: SSE stream for reload signals
  - Output: `200 text/event-stream`, connection held open
  - Pushes: `event: update\ndata: reload\n\n` after each `updateHtml` call

### Internal Interfaces
- `PreviewServer.start() → Promise<void>`
  - Pre: port 3333 is free
  - Post: HTTP server listening on port 3333
  - Throws (rejects): clear Error message if port already in use
- `PreviewServer.updateHtml(html: string) → void`
  - Pre: none
  - Post: `currentHtml` set; all connected SSE clients receive `event: update\ndata: reload\n\n`
- `PreviewServer.stop() → Promise<void>`
  - Pre: server is running
  - Post: all SSE connections closed, port 3333 freed
- `injectScript(html: string) → string` (module-private)
  - Injects SSE client `<script>` before `</body>` if present; otherwise appends to end

## Acceptance Criteria

### FR-01: HTTP server serves HTML at localhost:3333
- GIVEN `PreviewServer.start()` has resolved
- WHEN `GET http://localhost:3333/` is requested after `updateHtml('<h1>Hello</h1>')`
- THEN the response SHALL be `200 text/html`
- AND the body SHALL contain `<h1>Hello</h1>`

### FR-01 (failure): empty html input
- GIVEN the server is running
- WHEN `GET /` is requested before any `updateHtml` call
- THEN the response SHALL be `503`
- AND the server SHALL remain operational

### FR-03: SSE clients receive reload signal
- GIVEN a client is connected to `GET /events`
- WHEN `updateHtml(newHtml)` is called
- THEN the client SHALL receive `event: update\ndata: reload\n\n`

### FR-06: Clean shutdown frees port
- GIVEN the server is running with one SSE client connected
- WHEN `PreviewServer.stop()` is called
- THEN the SSE connection SHALL be ended
- AND a subsequent `PreviewServer.start()` SHALL succeed without EADDRINUSE

## Done Criteria
- [ ] `src/preview-server.ts` exports `PreviewServer` class with `start`, `updateHtml`, `stop` methods
- [ ] `GET /` returns `503` when `currentHtml` is null
- [ ] `GET /` returns `200` with injected SSE script after `updateHtml` is called
- [ ] `GET /events` holds the connection open and pushes reload event on `updateHtml`
- [ ] `stop()` closes all SSE connections and resolves after server close
- [ ] `start()` rejects with a descriptive error if port 3333 is in use
- [ ] `injectScript` inserts before `</body>` when present; appends otherwise
- [ ] All unit tests in `preview-server.test.ts` pass
