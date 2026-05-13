import { useEffect } from "react";
import { createPortal } from "react-dom";

import ProductImageCropUploader from "./ProductImageCropUploader.jsx";

function FormSection({ title, description, children, className = "" }) {
  return (
    <div
      className={`eg-premium-card rounded-[1.35rem] bg-white/85 p-3 ring-1 ring-stone-100 ${className}`}
    >
      <div className="mb-2">
        <p className="text-sm font-black text-stone-900">{title}</p>

        {description && (
          <p className="mt-0.5 text-xs leading-5 text-stone-500">
            {description}
          </p>
        )}
      </div>

      <div className="space-y-2">{children}</div>
    </div>
  );
}

function getFieldClass(extraClass = "") {
  return `eg-field w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400 ${extraClass}`;
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
  ...props
}) {
  return (
    <input
      value={value || ""}
      onChange={onChange}
      type={type}
      placeholder={placeholder}
      className={getFieldClass(className)}
      {...props}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value || ""}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      className={getFieldClass("resize-y")}
    />
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3 py-0.5">
      <div className="h-px flex-1 bg-stone-200" />

      <span className="text-[11px] font-black uppercase tracking-wide text-stone-400">
        або
      </span>

      <div className="h-px flex-1 bg-stone-200" />
    </div>
  );
}

