export const PRODUCT_CSV_COLUMNS = [
  "id",
  "name",
  "category",
  "subcategory",
  "brand",
  "productType",
  "countryOfOrigin",
  "price",
  "oldPrice",
  "costPrice",
  "unit",
  "packageInfo",
  "image",
  "description",
  "details",
  "benefits",
  "composition",
  "allergens",
  "storageConditions",
  "statusLabel",
  "stockStatus",
  "stockQuantity",
  "active",
  "popular",
  "purchaseCount",
];

export const PRODUCT_CSV_TEMPLATE_COLUMNS = PRODUCT_CSV_COLUMNS.filter((key) => {
  return key !== "id";
});

const HEADER_ALIASES = {
  id: "id",
  sku: "id",
  артикул: "id",

  name: "name",
  назва: "name",
  название: "name",
  товар: "name",

  category: "category",
  категорія: "category",
  категория: "category",

  subcategory: "subcategory",
  підкатегорія: "subcategory",
  подкатегория: "subcategory",

  brand: "brand",
  бренд: "brand",

  producttype: "productType",
  тип: "productType",
  типтовару: "productType",
  типтовара: "productType",

  countryoforigin: "countryOfOrigin",
  країна: "countryOfOrigin",
  страна: "countryOfOrigin",
  країнавиробництва: "countryOfOrigin",
  странапроизводства: "countryOfOrigin",

  price: "price",
  ціна: "price",
  цена: "price",

  oldprice: "oldPrice",
  стараціна: "oldPrice",
  стараяцена: "oldPrice",

  costprice: "costPrice",
  собівартість: "costPrice",
  себестоимость: "costPrice",

  unit: "unit",
  обєм: "unit",
  обсяг: "unit",
  объем: "unit",
  вага: "unit",
  вес: "unit",

  packageinfo: "packageInfo",
  упаковка: "packageInfo",

  image: "image",
  фото: "image",
  зображення: "image",
  изображение: "image",

  description: "description",
  опис: "description",
  описание: "description",

  details: "details",
  деталі: "details",
  детали: "details",

  benefits: "benefits",
  переваги: "benefits",
  преимущества: "benefits",

  composition: "composition",
  склад: "composition",
  состав: "composition",

  allergens: "allergens",
  алергени: "allergens",
  аллергены: "allergens",

  storage: "storageConditions",
  storageconditions: "storageConditions",
  зберігання: "storageConditions",
  хранение: "storageConditions",
  умовизберігання: "storageConditions",
  умовияхранения: "storageConditions",

  statuslabel: "statusLabel",
  бейдж: "statusLabel",
  статуснатоварі: "statusLabel",

  stockstatus: "stockStatus",
  наявність: "stockStatus",
  наличие: "stockStatus",

  stockquantity: "stockQuantity",
  залишок: "stockQuantity",
  остаток: "stockQuantity",

  active: "active",
  активний: "active",
  активный: "active",

  popular: "popular",
  популярний: "popular",
  популярный: "popular",

  purchasecount: "purchaseCount",
  продажі: "purchaseCount",
  продажи: "purchaseCount",
};

const STOCK_STATUS_ALIASES = {
  "": "",
  in_stock: "in_stock",
  instock: "in_stock",
  "в наявності": "in_stock",
  "у наявності": "in_stock",
  "в наличии": "in_stock",
  limited: "limited",
  "мало": "limited",
  "мало в наявності": "limited",
  "ограничено": "limited",
  preorder: "preorder",
  "під замовлення": "preorder",
  "под заказ": "preorder",
  out_of_stock: "out_of_stock",
  outofstock: "out_of_stock",
  "немає": "out_of_stock",
  "нет": "out_of_stock",
  "нет в наличии": "out_of_stock",
};

function normalizeHeader(value) {
  const normalized = String(value || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/['’ʼ"]/g, "")
    .replace(/[\s._-]+/g, "");

  return HEADER_ALIASES[normalized] || normalized;
}

function countDelimiter(line, delimiter) {
  let count = 0;
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && nextChar === '"') {
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === delimiter) {
      count += 1;
    }
  }

  return count;
}

function detectDelimiter(text) {
  const firstLine = String(text || "")
    .split(/\r?\n/)
    .find((line) => line.trim());

  if (!firstLine) return ",";

  return [",", ";", "\t"].reduce((best, delimiter) => {
    return countDelimiter(firstLine, delimiter) > countDelimiter(firstLine, best)
      ? delimiter
      : best;
  }, ",");
}

function parseCsv(text, delimiter) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  const source = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(cell);
      cell = "";
      continue;
    }

    if (!inQuotes && char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);

  return rows.filter((items) => items.some((item) => String(item).trim()));
}

function parseNumber(value) {
  const cleanValue = String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(",", ".");

  if (!cleanValue) return "";

  const number = Number(cleanValue);

  return Number.isFinite(number) ? Math.round(number) : "";
}

