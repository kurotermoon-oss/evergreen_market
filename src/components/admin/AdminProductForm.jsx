import ProductImageCropUploader from "./ProductImageCropUploader.jsx";

function FormSection({ title, description, children }) {
  return (
    <div className="eg-panel eg-premium-card rounded-[2rem] bg-stone-50/90 p-5 backdrop-blur">
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

function getFieldClass(extraClass = "") {
  return `eg-field w-full rounded-[1.3rem] border border-stone-200 bg-white/85 px-5 py-3.5 outline-none backdrop-blur focus:border-emerald-700 focus:bg-white ${extraClass}`;
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
      className={getFieldClass(className)}
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
      className={getFieldClass()}
    />
  );
}

function ToggleCard({ checked, onChange, children }) {
  return (
    <label
      className={`eg-card flex cursor-pointer items-center gap-3 rounded-[1.4rem] border p-4 text-sm font-semibold ${
        checked
          ? "border-emerald-200 bg-emerald-50 text-emerald-950"
          : "border-stone-200 bg-white/85 text-stone-700 hover:bg-white"
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
    <section className="mx-auto max-w-4xl">
      <div className="eg-glass eg-premium-card rounded-[2.2rem] p-5 sm:p-6">
        <div>
          <p className="w-fit rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-800 shadow-sm backdrop-blur">
            Каталог
          </p>

          <h2 className="mt-4 text-3xl font-black text-stone-950">
            Новий товар
          </h2>

          <p className="mt-2 text-sm leading-6 text-stone-500">
            Заповніть основні дані товару. Поля з описом, складом та умовами
            зберігання будуть використані на сторінці товару.
          </p>
        </div>

        <div className="mt-6 space-y-5">
          <FormSection
            title="Основна інформація"
            description="Назва, бренд, тип товару та походження."
          >
            <TextInput
              value={draftProduct.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Назва товару"
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <TextInput
                value={draftProduct.brand || ""}
                onChange={(event) => updateField("brand", event.target.value)}
                placeholder="Бренд / торгова марка"
              />

              <TextInput
                value={draftProduct.productType || ""}
                onChange={(event) =>
                  updateField("productType", event.target.value)
                }
                placeholder="Тип товару: сироп, напій, батончик"
              />

              <TextInput
                value={draftProduct.countryOfOrigin || ""}
                onChange={(event) =>
                  updateField("countryOfOrigin", event.target.value)
                }
                placeholder="Країна виробництва"
              />
            </div>
          </FormSection>

          <FormSection
            title="Категорія"
            description="Оберіть існуючу категорію або створіть нову."
          >
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

            <input
              value={draftProduct.newCategoryName || ""}
              onChange={(event) =>
                setDraftProduct((current) => ({
                  ...current,
                  newCategoryName: event.target.value,
                  category: event.target.value.trim() ? "" : current.category,
                  subcategory: event.target.value.trim()
                    ? ""
                    : current.subcategory,
                }))
              }
              className={getFieldClass()}
              placeholder="Або введіть нову категорію"
            />
          </FormSection>

          <FormSection
            title="Підкатегорія"
            description="Необовʼязково. Можна залишити товар без підкатегорії."
          >
            <select
              value={draftProduct.subcategory || ""}
              onChange={(event) =>
                setDraftProduct({
                  ...draftProduct,
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

            <input
              value={draftProduct.newSubcategoryName || ""}
              onChange={(event) =>
                setDraftProduct((current) => ({
                  ...current,
                  newSubcategoryName: event.target.value,
                  subcategory: event.target.value.trim()
                    ? ""
                    : current.subcategory,
                }))
              }
              className={getFieldClass()}
              placeholder="Або введіть нову підкатегорію"
            />
          </FormSection>

          <FormSection
            title="Ціна"
            description="Стара ціна використовується для автоматичного бейджа знижки."
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <TextInput
                value={draftProduct.price}
                onChange={(event) => updateField("price", event.target.value)}
                placeholder="Ціна, грн"
                type="number"
              />

              <TextInput
                value={draftProduct.costPrice || ""}
                onChange={(event) =>
                  updateField("costPrice", event.target.value)
                }
                placeholder="Собівартість, грн"
                type="number"
              />

              <TextInput
                value={draftProduct.oldPrice || ""}
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
                className={getFieldClass()}
              >
                <option value="in_stock">У наявності</option>
                <option value="limited">Мало в наявності</option>
                <option value="preorder">Під замовлення</option>
                <option value="out_of_stock">Немає в наявності</option>
              </select>

              {draftProduct.stockStatus === "limited" && (
                <TextInput
                  value={draftProduct.stockQuantity || ""}
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
            description="Можна вставити посилання вручну або завантажити фото з компʼютера."
          >
            <TextInput
              value={draftProduct.image || ""}
              onChange={(event) => updateField("image", event.target.value)}
              placeholder="Посилання на фото"
            />

            <div className="rounded-[1.5rem] bg-white/80 p-4 ring-1 ring-stone-100">
              <ProductImageCropUploader
                value={draftProduct.image || ""}
                onChange={(imageUrl) => updateField("image", imageUrl)}
              />
            </div>
          </FormSection>

          <FormSection
            title="Опис товару"
            description="Короткий опис можна використовувати в адмінці та майбутніх превʼю, детальний — на сторінці товару."
          >
            <TextArea
              value={draftProduct.description || ""}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              rows={3}
              placeholder="Короткий опис товару"
            />

            <TextArea
              value={draftProduct.details || ""}
              onChange={(event) => updateField("details", event.target.value)}
              rows={6}
              placeholder="Детальний опис товару"
            />

            <TextArea
              value={draftProduct.benefits || ""}
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
                value={draftProduct.unit || ""}
                onChange={(event) => updateField("unit", event.target.value)}
                placeholder="Обʼєм / кількість: 1 л, 250 г, 1 шт"
              />

              <TextInput
                value={draftProduct.packageInfo || ""}
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
              value={draftProduct.composition || ""}
              onChange={(event) =>
                updateField("composition", event.target.value)
              }
              rows={3}
              placeholder="Склад"
            />

            <TextArea
              value={draftProduct.allergens || ""}
              onChange={(event) => updateField("allergens", event.target.value)}
              rows={3}
              placeholder="Алергени"
            />

            <TextArea
              value={draftProduct.storageConditions || ""}
              onChange={(event) =>
                updateField("storageConditions", event.target.value)
              }
              rows={3}
              placeholder="Умови зберігання"
            />
          </FormSection>

          <FormSection title="Відображення">
            <ToggleCard
              checked={Boolean(draftProduct.popular)}
              onChange={(event) => updateField("popular", event.target.checked)}
            >
              Показувати як популярний товар
            </ToggleCard>

            <ToggleCard
              checked={draftProduct.active !== false}
              onChange={(event) => updateField("active", event.target.checked)}
            >
              Товар активний
            </ToggleCard>
          </FormSection>

          <button
            type="button"
            onClick={addDraftProduct}
            className="eg-button eg-sweep w-full rounded-[1.5rem] bg-emerald-900 py-4 font-black text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-800 hover:shadow-xl hover:shadow-emerald-900/30"
          >
            Додати товар
          </button>
        </div>
      </div>
    </section>
  );
}