const DEFAULT_META = {
  title: "Evergreen coffee | Кава та маркет поруч",
  description:
    "Evergreen coffee — локальна кав'ярня та маркет у Києві з онлайн-каталогом, самовивозом і доставкою по ЖК.",
  robots: "index, follow",
};

const PAGE_META = {
  home: DEFAULT_META,
  catalog: {
    title: "Каталог товарів | Evergreen coffee",
    description:
      "Обирайте каву, напої та товари для дому в онлайн-каталозі Evergreen coffee. Доступні товари в наявності та позиції під замовлення.",
    robots: "index, follow",
  },
  contacts: {
    title: "Контакти та адреса | Evergreen coffee",
    description:
      "Контакти Evergreen coffee: адреса в Києві, телефон, Telegram, Instagram і карта для самовивозу замовлень.",
    robots: "index, follow",
  },
  cart: {
    title: "Кошик | Evergreen coffee",
    description:
      "Перевірте товари в кошику Evergreen coffee, кількість позицій і доступні сегменти замовлення перед оформленням.",
    robots: "index, follow",
  },
  checkout: {
    title: "Оформлення замовлення | Evergreen coffee",
    description:
      "Оформіть замовлення Evergreen coffee: залиште контакт, оберіть самовивіз або доставку та надішліть вибраний сегмент кошика.",
    robots: "index, follow",
  },
  "customer-auth": {
    title: "Вхід до кабінету | Evergreen coffee",
    description:
      "Увійдіть або зареєструйтеся, щоб зберігати контакти та переглядати історію замовлень Evergreen coffee.",
    robots: "noindex, nofollow",
  },
  account: {
    title: "Особистий кабінет | Evergreen coffee",
    description:
      "Особистий кабінет клієнта Evergreen coffee з профілем та історією замовлень.",
    robots: "noindex, nofollow",
  },
  admin: {
    title: "Адмін-панель | Evergreen coffee",
    description: "Внутрішня адмін-панель Evergreen coffee.",
    robots: "noindex, nofollow",
  },
  success: {
    title: "Замовлення створено | Evergreen coffee",
    description:
      "Замовлення Evergreen coffee створено. Очікуйте підтвердження від команди.",
    robots: "noindex, nofollow",
  },
};

function getProductDescription(product) {
  const text = String(
    product?.description || product?.details || product?.brand || ""
  )
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return "Деталі товару Evergreen coffee: ціна, наявність, опис і додавання до кошика.";
  }

  return text.length > 155 ? `${text.slice(0, 152)}...` : text;
}

export function getPageMeta(view, { product } = {}) {
  if (view === "product") {
    const productName = String(product?.name || "").trim();

    return {
      title: productName
        ? `${productName} | Evergreen coffee`
        : "Товар | Evergreen coffee",
      description: getProductDescription(product),
      robots: "index, follow",
    };
  }

  return PAGE_META[view] || DEFAULT_META;
}

function ensureMeta(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    Object.entries(attributes).forEach(([name, value]) => {
      element.setAttribute(name, value);
    });
    document.head.appendChild(element);
  }

  return element;
}

function ensureCanonical() {
  let element = document.head.querySelector('link[rel="canonical"]');

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  return element;
}

export function applyPageMeta(meta, path) {
  const title = meta?.title || DEFAULT_META.title;
  const description = meta?.description || DEFAULT_META.description;
  const robots = meta?.robots || DEFAULT_META.robots;
  const canonicalPath = path || window.location.pathname || "/";
  const canonicalUrl = `${window.location.origin}${canonicalPath}`;

  document.title = title;

  ensureMeta('meta[name="description"]', {
    name: "description",
  }).setAttribute("content", description);

  ensureMeta('meta[name="robots"]', {
    name: "robots",
  }).setAttribute("content", robots);

  ensureMeta('meta[property="og:title"]', {
    property: "og:title",
  }).setAttribute("content", title);

  ensureMeta('meta[property="og:description"]', {
    property: "og:description",
  }).setAttribute("content", description);

  ensureMeta('meta[property="og:url"]', {
    property: "og:url",
  }).setAttribute("content", canonicalUrl);

  ensureCanonical().setAttribute("href", canonicalUrl);
}
