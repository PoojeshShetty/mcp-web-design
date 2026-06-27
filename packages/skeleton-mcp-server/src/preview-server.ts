import http from 'http';
import type { IncomingMessage, ServerResponse } from 'http';

const SSE_SCRIPT = `<script>
(function() {
  const es = new EventSource('/events');
  es.addEventListener('update', function() { location.reload(); });
})();
</script>`;

function injectScript(html: string): string {
  const idx = html.indexOf('</body>');
  if (idx !== -1) {
    return html.slice(0, idx) + SSE_SCRIPT + html.slice(idx);
  }
  return html + SSE_SCRIPT;
}

export class PreviewServer {
  private currentHtml: string | null = null;
  private sseClients: Set<ServerResponse> = new Set();
  private server: http.Server;

  constructor() {
    this.server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
      if (req.url === '/events') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });
        res.write('\n');
        this.sseClients.add(res);
        req.on('close', () => {
          this.sseClients.delete(res);
        });
        return;
      }

      if (req.url === '/' || req.url === '') {
        if (this.currentHtml === null) {
          res.writeHead(503, { 'Content-Type': 'text/plain' });
          res.end('No content yet');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(injectScript(this.currentHtml));
        return;
      }

      res.writeHead(404);
      res.end();
    });
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error('Port 3333 is already in use'));
        } else {
          reject(err);
        }
      });
      this.server.listen(3333, () => resolve());
    });
  }

  updateHtml(html: string): void {
    this.currentHtml = html;
    for (const client of this.sseClients) {
      client.write('event: update\ndata: reload\n\n');
    }
  }

  stop(): Promise<void> {
    for (const client of this.sseClients) {
      client.socket?.destroy();
    }
    this.sseClients.clear();
    return new Promise((resolve, reject) => {
      this.server.close((err?: Error) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
