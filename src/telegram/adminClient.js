export function createAdminClient() {
  let token = "";
  let sessionPromise;
  async function request(path, options = {}) {
    let response;
    try {
      response = await fetch(`/api/telegram/admin${path}`, {
        ...options, credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(20000),
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
    } catch { throw new Error("Немає відповіді сервера. Оновіть замовлення, щоб перевірити результат дії."); }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data.message || "Не вдалося завантажити дані."), { status: response.status });
    return data;
  }
  return {
    session(initData) {
      if (!sessionPromise) sessionPromise = request("/session", { method: "POST", body: JSON.stringify({ initData }) }).then(result => { token = result.token; return result; });
      return sessionPromise;
    },
    list(params) { return request(`/orders?${new URLSearchParams(params)}`); },
    detail(id) { return request(`/orders/${encodeURIComponent(id)}`); },
    action(id, payload) { return request(`/orders/${encodeURIComponent(id)}/action`, { method: "PATCH", body: JSON.stringify(payload) }); },
    clear() { token = ""; sessionPromise = undefined; },
  };
}
