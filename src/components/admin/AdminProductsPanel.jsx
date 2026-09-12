import { useMemo, useRef, useState } from "react";
import { getAdminStockLabel } from "../../utils/adminProductStatus.js";
import Icon from "../Icon.jsx";
import { formatUAH } from "../../utils/formatUAH.js";


function getCategoryLabel(categories, product) {
  const category = categories.find((item) => item.id === product.category);
  const subcategory = category?.subcategories?.find((item) => {
    return item.id === product.subcategory;
  });

  return [category?.name || "Без категорії", subcategory?.name]
    .filter(Boolean)
    .join(" / ");
}

function getVisibilitySearchText(product) {
  return product.active === false
    ? "приховано сховано не відображається на сайті прихований"
    : "активний видимий відображається на сайті";
}

function ProductThumbnail({ product }) {
  const [hasImageError, setHasImageError] = useState(false);
  const hasImage = Boolean(product.image) && !hasImageError;

  return (
    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 text-emerald-900 shadow-sm sm:h-[72px] sm:w-[72px]">
      {hasImage ? (
        <img
          src={product.image}
          alt={product.name}
          onError={() => setHasImageError(true)}
          className="eg-image h-full w-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-1 text-stone-400">
          <Icon name="package" size={22} />
          <span className="text-[9px] font-black uppercase leading-none">
            Без фото
          </span>
        </div>
      )}
    </div>
  );
}

function ProductActionButton({ children, label, tone = "neutral", onClick }) {
  const toneClasses = {
    neutral:
      "border-stone-200 bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-950",
    green:
      "border-emerald-100 bg-white text-emerald-800 hover:bg-emerald-50 hover:text-emerald-950",
    red: "border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`eg-icon-button grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${toneClasses[tone]} shadow-sm`}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}

export default function AdminProductsPanel({
  showSearch = true,
  products,
  categories,
  startEditProduct,
  toggleProductActive,
  deleteProduct,
}) {
  const [page, setPage] = useState(1);
  const listRef = useRef(null);
  function goToPage(nextPage) {
    setPage(nextPage);
    listRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }
  const [adminProductQuery, setAdminProductQuery] = useState("");

  const filteredAdminProducts = useMemo(() => {
    const normalizedQuery = adminProductQuery.toLowerCase().trim();

    return products.filter((product) => {
      const categoryName =
        categories.find((category) => category.id === product.category)?.name ||
        "";

      const searchableText = [
        product.name,
        product.brand,
        product.description,
        product.details,
        product.unit,
        product.packageInfo,
        product.fulfillmentType,
        product.supplier?.name,
        product.supplierId,
        product.price,
        product.costPrice,
        categoryName,
        getCategoryLabel(categories, product),
        getVisibilitySearchText(product),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !normalizedQuery || searchableText.includes(normalizedQuery);
    });
  }, [products, categories, adminProductQuery]);

  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(filteredAdminProducts.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageProducts = filteredAdminProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return <section ref={listRef} className="eg-admin-products" aria-label="Список товарів">
    {showSearch && <label className="eg-admin-label">Пошук товарів<input className="eg-field" value={adminProductQuery} onChange={event => { setAdminProductQuery(event.target.value); setPage(1); }} placeholder="Назва, категорія, постачальник…" /></label>}
    <div className="eg-product-columns" aria-hidden="true"><span>Товар</span><span>Ціна / собівартість</span><span>Наявність / показ</span><span>Дії</span></div>
    {!pageProducts.length && <p className="eg-admin-empty">Товарів не знайдено. Змініть пошук або скиньте фільтри.</p>}
    {pageProducts.map(product => {
      const isHidden = product.active === false;
      const unavailable = product.stockStatus === "out_of_stock";
      return <article key={product.id} className="eg-product-row" data-hidden={isHidden}>
        <div className="eg-product-identity">
          <ProductThumbnail key={product.image} product={product} />
          <div><button type="button" className="eg-product-name" onClick={() => startEditProduct(product)}>{product.name}</button>
            <p>{getCategoryLabel(categories, product)}</p>
            <small>{product.fulfillmentType === "supplier_order" ? product.supplier?.name || "Постачальник не вказаний" : "Власний склад"}</small>
          </div>
        </div>
        <div className="eg-product-price"><strong>{formatUAH(product.price)}</strong><small>Собівартість: {product.costPrice == null || product.costPrice === "" ? "—" : formatUAH(product.costPrice)}</small></div>
        <div className="eg-product-status"><span data-tone={unavailable ? "warning" : "neutral"}>{getAdminStockLabel(product)}</span><small>{isHidden ? "Приховано вручну" : unavailable && product.fulfillmentType === "supplier_order" ? "Не показується покупцям" : "Увімкнено в каталозі"}</small></div>
        <div className="eg-product-actions">
          <ProductActionButton onClick={() => startEditProduct(product)} label={"Редагувати: " + product.name}><Icon name="edit" size={18} /></ProductActionButton>
          <ProductActionButton onClick={() => toggleProductActive(product.id)} label={(isHidden ? "Повернути на сайт: " : "Сховати: ") + product.name} tone="green"><Icon name={isHidden ? "eye" : "eyeOff"} size={18} /></ProductActionButton>
          <ProductActionButton onClick={() => deleteProduct(product.id)} label={"Видалити: " + product.name} tone="red"><Icon name="trash" size={18} /></ProductActionButton>
        </div>
      </article>;
    })}
    <nav className="eg-admin-pagination" aria-label="Сторінки товарів">
      <p role="status">{filteredAdminProducts.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredAdminProducts.length)} із {filteredAdminProducts.length} товарів</p>
      <div><button type="button" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>Назад</button><span>{currentPage} / {pageCount}</span><button type="button" disabled={currentPage === pageCount} onClick={() => goToPage(currentPage + 1)}>Далі</button></div>
    </nav>
  </section>;
}
