const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Run the real repository with an isolated database double: no production DB.
function setup(overrides = {}) {
  let product = { id: 'milk', name: 'Milk', categoryId: 'dairy', subcategoryId: 'lactose-free',
    fulfillmentType: 'supplier_order', supplierId: 'supplier', price: 60, oldPrice: 70,
    costPrice: 45, active: true, stockStatus: 'preorder', stockQuantity: null, ...overrides };
  const subcategories = [
    { id: 'lactose-free', categoryId: 'dairy', name: 'Lactose free' },
    { id: 'cream', categoryId: 'dairy', name: 'Cream' },
    { id: 'black', categoryId: 'tea', name: 'Black tea' },
  ];
  let created = 0;
  const prisma = {
    product: {
      findUnique: async () => ({ ...product }),
      update: async ({ data }) => (product = { ...product, ...data }),
      create: async ({ data }) => (product = { id: 'new', ...data }),
    },
    category: { findUnique: async ({ where }) => ['dairy', 'tea'].includes(where.id) ? { id: where.id } : null },
    subcategory: { findFirst: async ({ where }) => subcategories.find(s => s.categoryId === where.categoryId &&
      (where.id ? s.id === where.id : s.name.toLowerCase() === where.name.equals.toLowerCase())) || null },
    supplier: { findUnique: async () => ({ id: 'supplier' }) },
  };
  const module = { exports: {} };
  const filename = path.join(__dirname, '../repositories/productsRepository.cjs');
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    module, exports: module.exports,
    require: (id) => {
      if (id === '../database/prisma.cjs') return prisma;
      if (id === './categoriesRepository.cjs') return {
        createAdminSubcategory: async (categoryId, { name }) => {
          created++; const s = { id: 'created', categoryId, name }; subcategories.push(s); return s;
        },
      };
      if (id === '../utils/publicProductVisibility.cjs') return { PUBLIC_AVAILABILITY_WHERE: {} };
      if (id === 'crypto') return require('node:crypto');
      throw Error('Unexpected dependency: ' + id);
    },
  }, { filename });
  return { repo: module.exports, current: () => product, created: () => created };
}

test('partial content/price/visibility updates retain category and subcategory', async () => {
  const s = setup();
  for (const patch of [{ price: 55 }, { allergens: 'Milk' }, { packageInfo: 'Carton' }, { active: false }, { oldPrice: null }]) {
    const result = await s.repo.updateAdminProduct('milk', patch);
    assert.equal(result.category, 'dairy');
    assert.equal(result.subcategory, 'lactose-free');
    assert.equal(result.costPrice, 45);
  }
  assert.equal(s.created(), 0);
});

test('same category sent with PATCH still preserves omitted subcategory', async () => {
  const s = setup();
  const result = await s.repo.updateAdminProduct('milk', { category: 'dairy', price: 58 });
  assert.equal(result.subcategory, 'lactose-free');
});

test('explicit clear works with both API field names and empty/null/sentinel values', async () => {
  for (const field of ['subcategory', 'subcategoryId']) {
    for (const value of ['', null, 'all', 'none']) {
      const s = setup();
      await s.repo.updateAdminProduct('milk', { [field]: value });
      assert.equal(s.current().subcategoryId, null, field + ':' + value);
      assert.equal(s.created(), 0);
    }
  }
});

test('moving category without a child does not reuse/create an unrelated child', async () => {
  const s = setup();
  const result = await s.repo.updateAdminProduct('milk', { categoryId: 'tea' });
  assert.equal(result.category, 'tea');
  assert.equal(s.current().subcategoryId, null);
  assert.equal(s.created(), 0);
});

test('explicit selection and new subcategory creation remain supported', async () => {
  const s = setup();
  assert.equal((await s.repo.updateAdminProduct('milk', { subcategory: 'cream' })).subcategory, 'cream');
  assert.equal((await s.repo.updateAdminProduct('milk', { category: 'tea', subcategoryId: 'black' })).subcategory, 'black');
  assert.equal((await s.repo.updateAdminProduct('milk', { newSubcategoryName: 'Herbal', subcategory: '' })).subcategory, 'created');
  assert.equal(s.created(), 1);
});

test('create without subcategory remains uncategorized at the child level', async () => {
  const s = setup();
  const result = await s.repo.createAdminProduct({ name: 'Tea', category: 'tea', fulfillmentType: 'in_stock' });
  assert.equal(result.subcategory, '');
  assert.equal(s.created(), 0);
});

test('old price can be cleared with null and survives unrelated PATCH', async () => {
  const s = setup();
  assert.equal((await s.repo.updateAdminProduct('milk', { price: 58 })).oldPrice, 70);
  assert.equal((await s.repo.updateAdminProduct('milk', { oldPrice: null })).oldPrice, null);
  assert.equal((await s.repo.updateAdminProduct('milk', { price: 57 })).oldPrice, null);
});