function ToggleCard({ checked, onChange, children }) {
  return (
    <label
      className={`eg-card flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold ${
        checked
          ? "border-emerald-200 bg-emerald-50 text-emerald-950"
          : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-emerald-900"
      />

      {children}
    </label>
  );
}

export default function AdminProductEditModal({
  categories,
  editingProduct,
  setEditingProduct,
  saveEditedProduct,
  cancelEditProduct,
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function updateField(field, value) {
    setEditingProduct((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateFields(nextFields) {
    setEditingProduct((current) => ({
      ...current,
      ...nextFields,
    }));
  }

  const hasNewCategory = Boolean(
    String(editingProduct.newCategoryName || "").trim()
  );

  const hasNewSubcategory = Boolean(
    String(editingProduct.newSubcategoryName || "").trim()
  );

  const selectedCategory = categories.find((category) => {
    return category.id === editingProduct.category;
  });

  const canCreateOrSelectSubcategory =
    Boolean(editingProduct.category) || hasNewCategory;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 p-3 backdrop-blur-md"
      onClick={cancelEditProduct}
    >
      <div
        className="eg-glass flex h-[96dvh] w-[94vw] max-w-[1260px] flex-col overflow-hidden rounded-[1.6rem] bg-white/95 shadow-[0_30px_80px_rgba(0,0,0,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 border-b border-stone-200 bg-white/95 px-5 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                Редагування
              </p>

              <h2 className="mt-0.5 truncate text-2xl font-black text-stone-950">
                {editingProduct.name || "Товар"}
              </h2>

              <p className="mt-1 text-xs leading-5 text-stone-500">
                Змініть дані товару для каталогу, картки товару та сторінки
                товару.
              </p>
            </div>

            <button
              type="button"
              onClick={cancelEditProduct}
              className="eg-icon-button flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-xl font-black text-stone-600 hover:bg-stone-200"
            >
              ×
            </button>
          </div>
        </div>

        <div className="modal-scrollbar min-h-0 flex-1 overflow-y-auto bg-stone-50/60 px-4 py-4 sm:px-5">
          <div className="grid gap-3 xl:grid-cols-2">
            <FormSection
              title="Основна інформація"
              description="Назва, бренд, тип товару та походження."
            >
              <TextInput
                value={editingProduct.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Назва товару"
              />

              <div className="grid gap-2 sm:grid-cols-3">
                <TextInput
                  value={editingProduct.brand || ""}
                  onChange={(event) => updateField("brand", event.target.value)}
                  placeholder="Бренд"
                />

                <TextInput
                  value={editingProduct.productType || ""}
                  onChange={(event) =>
                    updateField("productType", event.target.value)
                  }
                  placeholder="Тип товару"
                />

                <TextInput
                  value={editingProduct.countryOfOrigin || ""}
                  onChange={(event) =>
                    updateField("countryOfOrigin", event.target.value)
                  }
                  placeholder="Країна"
                />
              </div>
            </FormSection>

            <FormSection
              title="Ціна"
              description="Стара ціна використовується для бейджа знижки."
            >
              <div className="grid gap-2 sm:grid-cols-3">
                <TextInput
                  value={editingProduct.price}
                  onChange={(event) => updateField("price", event.target.value)}
                  placeholder="Ціна, грн"
                  type="number"
                  min="0"
                  max="999999"
                />

                <TextInput
                  value={editingProduct.costPrice || ""}
                  onChange={(event) =>
                    updateField("costPrice", event.target.value)
                  }
                  placeholder="Собівартість"
                  type="number"
                  min="0"
                  max="999999"
                />

                <TextInput
                  value={editingProduct.oldPrice || ""}
                  onChange={(event) =>
                    updateField("oldPrice", event.target.value)
                  }
                  placeholder="Стара ціна"
                  type="number"
                  min="0"
                  max="999999"
                />
              </div>
            </FormSection>

            <FormSection
              title="Категорія"
              description="Оберіть існуючу або створіть нову."
            >
              <select
                value={editingProduct.category || ""}
                disabled={hasNewCategory}
                onChange={(event) =>
                  updateFields({
                    category: event.target.value,
                    subcategory: "",
                    newCategoryName: "",
                    newSubcategoryName: "",
                  })
                }
                className={getFieldClass()}
              >
                <option value="">Оберіть категорію</option>

                {categories
                  .filter((category) => category.id !== "all")
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>

              <OrDivider />

              <TextInput
                value={editingProduct.newCategoryName || ""}
                onChange={(event) =>
                  updateFields({
                    newCategoryName: event.target.value,
                    category: event.target.value.trim()
                      ? ""
                      : editingProduct.category,
                    subcategory: event.target.value.trim()
                      ? ""
                      : editingProduct.subcategory,
                  })
                }
                placeholder="Нова категорія"
              />

              {hasNewCategory && (
                <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-900">
                  Буде створено:{" "}
                  <span className="font-black">
                    {editingProduct.newCategoryName}
                  </span>
                </p>
              )}
            </FormSection>

            <FormSection
              title="Підкатегорія"
              description="Необовʼязково. Можна обрати або створити нову."
            >
              <select
                value={editingProduct.subcategory || ""}
                disabled={
                  !selectedCategory || hasNewCategory || hasNewSubcategory
                }
                onChange={(event) =>
                  updateFields({
                    subcategory: event.target.value,
                    newSubcategoryName: "",
                  })
                }
                className={getFieldClass()}
              >
                <option value="">Без підкатегорії</option>

                {(selectedCategory?.subcategories || []).map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>

              <OrDivider />

              <TextInput
                value={editingProduct.newSubcategoryName || ""}
                disabled={!canCreateOrSelectSubcategory}
                onChange={(event) =>
                  updateFields({
                    newSubcategoryName: event.target.value,
                    subcategory: event.target.value.trim()
                      ? ""
                      : editingProduct.subcategory,
                  })
                }
                placeholder={
                  canCreateOrSelectSubcategory
                    ? "Нова підкатегорія"
                    : "Спочатку оберіть категорію"
                }
              />

              {hasNewSubcategory && (
                <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-900">
                  Буде створено:{" "}
                  <span className="font-black">
                    {editingProduct.newSubcategoryName}
                  </span>
                </p>
              )}
            </FormSection>

            <FormSection
              title="Наявність"
              description="Кількість списується тільки для обмеженого залишку."
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  value={editingProduct.stockStatus || "in_stock"}
                  onChange={(event) => {
                    const nextStatus = event.target.value;

                    updateFields({
                      stockStatus: nextStatus,
                      stockQuantity:
                        nextStatus === "limited"
                          ? editingProduct.stockQuantity || "1"
                          : "",
                    });
                  }}
                  className={getFieldClass()}
                >
                  <option value="in_stock">У наявності</option>
                  <option value="limited">Обмежена кількість</option>
                  <option value="preorder">Під замовлення</option>
                  <option value="out_of_stock">Немає в наявності</option>
                </select>

                <TextInput
                  value={editingProduct.stockQuantity || ""}
                  onChange={(event) =>
                    updateField("stockQuantity", event.target.value)
                  }
                  placeholder={
                    editingProduct.stockStatus === "limited"
                      ? "Кількість"
                      : "Недоступно для цього статусу"
                  }
                  type="number"
                  min="0"
                  max="999999"
                  disabled={editingProduct.stockStatus !== "limited"}
                />
              </div>

              {editingProduct.stockStatus === "limited" ? (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                  Залишок буде зменшуватися після замовлення і повертатися при
                  скасуванні.
                </p>
              ) : (
                <p className="rounded-xl bg-white px-3 py-2 text-xs leading-5 text-stone-500">
                  Для звичайного статусу точний залишок не списується.
                </p>
              )}
            </FormSection>

            <FormSection title="Відображення">
              <ToggleCard
                checked={Boolean(editingProduct.popular)}
                onChange={(event) =>
                  updateField("popular", event.target.checked)
                }
              >
                Показувати як популярний товар
              </ToggleCard>

              <ToggleCard
                checked={editingProduct.active !== false}
                onChange={(event) =>
                  updateField("active", event.target.checked)
                }
              >
                Товар активний
              </ToggleCard>
            </FormSection>

            <FormSection
              title="Зображення"
              description="Одне основне фото товару."
              className="xl:col-span-2"
            >
              <TextInput
                value={editingProduct.image || ""}
                onChange={(event) => updateField("image", event.target.value)}
                placeholder="Посилання на фото"
              />

              <div className="rounded-[1.25rem] bg-white/80 p-3 ring-1 ring-stone-100">
                <ProductImageCropUploader
                  value={editingProduct.image || ""}
                  onChange={(imageUrl) =>
                    setEditingProduct((current) => ({
                      ...current,
                      image: imageUrl,
                    }))
                  }
                />
              </div>
            </FormSection>

            <FormSection
              title="Опис товару"
              description="Короткий опис, деталі та переваги."
              className="xl:col-span-2"
            >
              <div className="grid gap-2 xl:grid-cols-3">
                <TextArea
                  value={editingProduct.description || ""}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  rows={3}
                  placeholder="Короткий опис"
                />

                <TextArea
                  value={editingProduct.details || ""}
                  onChange={(event) => updateField("details", event.target.value)}
                  rows={3}
                  placeholder="Детальний опис"
                />

                <TextArea
                  value={editingProduct.benefits || ""}
                  onChange={(event) =>
                    updateField("benefits", event.target.value)
                  }
                  rows={3}
                  placeholder="Переваги"
                />
              </div>
            </FormSection>

            <FormSection
              title="Обʼєм, вага та упаковка"
              description="Показується в каталозі та на сторінці товару."
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <TextInput
                  value={editingProduct.unit || ""}
                  onChange={(event) => updateField("unit", event.target.value)}
                  placeholder="1 л, 250 г, 1 шт"
                />

                <TextInput
                  value={editingProduct.packageInfo || ""}
                  onChange={(event) =>
                    updateField("packageInfo", event.target.value)
                  }
                  placeholder="Пляшка, пакет, батончик"
                />
              </div>
            </FormSection>

            <FormSection
              title="Склад, алергени та зберігання"
              description="Якщо порожньо — блок не показується."
            >
              <div className="grid gap-2">
                <TextArea
                  value={editingProduct.composition || ""}
                  onChange={(event) =>
                    updateField("composition", event.target.value)
                  }
                  rows={2}
                  placeholder="Склад"
                />

                <TextArea
                  value={editingProduct.allergens || ""}
                  onChange={(event) =>
                    updateField("allergens", event.target.value)
                  }
                  rows={2}
                  placeholder="Алергени"
                />

                <TextArea
                  value={
                    editingProduct.storageConditions ??
                    editingProduct.storage ??
                    ""
                  }
                  onChange={(event) =>
                    updateFields({
                      storageConditions: event.target.value,
                      storage: event.target.value,
                    })
                  }
                  rows={2}
                  placeholder="Умови зберігання"
                />
              </div>
            </FormSection>
          </div>
        </div>

        <div className="shrink-0 border-t border-stone-200 bg-white/95 px-5 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={cancelEditProduct}
              className="eg-button rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-black text-stone-900 hover:bg-stone-100"
            >
              Скасувати
            </button>

            <button
              type="button"
              onClick={saveEditedProduct}
              className="eg-button eg-sweep rounded-xl bg-emerald-900 px-5 py-2.5 text-sm font-black text-white hover:bg-emerald-800 hover:shadow-lg hover:shadow-emerald-900/20"
            >
              Зберегти зміни
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}