const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const adapter = require('../integrations/suppliers/milkDillerAdapter.cjs');
const { isPublicProductVisible, PUBLIC_AVAILABILITY_WHERE } = require('../utils/publicProductVisibility.cjs');

let products, remoteProducts, supplier, writes, run, fallbackCalls, lockAvailable;
const assignDefined = (target, data) => Object.assign(target, Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)));
const prisma = {
  supplier: {
    findUnique: async () => supplier,
    findMany: async () => supplier.availabilitySyncEnabled && !supplier.availabilitySyncPaused ? [supplier] : [],
    updateMany: async () => ({ count: lockAvailable ? 1 : 0 }),
    update: async ({ data }) => assignDefined(supplier, data),
  },
  product: {
    findMany: async () => products,
    findFirst: async ({ where }) => products.find(p => Object.entries(where).every(([key, value]) => p[key] === value)),
    update: async ({ where, data }) => {
      writes.push({ id: where.id, data });
      return assignDefined(products.find(p => p.id === where.id), data);
    },
  },
  supplierSyncRun: {
    create: async ({ data }) => (run = { ...data, startedAt: new Date() }),
    update: async ({ data }) => assignDefined(run, data),
    findMany: async () => run ? [run] : [],
    findFirst: async () => run?.trigger === 'cron' ? run : null,
  },
  $transaction: async value => typeof value === 'function' ? value(prisma) : Promise.all(value),
};
require.cache[require.resolve('../database/prisma.cjs')] = { exports: prisma };
require.cache[require.resolve('../services/supplierSyncNotifications.cjs')] = { exports: { notifySupplierSyncIssue: async () => ({ skipped: true }) } };
const { runSupplierSync, runEnabledSupplierSyncs, getSupplierSyncDashboard, updateProductSyncMapping } = require('../services/supplierAvailabilitySync.cjs');
const realFetchHtml = adapter.fetchHtml;
function product(id, extra = {}) {
  return { id, name: `Product ${id}`, active: true, fulfillmentType: 'supplier_order', supplierId: 'milk', supplierSyncEnabled: true, supplierExternalId: id, supplierProductUrl: `https://milkdiller.ua/product-${id}`, supplierStatusOverride: 'auto', supplierRemoteStatus: 'available', stockStatus: 'preorder', ...extra };
}
function remote(p, status = 'available', extra = {}) { return { url: p.supplierProductUrl, externalId: p.supplierExternalId, status, ...extra }; }
beforeEach(() => {
  products = [product('1'), product('2')];
  remoteProducts = products.map(p => remote(p));
  supplier = { id: 'milk', name: 'Milk Diller', availabilitySyncAdapter: adapter.ADAPTER_ID, availabilitySyncEnabled: true, availabilitySyncPaused: false, availabilitySyncLastOkAt: 'previous-success' };
  writes = []; run = null; fallbackCalls = 0; lockAvailable = true;
  adapter.crawlCatalog = async () => ({ products: new Map(remoteProducts.map(p => [p.url, p])), pageCount: 1, totalCount: remoteProducts.length });
  adapter.fetchProductAvailability = async () => { fallbackCalls++; throw new Error('HTTP 404'); };
});

