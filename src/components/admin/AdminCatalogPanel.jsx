import { useMemo, useRef, useState } from "react";
import Modal from "../Modal.jsx";

import AdminProductForm from "./AdminProductForm.jsx";
import AdminProductsPanel from "./AdminProductsPanel.jsx";
import AdminCategoriesPanel from "./AdminCategoriesPanel.jsx";
import {
  buildProductTemplateCsv,
  buildProductsCsv,
  downloadCsv,
  parseProductsCsv,
} from "../../utils/productCsv.js";

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

const VISIBILITY_FILTERS = [
  {
    id: "all",
    label: "Всі товари",
  },
  {
    id: "visible",
    label: "Видимі",
  },
  {
    id: "hidden",
    label: "Приховані",
  },
];

function getProductsByVisibility(products, visibilityFilter) {
  if (visibilityFilter === "visible") {
    return products.filter((product) => product.active !== false);
  }

  if (visibilityFilter === "hidden") {
    return products.filter((product) => product.active === false);
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
      product.supplier?.name,
      product.description,
      product.details,
      product.unit,
      product.packageInfo,
      product.price,
      getCategoryName(product, categories),
      getSubcategoryName(product, categories),
      product.active === false
        ? "приховано сховано не відображається"
        : "видимий активний",
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

function CsvImportDialog({ dialog, onClose, onPrimary }) {
  if (!dialog) return null;

  const toneClasses = {
    success: "bg-emerald-100 text-emerald-950 ring-emerald-200",
    warning: "bg-amber-100 text-amber-950 ring-amber-200",
    error: "bg-red-100 text-red-950 ring-red-200",
  };

  const iconByTone = {
    success: "✓",
    warning: "!",
    error: "×",
  };

  return <Modal label={dialog.title} maxWidth={576} onClose={onClose}>
      <div
        className="eg-dialog-surface eg-glass eg-premium-card w-full max-w-xl overflow-hidden rounded-[2rem] bg-white/95 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-black ring-1 ${
              toneClasses[dialog.tone || "success"]
            }`}
          >
            {iconByTone[dialog.tone || "success"]}
          </span>

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Імпорт CSV
            </p>

            <h3 className="mt-2 text-2xl font-black leading-tight text-stone-950">
              {dialog.title}
            </h3>

            {dialog.message && (
              <p className="mt-3 text-sm leading-6 text-stone-600">
                {dialog.message}
              </p>
            )}
          </div>
        </div>

        {dialog.details?.length > 0 && (
          <div className="modal-scrollbar mt-5 max-h-52 overflow-y-auto rounded-[1.4rem] bg-stone-50 p-4 ring-1 ring-stone-100">
            <div className="space-y-2">
              {dialog.details.map((detail, index) => (
                <p
                  key={`${detail.rowNumber || "row"}-${index}`}
                  className="text-sm leading-5 text-stone-700"
                >
                  <span className="font-black text-stone-950">
                    Рядок {detail.rowNumber || "?"}:
                  </span>{" "}
                  {detail.message}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {dialog.secondaryLabel && (
            <button
              type="button"
              onClick={onClose}
              className="eg-button rounded-[1.2rem] border border-stone-300 bg-white px-5 py-3 text-sm font-black text-stone-800 hover:bg-stone-50"
            >
              {dialog.secondaryLabel}
            </button>
          )}

          <button
            type="button"
            onClick={onPrimary}
            className="eg-button eg-sweep rounded-[1.2rem] bg-emerald-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-800"
          >
            {dialog.primaryLabel || "Готово"}
          </button>
        </div>
      </div>
    </Modal>;
}

export default function AdminCatalogPanel({
  categories,
  products,
  suppliers = [],

  draftProduct,
  setDraftProduct,
  addDraftProduct,
  importProductsCsv,

  startEditProduct,
  toggleProductActive,
  deleteProduct,

  createCategory,
  updateCategory,
  applyCategoryMarkup,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
}) {
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [importStatus, setImportStatus] = useState({
    isLoading: false,
    message: "",
  });
  const [importDialog, setImportDialog] = useState(null);
  const [pendingImport, setPendingImport] = useState(null);
  const importInputRef = useRef(null);

  const [catalogFilter, setCatalogFilter] = useState({
    type: "all",
    categoryId: "",
    subcategoryId: "",
    label: "Усі товари",
  });



  const categoryStats = useMemo(() => {
    return buildCategoryStats(categories, products);
  }, [categories, products]);

  const catalogScopeProducts = useMemo(() => {
    return getProductsByCatalogFilter(products, catalogFilter);
  }, [products, catalogFilter]);

  const searchedProducts = useMemo(() => {
    return getProductsBySearch(catalogScopeProducts, categories, catalogQuery);
  }, [catalogScopeProducts, categories, catalogQuery]);

  const visibilityCounts = useMemo(() => {
    return {
      all: searchedProducts.length,
      visible: searchedProducts.filter((product) => product.active !== false)
        .length,
      hidden: searchedProducts.filter((product) => product.active === false)
        .length,
    };
  }, [searchedProducts]);

  const visibleProducts = useMemo(() => {
    return getProductsByVisibility(searchedProducts, visibilityFilter);
  }, [searchedProducts, visibilityFilter]);

  async function handleAddProduct() {
    await addDraftProduct();
    setShowAddProductForm(false);
  }

  function handleExportProducts() {
    downloadCsv("evergreen-products.csv", buildProductsCsv(products, categories));
  }

  function handleDownloadTemplate() {
    downloadCsv("evergreen-products-template.csv", buildProductTemplateCsv());
  }

  function getImportMessage(summary, clientErrorsCount = 0) {
    const created = Number(summary?.created || 0);
    const updated = Number(summary?.updated || 0);
    const skipped = Number(summary?.skipped || 0) + clientErrorsCount;

    return `Імпорт завершено: створено ${created}, оновлено ${updated}, пропущено ${skipped}.`;
  }

  function showImportDialog(nextDialog) {
    setImportDialog({
      tone: "success",
      primaryLabel: "Готово",
      ...nextDialog,
    });
  }

  function closeImportDialog() {
    setImportDialog(null);
    setPendingImport(null);
  }

  async function runProductsImport(productsToImport, clientErrorsCount = 0) {
    setImportStatus({
      isLoading: true,
      message: `Імпортуємо товари: ${productsToImport.length}...`,
    });

    try {
      const result = await importProductsCsv(productsToImport);
      const summary = result?.summary || {};
      const message = getImportMessage(summary, clientErrorsCount);
      const serverErrors = summary.errors || [];

      setImportStatus({
        isLoading: false,
        message:
          serverErrors.length > 0
            ? `${message} Помилок сервера: ${serverErrors.length}.`
            : message,
      });

      showImportDialog({
        tone: serverErrors.length > 0 ? "warning" : "success",
        title:
          serverErrors.length > 0
            ? "Імпорт завершено з помилками"
            : "Імпорт завершено",
        message:
          serverErrors.length > 0
            ? `${message} Нижче перші рядки, які не вдалося імпортувати.`
            : message,
        details: serverErrors.slice(0, 8),
        primaryLabel: "Готово",
      });
    } catch (error) {
      const message = error.message || "Не вдалося імпортувати CSV.";

      setImportStatus({
        isLoading: false,
        message,
      });

      showImportDialog({
        tone: "error",
        title: "Не вдалося імпортувати CSV",
        message,
        primaryLabel: "Зрозуміло",
      });
    }
  }

  async function handleImportDialogPrimary() {
    if (importDialog?.action === "continue-import" && pendingImport) {
      const nextImport = pendingImport;

      setImportDialog(null);
      setPendingImport(null);
      await runProductsImport(nextImport.products, nextImport.errorsCount);
      return;
    }

    closeImportDialog();
  }

  async function handleImportProductsFile(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    setImportStatus({
      isLoading: true,
      message: `Читаємо файл “${file.name}”...`,
    });

    try {
      const text = await file.text();
      const parsed = parseProductsCsv(text);

      if (!parsed.products.length) {
        const message =
          parsed.errors[0]?.message || "У CSV не знайдено товарів для імпорту.";

        setImportStatus({
          isLoading: false,
          message,
        });

        showImportDialog({
          tone: "error",
          title: "Файл не готовий до імпорту",
          message:
            "Перевірте, що файл має рядок із заголовками та хоча б один рядок товару. Порожній шаблон CSV потрібно спочатку заповнити.",
          details: parsed.errors,
          primaryLabel: "Зрозуміло",
        });
        return;
      }

      if (parsed.errors.length > 0) {
        setImportStatus({
          isLoading: false,
          message: `Знайдено ${parsed.products.length} коректних товарів і ${parsed.errors.length} рядків з помилками.`,
        });

        setPendingImport({
          products: parsed.products,
          errorsCount: parsed.errors.length,
        });

        showImportDialog({
          tone: "warning",
          title: "У файлі є рядки з помилками",
          message: `Можна імпортувати ${parsed.products.length} коректних товарів, а проблемні рядки пропустити.`,
          details: parsed.errors.slice(0, 8),
          primaryLabel: "Імпортувати коректні",
          secondaryLabel: "Скасувати",
          action: "continue-import",
        });
        return;
      }

      await runProductsImport(parsed.products, 0);
    } catch (error) {
      const message = error.message || "Не вдалося імпортувати CSV.";

      setImportStatus({
        isLoading: false,
        message,
      });
      showImportDialog({
        tone: "error",
        title: "Не вдалося імпортувати CSV",
        message,
        primaryLabel: "Зрозуміло",
      });
    }
  }

  return (
    <section className="eg-admin-page eg-admin-catalog eg-ambient space-y-6">
      <div className="eg-glass eg-premium-card overflow-hidden rounded-[2.5rem] p-6 lg:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="eg-admin-panel-title">
              Каталог
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600">
              Знаходьте товари, оновлюйте ціни та керуйте видимістю в магазині.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
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

            <details className="eg-admin-csv">
              <summary>Імпорт / експорт CSV</summary>
              <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="eg-button rounded-[1.3rem] border border-stone-300 bg-white/80 px-5 py-3 text-sm font-black text-stone-900 backdrop-blur hover:bg-white"
            >
              Шаблон CSV
            </button>

            <button
              type="button"
              onClick={handleExportProducts}
              className="eg-button rounded-[1.3rem] border border-stone-300 bg-white/80 px-5 py-3 text-sm font-black text-stone-900 backdrop-blur hover:bg-white"
            >
              Експорт CSV
            </button>

            <input
              ref={importInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleImportProductsFile}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              disabled={importStatus.isLoading}
              className="eg-button rounded-[1.3rem] border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-950 backdrop-blur hover:bg-emerald-100 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
            >
              {importStatus.isLoading ? "Імпортуємо..." : "Імпорт CSV"}
            </button>

              </div>
              <p className="mt-3 text-xs leading-5 text-stone-600">
                Для нових товарів використовуйте шаблон без id. Для оновлення — експортований файл з id.
              </p>
            </details>
            <button
              type="button"
              onClick={() => setShowAddProductForm(true)}
              className="eg-button rounded-[1.3rem] bg-emerald-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition-all duration-300 hover:-translate-y-[2px] hover:bg-emerald-800 hover:shadow-xl hover:shadow-emerald-900/30 active:translate-y-0"
            >
              Додати товар
            </button>
          </div>
        </div>

        {importStatus.message && (
          <div className="mt-5 rounded-[1.3rem] bg-white/75 px-4 py-3 text-sm font-semibold text-stone-700 ring-1 ring-stone-100">
            {importStatus.message}
          </div>
        )}


        <div className="eg-catalog-filters">
          <label className="eg-admin-label eg-catalog-search">Пошук товарів
            <input className="eg-field" value={catalogQuery} onChange={event => setCatalogQuery(event.target.value)} placeholder="Назва, бренд, постачальник…" />
          </label>
          <label className="eg-admin-label">Категорія
            <select className="eg-field" value={catalogFilter.categoryId} onChange={event => {
              const category = categoryStats.find(item => item.id === event.target.value);
              setCatalogFilter({ type: category ? "category" : "all", categoryId: category?.id || "", subcategoryId: "", label: category?.name || "Усі товари" });
            }}>
              <option value="">Усі категорії · {products.length}</option>
              {categoryStats.map(category => <option key={category.id} value={category.id}>{category.name} · {category.productsCount}</option>)}
            </select>
          </label>
          {catalogFilter.categoryId && <label className="eg-admin-label">Підкатегорія
            <select className="eg-field" value={catalogFilter.subcategoryId} onChange={event => {
              const category = categoryStats.find(item => item.id === catalogFilter.categoryId);
              const subcategory = category?.subcategories?.find(item => item.id === event.target.value);
              setCatalogFilter({ type: subcategory ? "subcategory" : "category", categoryId: category.id, subcategoryId: subcategory?.id || "", label: subcategory ? category.name + " / " + subcategory.name : category.name });
            }}>
              <option value="">Усі підкатегорії</option>
              {categoryStats.find(item => item.id === catalogFilter.categoryId)?.subcategories?.map(item => <option key={item.id} value={item.id}>{item.name} · {item.productsCount}</option>)}
            </select>
          </label>}
        </div>
        <div className="eg-catalog-filter-footer">
          <div className="eg-admin-filter-tabs" aria-label="Видимість товарів">
            {VISIBILITY_FILTERS.map(item => <button type="button" key={item.id} aria-pressed={visibilityFilter === item.id} onClick={() => setVisibilityFilter(item.id)}>{item.label} <span>{visibilityCounts[item.id] || 0}</span></button>)}
          </div>
          {(catalogQuery || catalogFilter.type !== "all" || visibilityFilter !== "all") && <button className="eg-button eg-admin-reset" type="button" onClick={() => { setCatalogQuery(""); setVisibilityFilter("all"); setCatalogFilter({ type: "all", categoryId: "", subcategoryId: "", label: "Усі товари" }); }}>Скинути фільтри</button>}
        </div>
        <p className="eg-admin-caption">{catalogFilter.label} · Знайдено {visibleProducts.length}. Приховані та недоступні товари залишаються тут для керування.</p>
      </div>

{showCategoryManager &&
  <Modal label="Категорії та підкатегорії" maxWidth={1260} onClose={() => setShowCategoryManager(false)}>
      <div
        className="eg-dialog-surface eg-glass flex h-[96dvh] w-[96vw] max-w-[1500px] flex-col overflow-hidden rounded-[1.6rem] bg-white/95 shadow-[0_30px_80px_rgba(0,0,0,0.22)]"
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
              aria-label="Закрити вікно"
              className="eg-icon-button flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-xl font-black text-stone-600 hover:bg-stone-200"
            >
              ×
            </button>
          </div>
        </div>

        <div className="modal-scrollbar min-h-0 flex-1 overflow-y-auto bg-stone-50/60 px-4 py-4 sm:px-5">
          <AdminCategoriesPanel
            categories={categories}
            products={products}
            createCategory={createCategory}
            updateCategory={updateCategory}
            applyCategoryMarkup={applyCategoryMarkup}
            deleteCategory={deleteCategory}
            createSubcategory={createSubcategory}
            updateSubcategory={updateSubcategory}
            deleteSubcategory={deleteSubcategory}
          />
        </div>
      </div>
    </Modal>}

      <AdminProductsPanel
        key={catalogQuery + "|" + catalogFilter.type + "|" + catalogFilter.categoryId + "|" + catalogFilter.subcategoryId + "|" + visibilityFilter}
        showSearch={false} products={visibleProducts} categories={categories}
        startEditProduct={startEditProduct} toggleProductActive={toggleProductActive} deleteProduct={deleteProduct}
      />

{showAddProductForm &&
  <Modal label="Додати товар" maxWidth={1260} onClose={() => setShowAddProductForm(false)}>
      <div
        className="eg-dialog-surface eg-glass flex h-[96dvh] w-[94vw] max-w-[1260px] flex-col overflow-hidden rounded-[1.6rem] bg-white/95 shadow-[0_30px_80px_rgba(0,0,0,0.22)]"
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
              aria-label="Закрити вікно"
              className="eg-icon-button flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-xl font-black text-stone-600 hover:bg-stone-200"
            >
              ×
            </button>
          </div>
        </div>

        <div className="modal-scrollbar min-h-0 flex-1 overflow-y-auto bg-stone-50/60 px-4 py-4 sm:px-5">
          <AdminProductForm
            categories={categories}
            suppliers={suppliers}
            draftProduct={draftProduct}
            setDraftProduct={setDraftProduct}
            addDraftProduct={handleAddProduct}
          />
        </div>
      </div>
    </Modal>}

      <CsvImportDialog
        dialog={importDialog}
        onClose={closeImportDialog}
        onPrimary={handleImportDialogPrimary}
      />
    </section>
  );
}
