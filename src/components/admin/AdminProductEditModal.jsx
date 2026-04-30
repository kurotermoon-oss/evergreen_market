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
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Редагування
            </p>

            <h2 className="mt-1 text-2xl font-black text-stone-950">
              {editingProduct.name || "Товар"}
            </h2>
          </div>

          <button
            type="button"
            onClick={cancelEditProduct}
            className="rounded-2xl bg-stone-100 px-4 py-2 text-xl font-black hover:bg-stone-200"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <input
            value={editingProduct.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
            placeholder="Назва товару"
          />

          <select
            value={editingProduct.category}
            onChange={(event) =>
              setEditingProduct({
                ...editingProduct,
                category: event.target.value,
                subcategory: "",
              })
            }
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
          >
            {categories
              .filter((category) => category.id !== "all")
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>

          <select
            value={editingProduct.subcategory || ""}
            onChange={(event) => updateField("subcategory", event.target.value)}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
          >
            <option value="">Без підкатегорії</option>

            {(selectedCategory?.subcategories || []).map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>

          <div className="grid gap-4 sm:grid-cols-3">
            <input
              value={editingProduct.price}
              onChange={(event) => updateField("price", event.target.value)}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
              placeholder="Ціна, грн"
              type="number"
            />

            <input
              value={editingProduct.costPrice || ""}
              onChange={(event) => updateField("costPrice", event.target.value)}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
              placeholder="Собівартість, грн"
              type="number"
            />

            <input
              value={editingProduct.oldPrice || ""}
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
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
              >
                <option value="in_stock">В наявності</option>
                <option value="limited">Обмежена кількість</option>
                <option value="preorder">Під замовлення</option>
                <option value="out_of_stock">Немає в наявності</option>
              </select>

              {editingProduct.stockStatus === "limited" && (
                <input
                  value={editingProduct.stockQuantity || ""}
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
            value={editingProduct.image || ""}
            onChange={(event) => updateField("image", event.target.value)}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
            placeholder="Посилання на фото"
          />

          <textarea
            value={editingProduct.description || ""}
            onChange={(event) => updateField("description", event.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
            placeholder="Короткий опис"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={editingProduct.unit || ""}
              onChange={(event) => updateField("unit", event.target.value)}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
              placeholder="Обʼєм / кількість"
            />

            <input
              value={editingProduct.packageInfo || ""}
              onChange={(event) =>
                updateField("packageInfo", event.target.value)
              }
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
              placeholder="Упаковка"
            />
          </div>

          <textarea
            value={editingProduct.details || ""}
            onChange={(event) => updateField("details", event.target.value)}
            rows={5}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
            placeholder="Детальний опис товару"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={editingProduct.composition || ""}
              onChange={(event) => updateField("composition", event.target.value)}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
              placeholder="Склад"
            />

            <input
              value={editingProduct.statusLabel || ""}
              onChange={(event) => updateField("statusLabel", event.target.value)}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
              placeholder="Статус"
            />
          </div>

          <label className="flex items-center gap-3 rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-stone-700">
            <input
              type="checkbox"
              checked={Boolean(editingProduct.popular)}
              onChange={(event) => updateField("popular", event.target.checked)}
            />
            Показувати як популярний товар
          </label>

          <label className="flex items-center gap-3 rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-stone-700">
            <input
              type="checkbox"
              checked={Boolean(editingProduct.active)}
              onChange={(event) => updateField("active", event.target.checked)}
            />
            Товар активний
          </label>

          <div className="sticky bottom-0 flex flex-col gap-3 bg-white pt-4 sm:flex-row">
            <button
              type="button"
              onClick={saveEditedProduct}
              className="rounded-2xl bg-emerald-900 px-6 py-4 font-bold text-white hover:bg-emerald-800"
            >
              Зберегти зміни
            </button>

            <button
              type="button"
              onClick={cancelEditProduct}
              className="rounded-2xl border border-stone-300 px-6 py-4 font-bold text-stone-900 hover:bg-stone-100"
            >
              Скасувати
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}