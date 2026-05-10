import { useEffect, useMemo, useState } from "react";

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

    if (showAddProductForm) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showAddProductForm]);

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
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Каталог
            </p>

            <h2 className="mt-2 text-3xl font-black text-stone-950">
              Керування каталогом
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-500">
              Оберіть категорію зліва, щоб швидко переглянути повʼязані товари.
              Редагування категорій винесено в окремий режим, щоб сторінка не
              була перевантаженою.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setShowCategoryManager((current) => !current)}
              className={`rounded-2xl px-5 py-3 text-sm font-black transition ${
                showCategoryManager
                  ? "bg-stone-950 text-white"
                  : "border border-stone-300 bg-white text-stone-900 hover:bg-stone-100"
              }`}
            >
              {showCategoryManager
                ? "Сховати категорії"
                : "Керування категоріями"}
            </button>

            <button
              type="button"
              onClick={() => setShowAddProductForm(true)}
              className="rounded-2xl bg-emerald-900 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
            >
              Додати товар
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-3xl bg-stone-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
              Товарів
            </p>
            <p className="mt-2 text-2xl font-black text-stone-950">
              {products.length}
            </p>
          </div>

          <div className="rounded-3xl bg-stone-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
              Активних
            </p>
            <p className="mt-2 text-2xl font-black text-emerald-900">
              {activeProductsCount}
            </p>
          </div>

          <div className="rounded-3xl bg-stone-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
              Прихованих
            </p>
            <p className="mt-2 text-2xl font-black text-stone-950">
              {hiddenProductsCount}
            </p>
          </div>

          <div className="rounded-3xl bg-stone-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
              Категорій / підкатегорій
            </p>
            <p className="mt-2 text-2xl font-black text-stone-950">
              {visibleCategories.length} / {subcategoriesCount}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-black text-stone-800">
            Пошук у вибраному розділі
          </label>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={catalogQuery}
              onChange={(event) => setCatalogQuery(event.target.value)}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-4 outline-none transition focus:border-emerald-700"
              placeholder="Пошук товарів, категорій, підкатегорій..."
            />

            {catalogQuery && (
              <button
                type="button"
                onClick={() => setCatalogQuery("")}
                className="rounded-2xl border border-stone-300 bg-white px-5 py-3 text-sm font-black text-stone-900 hover:bg-stone-100"
              >
                Очистити
              </button>
            )}
          </div>

          <p className="mt-2 text-sm text-stone-500">
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

{showCategoryManager && (
  <div className="fixed inset-0 z-[70] bg-black/45 p-4 backdrop-blur-[2px] sm:p-6">
    <div className="flex min-h-full items-start justify-center sm:items-center">
      <div className="flex w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-6 py-5 sm:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Каталог
            </p>

            <h2 className="mt-1 text-3xl font-black text-stone-950">
              Керування категоріями
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
              Тут можна створювати, перейменовувати, приховувати, повертати та
              видаляти категорії й підкатегорії.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCategoryManager(false)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-xl font-black text-stone-600 transition hover:bg-stone-200"
          >
            ×
          </button>
        </div>

      <div className="modal-scrollbar max-h-[85vh] overflow-y-auto px-6 py-6 sm:px-8">
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
    </div>
  </div>
)}

      <div className="grid gap-6 xl:grid-cols-[340px_1fr] xl:items-start">
        <aside className="rounded-[2rem] bg-white p-5 shadow-sm">
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
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
                catalogFilter.type === "all"
                  ? "bg-emerald-900 text-white"
                  : "bg-stone-50 text-stone-800 hover:bg-stone-100"
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
                  className="rounded-3xl border border-stone-200 bg-white p-3"
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
                      className={`flex flex-1 items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-black transition ${
                        isCategoryActive || hasActiveSubcategory
                          ? "bg-emerald-900 text-white"
                          : "bg-stone-50 text-stone-900 hover:bg-stone-100"
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
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
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
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
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

        <div className="min-w-0">
          <AdminProductsPanel
            products={visibleProducts}
            categories={categories}
            startEditProduct={startEditProduct}
            toggleProductActive={toggleProductActive}
            deleteProduct={deleteProduct}
          />
        </div>
      </div>

      {showAddProductForm && (
        <div
          className="fixed inset-0 z-50 bg-black/40 p-4 sm:p-6"
          onClick={() => setShowAddProductForm(false)}
        >
          <div
            className="mx-auto max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  Новий товар
                </p>

                <h3 className="mt-1 text-2xl font-black text-stone-950">
                  Додати товар
                </h3>

                <p className="mt-2 text-sm text-stone-500">
                  Заповніть основні дані товару. Після створення форма
                  автоматично закриється.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddProductForm(false)}
                className="rounded-2xl border border-stone-300 px-4 py-2 font-bold text-stone-700 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <AdminProductForm
              categories={categories}
              draftProduct={draftProduct}
              setDraftProduct={setDraftProduct}
              addDraftProduct={handleAddProduct}
            />
          </div>
        </div>
      )}
    </section>
  );
}