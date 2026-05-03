function FormSection({ title, description, children }) {
  return (
    <div className="rounded-3xl bg-stone-50 p-4">
      <div className="mb-4">
        <p className="font-black text-stone-900">{title}</p>

        {description && (
          <p className="mt-1 text-sm leading-6 text-stone-500">
            {description}
          </p>
        )}
      </div>

      <div className="space-y-3">{children}</div>
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}) {
  return (
    <input
      value={value || ""}
      onChange={onChange}
      type={type}
      placeholder={placeholder}
      className={`w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-700 ${className}`}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value || ""}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-700"
    />
  );
}

export default function AdminProductEditModal({
  categories,
  editingProduct,
  setEditingProduct,
  saveEditedProduct,
  cancelEditProduct,
}) {
  function updateField(field, value) {
    setEditingProduct({
      ...editingProduct,
      [field]: value,
    });
  }

  const selectedCategory = categories.find(
    (category) => category.id === editingProduct.category
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Редагування
            </p>

            <h2 className="mt-1 text-2xl font-black text-stone-950">
              {editingProduct.name || "Товар"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-stone-500">
              Змініть дані товару. Ці поля використовуються в каталозі,
              карточці товару та на сторінці товару.
            </p>
          </div>

          <button
            type="button"
            onClick={cancelEditProduct}
            className="rounded-2xl bg-stone-100 px-4 py-2 text-xl font-black hover:bg-stone-200"
          >
            ×
          </button>
        </div>

        <div className="space-y-5">
          <FormSection
            title="Основна інформація"
            description="Назва, бренд, тип товару та походження."
          >
            <TextInput
              value={editingProduct.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Назва товару"
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <TextInput
                value={editingProduct.brand || ""}
                onChange={(event) => updateField("brand", event.target.value)}
                placeholder="Бренд / торгова марка"
              />

              <TextInput
                value={editingProduct.productType || ""}
                onChange={(event) =>
                  updateField("productType", event.target.value)
                }
                placeholder="Тип товару: сироп, напій, батончик"
              />

              <TextInput
                value={editingProduct.countryOfOrigin || ""}
                onChange={(event) =>
                  updateField("countryOfOrigin", event.target.value)
                }
                placeholder="Країна виробництва"
              />
            </div>
          </FormSection>

          <FormSection title="Категорія">
            <select
              value={editingProduct.category || ""}
              onChange={(event) =>
                setEditingProduct({
                  ...editingProduct,
                  category: event.target.value,
                  subcategory: "",
                })
              }
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-700"
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
          </FormSection>

          <FormSection title="Підкатегорія">
            <select
              value={editingProduct.subcategory || ""}
              onChange={(event) =>
                updateField("subcategory", event.target.value)
              }
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-700"
            >
              <option value="">Без підкатегорії</option>

              {(selectedCategory?.subcategories || []).map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
          </FormSection>

          <FormSection
            title="Ціна"
            description="Стара ціна використовується для автоматичного бейджа знижки."
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <TextInput
                value={editingProduct.price}
                onChange={(event) => updateField("price", event.target.value)}
                placeholder="Ціна, грн"
                type="number"
              />

              <TextInput
                value={editingProduct.costPrice || ""}
                onChange={(event) =>
                  updateField("costPrice", event.target.value)
                }
                placeholder="Собівартість, грн"
                type="number"
              />

              <TextInput
                value={editingProduct.oldPrice || ""}
                onChange={(event) =>
                  updateField("oldPrice", event.target.value)
                }
                placeholder="Стара ціна, якщо є"
                type="number"
              />
            </div>
          </FormSection>

          <FormSection
            title="Наявність"
            description="Точну кількість бачить тільки адмінка. На сайті клієнт бачить лише статус."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={editingProduct.stockStatus || "in_stock"}
                onChange={(event) =>
                  setEditingProduct({
                    ...editingProduct,
                    stockStatus: event.target.value,
                    stockQuantity:
                      event.target.value === "limited"
                        ? editingProduct.stockQuantity || ""
                        : "",
                  })
                }
                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-700"
              >
                <option value="in_stock">У наявності</option>
                <option value="limited">Мало в наявності</option>
                <option value="preorder">Під замовлення</option>
                <option value="out_of_stock">Немає в наявності</option>
              </select>

              {editingProduct.stockStatus === "limited" && (
                <TextInput
                  value={editingProduct.stockQuantity || ""}
                  onChange={(event) =>
                    updateField("stockQuantity", event.target.value)
                  }
                  placeholder="Кількість на складі"
                  type="number"
                />
              )}
            </div>
          </FormSection>

          <FormSection
            title="Зображення"
            description="Поки використовуємо одне основне фото товару."
          >
            <TextInput
              value={editingProduct.image || ""}
              onChange={(event) => updateField("image", event.target.value)}
              placeholder="Посилання на фото"
            />
          </FormSection>

          <FormSection
            title="Опис товару"
            description="Короткий опис можна використовувати в адмінці та майбутніх превʼю, детальний — на сторінці товару."
          >
            <TextArea
              value={editingProduct.description || ""}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              rows={3}
              placeholder="Короткий опис товару"
            />

            <TextArea
              value={editingProduct.details || ""}
              onChange={(event) => updateField("details", event.target.value)}
              rows={6}
              placeholder="Детальний опис товару"
            />

            <TextArea
              value={editingProduct.benefits || ""}
              onChange={(event) => updateField("benefits", event.target.value)}
              rows={4}
              placeholder="Переваги товару. Кожну перевагу краще писати з нового рядка"
            />
          </FormSection>

          <FormSection
            title="Обʼєм, вага та упаковка"
            description="Ці поля показуються в карточці каталогу та на сторінці товару."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput
                value={editingProduct.unit || ""}
                onChange={(event) => updateField("unit", event.target.value)}
                placeholder="Обʼєм / кількість: 1 л, 250 г, 1 шт"
              />

              <TextInput
                value={editingProduct.packageInfo || ""}
                onChange={(event) =>
                  updateField("packageInfo", event.target.value)
                }
                placeholder="Упаковка: пляшка, пакет, 1 батончик"
              />
            </div>
          </FormSection>

          <FormSection
            title="Склад, алергени та зберігання"
            description="Поля необовʼязкові. Якщо залишити порожніми, блок не буде показаний на сторінці товару."
          >
            <TextArea
              value={editingProduct.composition || ""}
              onChange={(event) =>
                updateField("composition", event.target.value)
              }
              rows={3}
              placeholder="Склад"
            />

            <TextArea
              value={editingProduct.allergens || ""}
              onChange={(event) =>
                updateField("allergens", event.target.value)
              }
              rows={3}
              placeholder="Алергени"
            />

            <TextArea
              value={editingProduct.storageConditions || ""}
              onChange={(event) =>
                updateField("storageConditions", event.target.value)
              }
              rows={3}
              placeholder="Умови зберігання"
            />
          </FormSection>

          <FormSection title="Відображення">
            <label className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-stone-700">
              <input
                type="checkbox"
                checked={Boolean(editingProduct.popular)}
                onChange={(event) =>
                  updateField("popular", event.target.checked)
                }
              />
              Показувати як популярний товар
            </label>

            <label className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-semibold text-stone-700">
              <input
                type="checkbox"
                checked={editingProduct.active !== false}
                onChange={(event) =>
                  updateField("active", event.target.checked)
                }
              />
              Товар активний
            </label>
          </FormSection>

          <div className="sticky bottom-0 flex flex-col gap-3 border-t border-stone-200 bg-white pt-4 sm:flex-row">
            <button
              type="button"
              onClick={saveEditedProduct}
              className="rounded-2xl bg-emerald-900 px-6 py-4 font-black text-white transition hover:bg-emerald-800"
            >
              Зберегти зміни
            </button>

            <button
              type="button"
              onClick={cancelEditProduct}
              className="rounded-2xl border border-stone-300 px-6 py-4 font-bold text-stone-900 transition hover:bg-stone-100"
            >
              Скасувати
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}