// Loaded only by the explicitly enabled, local development preview.
import { useMemo, useState } from "react";
import AdminView from "./AdminView.jsx";
import AccountView from "./AccountView.jsx";
import SuccessView from "./SuccessView.jsx";
import AdminProductEditModal from "../components/admin/AdminProductEditModal.jsx";
import { EMPTY_DRAFT_PRODUCT } from "../data/defaults.js";

const date = "2026-09-09T09:15:00.000Z";
const demoCustomer = { id: "demo-customer", name: "Демонстраційний покупець", phone: "", telegram: "", createdAt: date, ordersCount: 3, activeOrdersCount: 2, completedOrdersCount: 1, cancelledOrdersCount: 0, completedRevenue: 480, isFullyVerified: false, isPhoneVerified: false, isTelegramVerified: false, blockedItems: [] };
const demoOrders = ["new", "ready", "completed"].map((status, i) => ({
  id: `demo-order-${i}`, orderNumber: `DEMO-00${i + 1}`, status, createdAt: date, customerName: "Демонстраційний покупець", customerPhone: "", customerTelegram: "", deliveryType: "pickup", paymentMethod: "На місці", total: 480,
  items: [{ id: `demo-item-${i}`, name: "Приклад товару з довгою назвою для перевірки перенесення", quantity: 4, price: 120, total: 480 }], comment: i === 0 ? "Демонстраційне замовлення для перевірки інтерфейсу." : "",
}));
const demoAnalytics = { completedOrdersCount: 1, totalRevenue: 480, totalCost: 400, totalProfit: 80, ordersByDay: [{ date: "07.09", orders: 1, revenue: 240, profit: 40 }, { date: "08.09", orders: 2, revenue: 600, profit: 100 }, { date: "09.09", orders: 1, revenue: 480, profit: 80 }], topProducts: [{ name: "Демонстраційний товар", purchaseCount: 4, revenue: 480, profit: 80 }] };
const blockedWrite = async () => { throw new Error("Демонстрація: зміни не зберігаються."); };

export default function DesignPreview({ mode, products = [], categories = [], setView }) {
  const [draft, setDraft] = useState({ ...EMPTY_DRAFT_PRODUCT });
  const [editing, setEditing] = useState(null);
  const [customer, setCustomer] = useState(demoCustomer);
  const [notice, setNotice] = useState("");
  const [accountScenario, setAccountScenario] = useState("normal");
  const [analyticsFilters, setAnalyticsFilters] = useState({ preset: "7d", from: "", to: "" });
  const previewProducts = useMemo(() => products.slice(0, 60).map(p => ({ ...p, supplierId: "demo-supplier", supplier: { name: "Milk Diller · демо" } })), [products]);
  const suppliers = useMemo(() => [{ id: "demo-supplier", name: "Milk Diller · демо", active: true, minOrderAmount: 400, availabilitySyncAdapter: "milkdiller_html", availabilitySyncEnabled: false }], []);
  const previewApi = useMemo(() => ({
    getAdminCustomers: async ({ search = "" } = {}) => ({ customers: demoCustomer.name.toLowerCase().includes(search.toLowerCase()) ? [demoCustomer] : [] }),
    getAdminCustomerOrders: async () => ({ orders: demoOrders }),
    getAdminGuestActivity: async () => ({ guests: [{ key: "demo-guest", guestId: "demo-guest", mainName: "Демонстраційний гість", clientIp: "192.0.2.1", ordersCount: 3, ordersTodayCount: 1, activeOrdersCount: 2, cancelledOrdersCount: 0, completedRevenue: 480, totalRevenue: 1440, lastOrderAt: date, risk: "low", orders: demoOrders }] }),
    getAdminSecurityBlockedCustomers: async () => ({ blockedCustomers: [] }),
    getAdminSupplierSync: async () => ({ supplier: { id: "demo-supplier", name: "Milk Diller · демо", adapter: "milkdiller_html", enabled: false, paused: false, lastStatus: "success", lastRunAt: date }, stats: { products: previewProducts.length, mapped: 0, available: previewProducts.length, unavailable: 0, errors: 0 }, products: previewProducts.map(p => ({ ...p, syncEnabled: false, statusOverride: "auto", productUrl: "", remoteStatus: "unknown", lastCheckedAt: date })), runs: [] }),
    createBlockedCustomer: blockedWrite, deleteBlockedCustomer: blockedWrite, createAdminSecurityBlockedCustomer: blockedWrite, deleteAdminSecurityBlockedCustomer: blockedWrite,
    updateAdminSupplierSyncSettings: blockedWrite, runAdminSupplierSync: blockedWrite, autoMapAdminSupplierProducts: blockedWrite, updateAdminSupplierSyncProduct: blockedWrite,
  }), [previewProducts]);
  const action = async () => { setNotice("Демонстрація: зміни не зберігаються."); return false; };
  const noop = async () => {};

  return <>
    <div className="eg-admin-demo-note" role="status">Демонстраційні дані · зміни не зберігаються{notice && <strong> · {notice}</strong>}<span className="ml-3"><a href="/preview/admin">Адмінка</a> · <a href="/preview/account">Кабінет</a> · <a href="/preview/success">Підтвердження</a></span></div>
    {mode === "admin" && <AdminView adminApi={previewApi} categories={categories} adminCategories={categories} products={previewProducts} suppliers={suppliers} orders={demoOrders} feedback={[{ id: "demo-feedback", type: "wish", status: "new", name: "Демонстраційний покупець", message: "Приклад побажання: розширити вибір кави в каталозі.", createdAt: date }]} draftProduct={draft} setDraftProduct={setDraft} startEditProduct={p => setEditing({ ...EMPTY_DRAFT_PRODUCT, ...p })} addDraftProduct={action} importProductsCsv={action} toggleProductActive={action} deleteProduct={action} createSupplier={action} updateSupplier={action} deleteSupplier={action} refreshAdminData={noop} refreshPublicData={noop} updateOrderAction={action} updateFeedbackStatus={action} logoutAdmin={() => setView("home")} analytics={demoAnalytics} analyticsFilters={analyticsFilters} updateAnalyticsFilters={values => setAnalyticsFilters(current => ({ ...current, ...values }))} createCategory={action} updateCategory={action} applyCategoryMarkup={action} deleteCategory={action} createSubcategory={action} updateSubcategory={action} deleteSubcategory={action} />}
    {mode === "account" && <label className="block mx-auto max-w-6xl px-6 pt-4 text-sm">Перевірка профілю: <select aria-label="Сценарій профілю" value={accountScenario} onChange={event => setAccountScenario(event.target.value)}><option value="normal">З замовленнями</option><option value="empty">Без замовлень</option><option value="error">Помилка завантаження</option></select></label>}
    {mode === "account" && <AccountView key={accountScenario} customer={customer} setCustomer={setCustomer} customerOrders={accountScenario === "empty" ? [] : demoOrders} loadCustomerOrders={async () => { if (accountScenario === "error") throw new Error("Preview: orders unavailable"); }} customerLogout={() => setView("home")} updateCustomerProfile={async data => { setCustomer(current => ({ ...current, ...data })); return { ...customer, ...data }; }} setView={setView} />}
    {mode === "success" && <SuccessView createdOrder={demoOrders[0]} customer={demoCustomer} setCart={noop} setOrderMessage={noop} setCreatedOrder={noop} setView={setView} />}
    {editing && <AdminProductEditModal categories={categories} suppliers={suppliers} editingProduct={editing} setEditingProduct={setEditing} saveEditedProduct={action} cancelEditProduct={() => setEditing(null)} />}
  </>;
}
