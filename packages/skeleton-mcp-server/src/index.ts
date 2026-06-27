import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { PreviewServer } from './preview-server';
import { BrowserState } from './browser';

const PREVIEW_URL = 'http://localhost:3333';

export function createToolHandler(preview: PreviewServer, browser: BrowserState) {
  return async function handleServeSkeleton(args: { html: string }) {
    if (!args.html) {
      return { content: [{ type: 'text' as const, text: 'Error: html must not be empty' }] };
    }
    preview.updateHtml(args.html);
    await browser.openOnce(PREVIEW_URL);
    return { content: [{ type: 'text' as const, text: `Preview ready at ${PREVIEW_URL}` }] };
  };
}

async function main() {
  const preview = new PreviewServer();
  const browser = new BrowserState();

  await preview.start();

  const server = new McpServer({ name: 'skeleton-mcp-server', version: '0.1.0' });

  server.registerTool(
    'serve_skeleton',
    {
      description: 'Serve an HTML skeleton in a local browser preview',
      inputSchema: { html: z.string() },
    },
    createToolHandler(preview, browser),
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  const shutdown = async () => {
    await preview.stop();
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`Fatal: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
}