function parseBoolean(value) {
  const cleanValue = String(value || "").trim().toLowerCase();

  if (!cleanValue) return undefined;

  if (["1", "true", "yes", "y", "так", "да", "активний"].includes(cleanValue)) {
    return true;
  }

  if (["0", "false", "no", "n", "ні", "нет", "неактивний"].includes(cleanValue)) {
    return false;
  }

  return undefined;
}

function normalizeStockStatus(value) {
  const cleanValue = String(value || "").trim().toLowerCase();
  const compactValue = cleanValue.replace(/[\s_-]+/g, "");

  return STOCK_STATUS_ALIASES[cleanValue] || STOCK_STATUS_ALIASES[compactValue] || cleanValue;
}

function normalizeProduct(row, rowNumber) {
  const product = {
    rowNumber,
  };

  PRODUCT_CSV_COLUMNS.forEach((key) => {
    if (row[key] !== undefined) {
      product[key] = String(row[key] || "").trim();
    }
  });

  ["price", "oldPrice", "costPrice", "stockQuantity", "purchaseCount"].forEach(
    (key) => {
      if (product[key] !== undefined) {
        product[key] = parseNumber(product[key]);
      }
    }
  );

  ["active", "popular"].forEach((key) => {
    if (product[key] !== undefined) {
      const booleanValue = parseBoolean(product[key]);

      if (booleanValue === undefined) {
        delete product[key];
      } else {
        product[key] = booleanValue;
      }
    }
  });

  if (product.stockStatus !== undefined) {
    product.stockStatus = normalizeStockStatus(product.stockStatus);
  }

  return product;
}

export function parseProductsCsv(text) {
  const delimiter = detectDelimiter(text);
  const rows = parseCsv(text, delimiter);
  const errors = [];

  if (rows.length < 2) {
    const message = rows.length === 1
      ? "У файлі є тільки заголовок. Додайте хоча б один рядок товару."
      : "CSV файл порожній або не містить заголовків.";

    return {
      products: [],
      errors: [{ rowNumber: 1, message }],
      delimiter,
    };
  }

  const headers = rows[0].map(normalizeHeader);
  const products = [];

  rows.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2;
    const row = {};

    cells.forEach((cell, cellIndex) => {
      const key = headers[cellIndex];

      if (key) {
        row[key] = cell;
      }
    });

    const product = normalizeProduct(row, rowNumber);

    if (!product.name) {
      errors.push({
        rowNumber,
        message: "Пропущено товар без назви.",
      });
      return;
    }

    if (product.price === "") {
      errors.push({
        rowNumber,
        message: `Для “${product.name}” не вказано коректну ціну.`,
      });
      return;
    }

    products.push(product);
  });

  return {
    products,
    errors,
    delimiter,
  };
}

function escapeCsvCell(value) {
  const cleanValue = value === null || value === undefined ? "" : String(value);

  if (/[",;\n\r\t]/.test(cleanValue)) {
    return `"${cleanValue.replace(/"/g, '""')}"`;
  }

  return cleanValue;
}

function getCategoryName(product, categories) {
  const category = categories.find((item) => item.id === product.category);

  return category?.name || product.category || "";
}

function getSubcategoryName(product, categories) {
  const category = categories.find((item) => item.id === product.category);
  const subcategory = category?.subcategories?.find((item) => {
    return item.id === product.subcategory;
  });

  return subcategory?.name || product.subcategory || "";
}

function mapProductForCsv(product, categories) {
  return {
    id: product.id || "",
    name: product.name || "",
    category: getCategoryName(product, categories),
    subcategory: getSubcategoryName(product, categories),
    brand: product.brand || "",
    productType: product.productType || "",
    countryOfOrigin: product.countryOfOrigin || "",
    price: product.price ?? "",
    oldPrice: product.oldPrice ?? "",
    costPrice: product.costPrice ?? "",
    unit: product.unit || "",
    packageInfo: product.packageInfo || "",
    image: product.image || "",
    description: product.description || "",
    details: product.details || "",
    benefits: product.benefits || "",
    composition: product.composition || "",
    allergens: product.allergens || "",
    storageConditions: product.storageConditions || product.storage || "",
    statusLabel: product.statusLabel || "",
    stockStatus: product.stockStatus || "in_stock",
    stockQuantity: product.stockQuantity ?? "",
    active: product.active !== false,
    popular: Boolean(product.popular),
    purchaseCount: product.purchaseCount ?? "",
  };
}

export function buildProductsCsv(products = [], categories = []) {
  const rows = [
    PRODUCT_CSV_COLUMNS,
    ...products.map((product) => {
      const csvProduct = mapProductForCsv(product, categories);

      return PRODUCT_CSV_COLUMNS.map((key) => csvProduct[key]);
    }),
  ];

  return rows
    .map((row) => row.map(escapeCsvCell).join(";"))
    .join("\n");
}

export function buildProductTemplateCsv() {
  return `${PRODUCT_CSV_TEMPLATE_COLUMNS.join(";")}\n`;
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
