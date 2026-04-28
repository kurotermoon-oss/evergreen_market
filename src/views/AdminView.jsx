import { useState } from "react";
import Icon from "../components/Icon.jsx";
import { formatUAH } from "../utils/formatUAH.js";
import AnalyticsCharts from "../components/AnalyticsCharts.jsx";

const orderStatuses = [
  "Новий",
  "Підтверджено",
  "Очікує оплату",
  "Оплачено",
  "Готово до видачі",
  "Видано",
  "Скасовано",
];

const statusTabs = [
  "Усі",
  "Новий",
  "Підтверджено",
  "Очікує оплату",
  "Оплачено",
  "Готово до видачі",
  "Видано",
  "Скасовано",
];

const statusColors = {
  Новий: "bg-yellow-100 text-yellow-800",
  Підтверджено: "bg-blue-100 text-blue-800",
  "Очікує оплату": "bg-orange-100 text-orange-800",
  Оплачено: "bg-emerald-100 text-emerald-800",
  "Готово до видачі": "bg-green-100 text-green-800",
  Видано: "bg-stone-200 text-stone-700",
  Скасовано: "bg-red-100 text-red-800",
};

export default function AdminView({
  categories,
  products,
  orders,
  draftProduct,
  setDraftProduct,
  editingProduct,
  setEditingProduct,
  startEditProduct,
  cancelEditProduct,
  saveEditedProduct,
  addDraftProduct,
  toggleProductActive,
  deleteProduct,
  updateOrderStatus,
  logoutAdmin,
  analytics,
}) {
  const [activeOrderTab, setActiveOrderTab] = useState("Усі");
  const [adminTab, setAdminTab] = useState("orders");
  const [adminProductQuery, setAdminProductQuery] = useState("");

  const filteredAdminProducts = products.filter((product) => {
  const categoryName =
    categories.find((category) => category.id === product.category)?.name || "";

  const searchableText = [
    product.name,
    product.description,
    product.details,
    product.unit,
    product.packageInfo,
    product.price,
    categoryName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(adminProductQuery.toLowerCase().trim());
});


  const filteredOrders =
    activeOrderTab === "Усі"
      ? orders
      : orders.filter((order) => order.status === activeOrderTab);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Адмін-панель
          </p>

          <h1 className="mt-2 text-4xl font-black text-stone-950">
            Товари та замовлення
          </h1>

          <p className="mt-3 max-w-3xl text-stone-600">
            Керуйте замовленнями, товарами та позиціями каталогу.
          </p>
        </div>

        <button
          type="button"
          onClick={logoutAdmin}
          className="rounded-2xl border border-stone-300 px-5 py-3 font-bold text-stone-900 hover:bg-stone-100"
        >
          Вийти
        </button>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto rounded-3xl bg-white p-2 shadow-sm">
        {[
          { id: "orders", label: "Замовлення" },
          { id: "products", label: "Товари" },
          { id: "add-product", label: "Додати товар" },
          { id: "analytics", label: "Аналітика" },
          
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setAdminTab(tab.id)}
            className={`whitespace-nowrap rounded-2xl px-5 py-3 text-sm font-black transition ${
              adminTab === tab.id
                ? "bg-emerald-900 text-white"
                : "text-stone-700 hover:bg-stone-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {adminTab === "orders" && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-stone-950">Замовлення</h2>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            {statusTabs.map((status) => {
              const count =
                status === "Усі"
                  ? orders.length
                  : orders.filter((order) => order.status === status).length;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setActiveOrderTab(status)}
                  className={`whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    activeOrderTab === status
                      ? "bg-stone-950 text-white"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  {status} · {count}
                </button>
              );
            })}
          </div>

          {!filteredOrders.length && (
            <div className="mt-6 rounded-3xl bg-stone-50 p-8 text-center text-stone-500">
              Поки що замовлень у цій вкладці немає.
            </div>
          )}

          <div className="mt-6 space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="rounded-3xl border border-stone-200 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">
                      #{order.orderNumber} ·{" "}
                      {new Date(order.createdAt).toLocaleString("uk-UA")}
                    </p>

                    <h3 className="mt-1 text-xl font-black text-stone-950">
                      {order.customerName}
                    </h3>

                    <p className="mt-2 text-sm text-stone-600">
                      Телефон: {order.customerPhone || "—"} · Telegram:{" "}
                      {order.customerTelegram || "—"}
                    </p>

                    <p className="mt-1 text-sm text-stone-600">
                      Отримання:{" "}
                      {order.deliveryType === "pickup"
                        ? "Самовивіз"
                        : `ЖК (${order.building || "-"}/${order.apartment || "-"})`}
                    </p>

                    <p className="mt-1 text-sm text-stone-600">
                      Оплата: {order.paymentMethod} · {order.paymentStatus}
                    </p>
                  </div>

                  <div className="text-left lg:text-right">
                    <p className="text-2xl font-black text-stone-950">
                      {formatUAH(order.total)}
                    </p>

                    <div
                      className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black ${
                        statusColors[order.status] || "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {order.status}
                    </div>

                    <select
                      value={order.status}
                      onChange={(event) =>
                        updateOrderStatus(order.id, event.target.value)
                      }
                      className="mt-3 block rounded-2xl border border-stone-300 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-700"
                    >
                      {orderStatuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-stone-50 p-4">
                  <p className="mb-3 text-sm font-bold text-stone-700">
                    Склад замовлення:
                  </p>

                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={`${order.id}-${item.productId}`}
                        className="flex justify-between gap-4 text-sm text-stone-700"
                      >
                        <span>
                          {item.name} · {item.quantity} шт × {item.price} грн
                        </span>
                        <span className="font-bold">{item.total} грн</span>
                      </div>
                    ))}
                  </div>

                  {order.comment && (
                    <p className="mt-4 text-sm text-stone-500">
                      Коментар: {order.comment}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      
{adminTab === "add-product" && (
  <section className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm">
    <h2 className="text-2xl font-black">Новий товар</h2>

    <div className="mt-6 space-y-4">
      <input
        value={draftProduct.name}
        onChange={(e) =>
          setDraftProduct({ ...draftProduct, name: e.target.value })
        }
        className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
        placeholder="Назва товару"
      />

      <div className="rounded-3xl bg-stone-50 p-4">
        <p className="mb-2 font-bold">Категорія</p>

        <select
          value={draftProduct.category}
          onChange={(e) =>
            setDraftProduct({
              ...draftProduct,
              category: e.target.value,
              subcategory: "",
              newCategoryName: "",
            })
          }
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
        >
          <option value="">Оберіть категорію</option>
          {categories
            .filter((c) => c.id !== "all")
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>

        <input
          value={draftProduct.newCategoryName || ""}
          onChange={(e) =>
            setDraftProduct({
              ...draftProduct,
              newCategoryName: e.target.value,
            })
          }
          placeholder="Або нова категорія"
          className="mt-3 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
        />
      </div>

      <div className="rounded-3xl bg-stone-50 p-4">
        <p className="mb-2 font-bold">Підкатегорія</p>

        <select
          value={draftProduct.subcategory || ""}
          onChange={(e) =>
            setDraftProduct({
              ...draftProduct,
              subcategory: e.target.value,
              newSubcategoryName: "",
            })
          }
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
        >
          <option value="">Без підкатегорії</option>

          {(categories.find((c) => c.id === draftProduct.category)
            ?.subcategories || []
          ).map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>

        <input
          value={draftProduct.newSubcategoryName || ""}
          onChange={(e) =>
            setDraftProduct({
              ...draftProduct,
              newSubcategoryName: e.target.value,
            })
          }
          placeholder="Або нова підкатегорія"
          className="mt-3 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <input
          value={draftProduct.price}
          onChange={(e) =>
            setDraftProduct({ ...draftProduct, price: e.target.value })
          }
          type="number"
          placeholder="Ціна, грн"
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
        />

        <input
          value={draftProduct.oldPrice || ""}
          onChange={(e) =>
            setDraftProduct({ ...draftProduct, oldPrice: e.target.value })
          }
          type="number"
          placeholder="Стара ціна, якщо є"
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
        />
      </div>

      <input
        value={draftProduct.image || ""}
        onChange={(e) =>
          setDraftProduct({ ...draftProduct, image: e.target.value })
        }
        placeholder="Посилання на фото"
        className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
      />

      <textarea
        value={draftProduct.description || ""}
        onChange={(e) =>
          setDraftProduct({ ...draftProduct, description: e.target.value })
        }
        rows={3}
        placeholder="Короткий опис для карточки"
        className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <input
          value={draftProduct.unit || ""}
          onChange={(e) =>
            setDraftProduct({ ...draftProduct, unit: e.target.value })
          }
          placeholder="Обʼєм / кількість: 1 л, 250 г, 1 шт"
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
        />

        <input
          value={draftProduct.packageInfo || ""}
          onChange={(e) =>
            setDraftProduct({ ...draftProduct, packageInfo: e.target.value })
          }
          placeholder="Упаковка: пляшка 1 л, пакет 250 г"
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
        />
      </div>

      <textarea
        value={draftProduct.details || ""}
        onChange={(e) =>
          setDraftProduct({ ...draftProduct, details: e.target.value })
        }
        rows={6}
        placeholder="Детальний опис товару"
        className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <input
          value={draftProduct.composition || ""}
          onChange={(e) =>
            setDraftProduct({ ...draftProduct, composition: e.target.value })
          }
          placeholder="Склад"
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
        />

        <input
          value={draftProduct.statusLabel || ""}
          onChange={(e) =>
            setDraftProduct({ ...draftProduct, statusLabel: e.target.value })
          }
          placeholder="Статус: В наявності / Під замовлення"
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
        />
      </div>

      <label className="flex items-center gap-3 rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-stone-700">
        <input
          type="checkbox"
          checked={Boolean(draftProduct.popular)}
          onChange={(e) =>
            setDraftProduct({
              ...draftProduct,
              popular: e.target.checked,
            })
          }
        />
        Показувати як популярний товар
      </label>

      <label className="flex items-center gap-3 rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-stone-700">
        <input
          type="checkbox"
          checked={draftProduct.active !== false}
          onChange={(e) =>
            setDraftProduct({
              ...draftProduct,
              active: e.target.checked,
            })
          }
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
)}

      {adminTab === "products" && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-stone-950">Список товарів</h2>
          <div className="mt-5">
          <input
            value={adminProductQuery}
            onChange={(event) => setAdminProductQuery(event.target.value)}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
            placeholder="Пошук товарів в адмінці..."
          />
        </div>

          {!filteredAdminProducts.length && (
          <div className="mt-6 rounded-3xl bg-stone-50 p-8 text-center text-stone-500">
            Товарів за цим запитом не знайдено.
          </div>
        )}


          <div className="mt-6 space-y-3">
            {filteredAdminProducts.map((product) => (
              <div
                key={product.id}
                className="flex flex-col gap-4 rounded-3xl border border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-16 w-16 rounded-2xl object-cover"
                  />

                  <div className="min-w-0">
                    <p className="truncate font-bold text-stone-950">
                      {product.name}
                    </p>

                    <p className="text-sm text-stone-500">
                      {formatUAH(product.price)} ·{" "}
                      {categories.find((item) => item.id === product.category)?.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      product.active
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-stone-200 text-stone-600"
                    }`}
                  >
                    {product.active ? "Активний" : "Схований"}
                  </span>
                    <button
                      type="button"
                      onClick={() => {startEditProduct(product)}
                      }

                      className="rounded-2xl border border-stone-300 p-3 text-stone-700 hover:bg-stone-100"
                      title="Редагувати товар"
                    >
                      ✏️
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleProductActive(product.id)}
                      className="rounded-2xl border border-stone-300 p-3 text-stone-700 hover:bg-stone-100"
                    >
                      {product.active ? (
                        <Icon name="eyeOff" size={18} />
                      ) : (
                        <Icon name="eye" size={18} />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteProduct(product.id)}
                      className="rounded-2xl border border-red-200 p-3 text-red-600 hover:bg-red-50"
                      title="Видалити товар"
                    >
                      🗑️
                    </button>
                  
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {editingProduct && (
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
          onChange={(event) =>
            setEditingProduct({ ...editingProduct, name: event.target.value })
          }
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
          onChange={(event) =>
            setEditingProduct({
              ...editingProduct,
              subcategory: event.target.value,
            })
          }
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
        >
          <option value="">Без підкатегорії</option>

          {(categories.find((category) => category.id === editingProduct.category)
            ?.subcategories || []
          ).map((subcategory) => (
            <option key={subcategory.id} value={subcategory.id}>
              {subcategory.name}
            </option>
          ))}
        </select>

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            value={editingProduct.price}
            onChange={(event) =>
              setEditingProduct({
                ...editingProduct,
                price: event.target.value,
              })
            }
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
            placeholder="Ціна, грн"
            type="number"
          />

          <input
            value={editingProduct.oldPrice || ""}
            onChange={(event) =>
              setEditingProduct({
                ...editingProduct,
                oldPrice: event.target.value,
              })
            }
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
            placeholder="Стара ціна, якщо є"
            type="number"
          />
        </div>

        <input
          value={editingProduct.image || ""}
          onChange={(event) =>
            setEditingProduct({ ...editingProduct, image: event.target.value })
          }
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
          placeholder="Посилання на фото"
        />

        <textarea
          value={editingProduct.description || ""}
          onChange={(event) =>
            setEditingProduct({
              ...editingProduct,
              description: event.target.value,
            })
          }
          rows={3}
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
          placeholder="Короткий опис"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            value={editingProduct.unit || ""}
            onChange={(event) =>
              setEditingProduct({ ...editingProduct, unit: event.target.value })
            }
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
            placeholder="Обʼєм / кількість"
          />

          <input
            value={editingProduct.packageInfo || ""}
            onChange={(event) =>
              setEditingProduct({
                ...editingProduct,
                packageInfo: event.target.value,
              })
            }
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
            placeholder="Упаковка"
          />
        </div>

        <textarea
          value={editingProduct.details || ""}
          onChange={(event) =>
            setEditingProduct({
              ...editingProduct,
              details: event.target.value,
            })
          }
          rows={5}
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
          placeholder="Детальний опис товару"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            value={editingProduct.composition || ""}
            onChange={(event) =>
              setEditingProduct({
                ...editingProduct,
                composition: event.target.value,
              })
            }
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
            placeholder="Склад"
          />

          <input
            value={editingProduct.statusLabel || ""}
            onChange={(event) =>
              setEditingProduct({
                ...editingProduct,
                statusLabel: event.target.value,
              })
            }
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
            placeholder="Статус"
          />
        </div>

        <label className="flex items-center gap-3 rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-stone-700">
          <input
            type="checkbox"
            checked={Boolean(editingProduct.popular)}
            onChange={(event) =>
              setEditingProduct({
                ...editingProduct,
                popular: event.target.checked,
              })
            }
          />
          Показувати як популярний товар
        </label>

        <label className="flex items-center gap-3 rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-stone-700">
          <input
            type="checkbox"
            checked={Boolean(editingProduct.active)}
            onChange={(event) =>
              setEditingProduct({
                ...editingProduct,
                active: event.target.checked,
              })
            }
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
)}


  {adminTab === "analytics" && (
  <section className="rounded-3xl bg-white p-6 shadow-sm">
    <h2 className="text-2xl font-black text-stone-950">Аналітика</h2>

    {!analytics && (
      <div className="mt-6 rounded-3xl bg-stone-50 p-8 text-center text-stone-500">
        Аналітика ще не завантажена.
      </div>
    )}

{analytics && (
  <>
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      <div className="rounded-3xl bg-stone-50 p-5">
        <p className="text-sm text-stone-500">Замовлень</p>
        <p className="mt-2 text-3xl font-black text-stone-950">
          {analytics.totalOrders}
        </p>
      </div>

      <div className="rounded-3xl bg-stone-50 p-5">
        <p className="text-sm text-stone-500">Оборот</p>
        <p className="mt-2 text-3xl font-black text-stone-950">
          {formatUAH(analytics.totalRevenue)}
        </p>
      </div>

      <div className="rounded-3xl bg-stone-50 p-5">
        <p className="text-sm text-stone-500">Середній чек</p>
        <p className="mt-2 text-3xl font-black text-stone-950">
          {formatUAH(analytics.averageOrderValue)}
        </p>
      </div>
    </div>

    {/* 🔥 ВОТ ЭТО ДОБАВЬ */}
    <AnalyticsCharts analytics={analytics} />

    <h3 className="mt-8 text-xl font-black text-stone-950">
      Товари, які найчастіше купують
    </h3>
  </>
)}


  </section>
)}


    </main>
  );
}