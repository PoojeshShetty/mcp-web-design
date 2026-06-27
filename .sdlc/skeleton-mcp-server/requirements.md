# Requirements: Skeleton MCP Server

## 1. Project

- Path: `.`

---

## 2. Purpose

Build an MCP server that lets Claude serve an HTML skeleton page to a local browser, so users can visually review generated designs without Claude needing to interpret screenshots.

---

## 3. User Stories

- As Claude, I want to call `serve_skeleton(html)` so that the user sees the generated design in their browser immediately.
- As a user, I want the browser to refresh when Claude updates the skeleton, so that I can see design changes without opening a new tab.
- As Claude, I want confirmation the preview is live, so that I can tell the user it's ready to review.

---

## 4. Functional Requirements

- FR-01: MCP server SHALL expose a `serve_skeleton(html: string)` tool that accepts an HTML string and serves it at `localhost:3333`.
- FR-02: `serve_skeleton` SHALL open the user's default browser automatically on the first call.
- FR-03: Calling `serve_skeleton` again SHALL replace the page content and refresh the existing browser tab without opening a new tab.
- FR-04: `serve_skeleton` SHALL return a success confirmation string to Claude once the preview is live.
- FR-05: MCP server SHALL NOT require any AI model or external API to operate.
- FR-06: The HTTP server SHALL shut down cleanly when the MCP process exits, leaving no orphaned processes.

---

## 5. Acceptance Criteria

### FR-01: serve_skeleton tool exposed at localhost:3333

**Happy path:**
- GIVEN the MCP server is running and connected to Claude
- WHEN Claude calls `serve_skeleton` with a valid HTML string
- THEN the server SHALL serve that HTML at `http://localhost:3333`
- AND the page SHALL be accessible in the browser

**Failure path:**
- GIVEN the MCP server is running
- WHEN Claude calls `serve_skeleton` with an empty string
- THEN the server SHALL return an error message to Claude
- AND SHALL NOT crash or leave the port in an unusable state

### FR-02: Browser opens automatically on first call

**Happy path:**
- GIVEN no browser tab is currently open for localhost:3333
- WHEN Claude calls `serve_skeleton` for the first time
- THEN the user's default browser SHALL open automatically to `http://localhost:3333`

**Edge case:**
- GIVEN a browser tab is already open at localhost:3333
- WHEN Claude calls `serve_skeleton`
- THEN the browser SHALL NOT open a second tab

### FR-03: Subsequent calls replace content in existing tab

**Happy path:**
- GIVEN a browser tab is already showing the skeleton preview
- WHEN Claude calls `serve_skeleton` with updated HTML
- THEN the existing tab SHALL refresh and display the new HTML
- AND no new browser tab SHALL be opened

### FR-04: Confirmation returned to Claude

**Happy path:**
- GIVEN Claude calls `serve_skeleton` with valid HTML
- WHEN the server has successfully served the content
- THEN the tool SHALL return a string such as `"Preview ready at http://localhost:3333"`
- AND Claude SHALL receive this before the browser finishes loading

### FR-05: No AI model or external API required

**Constraint verification:**
- GIVEN the MCP server is running
- WHEN `serve_skeleton` is called
- THEN the server SHALL fulfill the request using only local Node.js capabilities
- AND SHALL NOT make any outbound HTTP requests to external services

### FR-06: Clean shutdown on process exit

**Happy path:**
- GIVEN the MCP server is running and serving a preview
- WHEN the MCP process is terminated (SIGINT, SIGTERM, or natural exit)
- THEN the HTTP server on port 3333 SHALL be closed
- AND the port SHALL be freed for subsequent runs

**Edge case:**
- GIVEN the server starts and port 3333 is already in use
- THEN the server SHALL return a clear error message
- AND SHALL NOT crash silently

---

## 6. Constraints

### In Scope
- MCP server exposing the `serve_skeleton(html)` tool
- HTTP server on localhost:3333 serving provided HTML
- Auto-opening browser on first call
- In-place content replacement and tab refresh on subsequent calls
- Success confirmation string returned to Claude
- Clean process shutdown

### Out of Scope
- `update_skeleton` tool — deferred to Phase 2
- `close_preview` tool — deferred to Phase 2
- Skeleton HTML generation conventions — deferred to Phase 2
- Color picker panel — deferred to Phase 2
- Multi-page or named skeleton management
- Authentication or access control on localhost

### Prohibitions
- SHALL NOT bundle or call any AI model or external API
- SHALL NOT open a new browser tab on repeated `serve_skeleton` calls
- SHALL NOT leave an HTTP server running after the MCP process exits
- SHALL NOT store or persist HTML content between sessions

### Testing Approach
- Selective TDD — TDD for the MCP tool handler logic (input validation, HTML replacement, confirmation response); manual verification for browser auto-open behavior (not automatable without a headless browser)

### Branch
- Base branch: `main`
- Feature branch: `feature/skeleton-mcp-server`
