import { formatUAH } from "../../utils/formatUAH.js";
import { ArrowUpRight, Pencil } from "lucide-react";
import { getProductPath } from "../../utils/routes.js";
import { getStockLabel, getStockTone, isSupplierOrderProduct } from "../../utils/products.js";
import OrderActions from "./OrderActions.jsx";
import {
  isFinalOrder,
  getOrderStatusClass,
  getOrderStatusLabel,
} from "./orderUiConfig.js";

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoPill({ children }) {
  return (
    <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-stone-600 ring-1 ring-stone-200">
      {children}
    </span>
  );
}

function getSupplierLink(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : "";
  } catch {
    return "";
  }
}

function OrderItem({ item, product, startEditProduct }) {
  const supplierLink = getSupplierLink(product?.supplierProductUrl);
  const stockQuantity = product?.stockQuantity;
  const hasStockQuantity = !isSupplierOrderProduct(product) && stockQuantity !== null &&
    stockQuantity !== undefined && stockQuantity !== "" && Number.isFinite(Number(stockQuantity));

  return (
    <div className="eg-order-item">
      <div className="eg-order-item-main">
        {product ? (
          <a className="eg-order-item-name" href={getProductPath(product.id)} target="_blank" rel="noopener noreferrer"
            aria-label={`Відкрити товар у новій вкладці: ${item.name}`}>
            <span>{item.name}</span><ArrowUpRight size={17} aria-hidden="true" />
          </a>
        ) : <p className="eg-order-item-name">{item.name}</p>}
        <p className="eg-order-item-quantity">{item.quantity} шт × {formatUAH(item.price)}</p>
        {product ? (
          <div className="eg-order-item-current">
            <span>Зараз у каталозі:</span>
            <span className={`eg-order-item-stock ${getStockTone(product)}`}>{getStockLabel(product)}</span>
            {product.active === false && <span className="eg-order-item-stock bg-stone-100 text-stone-600">Приховано з вітрини</span>}
            {hasStockQuantity && <span>Обліковий залишок: {stockQuantity} шт.</span>}
            {isSupplierOrderProduct(product) && product.supplier?.name && <span>{product.supplier.name}</span>}
          </div>
        ) : <p className="eg-order-item-missing">Товар видалений або недоступний у каталозі. Дані замовлення збережені.</p>}
        {product && (
          <div className="eg-order-item-links">
            {supplierLink && <a href={supplierLink} target="_blank" rel="noopener noreferrer"
              aria-label={`Відкрити у постачальника в новій вкладці: ${item.name}`}>
              У постачальника <ArrowUpRight size={15} aria-hidden="true" />
            </a>}
            {startEditProduct && <button type="button" onClick={() => startEditProduct(product)}
              aria-label={`Редагувати товар: ${item.name}`}><Pencil size={14} aria-hidden="true" /> Редагувати товар</button>}
            {isSupplierOrderProduct(product) && !supplierLink && <span>Посилання постачальника не задане</span>}
          </div>
        )}
      </div>
      <strong className="eg-order-item-total">{formatUAH(item.total)}</strong>
    </div>
  );
}

export default function OrderCard({ order, productsById, startEditProduct, updateOrderAction }) {
  const final = isFinalOrder(order);

  async function handleAction(action) {
    if (action === "cancel") {
      const reason = window.prompt("Причина скасування замовлення:");
      if (reason === null) return;

      await updateOrderAction(order.id, action, { reason });
      return;
    }

    await updateOrderAction(order.id, action);
  }

  return (
    <div className="eg-order-card eg-card eg-premium-card rounded-[2rem] border border-stone-200 bg-white/85 p-5 backdrop-blur hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-900/10">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black text-emerald-700">
            #{order.orderNumber} · {formatDate(order.createdAt)}
          </p>

          <h3 className="mt-2 text-2xl font-black text-stone-950">
            {order.customerName}
          </h3>

          <div className="mt-3 flex flex-wrap gap-2">
            {order.customerPhone && <InfoPill>Телефон: {order.customerPhone}</InfoPill>}
            {order.customerTelegram && <InfoPill>Telegram: {order.customerTelegram}</InfoPill>}
            <InfoPill>
              {order.deliveryType === "pickup"
                ? "Самовивіз"
                : `Доставка: ${order.building || "-"}/${order.apartment || "-"}`}
            </InfoPill>
            <InfoPill>Оплата: {order.paymentMethod || "на місці"}</InfoPill>
          </div>

          <p className="mt-3 text-sm text-stone-500">
            Оплата здійснюється на місці після підтвердження.
          </p>

          {order.cancelReason && (
            <div className="eg-panel mt-4 rounded-[1.4rem] border border-red-100 bg-red-50/80 p-4 text-sm font-semibold text-red-700">
              Причина скасування: {order.cancelReason}
            </div>
          )}
        </div>

        <div className="eg-order-total shrink-0 rounded-[1.7rem] bg-stone-50/90 p-5 text-left shadow-sm ring-1 ring-stone-100 xl:min-w-[220px] xl:text-right">
          <p className="text-xs font-black uppercase tracking-wide text-stone-400">
            Сума
          </p>

          <p className="mt-1 text-3xl font-black text-stone-950">
            {formatUAH(order.total)}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 xl:justify-end">
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${getOrderStatusClass(
                order.status
              )}`}
            >
              {getOrderStatusLabel(order.status)}
            </span>
          </div>

          {order.finalizedAt && (
            <p className="mt-3 text-xs leading-5 text-stone-500">
              Завершено:
              <br />
              {formatDate(order.finalizedAt)}
            </p>
          )}
        </div>
      </div>

      <details className="eg-order-items eg-panel mt-5 rounded-[1.7rem] bg-stone-50/90 p-5">
        <summary>Склад замовлення · {order.items?.length || 0} поз. {order.comment && "· Є коментар"}</summary>

        <div className="mt-3 space-y-2">
          {(order.items || []).map((item) => (
            <OrderItem
              key={`${order.id}-${item.productId || item.id}-${item.name}`}
              item={item}
              product={item.productId ? productsById?.get(String(item.productId)) : null}
              startEditProduct={startEditProduct}
            />
          ))}
        </div>

        {order.comment && (
          <div className="mt-4 rounded-2xl bg-white/75 p-4 text-sm text-stone-600 ring-1 ring-stone-100">
            <span className="font-black text-stone-800">Коментар:</span>{" "}
            {order.comment}
          </div>
        )}
      </details>

      {!final && (
        <div className="mt-5 rounded-[1.7rem] bg-white/70 p-4 ring-1 ring-stone-100">
          <p className="mb-3 text-sm font-black text-stone-700">
            Дії із замовленням
          </p>

          <OrderActions order={order} onAction={handleAction} />
        </div>
      )}

      {final && (
        <details className="eg-panel mt-5 rounded-[1.7rem] bg-stone-50/90 p-5">
          <summary>Історія замовлення</summary>

          {!order.statusHistory?.length && (
            <p className="mt-2 text-sm text-stone-500">
              Історія дій відсутня.
            </p>
          )}

          <div className="mt-3 space-y-2">
            {(order.statusHistory || []).map((item, index) => (
              <div
                key={`${order.id}-history-${index}`}
                className="rounded-2xl bg-white/75 px-4 py-3 text-sm text-stone-600 ring-1 ring-stone-100"
              >
                <span className="font-black text-stone-800">
                  {formatDate(item.at)}
                </span>{" "}
                — <span>{item.label}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
