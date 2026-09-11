import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import Modal from "../Modal.jsx";
import "../../styles/catalog-categories.css";

function productCountLabel(count) {
  const last = count % 10;
  const teen = count % 100 >= 11 && count % 100 <= 14;
  return `${count} ${!teen && last === 1 ? "товар" : !teen && last >= 2 && last <= 4 ? "товари" : "товарів"}`;
}

export default function CatalogCategoryDialog({ categories, counts, selectedCategory, selectedSubcategory, totalCount, fulfillmentType, onSelectCategory, onSelectSubcategory, onShowAll, onClose }) {
  const [categoryId, setCategoryId] = useState(null);
  const titleRef = useRef(null);
  const category = categories.find((item) => item.id === categoryId);
  const subcategoriesFor = (item) => (item.subcategories || []).filter(
    (subcategory) => subcategory.active !== false && counts.subcategories[`${item.id}:${subcategory.id}`] > 0
  );
  const subcategories = category ? subcategoriesFor(category) : [];

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, [categoryId]);

  function chooseCategory(item) {
    if (subcategoriesFor(item).length) setCategoryId(item.id);
    else onSelectCategory(item.id);
  }

  return (
    <Modal className={`eg-storefront eg-category-dialog${category ? " eg-category-dialog--detail" : ""}`} maxWidth={1080} label="Категорії товарів" onClose={onClose}>
      <div id="catalog-menu-panel" className="eg-category-picker">
        <header className="eg-category-picker-header">
          <div className="eg-category-picker-heading">
            {category && <button className="eg-category-back" type="button" onClick={() => setCategoryId(null)} aria-label="Назад до категорій"><ChevronLeft size={20} /></button>}
            <div>
              <p className="eg-category-eyebrow">Каталог Evergreen</p>
              <h2 ref={titleRef} tabIndex={-1}>{category ? category.name : "Оберіть категорію"}</h2>
              <p className="eg-category-context">{fulfillmentType === "supplier_order" ? "Під замовлення" : "Є в наявності"} · {productCountLabel(category ? counts.categories[category.id] || 0 : totalCount)}</p>
            </div>
          </div>
          <button className="eg-category-close" type="button" onClick={onClose} aria-label="Закрити каталог"><X size={22} /></button>
        </header>

        <div className="eg-category-picker-content modal-scrollbar">
          <div className="eg-category-grid">
            <button className="eg-category-tile eg-category-tile-all" type="button" onClick={category ? () => onSelectCategory(category.id) : onShowAll}>
              <span><strong>{category ? "Усі товари категорії" : "Усі товари"}</strong><small>{category ? "Переглянути весь розділ" : "Переглянути весь каталог"}</small></span>
              <ArrowUpRight size={22} aria-hidden="true" />
            </button>

            {category ? subcategories.map((subcategory) => (
              <button key={subcategory.id} className="eg-category-tile" type="button" aria-pressed={selectedCategory === category.id && selectedSubcategory === subcategory.id} onClick={() => onSelectSubcategory(category.id, subcategory.id)}>
                <span><strong>{subcategory.name}</strong><small>{productCountLabel(counts.subcategories[`${category.id}:${subcategory.id}`] || 0)}</small></span>
                {selectedCategory === category.id && selectedSubcategory === subcategory.id ? <Check size={20} aria-hidden="true" /> : <ArrowUpRight size={20} aria-hidden="true" />}
              </button>
            )) : categories.map((item) => {
              const hasChildren = subcategoriesFor(item).length > 0;
              return (
                <button key={item.id} className="eg-category-tile" type="button" aria-pressed={selectedCategory === item.id} onClick={() => chooseCategory(item)}>
                  <span><strong>{item.name}</strong><small>{productCountLabel(counts.categories[item.id] || 0)}{hasChildren ? " · підкатегорії" : ""}</small></span>
                  {hasChildren ? <ChevronRight size={20} aria-hidden="true" /> : <ArrowUpRight size={20} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
        <footer className="eg-category-picker-footer">{category ? "Оберіть підкатегорію або перегляньте весь розділ." : "Категорії об’єднують товари всіх постачальників."}</footer>
      </div>
    </Modal>
  );
}
