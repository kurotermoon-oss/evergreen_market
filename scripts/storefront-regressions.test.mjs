import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { api } from '../src/api/client.js';
import { useOrderSubmit } from '../src/hooks/useOrderSubmit.js';
import { useCustomerSession } from '../src/hooks/useCustomerSession.js';
import { paginateProducts } from '../src/hooks/useCatalogFilters.js';
import { getRecentOrders, saveRecentOrder, clearRecentOrders } from '../src/utils/recentOrders.js';

function renderHook(hook) {
  let result;
  renderToString(React.createElement(() => {
    result = hook();
    return null;
  }));
  return result;
}

function withStorage(t, storage, blocked = false) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const browser = {};
  Object.defineProperty(browser, 'localStorage', { get() {
    if (blocked) throw new Error('Storage access denied');
    return storage;
  } });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: browser });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => browser.localStorage });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'window', previous);
    else delete globalThis.window;
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
    else delete globalThis.localStorage;
  });
}

const order = { id: 'test-order', orderNumber: 'TEST-1', total: 450 };
function orderOptions(overrides = {}) {
  return {
    cartItems: [{ id: 'selected-product', quantity: 2 }],
    form: { name: 'Test customer', telegram: '@test_customer' },
    ...overrides,
  };
}

test('blocked browser storage cannot break recent orders or checkout', (t) => {
  withStorage(t, null, true);
  assert.deepEqual(getRecentOrders(), []);
  assert.doesNotThrow(() => saveRecentOrder(order));
  assert.doesNotThrow(() => clearRecentOrders());
});

test('quota and storage method failures are optional history failures', (t) => {
  withStorage(t, {
    getItem() { throw new Error('read denied'); },
    setItem() { throw new Error('quota exceeded'); },
    removeItem() { throw new Error('remove denied'); },
  });
  assert.deepEqual(getRecentOrders(), []);
  assert.doesNotThrow(() => saveRecentOrder(order));
  assert.doesNotThrow(() => clearRecentOrders());
});

test('recent orders ignore malformed entries and retain deduplication and limit', (t) => {
  let raw = JSON.stringify([null, 'invalid', {}, { orderNumber: 'OLD' }]);
  withStorage(t, { getItem: () => raw, setItem: (_, value) => { raw = value; }, removeItem: () => { raw = null; } });
  for (let i = 0; i < 10; i++) saveRecentOrder({ ...order, orderNumber: `TEST-${i}` });
  saveRecentOrder({ ...order, orderNumber: 'TEST-9', total: 500 });
  const saved = getRecentOrders();
  assert.equal(saved.length, 8);
  assert.equal(saved[0].total, 500);
  assert.equal(saved.filter(item => item.orderNumber === 'TEST-9').length, 1);
  clearRecentOrders();
  assert.deepEqual(getRecentOrders(), []);
});

test('confirmed order stays successful when browser history and admin refresh fail', async (t) => {
  withStorage(t, null, true);
  t.mock.method(console, 'warn', () => {});
  t.mock.method(console, 'error', () => {});
  t.mock.method(api, 'createOrder', async () => ({ order }));
  const cleared = [];
  const views = [];
  const checkout = renderHook(() => useOrderSubmit(orderOptions({
    isAdmin: true,
    loadAdminData: async () => { throw new Error('history unavailable'); },
    clearCartItems: ids => cleared.push(ids),
    setView: view => views.push(view),
  })));
  const result = await checkout.submitOrder();
  assert.equal(result.ok, true);
  assert.deepEqual(cleared, [['selected-product']]);
  assert.deepEqual(views, ['success']);
});

test('rapid repeated checkout sends only one request', async (t) => {
  let finish;
  const create = t.mock.method(api, 'createOrder', () => new Promise(resolve => { finish = resolve; }));
  const views = [];
  const checkout = renderHook(() => useOrderSubmit(orderOptions({ setView: view => views.push(view) })));
  const first = checkout.submitOrder();
  const second = checkout.submitOrder();
  assert.equal(create.mock.callCount(), 1);
  finish({ order });
  await Promise.all([first, second]);
  assert.deepEqual(views, ['success']);
});

test('rejected checkout preserves cart and allows an intentional retry', async (t) => {
  const failure = Object.assign(new Error('Stock changed'), { errors: { cart: 'Stock changed' } });
  let fail = true;
  t.mock.method(console, 'error', () => {});
  t.mock.method(api, 'createOrder', async () => {
    if (fail) throw failure;
    return { order };
  });
  const cleared = [];
  const views = [];
  const checkout = renderHook(() => useOrderSubmit(orderOptions({
    clearCartItems: ids => cleared.push(ids), setView: view => views.push(view),
  })));
  const result = await checkout.submitOrder();
  assert.equal(result.ok, false);
  assert.equal(result.errors.cart, 'Stock changed');
  assert.deepEqual(cleared, []);
  assert.deepEqual(views, []);
  fail = false;
  assert.equal((await checkout.submitOrder()).ok, true);
  assert.equal(cleared.length, 1);
});

for (const action of ['customerLogin', 'customerRegister']) {
  test(`${action} succeeds even if order history is unavailable`, async (t) => {
    const customer = { id: 'customer', name: 'Test' };
    t.mock.method(console, 'warn', () => {});
    t.mock.method(api, action, async () => ({ customer }));
    t.mock.method(api, 'getCustomerOrders', async () => { throw new Error('history unavailable'); });
    const applied = [];
    const session = renderHook(() => useCustomerSession({ applyCustomerToForm: value => applied.push(value) }));
    assert.equal(await session[action]({}), customer);
    assert.deepEqual(applied, [customer]);
  });
}

test('catalog refresh clamps a removed last page while preserving valid pages', () => {
  const products = Array.from({ length: 19 }, (_, id) => ({ id }));
  assert.equal(paginateProducts(products, 3, 9).paginatedProducts[0].id, 18);
  const updated = paginateProducts(products.slice(0, 18), 3, 9);
  assert.equal(updated.currentPage, 2);
  assert.equal(updated.totalProductPages, 2);
  assert.equal(updated.paginatedProducts.length, 9);
  assert.equal(paginateProducts(products, 2, 9).currentPage, 2);
  assert.deepEqual(paginateProducts([], 3, 9), {
    currentPage: 1, totalProductPages: 1, paginatedProducts: [],
  });
});

test('profile history can distinguish an unavailable service from an empty account', async (t) => {
  t.mock.method(console, 'warn', () => {});
  const unavailable = new Error('history unavailable');
  t.mock.method(api, 'getCustomerOrders', async () => { throw unavailable; });
  const session = renderHook(() => useCustomerSession());
  await assert.rejects(session.loadCustomerOrders({ throwOnError: true }), unavailable);
  assert.deepEqual(await session.loadCustomerOrders(), []);
  api.getCustomerOrders.mock.mockImplementation(async () => ({ orders: [] }));
  assert.deepEqual(await session.loadCustomerOrders({ throwOnError: true }), []);
});
