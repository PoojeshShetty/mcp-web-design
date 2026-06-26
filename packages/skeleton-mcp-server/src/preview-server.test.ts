import http from 'http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PreviewServer } from './preview-server';

function get(path: string): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(
      { hostname: 'localhost', port: 3333, path, headers: { Connection: 'close' } },
      (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        res.on('end', () => resolve({ status: res.statusCode!, headers: res.headers, body }));
      },
    );
    req.on('error', reject);
  });
}

describe('PreviewServer', () => {
  let server: PreviewServer;

  beforeEach(async () => {
    server = new PreviewServer();
    await server.start();
  });

  afterEach(async () => {
    try {
      await server.stop();
    } catch {
      // already stopped in the test
    }
  });

  describe('GET /', () => {
    it('returns 503 when no content has been set', async () => {
      const res = await get('/');
      expect(res.status).toBe(503);
      expect(res.body).toBe('No content yet');
    });

    it('returns 200 with html after updateHtml', async () => {
      server.updateHtml('<h1>Hello</h1>');
      const res = await get('/');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.body).toContain('<h1>Hello</h1>');
    });

    it('injects SSE script before </body> when present', async () => {
      server.updateHtml('<html><body><h1>Test</h1></body></html>');
      const res = await get('/');
      const bodyIdx = res.body.indexOf('</body>');
      const scriptIdx = res.body.indexOf('<script>');
      expect(scriptIdx).toBeGreaterThan(-1);
      expect(scriptIdx).toBeLessThan(bodyIdx);
    });

    it('appends SSE script when no </body> tag', async () => {
      server.updateHtml('<h1>Fragment</h1>');
      const res = await get('/');
      expect(res.body).toMatch(/<h1>Fragment<\/h1>[\s\S]*<script>/);
    });
  });

  describe('GET /events', () => {
    it('pushes reload event to connected SSE clients on updateHtml', () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('SSE event not received within 2s')), 2000);

        const req = http.get('http://localhost:3333/events', (res) => {
          expect(res.statusCode).toBe(200);
          expect(res.headers['content-type']).toContain('text/event-stream');

          let buffer = '';
          res.on('data', (chunk: Buffer) => {
            buffer += chunk.toString();
            if (buffer.includes('event: update\ndata: reload\n\n')) {
              clearTimeout(timeout);
              req.destroy();
              resolve();
            }
          });
        });

        req.on('error', (err: NodeJS.ErrnoException) => {
          if (err.code !== 'ECONNRESET') reject(err);
        });

        setTimeout(() => server.updateHtml('<p>Updated</p>'), 50);
      });
    });
  });

  describe('start()', () => {
    it('rejects with descriptive error when port 3333 is already in use', async () => {
      const second = new PreviewServer();
      await expect(second.start()).rejects.toThrow('Port 3333 is already in use');
    });
  });

  describe('stop()', () => {
    it('frees port 3333 so a new server can start', async () => {
      await server.stop();

      const second = new PreviewServer();
      await expect(second.start()).resolves.toBeUndefined();
      await second.stop();

      server = new PreviewServer();
      await server.start();
    });

    it('closes active SSE connections on stop', () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('SSE connection was not closed')), 2000);
        const done = () => { clearTimeout(timeout); resolve(); };

        const req = http.get('http://localhost:3333/events', (res) => {
          res.on('close', done);
          res.on('end', done);
          setTimeout(() => server.stop().catch(reject), 50);
        });

        req.on('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'ECONNRESET') done();
          else reject(err);
        });
      });
    });
  });
});
