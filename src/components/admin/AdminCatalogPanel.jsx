import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import AdminProductForm from "./AdminProductForm.jsx";
import AdminProductsPanel from "./AdminProductsPanel.jsx";
import AdminCategoriesPanel from "./AdminCategoriesPanel.jsx";

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function getVisibleCategories(categories) {
  return categories.filter((category) => {
    return category.id !== "all" && normalizeText(category.name) !== "усі товари";
  });
}

function getCategoryName(product, categories) {
  const category = categories.find((item) => item.id === product.category);
  return category?.name || "";
}

function getSubcategoryName(product, categories) {
  const category = categories.find((item) => item.id === product.category);

  const subcategory = category?.subcategories?.find((item) => {
    return item.id === product.subcategory;
  });

  return subcategory?.name || "";
}

function getProductsByCatalogFilter(products, filter) {
  if (filter.type === "category") {
    return products.filter((product) => product.category === filter.categoryId);
  }

  if (filter.type === "subcategory") {
    return products.filter((product) => {
      return (
        product.category === filter.categoryId &&
        product.subcategory === filter.subcategoryId
      );
    });
  }

  return products;
}

function getProductsBySearch(products, categories, query) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) return products;

  return products.filter((product) => {
    const searchableText = [
      product.name,
      product.brand,
      product.description,
      product.details,
      product.unit,
      product.packageInfo,
      product.price,
      getCategoryName(product, categories),
      getSubcategoryName(product, categories),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
}

function buildCategoryStats(categories, products) {
  return getVisibleCategories(categories).map((category) => {
    const categoryProducts = products.filter((product) => {
      return product.category === category.id;
    });

    const subcategories = (category.subcategories || []).map((subcategory) => {
      const subcategoryProducts = products.filter((product) => {
        return (
          product.category === category.id &&
          product.subcategory === subcategory.id
        );
      });

      return {
        ...subcategory,
        productsCount: subcategoryProducts.length,
        activeProductsCount: subcategoryProducts.filter(
          (product) => product.active !== false
        ).length,
      };
    });

    return {
      ...category,
      productsCount: categoryProducts.length,
      activeProductsCount: categoryProducts.filter(
        (product) => product.active !== false
      ).length,
      subcategories,
    };
  });
}

export default function AdminCatalogPanel({
  categories,
  products,

  draftProduct,
  setDraftProduct,
  addDraftProduct,

  startEditProduct,
  toggleProductActive,
  deleteProduct,

  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
}) {
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({});

  const [catalogFilter, setCatalogFilter] = useState({
    type: "all",
    categoryId: "",
    subcategoryId: "",
    label: "Усі товари",
  });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (showAddProductForm || showCategoryManager) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showAddProductForm, showCategoryManager]);

  const visibleCategories = useMemo(() => {
    return getVisibleCategories(categories);
  }, [categories]);

  const categoryStats = useMemo(() => {
    return buildCategoryStats(categories, products);
  }, [categories, products]);

  const visibleProducts = useMemo(() => {
    const filteredByTree = getProductsByCatalogFilter(products, catalogFilter);

    return getProductsBySearch(filteredByTree, categories, catalogQuery);
  }, [products, categories, catalogFilter, catalogQuery]);

  const activeProductsCount = products.filter(
    (product) => product.active !== false
  ).length;

  const hiddenProductsCount = products.length - activeProductsCount;

  const subcategoriesCount = visibleCategories.reduce((sum, category) => {
    return sum + Number(category.subcategories?.length || 0);
  }, 0);

  function toggleCategoryExpand(categoryId) {
    setExpandedCategories((current) => ({
      ...current,
      [categoryId]: !current[categoryId],
    }));
  }

  async function handleAddProduct() {
    await addDraftProduct();
    setShowAddProductForm(false);
  }

  return (
    <section className="eg-ambient space-y-6">
      <div className="eg-glass eg-premium-card overflow-hidden rounded-[2.5rem] p-6 lg:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="w-fit rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-800 shadow-sm backdrop-blur">
              Каталог
            </p>

            <h2 className="mt-4 text-4xl font-black leading-tight text-stone-950">
              Керування каталогом
            </h2>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600">
              Оберіть категорію зліва, щоб швидко переглянути повʼязані товари.
              Редагування категорій винесено в окремий режим, щоб сторінка не
              була перевантаженою.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setShowCategoryManager((current) => !current)}
              className={`eg-button rounded-[1.3rem] px-5 py-3 text-sm font-black backdrop-blur transition-all duration-300 ${
                showCategoryManager
                  ? "bg-stone-950 text-white shadow-lg shadow-stone-950/20"
                  : "border border-stone-300 bg-white/80 text-stone-900 hover:bg-white"
              }`}
            >
              {showCategoryManager
                ? "Сховати категорії"
                : "Керування категоріями"}
            </button>

            <button
              type="button"
              onClick={() => setShowAddProductForm(true)}
              className="eg-button rounded-[1.3rem] bg-emerald-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition-all duration-300 hover:-translate-y-[2px] hover:bg-emerald-800 hover:shadow-xl hover:shadow-emerald-900/30 active:translate-y-0"
            >
              Додати товар
            </button>
          </div>
        </div>

        <div className="eg-stagger mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="eg-card rounded-[1.8rem] bg-white/75 p-5 shadow-sm ring-1 ring-stone-100 backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/10">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
              Товарів
            </p>
            <p className="mt-2 text-2xl font-black text-stone-950">
              {products.length}
            </p>
          </div>

          <div className="eg-card rounded-[1.8rem] bg-white/75 p-5 shadow-sm ring-1 ring-stone-100 backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/10">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
              Активних
            </p>
            <p className="mt-2 text-2xl font-black text-emerald-900">
              {activeProductsCount}
            </p>
          </div>

          <div className="eg-card rounded-[1.8rem] bg-white/75 p-5 shadow-sm ring-1 ring-stone-100 backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/10">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
              Прихованих
            </p>
            <p className="mt-2 text-2xl font-black text-amber-800">
              {hiddenProductsCount}
            </p>
          </div>

          <div className="eg-card rounded-[1.8rem] bg-white/75 p-5 shadow-sm ring-1 ring-stone-100 backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/10">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
              Категорій / підкатегорій
            </p>
            <p className="mt-2 text-2xl font-black text-stone-950">
              {visibleCategories.length} / {subcategoriesCount}
            </p>
          </div>
        </div>

        <div className="mt-7">
          <label className="mb-2 block text-sm font-black text-stone-800">
            Пошук у вибраному розділі
          </label>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={catalogQuery}
              onChange={(event) => setCatalogQuery(event.target.value)}
              className="eg-field w-full rounded-[1.5rem] border border-stone-200 bg-white/85 px-5 py-4 outline-none backdrop-blur transition-all duration-300 focus:border-emerald-700 focus:bg-white focus:shadow-lg focus:shadow-emerald-900/10"
              placeholder="Пошук товарів, категорій, підкатегорій..."
            />

            {catalogQuery && (
              <button
                type="button"
                onClick={() => setCatalogQuery("")}
                className="eg-button rounded-[1.3rem] border border-stone-300 bg-white/80 px-5 py-3 text-sm font-black text-stone-900 hover:bg-white"
              >
                Очистити
              </button>
            )}
          </div>

          <p className="mt-3 text-sm text-stone-500">
            Поточний розділ:{" "}
            <span className="font-bold text-stone-800">
              {catalogFilter.label}
            </span>
            {" · "}
            показано товарів:{" "}
            <span className="font-bold text-stone-800">
              {visibleProducts.length}
            </span>
          </p>
        </div>
      </div>

{showCategoryManager &&
  createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 p-3 backdrop-blur-md"
      onClick={() => setShowCategoryManager(false)}
    >
      <div
        className="eg-glass flex h-[96dvh] w-[96vw] max-w-[1500px] flex-col overflow-hidden rounded-[1.6rem] bg-white/95 shadow-[0_30px_80px_rgba(0,0,0,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 border-b border-stone-200 bg-white/95 px-5 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                Каталог
              </p>

              <h2 className="mt-0.5 text-2xl font-black text-stone-950">
                Керування категоріями
              </h2>

              <p className="mt-1 text-xs leading-5 text-stone-500">
                Створення, перейменування, приховування та видалення категорій.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCategoryManager(false)}
              className="eg-icon-button flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-xl font-black text-stone-600 hover:bg-stone-200"
            >
              ×
            </button>
          </div>
        </div>

        <div className="modal-scrollbar min-h-0 flex-1 overflow-y-auto bg-stone-50/60 px-4 py-4 sm:px-5">
          <AdminCategoriesPanel
            categories={categories}
            createCategory={createCategory}
            updateCategory={updateCategory}
            deleteCategory={deleteCategory}
            createSubcategory={createSubcategory}
            updateSubcategory={updateSubcategory}
            deleteSubcategory={deleteSubcategory}
          />
        </div>
      </div>
    </div>,
    document.body
  )}

      <div className="grid gap-6 xl:grid-cols-[340px_1fr] xl:items-start">
        <aside className="eg-glass eg-premium-card sticky top-24 rounded-[2.5rem] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Навігація
              </p>

              <h3 className="mt-1 text-xl font-black text-stone-950">
                Категорії
              </h3>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <button
              type="button"
              onClick={() =>
                setCatalogFilter({
                  type: "all",
                  categoryId: "",
                  subcategoryId: "",
                  label: "Усі товари",
                })
              }
              className={`eg-button flex w-full items-center justify-between rounded-[1.3rem] px-4 py-3 text-left text-sm font-black ${
                catalogFilter.type === "all"
                  ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                  : "bg-white/75 text-stone-800 hover:bg-white"
              }`}
            >
              <span>Усі товари</span>
              <span>{products.length}</span>
            </button>

            {categoryStats.map((category) => {
              const isExpanded = Boolean(expandedCategories[category.id]);

              const isCategoryActive =
                catalogFilter.type === "category" &&
                catalogFilter.categoryId === category.id;

              const hasActiveSubcategory =
                catalogFilter.type === "subcategory" &&
                catalogFilter.categoryId === category.id;

              return (
                <div
                  key={category.id}
                  className="eg-card rounded-[1.8rem] border border-stone-200 bg-white/75 p-3 backdrop-blur transition-all duration-300 hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-900/10"
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCatalogFilter({
                          type: "category",
                          categoryId: category.id,
                          subcategoryId: "",
                          label: category.name,
                        })
                      }
                      className={`eg-button flex flex-1 items-center justify-between rounded-[1.2rem] px-4 py-3 text-left text-sm font-black transition-all duration-300 ${
                        isCategoryActive || hasActiveSubcategory
                          ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                          : "bg-stone-50/90 text-stone-900 hover:bg-emerald-50"
                      }`}
                    >
                      <span className="min-w-0 truncate">{category.name}</span>

                      <span
                        className={`ml-3 shrink-0 rounded-full px-2 py-1 text-xs ${
                          isCategoryActive || hasActiveSubcategory
                            ? "bg-white/20 text-white"
                            : "bg-stone-200 text-stone-700"
                        }`}
                      >
                        {category.productsCount}
                      </span>
                    </button>

                    {category.subcategories?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleCategoryExpand(category.id)}
                        className="eg-icon-button flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
                        title={isExpanded ? "Згорнути" : "Розгорнути"}
                      >
                        <span
                          className={`text-lg leading-none transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        >
                          ⌄
                        </span>
                      </button>
                    )}
                  </div>

                  {isExpanded && category.subcategories?.length > 0 && (
                    <div className="mt-3 border-t border-stone-200 pt-3">
                      <div className="space-y-2 pl-2">
                        {category.subcategories.map((subcategory) => {
                          const isSubcategoryActive =
                            catalogFilter.type === "subcategory" &&
                            catalogFilter.categoryId === category.id &&
                            catalogFilter.subcategoryId === subcategory.id;

                          return (
                            <button
                              key={subcategory.id}
                              type="button"
                              onClick={() =>
                                setCatalogFilter({
                                  type: "subcategory",
                                  categoryId: category.id,
                                  subcategoryId: subcategory.id,
                                  label: `${category.name} / ${subcategory.name}`,
                                })
                              }
                              className={`eg-button flex w-full items-center justify-between rounded-[1rem] px-3 py-2.5 text-left text-sm transition-all duration-300 ${
                                isSubcategoryActive
                                  ? "bg-emerald-50 font-black text-emerald-900"
                                  : "text-stone-600 hover:bg-stone-50"
                              }`}
                            >
                              <span className="min-w-0 truncate">
                                {subcategory.name}
                              </span>

                              <span className="ml-3 shrink-0 text-xs text-stone-400">
                                {subcategory.productsCount}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <div className="min-w-0 overflow-hidden">
          <AdminProductsPanel
            products={visibleProducts}
            categories={categories}
            startEditProduct={startEditProduct}
            toggleProductActive={toggleProductActive}
            deleteProduct={deleteProduct}
          />
        </div>
      </div>

{showAddProductForm &&
  createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 p-3 backdrop-blur-md"
      onClick={() => setShowAddProductForm(false)}
    >
      <div
        className="eg-glass flex h-[96dvh] w-[94vw] max-w-[1260px] flex-col overflow-hidden rounded-[1.6rem] bg-white/95 shadow-[0_30px_80px_rgba(0,0,0,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 border-b border-stone-200 bg-white/95 px-5 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                Новий товар
              </p>

              <h3 className="mt-0.5 text-2xl font-black text-stone-950">
                Додати товар
              </h3>

              <p className="mt-1 text-xs leading-5 text-stone-500">
                Заповніть основні дані товару. Після створення форма закриється.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddProductForm(false)}
              className="eg-icon-button flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-xl font-black text-stone-600 hover:bg-stone-200"
            >
              ×
            </button>
          </div>
        </div>

        <div className="modal-scrollbar min-h-0 flex-1 overflow-y-auto bg-stone-50/60 px-4 py-4 sm:px-5">
          <AdminProductForm
            categories={categories}
            draftProduct={draftProduct}
            setDraftProduct={setDraftProduct}
            addDraftProduct={handleAddProduct}
          />
        </div>
      </div>
    </div>,
    document.body
  )}
    </section>
  );
}