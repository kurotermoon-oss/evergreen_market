const test = require('node:test');
const assert = require('node:assert/strict');
const { parseMarketQuote, fetchMarketQuote, mergeMarketQuote } = require('../server/integrations/marketPriceQuote.cjs');
const product = extra => ({ '@type': 'Product', name: 'Coffee 1 kg', offers: { '@type': 'Offer', price: '199.50', priceCurrency: 'UAH', availability: 'https://schema.org/InStock', seller: { name: 'Seller' }, ...extra } });
const html = value => `<html><script type="application/ld+json">${JSON.stringify(value)}</script></html>`;
test('parses a single unambiguous UAH offer and availability', () => {
  assert.deepEqual(parseMarketQuote(html({ '@graph': [product()] }), 'prom'), { title: 'Coffee 1 kg', seller: 'Seller', price: 199.5, availability: 'available' });
});
test('does not choose a low aggregate price, a second seller, another product or a missing currency', () => {
  for (const value of [product({ '@type': 'AggregateOffer', lowPrice: 10 }), { ...product(), offers: [product().offers, product().offers] }, [product(), product()], product({ priceCurrency: 'EUR' }), product({ priceCurrency: null })]) {
    assert.throws(() => parseMarketQuote(html(value), 'prom'));
  }
});
test('out-of-stock and unknown availability are preserved; expired promotions are rejected', () => {
  assert.equal(parseMarketQuote(html(product({ availability: 'https://schema.org/OutOfStock' })), 'rozetka').availability, 'unavailable');
  assert.equal(parseMarketQuote(html(product({ availability: '' })), 'rozetka').availability, 'unknown');
  assert.throws(() => parseMarketQuote(html(product({ priceValidUntil: '2000-01-01' })), 'rozetka'));
});
test('captcha and missing structured data cause a visible failure rather than an invented price', () => {
  assert.throws(() => parseMarketQuote('<html>Verify you are human</html>', 'prom'));
});
test('source redirect cannot reach private addresses or a different marketplace', async () => {
  let calls = 0;
  await assert.rejects(fetchMarketQuote({ url: 'https://prom.ua/p1', market: 'prom' }, async () => { calls++; return new Response(null, { status: 302, headers: { location: 'https://127.0.0.1/secret' } }); }));
  assert.equal(calls, 1);
});
test('HTTP blocks are not retried or bypassed', async () => {
  let calls = 0;
  await assert.rejects(fetchMarketQuote({ url: 'https://prom.ua/p1', market: 'prom' }, async () => { calls++; return new Response('Denied', { status: 403 }); }), /HTTP 403/);
  assert.equal(calls, 1);
});
test('limits downloaded body and rejects a non-HTML response', async () => {
  await assert.rejects(fetchMarketQuote({ url: 'https://prom.ua/p1', market: 'prom' }, async () => new Response('x'.repeat(2 * 1024 * 1024 + 1), { headers: { 'content-type': 'text/html' } })), /розмір/);
  await assert.rejects(fetchMarketQuote({ url: 'https://prom.ua/p1', market: 'prom' }, async () => new Response('{}', { headers: { 'content-type': 'application/json' } })), /HTML/);
});
test('same identity keeps confirmations, a changed seller/title or >30% jump forces review', () => {
  const offer = { title: 'Coffee 1 kg', seller: 'Seller', price: 100, matchConfirmed: true, termsConfirmed: true };
  const quote = { title: offer.title, seller: offer.seller, price: 110 };
  assert.equal(mergeMarketQuote(offer, quote).termsConfirmed, true);
  assert.equal(mergeMarketQuote(offer, { ...quote, price: 200 }).termsConfirmed, false);
  assert.equal(mergeMarketQuote(offer, { ...quote, seller: 'Different seller' }).matchConfirmed, false);
  assert.equal(mergeMarketQuote(offer, { ...quote, title: 'Coffee 250 g' }).matchConfirmed, false);
  assert.equal(mergeMarketQuote(offer, { ...quote, seller: '' }).termsConfirmed, false);
});
