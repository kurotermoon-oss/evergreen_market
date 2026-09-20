const TIMEZONE = "Europe/Kyiv";
const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
function localParts(now = new Date()) {
  const p = Object.fromEntries(formatter.formatToParts(now).map(part => [part.type, part.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}
function addDays(date, days) { return new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10); }
function weekday(date) { return new Date(`${date}T12:00:00Z`).getUTCDay(); }
function validDate(date) { return typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date; }
function validTime(time) { return typeof time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(time); }
// Try both offsets around a DST transition. Ambiguous deadlines use the earlier instant;
// nonexistent local times are never silently shifted to a later deadline.
function instant(date, time) {
  if (!validDate(date) || !validTime(time)) return null;
  const wall = Date.parse(`${date}T${time}:00Z`);
  const candidates = [-12, 12].map(hours => {
    const sample = wall + hours * 3600000;
    const p = localParts(new Date(sample));
    const offset = Date.parse(`${p.date}T${p.time}:00Z`) - sample;
    return new Date(wall - offset);
  }).filter(value => { const p = localParts(value); return p.date === date && p.time === time; });
  return candidates.sort((a, b) => a - b)[0]?.toISOString() || null;
}
function dayRule(supplier, date) {
  const exception = (supplier.exceptions || []).find(item => item.date === date);
  return { deadline: exception && Object.hasOwn(exception, "deadline") ? exception.deadline : supplier.orderTimes[weekday(date)],
    delivery: exception && Object.hasOwn(exception, "delivery") ? exception.delivery : supplier.deliveryDays.includes(weekday(date)) };
}
function orderWindow(supplier, date) {
  const deadline = dayRule(supplier, date).deadline;
  const at = deadline && instant(date, deadline);
  return at ? { date, time: deadline, at } : null;
}
function nextDelivery(supplier, orderDate, leadDays = supplier.maxLeadDays) {
  for (let n = leadDays; n < leadDays + 35; n++) {
    const date = addDays(orderDate, n);
    if (dayRule(supplier, date).delivery) return date;
  }
  return null;
}
function schedule(supplier, now = new Date()) {
  if (!supplier.active || !supplier.confirmed) return { confirmed: false, today: null, nextOrder: null, delivery: null, lastSafeOrder: null };
  const { date } = localParts(now);
  const today = orderWindow(supplier, date);
  let nextOrder = null;
  for (let n = 0; n < 35; n++) {
    const window = orderWindow(supplier, addDays(date, n));
    if (window && new Date(window.at) > now) { nextOrder = window; break; }
  }
  const delivery = nextOrder ? nextDelivery(supplier, nextOrder.date) : null;
  let lastSafeOrder = null;
  if (delivery) for (let n = supplier.maxLeadDays; n < supplier.maxLeadDays + 35; n++) {
    const window = orderWindow(supplier, addDays(delivery, -n));
    if (window) { lastSafeOrder = window; break; }
  }
  return { confirmed: true, today, nextOrder, delivery, lastSafeOrder,
    earliestDelivery: nextOrder ? nextDelivery(supplier, nextOrder.date, supplier.minLeadDays) : null,
    lastBeforeBreak: !!today && !orderWindow(supplier, addDays(date, 1)) };
}
module.exports = { TIMEZONE, localParts, addDays, weekday, validDate, validTime, instant, dayRule, orderWindow, schedule };
