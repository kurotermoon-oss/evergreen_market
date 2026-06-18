const PUBLIC_SITEMAP_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/catalog", priority: "0.9", changefreq: "daily" },
  { path: "/how-it-works", priority: "0.8", changefreq: "monthly" },
  { path: "/contacts", priority: "0.7", changefreq: "monthly" },
  { path: "/cart", priority: "0.5", changefreq: "weekly" },
  { path: "/checkout", priority: "0.5", changefreq: "weekly" },
];

function normalizeOrigin(value) {
  const trimmed = String(value || "").trim().replace(/\/+$/, "");

  if (!trimmed) return "";

  try {
    return new URL(trimmed).origin;
  } catch {
    try {
      return new URL(`https://${trimmed}`).origin;
    } catch {
      return "";
    }
  }
}

function getConfiguredOrigin() {
  return normalizeOrigin(
    process.env.SITE_URL ||
      process.env.PUBLIC_SITE_URL ||
      process.env.FRONTEND_URL ||
      process.env.APP_ORIGIN ||
      process.env.CLIENT_ORIGIN ||
      process.env.RAILWAY_PUBLIC_DOMAIN
  );
}

function getRequestOrigin(req) {
  const forwardedProto = String(req.get("x-forwarded-proto") || "")
    .split(",")[0]
    .trim();
  const proto = forwardedProto || req.protocol || "https";
  const host = req.get("host");

  return host ? normalizeOrigin(`${proto}://${host}`) : "";
}

function getSiteOrigin(req) {
  return getConfiguredOrigin() || getRequestOrigin(req) || "http://localhost:3001";
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSitemapXml(origin) {
  const urls = PUBLIC_SITEMAP_ROUTES.map((route) => {
    const loc = `${origin}${route.path}`;

    return [
      "  <url>",
      `    <loc>${escapeXml(loc)}</loc>`,
      `    <changefreq>${route.changefreq}</changefreq>`,
      `    <priority>${route.priority}</priority>`,
      "  </url>",
    ].join("\n");
  }).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");
}

function registerSeoRoutes(app) {
  app.get("/sitemap.xml", (req, res) => {
    const origin = getSiteOrigin(req);

    res.type("application/xml");
    res.send(buildSitemapXml(origin));
  });

  app.get("/robots.txt", (req, res) => {
    const origin = getSiteOrigin(req);

    res.type("text/plain");
    res.send(
      ["User-agent: *", "Allow: /", `Sitemap: ${origin}/sitemap.xml`, ""].join(
        "\n"
      )
    );
  });
}

module.exports = {
  PUBLIC_SITEMAP_ROUTES,
  registerSeoRoutes,
};
