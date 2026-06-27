# Task 4: MCP tool handler — serve_skeleton

## Trace
- **FR-IDs:** FR-01, FR-02, FR-03, FR-04, FR-05
- **Depends on:** task-2, task-3
- **Design:** ../design.md

## Files
- `packages/skeleton-mcp-server/src/index.ts` — create
- `packages/skeleton-mcp-server/src/index.test.ts` — create

## Design References
- design.md §Architecture (index.ts component — MCP server entry point)
- design.md §Data Flow (First call and Subsequent calls flows)
- design.md §Interface Contracts (MCP Tool: `serve_skeleton`)

## Contracts (task-specific)

### Internal Interfaces
- `serve_skeleton` tool handler `(args: { html: string }) → string`:
  - Pre: MCP server is running and connected
  - Post: `PreviewServer.updateHtml(html)` called, `BrowserState.openOnce` called on first invocation
  - Returns: `"Preview ready at http://localhost:3333"` on success
  - Returns: error string (e.g., `"Error: html must not be empty"`) if `html` is empty string — does NOT throw

## Acceptance Criteria

### FR-01: serve_skeleton registers and responds
- GIVEN the MCP server is running
- WHEN Claude calls `serve_skeleton` with `html: "<h1>Test</h1>"`
- THEN the handler SHALL call `PreviewServer.updateHtml("<h1>Test</h1>")`
- AND SHALL return `"Preview ready at http://localhost:3333"`

### FR-01 (failure): empty html
- GIVEN the MCP server is running
- WHEN Claude calls `serve_skeleton` with `html: ""`
- THEN the handler SHALL return an error string
- AND SHALL NOT call `PreviewServer.updateHtml`
- AND the server SHALL remain operational

### FR-02: Browser opens on first call
- GIVEN `BrowserState.browserOpened` is `false`
- WHEN `serve_skeleton` is called with valid HTML
- THEN `BrowserState.openOnce` SHALL be called

### FR-03: Subsequent calls update content without re-opening browser
- GIVEN `BrowserState.browserOpened` is `true`
- WHEN `serve_skeleton` is called again
- THEN `PreviewServer.updateHtml` SHALL be called with new HTML
- AND `BrowserState.openOnce` SHALL NOT call `openBrowser` again

### FR-04: Confirmation returned
- GIVEN valid HTML is provided
- WHEN `serve_skeleton` resolves
- THEN the return value SHALL be `"Preview ready at http://localhost:3333"`

### FR-05: No external HTTP calls
- GIVEN the handler is invoked
- WHEN it runs to completion
- THEN no outbound network requests SHALL be made outside of localhost

## Done Criteria
- [ ] `src/index.ts` creates an MCP Server, registers `serve_skeleton` tool with correct JSON schema (`html: string`)
- [ ] Empty `html` returns an error string without crashing
- [ ] Valid `html` calls `updateHtml` and returns confirmation string
- [ ] `BrowserState.openOnce` is called on each valid invocation (guard logic in `openOnce` itself prevents duplicate opens)
- [ ] All unit tests in `index.test.ts` pass with `PreviewServer` and `BrowserState` mocked
