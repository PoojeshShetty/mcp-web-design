import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./preview-server', () => ({
  PreviewServer: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    updateHtml: vi.fn(),
    stop: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('./browser', () => ({
  BrowserState: vi.fn().mockImplementation(() => ({
    browserOpened: false,
    openOnce: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: vi.fn().mockImplementation(() => ({
    registerTool: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn().mockImplementation(() => ({})),
}));

import { PreviewServer } from './preview-server';
import { BrowserState } from './browser';

describe('createToolHandler', () => {
  let handler: (args: { html: string }) => Promise<{ content: Array<{ type: string; text: string }> }>;
  let mockServer: { start: ReturnType<typeof vi.fn>; updateHtml: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> };
  let mockBrowser: { browserOpened: boolean; openOnce: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetModules();

    mockServer = {
      start: vi.fn().mockResolvedValue(undefined),
      updateHtml: vi.fn(),
      stop: vi.fn().mockResolvedValue(undefined),
    };

    mockBrowser = {
      browserOpened: false,
      openOnce: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(PreviewServer).mockImplementation(() => mockServer as unknown as PreviewServer);
    vi.mocked(BrowserState).mockImplementation(() => mockBrowser as unknown as BrowserState);

    const mod = await import('./index');
    handler = mod.createToolHandler(mockServer as unknown as PreviewServer, mockBrowser as unknown as BrowserState);
  });

  it('returns error string for empty html without calling updateHtml', async () => {
    const result = await handler({ html: '' });
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toMatch(/error/i);
    expect(mockServer.updateHtml).not.toHaveBeenCalled();
  });

  it('calls updateHtml and returns confirmation for valid html', async () => {
    const result = await handler({ html: '<h1>Test</h1>' });
    expect(mockServer.updateHtml).toHaveBeenCalledWith('<h1>Test</h1>');
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toBe('Preview ready at http://localhost:3333');
  });

  it('calls openOnce on each valid invocation', async () => {
    await handler({ html: '<h1>Test</h1>' });
    expect(mockBrowser.openOnce).toHaveBeenCalledWith('http://localhost:3333');
  });

  it('returns confirmation string on subsequent calls', async () => {
    mockBrowser.browserOpened = true;
    const result = await handler({ html: '<p>Update</p>' });
    expect(mockServer.updateHtml).toHaveBeenCalledWith('<p>Update</p>');
    expect(result.content[0].text).toBe('Preview ready at http://localhost:3333');
  });
});
