# Design: skeleton-mcp-server

## Trace
- **FR-IDs covered:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06
- **Requirements:** ../requirements.md

## Architecture

### Components
- `packages/skeleton-mcp-server/src/index.ts`: MCP server entry point — registers `serve_skeleton` tool, wires shutdown signals — new
- `packages/skeleton-mcp-server/src/preview-server.ts`: HTTP server on port 3333 — serves preview page, manages SSE clients, stores current HTML, broadcasts reload signals — new
- `packages/skeleton-mcp-server/src/browser.ts`: thin wrapper around the `open` npm package for cross-platform browser launch — new

### Data Flow

**First call:**
`serve_skeleton(html)` → `PreviewServer.updateHtml(html)` → store `currentHtml` → broadcast SSE reload signal (no clients yet) → `open('http://localhost:3333')` → set `browserOpened = true` → return `"Preview ready at http://localhost:3333"`

**Subsequent calls:**
`serve_skeleton(html)` → `PreviewServer.updateHtml(html)` → store `currentHtml` → broadcast `event: update\ndata: reload\n\n` to all SSE clients → browser receives signal → `location.reload()` → `GET /` returns new HTML → return `"Preview ready at http://localhost:3333"`

**Browser page load:**
`GET /` → `injectScript(currentHtml)` → serve page with embedded SSE client JS
`GET /events` → register `ServerResponse` in `sseClients` set → keep connection open → remove on client disconnect

**Shutdown:**
`SIGINT / SIGTERM` → `PreviewServer.stop()` → close all SSE connections → close HTTP server → process exits

## Data Models

In-memory runtime state only. No persistence between sessions (per FR-05 and Prohibitions).

- `currentHtml: string | null` — HTML string currently being served; `null` until first `serve_skeleton` call
- `sseClients: Set<ServerResponse>` — active SSE connections; entries added on `GET /events`, removed on client disconnect or shutdown
- `browserOpened: boolean` — `false` on startup; set to `true` after first successful browser launch (FR-02 edge case: prevents opening a second tab)

## Interface Contracts

### MCP Tool
- `serve_skeleton(html: string) → string`: accepts HTML, updates preview, opens browser on first call
  - Pre: MCP server is running and connected
  - Post: `currentHtml` updated, SSE reload signal broadcast, browser opened if first call
  - Returns: `"Preview ready at http://localhost:3333"` on success
  - Returns: error string to Claude if `html` is empty — does not throw, does not crash server (FR-01 failure path)

### API Endpoints
- `GET /`: serve the current preview page
  - Output: `200 text/html` — `injectScript(currentHtml)`
  - Errors: `503` if `currentHtml` is null (server started but no content yet)
- `GET /events`: SSE stream for reload signals
  - Output: `200 text/event-stream`, keeps connection open
  - Pushes: `event: update\ndata: reload\n\n` on each `serve_skeleton` call after the first

### Internal Interfaces
- `PreviewServer.start() → Promise<void>`: binds port 3333; rejects with a clear error message if port is already in use (FR-06 edge case)
  - Pre: port 3333 is free
  - Post: HTTP server is listening
- `PreviewServer.updateHtml(html: string) → void`: sets `currentHtml`, iterates `sseClients` and writes the reload event to each
  - Pre: none (safe to call before any client connects)
  - Post: `currentHtml` updated; all connected SSE clients receive reload signal
- `PreviewServer.stop() → Promise<void>`: ends all SSE client connections, closes HTTP server
  - Pre: server is running
  - Post: port 3333 is freed (FR-06)

## Design Decisions

### Refresh strategy: SSE + full page reload
- **Chosen:** Browser holds an SSE connection to `GET /events`; server sends a reload signal; browser calls `location.reload()`
- **Rationale:** Simple — the signal payload is trivial, the browser re-fetches the page over localhost (negligible latency), and `location.reload()` is universally reliable
- **Rejected:** SSE + `document.write(html)` in-place replacement — eliminates the brief reload flash but adds HTML as SSE payload (potentially large), and `document.write` quirks with scripts in the user HTML add unnecessary risk

### SSE script injection
- **Chosen:** Inject SSE client script before `</body>` if present; otherwise append to end of HTML string
- **Rationale:** Handles both full HTML documents and bare HTML fragments without requiring the user to structure their output in any particular way
- **Rejected:** Always wrap user HTML in a shell document — would silently alter the document structure and could break designs that supply their own `<html>/<head>/<body>` tags

### Browser open: `open` npm package
- **Chosen:** `open` npm package (`import open from 'open'`)
- **Rationale:** Cross-platform (Windows/macOS/Linux) with no shell injection risk; well-maintained; adds one small dependency with no transitive dependencies
- **Rejected:** `child_process.exec` with `process.platform` detection — zero dependencies but requires manual platform branching and is vulnerable to shell injection if the URL ever contains untrusted characters
