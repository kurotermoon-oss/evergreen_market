const { emptyState, command, reconcile, error } = require("./domain.cjs");
// A single café is a small aggregate. Row locking + revision checking makes the
// shared account safe on several devices; it never touches storefront tables.
function createRepository(pool) {
  async function transaction(action, expectedRevision, now = new Date()) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("INSERT INTO supply_workspace (id, data) VALUES ('evergreen', $1::jsonb) ON CONFLICT (id) DO NOTHING", [JSON.stringify(emptyState())]);
      const result = await client.query("SELECT data FROM supply_workspace WHERE id = 'evergreen' FOR UPDATE");
      const state = result.rows[0].data;
      const previous = JSON.stringify(state);
      if (action) {
        if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== state.revision) throw error("Список змінився на іншому пристрої. Дані оновлено — повторіть дію.", 409);
        command(state, action, now);
      } else {
        reconcile(state, now);
        if (JSON.stringify(state) !== previous) state.revision++;
      }
      if (JSON.stringify(state) !== previous) await client.query("UPDATE supply_workspace SET data = $1::jsonb, updated_at = now() WHERE id = 'evergreen'", [JSON.stringify(state)]);
      await client.query("COMMIT");
      return state;
    } catch (e) { await client.query("ROLLBACK").catch(() => {}); throw e; }
    finally { client.release(); }
  }
  return { read: now => transaction(null, null, now), command: transaction, pool };
}
module.exports = { createRepository };
