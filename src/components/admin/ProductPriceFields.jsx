import { useEffect, useMemo, useState } from "react";

function parsePriceValue(value) {
  const normalizedValue = String(value ?? "").trim().replace(",", ".");

  if (!normalizedValue) return null;

  const number = Number(normalizedValue);

  return Number.isFinite(number) ? number : null;
}

function formatMarkupPercent(value) {
  if (!Number.isFinite(value)) return "";

  return value.toFixed(2).replace(/\.?0+$/, "");
}

function getInitialMarkupPercent(product) {
  const costPrice = parsePriceValue(product?.costPrice);
  const price = parsePriceValue(product?.price);

  if (!costPrice || !price) return "";

  return formatMarkupPercent((price / costPrice - 1) * 100);
}

function calculateMarkupByPrice(costPrice, price) {
  const costPriceNumber = parsePriceValue(costPrice);
  const priceNumber = parsePriceValue(price);

  if (!costPriceNumber || priceNumber === null) return "";

  return formatMarkupPercent((priceNumber / costPriceNumber - 1) * 100);
}

function calculatePriceByMarkup(costPrice, markupPercent) {
  const costPriceNumber = parsePriceValue(costPrice);
  const markupPercentNumber = parsePriceValue(markupPercent);

  if (costPriceNumber === null || markupPercentNumber === null) return null;

  const calculatedPrice = costPriceNumber * (1 + markupPercentNumber / 100);

  if (!Number.isFinite(calculatedPrice)) return null;

  return Math.max(0, Math.round(calculatedPrice));
}

function formatUAHPreview(value) {
  return `${Number(value || 0).toLocaleString("uk-UA")} грн`;
}

function PriceFieldLabel({ title, children }) {
  return (
    <label className="grid gap-1.5 text-xs font-black text-stone-500">
      <span>{title}</span>
      {children}
    </label>
  );
}

export default function ProductPriceFields({
  product,
  updateFields,
  getFieldClass,
  compact = false,
}) {
  const [markupPercent, setMarkupPercent] = useState(() =>
    getInitialMarkupPercent(product)
  );
  const [priceSource, setPriceSource] = useState("price");

  const calculatedPrice = useMemo(
    () => calculatePriceByMarkup(product.costPrice, markupPercent),
    [product.costPrice, markupPercent]
  );

  useEffect(() => {
    setMarkupPercent(getInitialMarkupPercent(product));
    setPriceSource("price");
  }, [product.id]);

  useEffect(() => {
    if (priceSource === "markup") return;

    setMarkupPercent(calculateMarkupByPrice(product.costPrice, product.price));
  }, [product.costPrice, product.price, priceSource]);

  useEffect(() => {
    if (product.price || product.costPrice) return;

    setMarkupPercent("");
    setPriceSource("price");
  }, [product.price, product.costPrice]);

  function updatePriceFromMarkup(nextCostPrice, nextMarkupPercent) {
    const nextPrice = calculatePriceByMarkup(nextCostPrice, nextMarkupPercent);

    return nextPrice === null ? {} : { price: String(nextPrice) };
  }

  function handleCostPriceChange(value) {
    const nextPrice = calculatePriceByMarkup(value, markupPercent);

    if (priceSource === "markup" && nextPrice !== null) {
      updateFields({
        costPrice: value,
        price: String(nextPrice),
      });

      return;
    }

    setPriceSource("price");
    setMarkupPercent(calculateMarkupByPrice(value, product.price));

    updateFields({
      costPrice: value,
    });
  }

  function handlePriceChange(value) {
    setPriceSource("price");
    setMarkupPercent(calculateMarkupByPrice(product.costPrice, value));

    updateFields({ price: value });
  }

  function handleMarkupPercentChange(value) {
    setPriceSource("markup");
    setMarkupPercent(value);

    updateFields(updatePriceFromMarkup(product.costPrice, value));
  }

  const gridClass = compact
    ? "grid gap-2 sm:grid-cols-4"
    : "grid gap-3 sm:grid-cols-4";

  return (
    <div className="space-y-2.5">
      <div className={gridClass}>
        <PriceFieldLabel title="Ціна продажу, грн">
          <input
            value={product.price || ""}
            onChange={(event) => handlePriceChange(event.target.value)}
            placeholder="Ціна"
            type="number"
            min="0"
            max="999999"
            className={getFieldClass()}
          />
        </PriceFieldLabel>

        <PriceFieldLabel title="Собівартість, грн">
          <input
            value={product.costPrice || ""}
            onChange={(event) => handleCostPriceChange(event.target.value)}
            placeholder="Закупка"
            type="number"
            min="0"
            max="999999"
            className={getFieldClass()}
          />
        </PriceFieldLabel>

        <PriceFieldLabel title="Націнка, %">
          <input
            value={markupPercent}
            onChange={(event) => handleMarkupPercentChange(event.target.value)}
            placeholder="30"
            type="number"
            step="0.1"
            className={getFieldClass()}
          />
        </PriceFieldLabel>

        <PriceFieldLabel title="Стара ціна, грн">
          <input
            value={product.oldPrice || ""}
            onChange={(event) => updateFields({ oldPrice: event.target.value })}
            placeholder="Якщо є"
            type="number"
            min="0"
            max="999999"
            className={getFieldClass()}
          />
        </PriceFieldLabel>
      </div>

      <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-900">
        {calculatedPrice === null
          ? "Вкажіть собівартість і відсоток націнки, щоб автоматично заповнити ціну продажу."
          : `Розрахунок: ${formatUAHPreview(
              product.costPrice
            )} + ${markupPercent}% = ${formatUAHPreview(
              calculatedPrice
            )}. Ціна продажу оновлюється автоматично.`}
      </p>
    </div>
  );
}
