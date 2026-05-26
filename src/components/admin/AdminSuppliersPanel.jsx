import { useMemo, useState } from "react";
import Icon from "../Icon.jsx";
import { formatUAH } from "../../utils/formatUAH.js";

const EMPTY_SUPPLIER = {
  name: "",
  minOrderAmount: "",
  isActive: true,
  comment: "",
};

function getFieldClass() {
  return "eg-field w-full rounded-[1.2rem] border border-stone-200 bg-white/90 px-4 py-3 text-sm outline-none focus:border-emerald-700 focus:bg-white";
}

function SupplierForm({
  value,
  onChange,
  onSubmit,
  submitLabel,
  onCancel,
}) {
  function updateField(field, fieldValue) {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  }

  return (
    <div className="eg-glass eg-premium-card rounded-[2rem] p-5">
      <div className="grid gap-3 lg:grid-cols-[1fr_190px_auto] lg:items-start">
        <input
          value={value.name || ""}
          onChange={(event) => updateField("name", event.target.value)}
          className={getFieldClass()}
          placeholder="Назва постачальника"
        />

        <input
          value={value.minOrderAmount || ""}
          onChange={(event) =>
            updateField("minOrderAmount", event.target.value)
          }
          className={getFieldClass()}
          placeholder="Мінімум, грн"
          type="number"
          min="0"
        />

        <label className="eg-card flex min-h-[46px] cursor-pointer items-center gap-2 rounded-[1.2rem] border border-stone-200 bg-white/90 px-4 text-sm font-black text-stone-800">
          <input
            type="checkbox"
            checked={value.isActive !== false}
            onChange={(event) => updateField("isActive", event.target.checked)}
            className="h-4 w-4 accent-emerald-900"
          />
          Активний
        </label>
      </div>

      <textarea
        value={value.comment || ""}
        onChange={(event) => updateField("comment", event.target.value)}
        className={`${getFieldClass()} mt-3 resize-y`}
        rows={3}
        placeholder="Коментар для адмінки"
      />

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="eg-button rounded-[1.15rem] border border-stone-300 bg-white px-5 py-3 text-sm font-black text-stone-900 hover:bg-stone-100"
          >
            Скасувати
          </button>
        )}

        <button
          type="button"
          onClick={onSubmit}
          className="eg-button eg-sweep rounded-[1.15rem] bg-emerald-900 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

export default function AdminSuppliersPanel({
  suppliers = [],
  products = [],
  createSupplier,
  updateSupplier,
  deleteSupplier,
}) {
  const [draftSupplier, setDraftSupplier] = useState(EMPTY_SUPPLIER);
  const [editingSupplierId, setEditingSupplierId] = useState("");
  const [editingSupplier, setEditingSupplier] = useState(null);

  const productCountsBySupplier = useMemo(() => {
    return products.reduce((result, product) => {
      const supplierId = String(product.supplierId || "");

      if (supplierId) {
        result[supplierId] = (result[supplierId] || 0) + 1;
      }

      return result;
    }, {});
  }, [products]);

  async function handleCreateSupplier() {
    if (!String(draftSupplier.name || "").trim()) return;

    await createSupplier?.({
      ...draftSupplier,
      minOrderAmount: Number(draftSupplier.minOrderAmount || 0),
    });

    setDraftSupplier(EMPTY_SUPPLIER);
  }

  function startEditSupplier(supplier) {
    setEditingSupplierId(supplier.id);
    setEditingSupplier({
      ...supplier,
      minOrderAmount: String(supplier.minOrderAmount || ""),
    });
  }

  async function saveEditedSupplier() {
    if (!editingSupplierId || !editingSupplier?.name) return;

    await updateSupplier?.(editingSupplierId, {
      ...editingSupplier,
      minOrderAmount: Number(editingSupplier.minOrderAmount || 0),
    });

    setEditingSupplierId("");
    setEditingSupplier(null);
  }

  async function toggleSupplierActive(supplier) {
    await updateSupplier?.(supplier.id, {
      ...supplier,
      isActive: supplier.isActive === false,
    });
  }

  async function handleDeleteSupplier(supplier) {
    const count = productCountsBySupplier[supplier.id] || 0;

    if (count > 0) {
      alert(
        "Постачальник використовується у товарах. Спочатку перенесіть товари або вимкніть постачальника."
      );
      return;
    }

    if (!window.confirm("Видалити цього постачальника?")) return;

    await deleteSupplier?.(supplier.id);
  }

  return (
    <section className="space-y-6">
      <div className="eg-glass eg-premium-card rounded-[2.5rem] p-6 lg:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">
              Постачальники
            </p>

            <h2 className="mt-2 text-3xl font-black text-stone-950">
              Мінімальні замовлення
            </h2>
          </div>

          <span className="w-fit rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-950">
            {suppliers.length} постачальників
          </span>
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-600">
          Мінімальна сума задається тут один раз і застосовується до всіх
          товарів під замовлення цього постачальника.
        </p>
      </div>

      <SupplierForm
        value={draftSupplier}
        onChange={setDraftSupplier}
        onSubmit={handleCreateSupplier}
        submitLabel="Додати постачальника"
      />

      <div className="eg-stagger space-y-3">
        {suppliers.map((supplier) => {
          const productsCount = productCountsBySupplier[supplier.id] || 0;
          const isEditing = editingSupplierId === supplier.id;

          if (isEditing) {
            return (
              <SupplierForm
                key={supplier.id}
                value={editingSupplier}
                onChange={setEditingSupplier}
                onSubmit={saveEditedSupplier}
                submitLabel="Зберегти"
                onCancel={() => {
                  setEditingSupplierId("");
                  setEditingSupplier(null);
                }}
              />
            );
          }

          return (
            <div
              key={supplier.id}
              className="eg-card eg-premium-card grid gap-4 rounded-[1.6rem] border border-stone-200 bg-white/88 p-4 backdrop-blur lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black text-stone-950">
                    {supplier.name}
                  </h3>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      supplier.isActive !== false
                        ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200"
                        : "bg-stone-100 text-stone-600 ring-1 ring-stone-200"
                    }`}
                  >
                    {supplier.isActive !== false ? "Активний" : "Вимкнений"}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600">
                  <span className="font-black text-stone-950">
                    Мінімум: {formatUAH(supplier.minOrderAmount)}
                  </span>

                  <span>Товарів: {productsCount}</span>

                  <span>ID: {supplier.id}</span>
                </div>

                {supplier.comment && (
                  <p className="mt-2 text-sm leading-6 text-stone-500">
                    {supplier.comment}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 justify-self-start lg:justify-self-end">
                <button
                  type="button"
                  onClick={() => startEditSupplier(supplier)}
                  className="eg-icon-button grid h-11 w-11 place-items-center rounded-2xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
                  aria-label="Редагувати постачальника"
                  title="Редагувати"
                >
                  <Icon name="edit" size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => toggleSupplierActive(supplier)}
                  className="eg-icon-button grid h-11 w-11 place-items-center rounded-2xl border border-emerald-100 bg-white text-emerald-800 hover:bg-emerald-50"
                  aria-label="Змінити активність постачальника"
                  title={
                    supplier.isActive !== false ? "Вимкнути" : "Увімкнути"
                  }
                >
                  <Icon
                    name={supplier.isActive !== false ? "eyeOff" : "eye"}
                    size={18}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteSupplier(supplier)}
                  className="eg-icon-button grid h-11 w-11 place-items-center rounded-2xl border border-red-200 bg-white text-red-600 hover:bg-red-50"
                  aria-label="Видалити постачальника"
                  title="Видалити"
                >
                  <Icon name="trash" size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
