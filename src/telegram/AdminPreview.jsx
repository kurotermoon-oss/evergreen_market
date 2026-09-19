import { useMemo } from "react";
import AdminApp from "./AdminApp.jsx";

function createPreviewClient() {
  const scenario = new URLSearchParams(location.search).get("scenario");
  const product = { id: "demo-milk", name: "Демонстраційне молоко", active: true, stockStatus: "preorder", fulfillmentType: "supplier_order", supplierId: "demo-supplier", supplier: { id: "demo-supplier", name: "Демо-постачальник", isActive: true, minOrderAmount: 500 }, supplierProductUrl: "https://example.com/product" };
  const orders = ["new", "confirmed", "preparing", "ready", "completed", "cancelled"].map((status, index) => ({
    id: `demo-${index}`, orderNumber: 1047 + index, customerName: ["Олена · демонстрація", "Максим · демонстрація", "Анна · демонстрація", "Дмитро · демонстрація"][index % 4],
    customerPhone: "+380000000000", customerTelegram: "", total: 288, status, isFinal: index > 3,
    createdAt: "2026-09-17T09:30:00Z", updatedAt: "2026-09-17T09:30:00Z", paymentStatus: "unpaid", paymentMethod: "На місці", deliveryType: "pickup",
    comment: "Демонстраційний запис. Заберу після роботи, прошу перевірити упаковку.", itemCount: 3,
    items: [
      { productId: "demo-milk", name: "Молоко безлактозне ультрапастеризоване 2,5% · демонстраційний товар", price: 68, quantity: 2, total: 136, product },
      { productId: "demo-hidden", name: "Вівсяний напій · демонстраційний товар", price: 92, quantity: 1, total: 92, product: { ...product, id: "demo-hidden", active: false, stockStatus: "out_of_stock", supplierProductUrl: "javascript:alert(1)" } },
      { productId: "demo-deleted", name: "Товар, видалений із каталогу", price: 60, quantity: 1, total: 60, product: null },
    ], statusHistory: [{ at: "2026-09-17T09:30:00Z", label: "Замовлення створено" }],
  }));
  return {
    session: async () => {
      if (scenario === "denied") throw Object.assign(new Error("Цей Telegram-акаунт не має доступу до керування."), { status: 403 });
      return { user: { id: "demo", name: "Адміністратор · демо" } };
    },
    async list({ scope, status, q, offset = 0 }) {
      const active = orders.filter(o => !o.isFinal);
      const filtered = orders.filter(o => (scope === "history" ? o.isFinal : !o.isFinal) && (status === "all" || status === o.status) && [o.orderNumber, o.customerName, o.customerPhone].join(" ").toLowerCase().includes(q.toLowerCase()));
      return { orders: structuredClone(filtered.slice(Number(offset), Number(offset) + 50)), total: filtered.length, activeCount: active.length, nextOffset: null };
    },
    async detail(id) {
      const order = orders.find(o => o.id === id);
      if (!order) throw Object.assign(new Error("Замовлення не знайдено."), { status: 404 });
      return { order: structuredClone(order) };
    },
    async action(id, { action, expectedStatus, reason }) {
      const order = orders.find(o => o.id === id);
      if (scenario === "conflict") { order.status = "ready"; throw Object.assign(new Error("Замовлення вже змінилося. Перевірте оновлений статус."), { status: 409 }); }
      if (scenario === "expired") throw Object.assign(new Error("Сесія завершилась. Відкрийте застосунок ще раз через меню бота."), { status: 401 });
      if (order.status !== expectedStatus) throw Object.assign(new Error("Замовлення вже змінилося."), { status: 409 });
      order.status = { confirm: "confirmed", start_preparing: "preparing", mark_ready: "ready", complete: "completed", cancel: "cancelled" }[action];
      order.isFinal = ["completed", "cancelled"].includes(order.status);
      order.cancelReason = reason;
      order.statusHistory.push({ at: new Date().toISOString(), label: `${order.status} · демонстрація` });
      return { order: structuredClone(order) };
    },
    clear() {},
  };
}
export default function AdminPreview() {
  const client = useMemo(createPreviewClient, []);
  return <AdminApp previewClient={client} />;
}
