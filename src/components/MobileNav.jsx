import { ArrowUpRight, Home, LayoutGrid, MapPin, CircleHelp, MessageSquare, Settings, ShoppingBasket, UserRound, X } from "lucide-react";
import Modal from "./Modal.jsx";
import { getPathForView } from "../utils/routes.js";

/** Sections are available only after an intentional menu tap, away from the scroll area. */
export default function MobileNav({ view, onNavigate, onClose, onHelpOpen, onFeedbackOpen, cartCount = 0, customer = null, isAdmin = false }) {
  const items = [
    { view: "catalog", label: "Каталог товарів", Icon: LayoutGrid },
    { view: "cart", label: "Кошик", Icon: ShoppingBasket, count: cartCount },
    { view: "home", label: "Головна", Icon: Home },
    { view: "how-it-works", label: "Як це працює?", Icon: CircleHelp },
    { view: "contacts", label: "Контакти", Icon: MapPin },
    { view: customer ? "account" : "customer-auth", label: customer ? "Мій кабінет" : "Увійти", Icon: UserRound },
    ...(isAdmin ? [{ view: "admin", label: "Адмін-панель", Icon: Settings }] : []),
  ];

  return (
    <Modal label="Меню сайту" onClose={onClose} className="eg-storefront shop-navigation-dialog" maxWidth={440}>
      <div className="shop-navigation-heading">
        <h2>Меню</h2>
        <button type="button" className="shop-icon-button" onClick={onClose} aria-label="Закрити меню">
          <X size={22} aria-hidden="true" />
        </button>
      </div>
      <nav id="shop-mobile-menu" className="shop-navigation-links" aria-label="Мобільна навігація">
        {items.map(({ view: target, label, Icon, count }) => (
          <a key={target} href={getPathForView(target)} onClick={event => onNavigate(event, target)} aria-current={view === target ? "page" : undefined}>
            <Icon size={21} aria-hidden="true" />
            <span>{label}</span>
            {count > 0 && <span className="shop-navigation-count" aria-label={`Товарів: ${count}`}>{count}</span>}
            <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        ))}
      </nav>
      <div className="shop-navigation-footer">
        <div className="shop-navigation-support" role="group" aria-label="Допомога та відгуки">
          <button type="button" onClick={onHelpOpen} aria-haspopup="dialog">
            <CircleHelp size={20} aria-hidden="true" /><span>Допомога із замовленням</span>
          </button>
          <button type="button" onClick={onFeedbackOpen} aria-haspopup="dialog">
            <MessageSquare size={20} aria-hidden="true" /><span>Залишити відгук</span>
          </button>
        </div>
        <a href="https://t.me/EvergreeenCofee" target="_blank" rel="noopener noreferrer">
          Написати в Telegram <ArrowUpRight size={17} aria-hidden="true" />
        </a>
      </div>
    </Modal>
  );
}
