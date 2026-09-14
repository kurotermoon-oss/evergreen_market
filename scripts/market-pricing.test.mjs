import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMarketPrice, emptyPriceProfile, normalizePriceProfile, priceSourceUrl } from '../src/utils/marketPricing.js';

const time = Date.parse('2026-09-14T10:00:00Z');
const date = new Date(time).toISOString();
const source = (market, extra = {}) => ({
  id: market, market, url: `https://${{ milkdiller: 'milkdiller.ua', prom: 'prom.ua', rozetka: 'rozetka.com.ua' }[market]}/product`,
  title: 'Same SKU, 1 kg', approvedTitle: 'Same SKU, 1 kg', seller: market,
  price: 100, inboundShipping: 0, retailShipping: 50, batchUnits: 10,
  minimumUnits: 1, minimumOrder: 0, availability: 'available',
  matchConfirmed: true, termsConfirmed: true, checkedAt: date, termsCheckedAt: date,
  purchaseEnabled: market === 'milkdiller', benchmarkEnabled: true, ...extra,
});
const profile = offers => ({ ...emptyPriceProfile(), offers: offers || ['milkdiller', 'rozetka', 'prom'].map(market => source(market)) });
const calculate = value => calculateMarketPrice(value, time);

test('complete comparison uses delivered acquisition cost and the specified profit floor', () => {
  const p = profile(); p.offers[0].inboundShipping = 40;
  const result = calculate(p);
  assert.equal(result.status, 'competitive');
  assert.equal(result.purchase.landedCost, 104);
  assert.equal(result.suggestedPrice, 124);
  assert.equal(result.ceiling, 149);
  assert.equal(result.profit, 20);
});
test('retail delivery is divided by the customer quantity, not the procurement batch', () => {
  const p = profile(); p.policy.customerUnits = 5;
  assert.equal(calculate(p).benchmark.customerCost, 110);
  assert.equal(calculate(p).status, 'uncompetitive');
});
test('buying at the cheapest retail price cannot also beat it with positive markup and free delivery', () => {
  const p = profile(); p.offers.forEach(o => { o.retailShipping = 0; o.purchaseEnabled = true; });
  const result = calculate(p);
  assert.equal(result.status, 'uncompetitive');
  assert.equal(result.suggestedPrice, null);
  assert.equal(result.gap, 21);
});
test('a better verified procurement source is selected; unchecked sources cannot win', () => {
  const p = profile(); p.offers[1].price = 50; p.offers[1].purchaseEnabled = true;
  assert.equal(calculate(p).purchase.market, 'rozetka');
  p.offers[1].matchConfirmed = false;
  assert.equal(calculate(p).purchase.market, 'milkdiller');
});
test('unknown shipping is never interpreted as free', () => {
  const p = profile(); p.offers[0].inboundShipping = '';
  assert.equal(calculate(p).status, 'no_source');
  p.offers[0].inboundShipping = 0; p.offers[1].retailShipping = null;
  assert.equal(calculate(p).status, 'partial');
  assert.deepEqual(calculate(p).missingMarkets, ['rozetka']);
});
test('fees, operating costs and percentage requirement are included before upward whole-UAH rounding', () => {
  const p = profile(); p.policy = { ...p.policy, markupPercent: 25, feePercent: 3, operatingCost: 2 };
  const r = calculate(p);
  assert.equal(r.floor, 132);
  assert.ok(r.profit >= 102 * .25);
});
test('floor cannot round down through minimum profit and ceiling cannot round up through competitor', () => {
  const p = profile(); p.offers.forEach(o => { o.price = 100.01; o.retailShipping = 20.5; });
  const r = calculate(p);
  assert.equal(r.floor, 121);
  assert.equal(r.ceiling, 119);
  assert.equal(r.status, 'uncompetitive');
});
test('old quotes, future quotes, failed fetches and unknown availability do not qualify', () => {
  for (const patch of [{ checkedAt: '2026-09-01T00:00:00Z' }, { lastError: 'blocked' }, { availability: 'unknown' }, { availability: 'unavailable' }]) {
    const p = profile(); Object.assign(p.offers[0], patch);
    assert.equal(calculate(p).status, 'no_source');
  }
  const p = profile(); p.offers[0].checkedAt = '2030-01-01T00:00:00Z';
  assert.equal(calculate(p).status, 'invalid');
});
test('fresh automated price does not refresh expired delivery/seller confirmation', () => {
  const p = profile(); p.offers[0].termsCheckedAt = '2026-09-01T00:00:00Z';
  assert.equal(calculate(p).status, 'no_source');
});
test('changed product title requires a fresh identity match', () => {
  const p = profile(); p.offers[0].title = 'Same brand but 250 g';
  assert.equal(calculate(p).status, 'no_source');
});
test('minimum quantity and minimum order are independently enforced on buying and comparison', () => {
  const p = profile(); p.offers[0].minimumOrder = 400;
  const r = calculate(p);
  assert.equal(r.purchase.market, 'milkdiller');
  assert.deepEqual(r.missingMarkets, ['milkdiller']);
  p.offers[0].batchUnits = 2;
  assert.equal(calculate(p).status, 'no_source');
  p.offers[0].batchUnits = 10; p.offers[0].minimumUnits = 12;
  assert.equal(calculate(p).status, 'no_source');
});
test('missing prices are not presented as zero or as a whole-market advantage', () => {
  const p = profile(); p.offers.forEach(o => o.benchmarkEnabled = false);
  assert.equal(calculate(p).status, 'no_market');
  assert.equal(calculate(p).suggestedPrice, null);
  p.offers[0].price = '';
  assert.equal(calculate(p).status, 'no_source');
});
test('invalid and duplicated offers, invalid rules and excessive lists fail validation', () => {
  for (const modify of [p => p.offers.push(p.offers[0]), p => p.policy.feePercent = 100, p => p.policy.customerUnits = 0, p => p.offers[0].price = -1, p => p.offers = Array(13).fill(p.offers[0])]) {
    const p = profile(); modify(p); assert.equal(calculate(p).status, 'invalid');
  }
});
test('source URL validation permits only exact trusted HTTPS origins', () => {
  for (const url of ['http://prom.ua/p1', 'https://prom.ua.evil.test/p1', 'https://127.0.0.1/p1', 'https://prom.ua:444/p1', 'https://user:secret@prom.ua/p1', 'https://rozetka.com.ua/p1']) {
    assert.throws(() => priceSourceUrl(url, 'prom'));
  }
  assert.equal(priceSourceUrl('https://prom.ua/p1#details', 'prom'), 'https://prom.ua/p1');
});
test('normalization discards unknown payload properties and accepts decimal comma', () => {
  const p = profile(); p.offers[0].price = '100,50'; p.secret = 'ignored'; p.offers[0].secret = 'ignored';
  const r = normalizePriceProfile(p, time);
  assert.equal(r.offers[0].price, 100.5); assert.equal(r.secret, undefined); assert.equal(r.offers[0].secret, undefined);
});
