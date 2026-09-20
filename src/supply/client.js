export function createSupplyClient() {
  let token = "", login;
  async function request(path, options = {}) {
    let response;
    try { response = await fetch(`/api/telegram/supply${path}`, { ...options, credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(20000), headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } }); }
    catch { throw new Error("Немає зв’язку. Зміни могли зберегтися — оновіть список перед повторною дією."); }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data.message || "Не вдалося виконати дію."), { status: response.status });
    return data;
  }
  return {
    session(initData) { return login ||= request("/session", { method: "POST", body: JSON.stringify({ initData }) }).then(data => { token = data.token; return data; }); },
    read() { return request("/state"); },
    command(action, revision) { return request("/command", { method: "POST", body: JSON.stringify({ action, revision }) }); },
    clear() { token = ""; login = null; },
  };
}
