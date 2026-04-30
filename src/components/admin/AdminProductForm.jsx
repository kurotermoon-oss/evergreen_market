export default function AdminProductForm({
  categories,
  draftProduct,
  setDraftProduct,
  addDraftProduct,
}) {
  function updateField(field, value) {
    setDraftProduct({
      ...draftProduct,
      [field]: value,
    });
  }

  const selectedCategory = categories.find(
    (category) => category.id === draftProduct.category
  );

  return (
    <section className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-black text-stone-950">Новий товар</h2>

      <div className="mt-6 space-y-4">
        <input
          value={draftProduct.name}
          onChange={(event) => updateField("name", event.target.value)}
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
          placeholder="Назва товару"
        />

        <div className="rounded-3xl bg-stone-50 p-4">
          <p className="mb-2 font-bold text-stone-800">Категорія</p>

          <select
            value={draftProduct.category}
            onChange={(event) =>
              setDraftProduct({
                ...draftProduct,
                category: event.target.value,
                subcategory: "",
                newCategoryName: "",
              })
            }
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
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

          <input
            value={draftProduct.newCategoryName || ""}
            onChange={(event) =>
              updateField("newCategoryName", event.target.value)
            }
            placeholder="Або нова категорія"
            className="mt-3 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
          />
        </div>

        <div className="rounded-3xl bg-stone-50 p-4">
          <p className="mb-2 font-bold text-stone-800">Підкатегорія</p>

          <select
            value={draftProduct.subcategory || ""}
            onChange={(event) =>
              setDraftProduct({
                ...draftProduct,
                subcategory: event.target.value,
                newSubcategoryName: "",
              })
            }
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
          >
            <option value="">Без підкатегорії</option>

            {(selectedCategory?.subcategories || []).map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>

          <input
            value={draftProduct.newSubcategoryName || ""}
            onChange={(event) =>
              updateField("newSubcategoryName", event.target.value)
            }
            placeholder="Або нова підкатегорія"
            className="mt-3 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <input
            value={draftProduct.price}
            onChange={(event) => updateField("price", event.target.value)}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
            placeholder="Ціна, грн"
            type="number"
          />

          <input
            value={draftProduct.costPrice || ""}
            onChange={(event) => updateField("costPrice", event.target.value)}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
            placeholder="Собівартість, грн"
            type="number"
          />

          <input
            value={draftProduct.oldPrice || ""}
            onChange={(event) => updateField("oldPrice", event.target.value)}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
            placeholder="Стара ціна, якщо є"
            type="number"
          />
        </div>

        <div className="rounded-3xl bg-stone-50 p-4">
          <p className="mb-3 font-bold text-stone-800">Наявність</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <select
              value={draftProduct.stockStatus || "in_stock"}
              onChange={(event) =>
                setDraftProduct({
                  ...draftProduct,
                  stockStatus: event.target.value,
                  stockQuantity:
                    event.target.value === "limited"
                      ? draftProduct.stockQuantity || ""
                      : "",
                })
              }
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
            >
              <option value="in_stock">В наявності</option>
              <option value="limited">Обмежена кількість</option>
              <option value="preorder">Під замовлення</option>
              <option value="out_of_stock">Немає в наявності</option>
            </select>

            {draftProduct.stockStatus === "limited" && (
              <input
                value={draftProduct.stockQuantity || ""}
                onChange={(event) =>
                  updateField("stockQuantity", event.target.value)
                }
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
                placeholder="Кількість на складі"
                type="number"
              />
            )}
          </div>
        </div>

        <input
          value={draftProduct.image || ""}
          onChange={(event) => updateField("image", event.target.value)}
          placeholder="Посилання на фото"
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
        />

        <textarea
          value={draftProduct.description || ""}
          onChange={(event) => updateField("description", event.target.value)}
          rows={3}
          placeholder="Короткий опис для карточки"
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            value={draftProduct.unit || ""}
            onChange={(event) => updateField("unit", event.target.value)}
            placeholder="Обʼєм / кількість: 1 л, 250 г, 1 шт"
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
          />

          <input
            value={draftProduct.packageInfo || ""}
            onChange={(event) => updateField("packageInfo", event.target.value)}
            placeholder="Упаковка: пляшка 1 л, пакет 250 г"
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
          />
        </div>

        <textarea
          value={draftProduct.details || ""}
          onChange={(event) => updateField("details", event.target.value)}
          rows={6}
          placeholder="Детальний опис товару"
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            value={draftProduct.composition || ""}
            onChange={(event) => updateField("composition", event.target.value)}
            placeholder="Склад"
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
          />

          <input
            value={draftProduct.statusLabel || ""}
            onChange={(event) => updateField("statusLabel", event.target.value)}
            placeholder="Статус: В наявності / Під замовлення"
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
          />
        </div>

        <label className="flex items-center gap-3 rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-stone-700">
          <input
            type="checkbox"
            checked={Boolean(draftProduct.popular)}
            onChange={(event) => updateField("popular", event.target.checked)}
          />
          Показувати як популярний товар
        </label>

        <label className="flex items-center gap-3 rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-stone-700">
          <input
            type="checkbox"
            checked={draftProduct.active !== false}
            onChange={(event) => updateField("active", event.target.checked)}
          />
          Товар активний
        </label>

        <button
          type="button"
          onClick={addDraftProduct}
          className="w-full rounded-2xl bg-emerald-900 py-4 font-bold text-white hover:bg-emerald-800"
        >
          Додати товар
        </button>
      </div>
    </section>
  );
}