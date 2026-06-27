import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('open', () => ({ default: vi.fn().mockResolvedValue(undefined) }));

import { BrowserState, openBrowser } from './browser';

describe('openBrowser', () => {
  it('calls open with the provided url', async () => {
    const open = (await import('open')).default as ReturnType<typeof vi.fn>;
    vi.clearAllMocks();
    await openBrowser('http://localhost:3333');
    expect(open).toHaveBeenCalledWith('http://localhost:3333');
  });
});

describe('BrowserState', () => {
  let state: BrowserState;
  let mockOpen: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOpen = vi.fn().mockResolvedValue(undefined);
    state = new BrowserState(mockOpen);
  });

  it('starts with browserOpened = false', () => {
    expect(state.browserOpened).toBe(false);
  });

  it('calls opener and sets browserOpened on first openOnce call', async () => {
    await state.openOnce('http://localhost:3333');
    expect(mockOpen).toHaveBeenCalledOnce();
    expect(mockOpen).toHaveBeenCalledWith('http://localhost:3333');
    expect(state.browserOpened).toBe(true);
  });

  it('does not call opener on subsequent openOnce calls', async () => {
    await state.openOnce('http://localhost:3333');
    await state.openOnce('http://localhost:3333');
    await state.openOnce('http://localhost:3333');
    expect(mockOpen).toHaveBeenCalledOnce();
  });

  it('browserOpened remains true after multiple calls', async () => {
    await state.openOnce('http://localhost:3333');
    await state.openOnce('http://localhost:3333');
    expect(state.browserOpened).toBe(true);
  });
});
