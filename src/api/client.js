const API_BASE = "";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Request failed");
  }

  return data;
}

export const api = {
  getCategories() {
    return request("/api/categories");
  },

  getProducts() {
    return request("/api/products");
  },
    deleteAdminProduct(id) {
    return request(`/api/admin/products/${id}`, {
        method: "DELETE",
    });
    },
  createOrder(payload) {
    return request("/api/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  customerRegister(payload) {
    return request("/api/customer/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  customerLogin(payload) {
    return request("/api/customer/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  customerLogout() {
    return request("/api/customer/logout", {
      method: "POST",
    });
  },

  customerMe() {
    return request("/api/customer/me");
  },

  getCustomerOrders() {
    return request("/api/customer/orders");
  },

  
  adminLogin(payload) {
    return request("/api/admin/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  adminLogout() {
    return request("/api/admin/logout", {
      method: "POST",
    });
  },

  adminMe() {
    return request("/api/admin/me");
  },

  getAdminProducts() {
    return request("/api/admin/products");
  },

  createAdminProduct(payload) {
    return request("/api/admin/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateAdminProduct(id, payload) {
    return request(`/api/admin/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  getAdminOrders() {
    return request("/api/admin/orders");
  },

  updateAdminOrderAction(id, payload) {
    return request(`/api/admin/orders/${id}/action`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },


getAdminAnalytics(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);

  const query = searchParams.toString();

  return request(`/api/admin/analytics${query ? `?${query}` : ""}`);
},

};