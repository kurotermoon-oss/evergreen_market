const API_BASE = "";

function getFirstError(errors = {}) {
  return Object.values(errors).find(Boolean) || "";
}

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
    const message =
      data?.message ||
      data?.errors?.cart ||
      getFirstError(data?.errors) ||
      data?.error ||
      "Request failed";

    const error = new Error(message);

    error.status = response.status;
    error.code = data?.error || "";
    error.hint = data?.hint || "";
    error.errors = data?.errors || {};
    error.data = data;

    throw error;
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


updateCustomerProfile(payload) {
  return request("/api/customer/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
},
  startTelegramVerification() {
  return request("/api/customer/telegram/start-verification", {
    method: "POST",
  });
},

checkTelegramVerification() {
  return request("/api/customer/telegram/check-verification", {
    method: "POST",
  });
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

  getAdminCategories() {
  return request("/api/admin/categories");
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

createAdminCategory(payload) {
  return request("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
},

updateAdminCategory(id, payload) {
  return request(`/api/admin/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
},

deleteAdminCategory(id) {
  return request(`/api/admin/categories/${id}`, {
    method: "DELETE",
  });
},

createAdminSubcategory(categoryId, payload) {
  return request(`/api/admin/categories/${categoryId}/subcategories`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
},

updateAdminSubcategory(categoryId, subcategoryId, payload) {
  return request(
    `/api/admin/categories/${categoryId}/subcategories/${subcategoryId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
},


deleteAdminSubcategory(categoryId, subcategoryId) {
  return request(
    `/api/admin/categories/${categoryId}/subcategories/${subcategoryId}`,
    {
      method: "DELETE",
    }
  );
},


getAdminAnalytics(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);

  const query = searchParams.toString();

  return request(`/api/admin/analytics${query ? `?${query}` : ""}`);
},

getAdminCustomers(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);

  const query = searchParams.toString();

  return request(`/api/admin/customers${query ? `?${query}` : ""}`);
},

getAdminCustomerOrders(id) {
  return request(`/api/admin/customers/${id}/orders`);
},

getBlockedCustomers() {
  return request("/api/admin/customers/security/blocked");
},

createBlockedCustomer(payload) {
  return request("/api/admin/customers/security/blocked", {
    method: "POST",
    body: JSON.stringify(payload),
  });
},

deleteBlockedCustomer(id) {
  return request(`/api/admin/customers/security/blocked/${id}`, {
    method: "DELETE",
  });
},


};