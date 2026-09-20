const { getConfig } = require("./auth.cjs");
const { planNotifications, sendNotification } = require("./notifications.cjs");
const LOCK_ID = 76219042;
async function runTick(repository, config = getConfig(), now = new Date(), send = sendNotification, clock = () => new Date()) {
  if (!config.notificationsConfigured) return { skipped: true, reason: "not_configured" };
  const client = await repository.pool.connect();
  let locked = false, sent = 0;
  try {
    locked = (await client.query("SELECT pg_try_advisory_lock($1) AS locked", [LOCK_ID])).rows[0].locked;
    if (!locked) return { skipped: true, reason: "another_worker" };
    await client.query("INSERT INTO supply_worker_status (id, last_tick_at) VALUES ('evergreen', now()) ON CONFLICT (id) DO UPDATE SET last_tick_at = now()");
    const candidates = planNotifications(await repository.read(now), now);
    for (const candidate of candidates) {
      const key = `${config.chatId}:${candidate.key}`;
      await client.query("INSERT INTO supply_notifications (event_key) VALUES ($1) ON CONFLICT DO NOTHING", [key]);
      const entry = (await client.query("SELECT * FROM supply_notifications WHERE event_key = $1", [key])).rows[0];
      if (entry.sent_at || (entry.next_attempt_at && new Date(entry.next_attempt_at) > now)) continue;
      // Recheck just before sending: another device may have closed the task.
      const freshNow = clock();
      const fresh = planNotifications(await repository.read(freshNow), freshNow).find(n => n.key === candidate.key);
      if (!fresh) continue;
      await client.query("UPDATE supply_notifications SET attempts = attempts + 1, next_attempt_at = now() + interval '1 minute' WHERE event_key = $1", [key]);
      try {
        await send(config, fresh);
        await client.query("UPDATE supply_notifications SET sent_at = now(), last_error = NULL WHERE event_key = $1", [key]);
        await client.query("UPDATE supply_worker_status SET last_sent_at = now(), last_error = NULL WHERE id = 'evergreen'");
        sent++;
      } catch (e) {
        const delay = e.retryAfter || Math.min(3600, 60 * 2 ** Math.min(entry.attempts, 6));
        await client.query("UPDATE supply_notifications SET last_error = $2, next_attempt_at = now() + $3 * interval '1 second' WHERE event_key = $1", [key, e.message.slice(0, 300), delay]);
        await client.query("UPDATE supply_worker_status SET last_error = $1 WHERE id = 'evergreen'", [e.message.slice(0, 300)]);
      }
    }
    await client.query("DELETE FROM supply_notifications WHERE created_at < now() - interval '90 days'");
    return { sent };
  } finally {
    if (locked) await client.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]).catch(() => {});
    client.release();
  }
}
function startWorker(repository, config = getConfig) {
  let stopped = false, timer;
  async function tick() {
    if (stopped) return;
    try { await runTick(repository, config()); }
    catch { console.warn("[Supply] Reminder tick failed; will retry in one minute."); }
    if (!stopped) { timer = setTimeout(tick, 60000); timer.unref(); }
  }
  timer = setTimeout(tick, 1000); timer.unref();
  return () => { stopped = true; clearTimeout(timer); };
}
module.exports = { runTick, startWorker };
