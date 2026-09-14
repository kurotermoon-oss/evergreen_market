const test = require('node:test');
const assert = require('node:assert/strict');
const prismaPath = require.resolve('../server/database/prisma.cjs');
const records = new Map();
const mock = {
  product: { findUnique: async ({ where }) => where.id === 'missing' ? null : { id: where.id } },
  marketPriceProfile: {
    findUnique: async ({ where }) => records.get(where.productId) || null,
    create: async ({ data }) => { if (records.has(data.productId)) throw { code: 'P2002' }; records.set(data.productId, { ...data, revision: 1 }); },
    updateMany: async ({ where, data }) => { const item = records.get(where.productId); if (item?.revision !== where.revision) return { count: 0 }; records.set(where.productId, { productId: where.productId, data: data.data, revision: item.revision + 1 }); return { count: 1 }; },
    findMany: async () => [...records.values()],
  },
};
require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: mock };
const service = require('../server/services/marketPricing.cjs');
test('profile save protects concurrent device changes with revision comparison', async () => {
  const { emptyPriceProfile } = await import('../src/utils/marketPricing.js');
  const profile = emptyPriceProfile();
  const first = await service.saveProfile('one', profile, 0);
  assert.equal(first.revision, 1);
  const results = await Promise.allSettled([service.saveProfile('one', profile, 1), service.saveProfile('one', profile, 1)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.find(r => r.status === 'rejected').reason.status, 409);
  await assert.rejects(service.getProfile('missing'), { status: 404 });
});
test('monitoring updates snapshots only, is opt-in, bounded and preserves old price on fetch errors', async () => {
  const { emptyPriceProfile } = await import('../src/utils/marketPricing.js');
  const profile = emptyPriceProfile(); profile.monitoring = true;
  profile.offers = [{ id: 'p', market: 'prom', url: 'https://prom.ua/p1', price: 50, batchUnits: 1, minimumUnits: 1, minimumOrder: 0, benchmarkEnabled: true }];
  await service.saveProfile('two', profile, 0);
  const result = await service.refreshProfiles({ maxRequests: 1, fetchQuote: async () => { throw new Error('403'); } });
  assert.equal(result.failed, 1);
  assert.equal(result.skipped, 1);
  const after = await service.getProfile('two');
  assert.equal(after.profile.offers[0].price, 50);
  assert.match(after.profile.offers[0].lastError, /перевірка/);
  assert.equal(typeof mock.product.update, 'undefined');
});

test('pricing endpoints reject anonymous access before reading profiles or fetching offers', async () => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  app.use('/api/admin/pricing', require('../server/routes/adminPricing.routes.cjs'));
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  try {
    const root = `http://127.0.0.1:${server.address().port}/api/admin/pricing`;
    for (const [method, path] of [['GET', '/one'], ['PUT', '/one'], ['POST', '/quote']]) {
      const response = await fetch(root + path, { method });
      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), { error: 'Unauthorized' });
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});
