import { formatUAH } from "./formatUAH.js";
import { isProductAvailable } from "./products.js";
import { isSupplierOrderProduct } from "./cartSupplierRules.js";

export const GUIDE_SEEN_KEY = "evergreen_guide_seen_v1";
export const GUIDE_ACTIVE_KEY = "evergreen_guide_active_v1";

export function readGuideMode(browser) {
  try { if (browser.sessionStorage.getItem(GUIDE_ACTIVE_KEY) === "1") return "active"; } catch {}
  try { if (browser.localStorage.getItem(GUIDE_SEEN_KEY) === "1") return "closed"; } catch {}
  return "new";
}

export function saveGuideMode(browser, mode) {
  try { browser.localStorage.setItem(GUIDE_SEEN_KEY, "1"); } catch {}
  try {
    if (mode === "active") browser.sessionStorage.setItem(GUIDE_ACTIVE_KEY, "1");
    else browser.sessionStorage.removeItem(GUIDE_ACTIVE_KEY);
  } catch {}
}

const catalogAction = { label: "До каталогу", view: "catalog" };
const cartAction = { label: "Перевірити кошик", view: "cart" };

// Advice uses existing availability and order-group calculations; it never changes an order.
export function getShoppingTip({ view, product, groups = [], groupId, cartCount = 0, catalogCount, completed = false }) {
  if (["success", "success-preview"].includes(view)) {
    return completed
      ? { id: "done", step: 2, title: "Тепер ми на зв’язку!", text: "Дочекайтеся повідомлення про готовність. Потім заберіть покупки в Evergreen: Білицька, 20, щодня 09:00–21:00.", done: true }
      : { id: "pickup", step: 2, title: "Коли забирати покупки?", text: "Після оформлення ми зв’яжемося з вами. Перед візитом дочекайтеся повідомлення про готовність.", action: catalogAction };
  }

  if (view === "cart" || view === "checkout") {
    const group = groups.find(item => item.id === groupId) || groups[0];
    if (!group) return { id: "empty", step: 0, title: "Почнімо з вашого списку", text: "Кошик поки порожній. Оберіть потрібне в каталозі — я підкажу, як оформити покупку.", action: catalogAction };
    if (!group.isValid) return { id: "blocked", step: 1, title: "Перевірмо обрану групу", text: group.message || "Оформлення цієї групи зараз недоступне. Перевірте її товари та умови.", action: catalogAction };
    const separate = groups.length > 1 ? "Кожну групу оформлюємо окремо. " : "";
    if (group.missingAmount > 0) return {
      id: "minimum", step: 1, title: "Ще трохи до мінімуму",
      text: separate + "До мінімуму групи «" + group.title + "» бракує " + formatUAH(group.missingAmount) + ". Додавайте товари саме цього постачальника.",
      action: group.supplierId ? { label: "Товари цього постачальника", supplierId: group.supplierId } : catalogAction,
    };
    if (view === "checkout") return { id: "details", step: 1, title: "Як з вами зв’язатися?", text: separate + "Вкажіть ім’я та телефон або Telegram. Реєстрація не обов’язкова. Перевірте дані й натисніть «Оформити обрану групу»." };
    return {
      id: "cart", step: 1, title: groups.length > 1 ? "Одна група — одне замовлення" : "Перевіримо ваш кошик",
      text: separate + (group.type === "in_stock" ? "Для наявних товарів мінімуму постачальника немає." : group.minOrderAmount > 0 ? "Мінімум обраної групи виконано." : "Для цієї групи немає мінімальної суми.") + " Перевірте кількість і перейдіть до оформлення.",
      action: group.canCheckout ? { label: "До оформлення", view: "checkout" } : undefined,
    };
  }

  if (view === "product" && product) {
    if (!isProductAvailable(product)) return { id: "unavailable", step: 0, title: "Оберімо інший товар", text: "Цей товар зараз недоступний для замовлення. У каталозі можна переглянути інші варіанти.", action: catalogAction };
    const supplierOrder = isSupplierOrderProduct(product);
    const minimum = Number(product.supplier?.minOrderAmount);
    const terms = Number.isFinite(minimum) && product.supplier
      ? minimum > 0 ? "Мінімум цього постачальника — " + formatUAH(minimum) + "." : "У цього постачальника немає мінімальної суми."
      : "Умови постачальника вказані в картці.";
    return {
      id: "product", step: 0, title: supplierOrder ? "Цей товар — під замовлення" : "Цей товар є в Evergreen",
      text: (supplierOrder ? terms : "Можна обрати один товар, без мінімуму постачальника.") + " Перевірте фасування й додайте потрібну кількість до кошика.",
      action: cartCount > 0 ? cartAction : undefined,
    };
  }

  if (view === "catalog" && catalogCount === 0) return { id: "catalog-empty", step: 0, title: "Спробуймо інші умови", text: "За поточними умовами товарів немає. Перегляньте інший розділ — «Є в наявності» або «Під замовлення» — чи змініть фільтри.", action: cartCount > 0 ? cartAction : undefined };
  if (view === "catalog" || view === "product") return {
    id: "catalog", step: 0, title: cartCount > 0 ? "Ваш список уже в кошику" : "Що потрібно для дому?",
    text: cartCount > 0 ? "Можна продовжити покупки або перейти до кошика. Там перевіримо групи та умови замовлення." : "Оберіть категорію та потрібні товари. У картці видно ціну, фасування і статус: «Є в наявності» або «Під замовлення».",
    action: cartCount > 0 ? cartAction : undefined,
  };
  if (["home", "how-it-works", "contacts"].includes(view)) return {
    id: "welcome", step: 0, title: "Покупки разом із Зернятком",
    text: "Спершу оберіть товари для дому. Потім перевіримо кошик і залишимо контакт для самовивозу. Підказуватиму по ходу покупки.",
    action: catalogAction,
  };
  return null;
}
