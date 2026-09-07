import { readFile } from 'node:fs/promises';
/** Explicit opt-in, development-only preview. No customer/admin data or mutation proxy. */
export function readonlyPreview() {
  return {
    name: 'evergreen-readonly-preview',
    apply: 'serve',
    configureServer(server) {
      if (process.env.EG_READONLY_PREVIEW !== '1') return;
      server.middlewares.use(async (req, res, next) => {
        const path = new URL(req.url, 'http://localhost').pathname;
        if (!path.startsWith('/api/')) return next();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        if (req.method !== 'GET') { res.statusCode=403; return res.end(JSON.stringify({message:'Це перегляд дизайну. Замовлення та зміни не надсилаються.'})); }
        const file = {'/api/products':'products.json','/api/categories':'categories.json'}[path];
        if (file) {
          try { return res.end(await readFile(new URL(`../.preview/${file}`,import.meta.url))); }
          catch { res.statusCode=503; return res.end(JSON.stringify({message:'Не вдалося завантажити дані для перегляду.'})); }
        }
        res.statusCode = ["/api/customer/me", "/api/admin/me"].includes(path) ? 200 : 401;
        res.end(JSON.stringify({authenticated:false,customer:null,message:'Перегляд без авторизації'}));
      });
    },
  };
}
