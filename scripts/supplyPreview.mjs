import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { emptyState, command, snapshot, reconcile } = require('../server/supply/domain.cjs');

/** Opt-in synthetic workspace. Never imports a database, bot, or real API client. */
export function supplyPreview() {
  const workspaces = new Map();
  return {
    name: 'evergreen-supply-demo',
    apply: 'serve',
    configureServer(server) {
      if (process.env.EG_READONLY_PREVIEW !== '1') return;
      server.middlewares.use(async (req, res, next) => {
        if (new URL(req.url, 'http://localhost').pathname !== '/__supply_demo') return next();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        const id = String(req.headers['x-demo-workspace'] || '');
        if (!/^[a-f0-9-]{36}$/.test(id) || !['GET', 'POST'].includes(req.method)) {
          res.statusCode = 400; return res.end(JSON.stringify({ message: 'Демонстраційний простір не вибрано.' }));
        }
        try {
          if (!workspaces.has(id)) {
            if (workspaces.size >= 50) workspaces.delete(workspaces.keys().next().value);
            const initial = emptyState(); command(initial, { type: 'seed' }); workspaces.set(id, initial);
          }
          const state = structuredClone(workspaces.get(id));
          if (req.method === 'POST') {
            let body = '';
            for await (const chunk of req) {
              body += chunk;
              if (Buffer.byteLength(body) > 32000) throw Object.assign(new Error('Завеликий запит.'), { status: 413 });
            }
            const { action, revision } = JSON.parse(body);
            if (revision !== state.revision) throw Object.assign(new Error('Дані вже змінилися. Перевірте оновлений список.'), { status: 409 });
            command(state, action);
          } else {
            const before = JSON.stringify(state); reconcile(state);
            if (JSON.stringify(state) !== before) state.revision++;
          }
          workspaces.set(id, state);
          res.end(JSON.stringify({ ...snapshot(state), deliveryHealth: { configured: false, workerEnabled: false } }));
        } catch (e) {
          res.statusCode = e.status || 400; res.end(JSON.stringify({ message: e.message }));
        }
      });
    }
  };
}
