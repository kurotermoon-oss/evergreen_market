import test from 'node:test';
import assert from 'node:assert/strict';
import { getAdminStockLabel } from '../src/utils/adminProductStatus.js';

test('supplier unavailability takes precedence over an old quantity', () => {
  assert.equal(getAdminStockLabel({ stockStatus: 'out_of_stock', stockQuantity: 12 }), 'Немає');
});
test('unknown limited quantity does not invent zero stock', () => {
  for (const quantity of [undefined, null, '', 'invalid']) {
    assert.equal(getAdminStockLabel({ stockStatus: 'limited', stockQuantity: quantity }), 'Мало в наявності');
  }
});
test('known quantities including zero are displayed', () => {
  assert.equal(getAdminStockLabel({ stockStatus: 'limited', stockQuantity: 0 }), 'Залишилось: 0');
  assert.equal(getAdminStockLabel({ stockStatus: 'limited', stockQuantity: '7' }), 'Залишилось: 7');
});
test('orderable statuses keep their customer meaning', () => {
  assert.equal(getAdminStockLabel({ stockStatus: 'preorder' }), 'Під замовлення');
  assert.equal(getAdminStockLabel({ stockStatus: 'in_stock' }), 'В наявності');
});