test('waiting goods disappear publicly and return on the next successful sync without changing active', async () => {
  remoteProducts[0].status = 'unavailable';
  await runSupplierSync('milk');
  assert.equal(products[0].stockStatus, 'out_of_stock');
  assert.equal(products[0].active, true);
  assert.equal(isPublicProductVisible(products[0]), false);
  remoteProducts[0].status = 'available';
  await runSupplierSync('milk');
  assert.equal(isPublicProductVisible(products[0]), true);
  assert.equal(isPublicProductVisible({ ...products[0], active: false }), false);
  assert.equal(isPublicProductVisible({ fulfillmentType: 'in_stock', stockStatus: 'out_of_stock' }), true);
  assert.deepEqual(PUBLIC_AVAILABILITY_WHERE.NOT, { fulfillmentType: 'supplier_order', stockStatus: 'out_of_stock' });
});
test('manual availability overrides survive remote changes', async () => {
  products[0].supplierStatusOverride = 'available';
  products[1].supplierStatusOverride = 'unavailable';
  remoteProducts[0].status = 'unavailable';
  await runSupplierSync('milk');
  assert.equal(products[0].stockStatus, 'preorder');
  assert.equal(products[1].stockStatus, 'out_of_stock');
});
test('404 and unknown statuses preserve availability and do not count as a successful run', async () => {
  remoteProducts.splice(0, 1);
  const result = await runSupplierSync('milk');
  assert.equal(result.status, 'partial');
  assert.equal(result.errorCount, 1);
  assert.equal(products[0].stockStatus, 'preorder');
  assert.match(products[0].supplierLastError, /404/);
  assert.equal(supplier.availabilitySyncLastOkAt, 'previous-success');
  remoteProducts.length = 0;
  assert.equal((await runSupplierSync('milk')).status, 'failed');
});
test('unknown card markup cannot change the last known availability', async () => {
  remoteProducts[0].status = 'unknown';
  adapter.fetchProductAvailability = async () => remote(products[0], 'unknown');
  assert.equal((await runSupplierSync('milk')).status, 'partial');
  assert.equal(products[0].stockStatus, 'preorder');
});
test('an intentional admin URL replacement clears the previous supplier ID', async () => {
  await updateProductSyncMapping('milk', '1', { productUrl: 'https://milkdiller.ua/replacement', externalId: '1' });
  assert.equal(products[0].supplierExternalId, '');
  assert.equal(products[0].supplierProductUrl, 'https://milkdiller.ua/replacement');
});
test('dry run reports changes but does not modify products or last successful sync', async () => {
  remoteProducts[0].status = 'unavailable';
  const result = await runSupplierSync('milk', { dryRun: true });
  assert.equal(result.changedCount, 1);
  assert.equal(result.status, 'dry_run');
  assert.equal(writes.length, 0);
  assert.equal(supplier.availabilitySyncLastOkAt, 'previous-success');
});
test('mass-change guard blocks writes until explicitly forced', async () => {
  products = Array.from({ length: 10 }, (_, i) => product(String(i)));
  remoteProducts = products.map(p => remote(p, 'unavailable'));
  assert.equal((await runSupplierSync('milk')).status, 'blocked');
  assert.equal(writes.length, 0);
  assert.equal((await runSupplierSync('milk', { force: true })).status, 'completed');
  assert.equal(writes.length, 10);
});
test('moved URL is repaired only through a unique matching supplier ID, without a fallback request', async () => {
  remoteProducts[0].url = 'https://milkdiller.ua/new-url';
  const result = await runSupplierSync('milk');
  assert.equal(products[0].supplierProductUrl, remoteProducts[0].url);
  assert.equal(result.details.repairedLinks.length, 1);
  assert.equal(fallbackCalls, 0);
});
test('ambiguous IDs and changed product identity cannot remap a product', async () => {
  const oldUrl = products[0].supplierProductUrl;
  remoteProducts[0].url = 'https://milkdiller.ua/new-url';
  remoteProducts.push({ ...remoteProducts[0], url: 'https://milkdiller.ua/another-url' });
  assert.equal((await runSupplierSync('milk')).status, 'partial');
  assert.equal(products[0].supplierProductUrl, oldUrl);
  remoteProducts[0].url = oldUrl;
  remoteProducts[0].externalId = 'wrong-id';
  assert.equal((await runSupplierSync('milk')).errorCount, 1);
  assert.equal(products[0].supplierExternalId, '1');
});
test('disabled, paused and concurrent jobs cannot write; missing mappings are not reported as success', async () => {
  supplier.availabilitySyncEnabled = false;
  assert.deepEqual(await runEnabledSupplierSyncs(), []);
  await assert.rejects(runSupplierSync('milk', { trigger: 'cron' }), { code: 'SUPPLIER_SYNC_DISABLED' });
  supplier.availabilitySyncPaused = true;
  await assert.rejects(runSupplierSync('milk'), { code: 'SUPPLIER_SYNC_PAUSED' });
  supplier.availabilitySyncPaused = false;
  lockAvailable = false;
  await assert.rejects(runSupplierSync('milk'));
  assert.equal(writes.length, 0);
  lockAvailable = true; products = [];
  assert.equal((await runSupplierSync('milk')).status, 'empty');
  assert.equal(supplier.availabilitySyncLastOkAt, 'previous-success');
});
test('dashboard distinguishes manual runs from actual scheduler activity', async () => {
  await runSupplierSync('milk');
  assert.equal((await getSupplierSyncDashboard('milk')).schedule.overdue, true);
  await runSupplierSync('milk', { trigger: 'cron' });
  assert.equal((await getSupplierSyncDashboard('milk')).schedule.overdue, false);
  run.startedAt = new Date(Date.now() - 8 * 3600000);
  assert.equal((await getSupplierSyncDashboard('milk')).schedule.overdue, true);
});
test('all known waiting phrases override contradictory in-stock CSS; unknown stays unknown', () => {
  for (const text of ['Очікує на постачання', 'Очікується постачання', 'Очікується надходження', 'Очікує на поставку', 'Немає в наявності']) {
    assert.equal(adapter.parseProductPage(`<div class="head-info"><div class="status instock">${text}</div></div>`).status, 'unavailable', text);
  }
  assert.equal(adapter.parseProductPage('<div class="head-info"><div class="status">Не уточнено</div></div>').status, 'unknown');
});
test('permanent HTTP failures are not retried; temporary errors recover; env retries=0 is respected', async () => {
  let calls = 0;
  await assert.rejects(realFetchHtml('https://milkdiller.ua/missing', { fetchImpl: async () => { calls++; return { ok: false, status: 404 }; } }), /404/);
  assert.equal(calls, 1);
  calls = 0;
  assert.equal(await realFetchHtml('https://milkdiller.ua/temporary', { fetchImpl: async () => ++calls === 1 ? { ok: false, status: 503 } : { ok: true, text: async () => 'recovered' } }), 'recovered');
  assert.equal(calls, 2);
  const previous = process.env.MILKDILLER_FETCH_RETRIES;
  process.env.MILKDILLER_FETCH_RETRIES = '0'; calls = 0;
  try {
    await assert.rejects(realFetchHtml('https://milkdiller.ua/failure', { fetchImpl: async () => { calls++; throw new Error('offline'); } }), /offline/);
    assert.equal(calls, 1);
  } finally {
    if (previous === undefined) delete process.env.MILKDILLER_FETCH_RETRIES;
    else process.env.MILKDILLER_FETCH_RETRIES = previous;
  }
});
