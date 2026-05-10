import { useEffect, useMemo, useRef, useState } from "react";
import AdminMessageModal from "./AdminMessageModal.jsx";

export default function AdminCategoriesPanel({
  categories,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
}) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [subcategoryDrafts, setSubcategoryDrafts] = useState({});
  const [categoryNameDrafts, setCategoryNameDrafts] = useState({});
  const [subcategoryNameDrafts, setSubcategoryNameDrafts] = useState({});
  const [modal, setModal] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const panelRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const categoryList  = useMemo(() => {
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
  const panel = panelRef.current;

  if (!panel) return undefined;

  const scrollContainer = panel.closest(".modal-scrollbar");

  if (!scrollContainer) return undefined;

  let ticking = false;

  function handleScroll() {
    if (ticking) return;

    ticking = true;

    window.requestAnimationFrame(() => {
      const currentScrollTop = scrollContainer.scrollTop;
      const previousScrollTop = lastScrollTopRef.current;
      const difference = currentScrollTop - previousScrollTop;

      if (currentScrollTop < 40) {
        setIsHeaderVisible(true);
      } else if (difference > 8) {
        setIsHeaderVisible(false);
      } else if (difference < -8) {
        setIsHeaderVisible(true);
      }

      lastScrollTopRef.current = Math.max(currentScrollTop, 0);
      ticking = false;
    });
  }

  scrollContainer.addEventListener("scroll", handleScroll, {
    passive: true,
  });

  return () => {
    scrollContainer.removeEventListener("scroll", handleScroll);
  };
}, []);


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
  <section ref={panelRef} className="rounded-3xl bg-white p-0">
    <div
        className={`sticky top-0 z-10 rounded-3xl bg-white pb-4 transition-all duration-300 ease-out ${
          isHeaderVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-[105%] opacity-0"
        }`}
      >
      <div className="rounded-3xl bg-stone-50 p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Каталог
        </p>

        <h2 className="mt-1 text-2xl font-black text-stone-950">
          Категорії та підкатегорії
        </h2>

        <p className="mt-2 text-sm leading-6 text-stone-500">
          Створюйте, редагуйте, приховуйте та повертайте категорії каталогу.
          Приховані категорії не показуються клієнтам у магазині, але
          залишаються доступними в адмінці.
        </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-100">
              <p className="text-xs font-black uppercase text-stone-400">
                Категорій
              </p>
              <p className="mt-1 text-xl font-black text-stone-950">
                {categoryList.length}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-100">
              <p className="text-xs font-black uppercase text-stone-400">
                Підкатегорій
              </p>
              <p className="mt-1 text-xl font-black text-stone-950">
                {subcategoriesCount}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-100">
              <p className="text-xs font-black uppercase text-stone-400">
                Прихованих категорій
              </p>
              <p className="mt-1 text-xl font-black text-amber-800">
                {hiddenCategoriesCount}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-100">
              <p className="text-xs font-black uppercase text-stone-400">
                Прихованих підкатегорій
              </p>
              <p className="mt-1 text-xl font-black text-amber-800">
                {hiddenSubcategoriesCount}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleCreateCategory();
                  }
                }}
                placeholder="Нова категорія"
                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-emerald-700"
              />

              <button
                type="button"
                onClick={handleCreateCategory}
                className="rounded-2xl bg-emerald-900 px-5 py-3 font-black text-white hover:bg-emerald-800"
              >
                Додати
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Пошук категорій і підкатегорій..."
                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-emerald-700"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="rounded-2xl border border-stone-300 bg-white px-5 py-3 font-black text-stone-800 hover:bg-stone-100"
                >
                  Очистити
                </button>
              )}
            </div>
          </div>

          <p className="mt-3 text-sm text-stone-500">
            Показано категорій:{" "}
            <span className="font-black text-stone-800">
              {filteredCategories.length}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {filteredCategories.length === 0 && (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
            <p className="font-black text-stone-900">
              Категорії не знайдено
            </p>
            <p className="mt-2 text-sm text-stone-500">
              Спробуйте змінити пошуковий запит або очистити пошук.
            </p>
          </div>
        )}

        {filteredCategories.map((category) => {
          const isCategoryHidden = category.active === false;

          return (
            <div
              key={category.id}
              className={`rounded-3xl border p-5 ${
                isCategoryHidden
                  ? "border-amber-200 bg-amber-50/60"
                  : "border-stone-200 bg-white"
              }`}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="text-xs font-black uppercase tracking-wide text-stone-500">
                      Категорія
                    </p>

                    {isCategoryHidden && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900">
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
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 font-black outline-none focus:border-emerald-700 lg:max-w-md"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleCategory(category)}
                    className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                      isCategoryHidden
                        ? "bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                        : "bg-stone-100 text-stone-900 hover:bg-stone-200"
                    }`}
                  >
                    {isCategoryHidden ? "Показати" : "Приховати"}
                  </button>

                  <button
                    type="button"
                    onClick={() => askDeleteCategory(category)}
                    className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-800 ring-1 ring-red-200 hover:bg-red-100"
                  >
                    Видалити
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-3xl bg-stone-50 p-4">
                <p className="mb-3 text-sm font-black text-stone-700">
                  Підкатегорії
                </p>

                <div className="space-y-2">
                  {(category.subcategories || []).map((subcategory) => {
                    const isSubcategoryHidden =
                      subcategory.active === false;

                    return (
                      <div
                        key={subcategory.id}
                        className={`flex flex-col gap-2 rounded-2xl p-3 sm:flex-row sm:items-center ${
                          isSubcategoryHidden
                            ? "bg-amber-50 ring-1 ring-amber-100"
                            : "bg-white"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            {isSubcategoryHidden && (
                              <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-black text-amber-900">
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
                            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 outline-none focus:border-emerald-700"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleToggleSubcategory(category, subcategory)
                          }
                          className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                            isSubcategoryHidden
                              ? "bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                              : "bg-stone-100 text-stone-900 hover:bg-stone-200"
                          }`}
                        >
                          {isSubcategoryHidden ? "Показати" : "Приховати"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            askDeleteSubcategory(category, subcategory)
                          }
                          className="rounded-xl bg-red-50 px-3 py-2 text-sm font-black text-red-700 ring-1 ring-red-200 hover:bg-red-100"
                        >
                          Видалити
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
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
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-emerald-700"
                  />

                  <button
                    type="button"
                    onClick={() => handleCreateSubcategory(category.id)}
                    className="rounded-2xl bg-stone-900 px-5 py-3 font-black text-white hover:bg-stone-800"
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