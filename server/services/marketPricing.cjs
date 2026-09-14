const prisma = require("../database/prisma.cjs");
const { fetchMarketQuote, mergeMarketQuote } = require("../integrations/marketPriceQuote.cjs");
const engine = () => import("../../src/utils/marketPricing.js");
const conflict = () => Object.assign(new Error("Дані вже змінено на іншому пристрої. Перезавантажте розрахунок перед збереженням."), { status: 409 });

async function getProfile(productId) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) throw Object.assign(new Error("Товар не знайдено."), { status: 404 });
  const record = await prisma.marketPriceProfile.findUnique({ where: { productId } });
  const { emptyPriceProfile, calculateMarketPrice } = await engine();
  const profile = record?.data || emptyPriceProfile();
  return { profile, revision: record?.revision || 0, result: calculateMarketPrice(profile) };
}

async function saveProfile(productId, input, revision) {
  if (!Number.isInteger(revision) || revision < 0) throw conflict();
  const { normalizePriceProfile, calculateMarketPrice } = await engine();
  const clean = normalizePriceProfile(input);
  const current = await getProfile(productId);
  if (revision !== current.revision) throw conflict();
  const changes = clean.offers.filter(offer => {
    const old = current.profile.offers.find(item => item.id === offer.id);
    return !old || old.price !== offer.price || old.availability !== offer.availability;
  }).map(offer => ({ at: new Date().toISOString(), offerId: offer.id, market: offer.market, seller: offer.seller, price: offer.price, availability: offer.availability }));
  const data = { ...clean, history: [...changes, ...(current.profile.history || [])].slice(0, 60) };
  if (revision === 0) {
    try { await prisma.marketPriceProfile.create({ data: { productId, data } }); }
    catch (error) { if (error.code === "P2002") throw conflict(); throw error; }
  } else {
    const updated = await prisma.marketPriceProfile.updateMany({ where: { productId, revision }, data: { data, revision: { increment: 1 } } });
    if (!updated.count) throw conflict();
  }
  return { profile: data, revision: revision + 1, result: calculateMarketPrice(data) };
}

// This process updates research snapshots only. It never writes Product.price, costPrice or supplierId.
async function refreshProfiles({ limit = 20, maxRequests = 40, fetchQuote = fetchMarketQuote } = {}) {
  const profiles = await prisma.marketPriceProfile.findMany({ where: { data: { path: ["monitoring"], equals: true } }, orderBy: { updatedAt: "asc" }, take: limit });
  const summary = { checked: 0, failed: 0, skipped: 0, conflicts: 0 };
  for (const record of profiles) {
    if (summary.checked + summary.failed >= maxRequests) break;
    if (!record.data.monitoring) { summary.skipped++; continue; }
    const offers = [];
    // Sequential within the run: no bursts against marketplaces and at most 12 requests per product.
    for (const offer of record.data.offers) {
      if (summary.checked + summary.failed >= maxRequests) { offers.push(offer); continue; }
      if (!offer.purchaseEnabled && !offer.benchmarkEnabled) { offers.push(offer); continue; }
      try { offers.push(mergeMarketQuote(offer, await fetchQuote(offer))); summary.checked++; }
      catch (error) { offers.push({ ...offer, lastError: "Автоматична перевірка не вдалася. Перевірте картку вручну." }); summary.failed++; }
    }
    try { await saveProfile(record.productId, { ...record.data, offers }, record.revision); }
    catch (error) { if (error.status === 409) summary.conflicts++; else throw error; }
  }
  return summary;
}

module.exports = { getProfile, saveProfile, refreshProfiles };
