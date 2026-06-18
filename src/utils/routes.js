export const ROUTE_PATHS = {
  home: "/",
  catalog: "/catalog",
  howItWorks: "/how-it-works",
  contacts: "/contacts",
  cart: "/cart",
  checkout: "/checkout",
  customerAuth: "/login",
  account: "/account",
  admin: "/admin",
  success: "/order-success",
};

const STATIC_VIEW_BY_PATH = new Map([
  [ROUTE_PATHS.home, "home"],
  [ROUTE_PATHS.catalog, "catalog"],
  [ROUTE_PATHS.howItWorks, "how-it-works"],
  [ROUTE_PATHS.contacts, "contacts"],
  [ROUTE_PATHS.cart, "cart"],
  [ROUTE_PATHS.checkout, "checkout"],
  [ROUTE_PATHS.customerAuth, "customer-auth"],
  [ROUTE_PATHS.account, "account"],
  [ROUTE_PATHS.admin, "admin"],
  [ROUTE_PATHS.success, "success"],
]);

export function normalizePathname(pathname = "/") {
  const path = String(pathname || "/").split("?")[0] || "/";

  if (path === "/") return "/";

  return path.replace(/\/+$/, "");
}

export function getProductPath(productId) {
  const id = String(productId || "").trim();

  return id ? `/products/${encodeURIComponent(id)}` : ROUTE_PATHS.catalog;
}

export function getRouteFromLocation(location = window.location) {
  const pathname = normalizePathname(location.pathname);
  const params = new URLSearchParams(location.search || "");

  if (params.get("admin") === "1") {
    return {
      view: "admin",
      path: ROUTE_PATHS.admin,
    };
  }

  if (pathname.startsWith("/products/")) {
    const productId = decodeURIComponent(pathname.replace("/products/", ""));

    return {
      view: "product",
      path: getProductPath(productId),
      productId,
    };
  }

  const view = STATIC_VIEW_BY_PATH.get(pathname);

  if (view) {
    return {
      view,
      path: pathname,
    };
  }

  return {
    view: "home",
    path: ROUTE_PATHS.home,
    isNotFound: true,
  };
}

export function getPathForView(view, options = {}) {
  if (view === "product") {
    return getProductPath(options.productId);
  }

  if (view === "customer-auth") {
    return ROUTE_PATHS.customerAuth;
  }

  return (
    {
      home: ROUTE_PATHS.home,
      catalog: ROUTE_PATHS.catalog,
      "how-it-works": ROUTE_PATHS.howItWorks,
      contacts: ROUTE_PATHS.contacts,
      cart: ROUTE_PATHS.cart,
      checkout: ROUTE_PATHS.checkout,
      account: ROUTE_PATHS.account,
      admin: ROUTE_PATHS.admin,
      success: ROUTE_PATHS.success,
    }[view] || ROUTE_PATHS.home
  );
}

export function isCartRoute(view) {
  return view === "cart" || view === "checkout";
}
