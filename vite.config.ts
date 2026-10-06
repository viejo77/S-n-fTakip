import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Safe Tailwind plugin wrapper that prevents crashes when HMR is disabled in AI Studio
function safeTailwindcss(): Plugin[] {
  const plugins = tailwindcss() as Plugin[];
  return plugins.map((p) => {
    if (p.name === '@tailwindcss/vite:generate:serve' && p.hotUpdate) {
      const origHotUpdate = p.hotUpdate;
      return {
        ...p,
        hotUpdate(this: any, ctx: any) {
          // If HMR is disabled, provide a safe dummy .hot so Tailwind never throws reading 'send'
          if (this.environment && !this.environment.hot) {
            this.environment.hot = { send: () => {} };
          }
          if (ctx?.server?.environments) {
            for (const env of Object.values(ctx.server.environments as Record<string, any>)) {
              if (env && !env.hot) {
                env.hot = { send: () => {} };
              }
            }
          }
          if (ctx?.server && !ctx.server.ws) {
            ctx.server.ws = { send: () => {} };
          }
          try {
            return (origHotUpdate as any).call(this, ctx);
          } catch (e: any) {
            if (e?.message?.includes?.('send')) {
              return [];
            }
            throw e;
          }
        },
      };
    }
    return p;
  });
}

function hmrDisabledProtector(): Plugin {
  return {
    name: 'hmr-disabled-protector',
    configureServer(server) {
      if (server.environments) {
        for (const env of Object.values(server.environments)) {
          if (!env.hot) {
            env.hot = {
              send: () => {},
              on: () => {},
              off: () => {},
              listen: () => {},
            } as any;
          }
        }
      }
      if (!server.ws) {
        server.ws = {
          send: () => {},
          on: () => {},
          off: () => {},
          close: () => {},
        } as any;
      }

      // Intercept and sanitize /@vite/client HTTP requests dynamically
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (url === '/@vite/client' || url.startsWith('/@vite/client?')) {
          const originalWrite = res.write.bind(res);
          const originalEnd = res.end.bind(res);
          let body = '';

          res.write = function (chunk: any, ...args: any[]) {
            if (chunk) body += chunk.toString();
            return true;
          };

          res.end = function (chunk: any, ...args: any[]) {
            if (chunk) body += chunk.toString();
            if (body) {
              body = body
                .replace(/wsTransport\.send\(/g, 'wsTransport?.send?.(')
                .replace(/this\.transport\.send\(/g, 'this.transport?.send?.(')
                .replace(/transport\.send\(/g, 'transport?.send?.(')
                .replace(/this\.hmrClient\.send\(/g, 'this.hmrClient?.send?.(')
                .replace(/ws\.send\(/g, 'ws?.send?.(')
                .replace(/socket\.send\(/g, 'socket?.send?.(')
                .replace(/invokeableTransport\.send\(/g, 'invokeableTransport?.send?.(')
                .replace(/this\.logger\.error\(err\);/g, '/* safe */');
              res.setHeader('Content-Length', Buffer.byteLength(body));
              return (originalEnd as any)(body, ...args);
            }
            return (originalEnd as any)(chunk, ...args);
          };
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      safeTailwindcss(),
      hmrDisabledProtector(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      forwardConsole: false,
    },
  };
});
