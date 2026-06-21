import { useEffect, useMemo, useState } from "react";
import AdminMessageModal from "./AdminMessageModal.jsx";

function StatCard({ label, value, tone = "stone" }) {
  const valueClass = tone === "amber" ? "text-amber-800" : "text-stone-950";

  return (
    <div className="rounded-2xl bg-white/85 px-4 py-3 ring-1 ring-stone-100">
      <p className="text-[11px] font-black uppercase tracking-wide text-stone-400">
        {label}
      </p>

      <p className={`mt-0.5 text-xl font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

function ActionButton({ children, tone = "stone", onClick }) {
  const className =
    tone === "red"
      ? "bg-red-50 text-red-800 ring-1 ring-red-200 hover:bg-red-100"
      : tone === "emerald"
        ? "bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
        : "bg-stone-100 text-stone-900 hover:bg-stone-200";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`eg-button rounded-xl px-3 py-2 text-xs font-black ${className}`}
    >
      {children}
    </button>
  );
}

function getInputClass(extra = "") {
  return `eg-field w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-700 ${extra}`;
}

function parseMarkupPercent(value) {
  const normalizedValue = String(value ?? "").trim().replace(",", ".");

  if (!normalizedValue) return null;

  const number = Number(normalizedValue);

  return Number.isFinite(number) && number >= 0 ? number : null;
}

function formatMarkupPercent(value) {
  if (!Number.isFinite(value)) return "";

  return value.toFixed(2).replace(/\.?0+$/, "");
}

export default function AdminCategoriesPanel({
  categories,
  products = [],
  createCategory,
  updateCategory,
  applyCategoryMarkup,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
}) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [subcategoryDrafts, setSubcategoryDrafts] = useState({});
  const [categoryNameDrafts, setCategoryNameDrafts] = useState({});
  const [subcategoryNameDrafts, setSubcategoryNameDrafts] = useState({});
  const [categoryMarkupDrafts, setCategoryMarkupDrafts] = useState({});
  const [modal, setModal] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const categoryList = useMemo(() => {
    return Array.isArray(categories)
      ? categories.filter((category) => category.id !== "all")
      : [];
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return categoryList;

    return categoryList
      .map((category) => {
        const categoryName = String(category.name || "").toLowerCase();

        const subcategories = Array.isArray(category.subcategories)
          ? category.subcategories
          : [];

        const matchedSubcategories = subcategories.filter((subcategory) => {
          return String(subcategory.name || "").toLowerCase().includes(query);
        });

        const categoryMatches = categoryName.includes(query);

        if (categoryMatches) {
          return category;
        }

        if (matchedSubcategories.length > 0) {
          return {
            ...category,
            subcategories: matchedSubcategories,
          };
        }

        return null;
      })
      .filter(Boolean);
  }, [categoryList, searchQuery]);

  const productStatsByCategory = useMemo(() => {
    const stats = {};

    (Array.isArray(products) ? products : []).forEach((product) => {
      const categoryId = product.category;

      if (!categoryId) return;

      if (!stats[categoryId]) {
        stats[categoryId] = {
          total: 0,
          withCostPrice: 0,
          withoutCostPrice: 0,
        };
      }

      stats[categoryId].total += 1;

      if (Number(product.costPrice || 0) > 0) {
        stats[categoryId].withCostPrice += 1;
      } else {
        stats[categoryId].withoutCostPrice += 1;
      }
    });

    return stats;
  }, [products]);

  const hiddenCategoriesCount = categoryList.filter((category) => {
    return category.active === false;
  }).length;

  const subcategoriesCount = categoryList.reduce((sum, category) => {
    return sum + Number(category.subcategories?.length || 0);
  }, 0);

  const hiddenSubcategoriesCount = categoryList.reduce((sum, category) => {
    const hiddenCount = (category.subcategories || []).filter((subcategory) => {
      return subcategory.active === false;
    }).length;

    return sum + hiddenCount;
  }, 0);

  useEffect(() => {
    const nextCategoryDrafts = {};
    const nextSubcategoryDrafts = {};

    categoryList.forEach((category) => {
      nextCategoryDrafts[category.id] = category.name || "";

      (category.subcategories || []).forEach((subcategory) => {
        nextSubcategoryDrafts[subcategory.id] = subcategory.name || "";
      });
    });

    setCategoryNameDrafts(nextCategoryDrafts);
    setSubcategoryNameDrafts(nextSubcategoryDrafts);
  }, [categoryList]);

  useEffect(() => {
    setCategoryMarkupDrafts((current) => {
      const nextDrafts = {};

      categoryList.forEach((category) => {
        nextDrafts[category.id] = current[category.id] || "";
      });

      return nextDrafts;
    });
  }, [categoryList]);

  function showError(title, message) {
    setModal({
      type: "error",
      title,
      message,
      confirmLabel: "Зрозуміло",
      showCancel: false,
      onConfirm: () => setModal(null),
    });
  }

  function showSuccess(title, message) {
    setModal({
      type: "success",
      title,
      message,
      confirmLabel: "Готово",
      showCancel: false,
      onConfirm: () => setModal(null),
    });
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim();

    if (!name) {
      showError("Назва порожня", "Введіть назву категорії.");
      return;
    }

    try {
      await createCategory(name);
      setNewCategoryName("");
    } catch (error) {
      showError(
        "Не вдалося створити категорію",
        error?.message || "Спробуйте ще раз."
      );
    }
  }

  async function handleRenameCategory(category) {
    const name = String(categoryNameDrafts[category.id] || "").trim();

    if (!name) {
      setCategoryNameDrafts((current) => ({
        ...current,
        [category.id]: category.name || "",
      }));

      showError("Назва порожня", "Категорія не може бути без назви.");
      return;
    }

    if (name === category.name) return;

    try {
      await updateCategory(category.id, { name });
    } catch (error) {
      setCategoryNameDrafts((current) => ({
        ...current,
        [category.id]: category.name || "",
      }));

      showError(
        "Не вдалося перейменувати категорію",
        error?.message || "Спробуйте ще раз."
      );
    }
  }

  async function handleToggleCategory(category) {
    try {
      await updateCategory(category.id, {
        active: category.active === false,
      });
    } catch (error) {
      showError(
        "Не вдалося змінити видимість категорії",
        error?.message || "Спробуйте ще раз."
      );
    }
  }

  function askApplyCategoryMarkup(category) {
    const markupPercent = parseMarkupPercent(
      categoryMarkupDrafts[category.id]
    );
    const stats = productStatsByCategory[category.id] || {
      total: 0,
      withCostPrice: 0,
      withoutCostPrice: 0,
    };

    if (!applyCategoryMarkup) {
      showError(
        "Дія недоступна",
        "Не вдалося підготувати масове оновлення цін для категорії."
      );
      return;
    }

    if (markupPercent === null) {
      showError(
        "Некоректна націнка",
        "Вкажіть відсоток націнки числом, наприклад 30 або 45.5."
      );
      return;
    }

    if (stats.total === 0) {
      showError(
        "У категорії немає товарів",
        "Спочатку додайте товари до цієї категорії."
      );
      return;
    }

    if (stats.withCostPrice === 0) {
      showError(
        "Немає товарів із собівартістю",
        "Націнку можна застосувати тільки до товарів, де заповнена собівартість."
      );
      return;
    }

    const percentLabel = formatMarkupPercent(markupPercent);
    const skippedText = stats.withoutCostPrice
      ? `\nБез собівартості буде пропущено: ${stats.withoutCostPrice}.`
      : "";

    setModal({
      type: "warning",
      title: "Застосувати націнку до категорії?",
      message:
        `Категорія: ${category.name}\n` +
        `Ціна продажу буде перерахована як собівартість + ${percentLabel}%.\n` +
        `Буде оновлено товарів: ${stats.withCostPrice}.${skippedText}\n\n` +
        "Поточні ціни продажу цих товарів буде перезаписано.",
      confirmLabel: "Застосувати",
      cancelLabel: "Скасувати",
      showCancel: true,
      onConfirm: async () => {
        try {
          setIsModalLoading(true);

          const result = await applyCategoryMarkup(
            category.id,
            markupPercent
          );

          setCategoryMarkupDrafts((current) => ({
            ...current,
            [category.id]: "",
          }));

          showSuccess(
            "Націнку застосовано",
            `Оновлено товарів: ${result.updated || 0}.\n` +
              `Пропущено без собівартості: ${
                result.skippedWithoutCostPrice || 0
              }.`
          );
        } catch (error) {
          setModal({
            type: "error",
            title: "Не вдалося застосувати націнку",
            message: error?.message || "Спробуйте ще раз.",
            confirmLabel: "Зрозуміло",
            showCancel: false,
            onConfirm: () => setModal(null),
          });
        } finally {
          setIsModalLoading(false);
        }
      },
    });
  }

  async function handleCreateSubcategory(categoryId) {
    const name = String(subcategoryDrafts[categoryId] || "").trim();

    if (!name) {
      showError("Назва порожня", "Введіть назву підкатегорії.");
      return;
    }

    try {
      await createSubcategory(categoryId, name);

      setSubcategoryDrafts((current) => ({
        ...current,
        [categoryId]: "",
      }));
    } catch (error) {
      showError(
        "Не вдалося створити підкатегорію",
        error?.message || "Спробуйте ще раз."
      );
    }
  }

  async function handleRenameSubcategory(category, subcategory) {
    const name = String(subcategoryNameDrafts[subcategory.id] || "").trim();

    if (!name) {
      setSubcategoryNameDrafts((current) => ({
        ...current,
        [subcategory.id]: subcategory.name || "",
      }));

      showError("Назва порожня", "Підкатегорія не може бути без назви.");
      return;
    }

    if (name === subcategory.name) return;

    try {
      await updateSubcategory(category.id, subcategory.id, { name });
    } catch (error) {
      setSubcategoryNameDrafts((current) => ({
        ...current,
        [subcategory.id]: subcategory.name || "",
      }));

      showError(
        "Не вдалося перейменувати підкатегорію",
        error?.message || "Спробуйте ще раз."
      );
    }
  }

  async function handleToggleSubcategory(category, subcategory) {
    try {
      await updateSubcategory(category.id, subcategory.id, {
        active: subcategory.active === false,
      });
    } catch (error) {
      showError(
        "Не вдалося змінити видимість підкатегорії",
        error?.message || "Спробуйте ще раз."
      );
    }
  }

  function getDeleteErrorMessage(error, entityName) {
    const message =
      error?.data?.error ||
      error?.message ||
      `Не вдалося видалити ${entityName}.`;

    if (
      error?.status === 409 ||
      message.includes("used by") ||
      message.includes("використовується товарами") ||
      message.includes("в ній є товари")
    ) {
      return entityName === "категорію"
        ? "Цю категорію не можна видалити, бо в ній є товари. Спочатку перенесіть товари в іншу категорію або просто приховайте категорію."
        : "Цю підкатегорію не можна видалити, бо вона використовується товарами. Спочатку перенесіть товари в іншу підкатегорію або просто приховайте її.";
    }

    return message;
  }

  function askDeleteCategory(category) {
    setModal({
      type: "warning",
      title: "Видалити категорію?",
      message: `Категорія “${category.name}” буде видалена назавжди. Якщо в ній є товари, сайт не дозволить її видалити.`,
      confirmLabel: "Видалити",
      cancelLabel: "Скасувати",
      showCancel: true,
      onConfirm: async () => {
        try {
          setIsModalLoading(true);

          await deleteCategory(category.id);

          setModal(null);
        } catch (error) {
          setModal({
            type: "error",
            title: "Не вдалося видалити категорію",
            message: getDeleteErrorMessage(error, "категорію"),
            confirmLabel: "Зрозуміло",
            showCancel: false,
            onConfirm: () => setModal(null),
          });
        } finally {
          setIsModalLoading(false);
        }
      },
    });
  }

  function askDeleteSubcategory(category, subcategory) {
    setModal({
      type: "warning",
      title: "Видалити підкатегорію?",
      message: `Підкатегорія “${subcategory.name}” буде видалена назавжди. Якщо вона використовується товарами, сайт не дозволить її видалити.`,
      confirmLabel: "Видалити",
      cancelLabel: "Скасувати",
      showCancel: true,
      onConfirm: async () => {
        try {
          setIsModalLoading(true);

          await deleteSubcategory(category.id, subcategory.id);

          setModal(null);
        } catch (error) {
          setModal({
            type: "error",
            title: "Не вдалося видалити підкатегорію",
            message: getDeleteErrorMessage(error, "підкатегорію"),
            confirmLabel: "Зрозуміло",
            showCancel: false,
            onConfirm: () => setModal(null),
          });
        } finally {
          setIsModalLoading(false);
        }
      },
    });
  }

  return (
    <section className="space-y-4">
      <div className="rounded-[1.5rem] bg-white/85 p-4 ring-1 ring-stone-100">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
              Каталог
            </p>

            <h2 className="mt-0.5 text-2xl font-black text-stone-950">
              Категорії та підкатегорії
            </h2>

            <p className="mt-1 text-xs leading-5 text-stone-500">
              Створюйте, редагуйте, приховуйте та повертайте категорії каталогу.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[520px]">
            <StatCard label="Категорій" value={categoryList.length} />
            <StatCard label="Підкатегорій" value={subcategoriesCount} />
            <StatCard
              label="Прих. категорій"
              value={hiddenCategoriesCount}
              tone="amber"
            />
            <StatCard
              label="Прих. підкатегорій"
              value={hiddenSubcategoriesCount}
              tone="amber"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_auto]">
          <input
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleCreateCategory();
              }
            }}
            placeholder="Нова категорія"
            className={getInputClass()}
          />

          <button
            type="button"
            onClick={handleCreateCategory}
            className="eg-button rounded-xl bg-emerald-900 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-800"
          >
            Додати категорію
          </button>
        </div>

        <div className="mt-2 grid gap-2 lg:grid-cols-[1fr_auto]">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Пошук категорій і підкатегорій..."
            className={getInputClass()}
          />

          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="eg-button rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-black text-stone-800 hover:bg-stone-100"
            >
              Очистити
            </button>
          ) : (
            <div className="hidden lg:block" />
          )}
        </div>

        <p className="mt-2 text-xs text-stone-500">
          Показано категорій:{" "}
          <span className="font-black text-stone-800">
            {filteredCategories.length}
          </span>
        </p>
      </div>

      <div className="space-y-3">
        {filteredCategories.length === 0 && (
          <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-white/70 p-6 text-center">
            <p className="font-black text-stone-900">Категорії не знайдено</p>

            <p className="mt-1 text-sm text-stone-500">
              Спробуйте змінити пошуковий запит або очистити пошук.
            </p>
          </div>
        )}

        {filteredCategories.map((category) => {
          const isCategoryHidden = category.active === false;
          const subcategories = category.subcategories || [];
          const productStats = productStatsByCategory[category.id] || {
            total: 0,
            withCostPrice: 0,
            withoutCostPrice: 0,
          };
          const markupDraft = categoryMarkupDrafts[category.id] || "";
          const markupPercent = parseMarkupPercent(markupDraft);
          const canApplyMarkup =
            Boolean(applyCategoryMarkup) &&
            markupPercent !== null &&
            productStats.withCostPrice > 0;

          return (
            <div
              key={category.id}
              className={`rounded-[1.5rem] border p-3 ${
                isCategoryHidden
                  ? "border-amber-200 bg-amber-50/70"
                  : "border-stone-200 bg-white/85"
              }`}
            >
              <div className="grid gap-2 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-black uppercase tracking-wide text-stone-500">
                      Категорія
                    </p>

                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-black text-stone-600">
                      {subcategories.length} підкат.
                    </span>

                    {isCategoryHidden && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-900">
                        Приховано
                      </span>
                    )}
                  </div>

                  <input
                    value={categoryNameDrafts[category.id] ?? category.name}
                    onChange={(event) =>
                      setCategoryNameDrafts((current) => ({
                        ...current,
                        [category.id]: event.target.value,
                      }))
                    }
                    onBlur={() => handleRenameCategory(category)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.currentTarget.blur();
                      }

                      if (event.key === "Escape") {
                        setCategoryNameDrafts((current) => ({
                          ...current,
                          [category.id]: category.name || "",
                        }));

                        event.currentTarget.blur();
                      }
                    }}
                    className={getInputClass("font-black")}
                  />
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <ActionButton
                    tone={isCategoryHidden ? "emerald" : "stone"}
                    onClick={() => handleToggleCategory(category)}
                  >
                    {isCategoryHidden ? "Показати" : "Приховати"}
                  </ActionButton>

                  <ActionButton
                    tone="red"
                    onClick={() => askDeleteCategory(category)}
                  >
                    Видалити
                  </ActionButton>
                </div>
              </div>

              <div className="mt-3 rounded-[1.25rem] border border-emerald-100 bg-emerald-50/70 p-3">
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-800">
                      Націнка на товари категорії
                    </p>

                    <p className="mt-1 text-xs leading-5 text-emerald-950/75">
                      Перерахує ціну продажу за формулою: собівартість +
                      відсоток. Товари без собівартості не змінюються.
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-black">
                      <span className="rounded-full bg-white/80 px-2 py-1 text-emerald-900 ring-1 ring-emerald-100">
                        товарів: {productStats.total}
                      </span>

                      <span className="rounded-full bg-white/80 px-2 py-1 text-emerald-900 ring-1 ring-emerald-100">
                        з собівартістю: {productStats.withCostPrice}
                      </span>

                      {productStats.withoutCostPrice > 0 && (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-900 ring-1 ring-amber-100">
                          без собівартості: {productStats.withoutCostPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-[minmax(8rem,11rem)_auto]">
                    <label className="grid gap-1.5 text-xs font-black text-emerald-900">
                      <span>Націнка, %</span>

                      <input
                        value={markupDraft}
                        onChange={(event) =>
                          setCategoryMarkupDrafts((current) => ({
                            ...current,
                            [category.id]: event.target.value,
                          }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            askApplyCategoryMarkup(category);
                          }
                        }}
                        placeholder="30"
                        type="number"
                        min="0"
                        step="0.1"
                        className={getInputClass("bg-white/95")}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => askApplyCategoryMarkup(category)}
                      disabled={!canApplyMarkup}
                      className="eg-button rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
                    >
                      Застосувати
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-[1.25rem] bg-stone-50/90 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-wide text-stone-500">
                    Підкатегорії
                  </p>

                  <span className="text-xs font-bold text-stone-400">
                    {subcategories.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {subcategories.map((subcategory) => {
                    const isSubcategoryHidden =
                      subcategory.active === false;

                    return (
                      <div
                        key={subcategory.id}
                        className={`grid gap-2 rounded-xl p-2 lg:grid-cols-[1fr_auto] lg:items-center ${
                          isSubcategoryHidden
                            ? "bg-amber-50 ring-1 ring-amber-100"
                            : "bg-white"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            {isSubcategoryHidden && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-900">
                                Приховано
                              </span>
                            )}
                          </div>

                          <input
                            value={
                              subcategoryNameDrafts[subcategory.id] ??
                              subcategory.name
                            }
                            onChange={(event) =>
                              setSubcategoryNameDrafts((current) => ({
                                ...current,
                                [subcategory.id]: event.target.value,
                              }))
                            }
                            onBlur={() =>
                              handleRenameSubcategory(category, subcategory)
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.currentTarget.blur();
                              }

                              if (event.key === "Escape") {
                                setSubcategoryNameDrafts((current) => ({
                                  ...current,
                                  [subcategory.id]: subcategory.name || "",
                                }));

                                event.currentTarget.blur();
                              }
                            }}
                            className={getInputClass()}
                          />
                        </div>

                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <ActionButton
                            tone={isSubcategoryHidden ? "emerald" : "stone"}
                            onClick={() =>
                              handleToggleSubcategory(category, subcategory)
                            }
                          >
                            {isSubcategoryHidden ? "Показати" : "Приховати"}
                          </ActionButton>

                          <ActionButton
                            tone="red"
                            onClick={() =>
                              askDeleteSubcategory(category, subcategory)
                            }
                          >
                            Видалити
                          </ActionButton>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 grid gap-2 lg:grid-cols-[1fr_auto]">
                  <input
                    value={subcategoryDrafts[category.id] || ""}
                    onChange={(event) =>
                      setSubcategoryDrafts((current) => ({
                        ...current,
                        [category.id]: event.target.value,
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleCreateSubcategory(category.id);
                      }
                    }}
                    placeholder="Нова підкатегорія"
                    className={getInputClass()}
                  />

                  <button
                    type="button"
                    onClick={() => handleCreateSubcategory(category.id)}
                    className="eg-button rounded-xl bg-stone-950 px-5 py-2.5 text-sm font-black text-white hover:bg-stone-800"
                  >
                    Додати
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <AdminMessageModal
          type={modal.type}
          title={modal.title}
          message={modal.message}
          confirmLabel={modal.confirmLabel}
          cancelLabel={modal.cancelLabel}
          showCancel={modal.showCancel}
          isLoading={isModalLoading}
          onConfirm={modal.onConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </section>
  );
}
