# Task 3: Browser launcher wrapper

## Trace
- **FR-IDs:** FR-02
- **Depends on:** task-1
- **Design:** ../design.md

## Files
- `packages/skeleton-mcp-server/src/browser.ts` — create
- `packages/skeleton-mcp-server/src/browser.test.ts` — create

## Design References
- design.md §Architecture (browser.ts component)
- design.md §Data Models (`browserOpened` flag)
- design.md §Design Decisions (Browser open: `open` npm package)

## Contracts (task-specific)

### Internal Interfaces
- `openBrowser(url: string) → Promise<void>`: calls `open(url)` from the `open` npm package
  - Pre: none
  - Post: default browser launched with `url`
- `BrowserState` (class or plain object):
  - `browserOpened: boolean` — `false` on init
  - `openOnce(url: string) → Promise<void>`: calls `openBrowser(url)` only if `browserOpened` is `false`; sets `browserOpened = true` after first call
    - Pre: none
    - Post: browser opened at most once regardless of how many times `openOnce` is called

## Acceptance Criteria

### FR-02: Browser opens automatically on first call
- GIVEN `BrowserState.browserOpened` is `false`
- WHEN `openOnce('http://localhost:3333')` is called
- THEN `openBrowser` SHALL be called once
- AND `browserOpened` SHALL be set to `true`

### FR-02 (edge case): Browser does not open a second tab
- GIVEN `BrowserState.browserOpened` is `true`
- WHEN `openOnce('http://localhost:3333')` is called again
- THEN `openBrowser` SHALL NOT be called
- AND no new tab SHALL be opened

## Done Criteria
- [ ] `src/browser.ts` exports `openBrowser` and `BrowserState`
- [ ] `BrowserState.openOnce` calls `openBrowser` exactly once across multiple calls
- [ ] `openBrowser` is mockable / injectable in tests (does not hard-code `open` call at module level)
- [ ] All unit tests in `browser.test.ts` pass with `openBrowser` mocked (no real browser launched in tests)
