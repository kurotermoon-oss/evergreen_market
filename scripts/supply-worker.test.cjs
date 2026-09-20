const test = require('node:test');
const assert = require('node:assert/strict');
const { emptyState } = require('../server/supply/domain.cjs');
const { runTick } = require('../server/supply/worker.cjs');

// Persistent outbox double: new worker instances share these database records.
// Actual PostgreSQL advisory-lock/transaction integration needs a test database.
function database(clock) {
  const records = new Map(); let locked = false, releases = 0;
  const query = async (sql, args = []) => {
    if (sql.includes('pg_try_advisory_lock')) { const result = !locked; locked = true; return { rows: [{ locked: result }] }; }
    if (sql.includes('pg_advisory_unlock')) { locked = false; return { rows: [] }; }
    if (sql.startsWith('INSERT INTO supply_notifications')) {
      if (!records.has(args[0])) records.set(args[0], { attempts: 0 });
    } else if (sql.startsWith('SELECT * FROM supply_notifications')) return { rows: [{ ...records.get(args[0]) }] };
    else if (sql.startsWith('UPDATE supply_notifications SET attempts')) Object.assign(records.get(args[0]), { attempts: records.get(args[0]).attempts + 1, next_attempt_at: new Date(+clock() + 60000) });
    else if (sql.startsWith('UPDATE supply_notifications SET sent_at')) Object.assign(records.get(args[0]), { sent_at: clock(), last_error: null });
    else if (sql.startsWith('UPDATE supply_notifications SET last_error')) Object.assign(records.get(args[0]), { last_error: args[1], next_attempt_at: new Date(+clock() + args[2] * 1000) });
    else if (!sql.includes('supply_worker_status') && !sql.startsWith('DELETE FROM supply_notifications')) throw Error(`Unimplemented test query: ${sql}`);
    return { rows: [] };
  };
  return { pool: { connect: async () => ({ query, release: () => releases++ }) }, records, releases: () => releases };
}
function fixture() {
  const state = emptyState(); state.settings.enabled = true;
  state.suppliers = [{ id: 's', active: true, confirmed: false }];
  state.products = [{ id: 'p', name: 'Test', kind: 'stock', active: true, supplierId: 's', days: [0,1,2,3,4,5,6], sortOrder: 0 }];
  return state;
}
const config = { notificationsConfigured: true, chatId: '42' };
test('Reminder retry survives worker restart, honors delay, and does not repeat a sent stage', async () => {
  let time = new Date('2026-09-18T09:00Z'), attempts = 0;
  const clock = () => time, db = database(clock), state = fixture();
  const repository = () => ({ pool: db.pool, read: async () => structuredClone(state) });
  const send = async () => { if (++attempts === 1) throw Object.assign(new Error('Temporary outage'), { retryAfter: 120 }); };
  assert.deepEqual(await runTick(repository(), config, time, send, clock), { sent: 0 });
  time = new Date(+time + 60000);
  await runTick(repository(), config, time, send, clock); assert.equal(attempts, 1);
  time = new Date(+time + 60000);
  assert.deepEqual(await runTick(repository(), config, time, send, clock), { sent: 1 });
  await runTick(repository(), config, time, send, clock); assert.equal(attempts, 2);
  assert.equal(db.records.size, 1); assert.equal(db.releases(), 4);
});
test('Only one worker sends while another instance holds the notification lock', async () => {
  const time = new Date('2026-09-18T09:00Z'), db = database(() => time), state = fixture();
  const repository = { pool: db.pool, read: async () => structuredClone(state) };
  let releaseSend, entered;
  const started = new Promise(resolve => { entered = resolve; });
  const first = runTick(repository, config, time, async () => { entered(); await new Promise(resolve => { releaseSend = resolve; }); }, () => time);
  await started;
  assert.deepEqual(await runTick(repository, config, time, async () => assert.fail('Concurrent send'), () => time), { skipped: true, reason: 'another_worker' });
  releaseSend(); assert.deepEqual(await first, { sent: 1 });
  assert.equal(db.releases(), 2);
});
test('A checklist resolved on another device just before dispatch suppresses an obsolete alert', async () => {
  const time = new Date('2026-09-18T09:00Z'), db = database(() => time), state = fixture(); let reads = 0;
  const repository = { pool: db.pool, read: async () => { const copy = structuredClone(state); if (++reads > 1) copy.settings.enabled = false; return copy; } };
  assert.deepEqual(await runTick(repository, config, time, async () => assert.fail('Obsolete message'), () => time), { sent: 0 });
  assert.equal([...db.records.values()][0].attempts, 0);
});
