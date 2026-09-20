import { Menu, ArrowUpRight, UserRound, Settings, ShoppingBasket, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import logo from "../img/logo_evergreen.webp";
import { getPathForView } from "../utils/routes.js";
import MobileNav from "./MobileNav.jsx";

export default function Header({
  view, setView, onContactsClick, isAdmin = false, customer = null,
  cartCount = 0, onSearchOpen, onSearchClose, isSearchOpen = false,
  onHelpOpen, onFeedbackOpen,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    const update = () => document.documentElement.style.setProperty("--eg-header-offset", `${Math.ceil(headerRef.current?.getBoundingClientRect().height || 88)}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(headerRef.current);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--eg-header-offset");
    };
  }, []);

  useEffect(() => { setMenuOpen(false); }, [view]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const resize = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", resize);
    return () => desktop.removeEventListener("change", resize);
  }, []);

  function navigate(event, target) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setMenuOpen(false);
    onSearchClose?.();
    target === "contacts" ? onContactsClick() : setView(target);
  }

  const items = [["home", "Головна"], ["how-it-works", "Як це працює?"], ["contacts", "Контакти"]];
  const accountView = customer ? "account" : "customer-auth";

  return (
    <header ref={headerRef} className="eg-site-header shop-header">
      <div className="shop-container shop-header-row">
        <a href="/" onClick={event => navigate(event, "home")} className="shop-logo" aria-label="Evergreen coffee — головна">
          <img src={logo} alt="Evergreen coffee" width="134" height="70" />
        </a>
        <nav className="shop-desktop-nav" aria-label="Головна навігація">
          {items.map(([target, label]) => (
            <a key={target} href={getPathForView(target)} onClick={event => navigate(event, target)} aria-current={view === target ? "page" : undefined}>{label}</a>
          ))}
        </nav>
        <div className="shop-header-actions">
          <a href="/catalog" onClick={event => navigate(event, "catalog")} className="shop-button shop-header-catalog">Каталог <ArrowUpRight size={17} aria-hidden="true" /></a>
          <a className="shop-account" href={getPathForView(accountView)} onClick={event => navigate(event, accountView)} aria-label={customer ? "Особистий кабінет" : "Увійти"}>
            <UserRound size={20} aria-hidden="true" /><span>{customer ? "Кабінет" : "Увійти"}</span>
          </a>
          {isAdmin && <a className="shop-icon-button shop-admin-link" href="/admin" onClick={event => navigate(event, "admin")} aria-label="Адмін-панель"><Settings size={20} aria-hidden="true" /></a>}
          {view === "catalog" && onSearchOpen && (
            <button type="button" className="shop-icon-button shop-header-search" onClick={isSearchOpen ? onSearchClose : onSearchOpen} aria-label={isSearchOpen ? "Закрити пошук" : "Пошук товарів"} aria-haspopup="dialog" aria-expanded={isSearchOpen}>
              <Search size={21} aria-hidden="true" />
            </button>
          )}
          <a className="shop-icon-button shop-header-cart" href="/cart" onClick={event => navigate(event, "cart")} aria-label={cartCount > 0 ? `Кошик, товарів: ${cartCount}` : "Кошик"} aria-current={view === "cart" ? "page" : undefined}>
            <ShoppingBasket size={22} aria-hidden="true" />
            {cartCount > 0 && <span className="shop-header-cart-count" aria-hidden="true">{cartCount > 99 ? "99+" : cartCount}</span>}
          </a>
          <button className="shop-icon-button shop-menu-toggle" type="button" onClick={() => { onSearchClose?.(); setMenuOpen(true); }} aria-expanded={menuOpen} aria-controls="shop-mobile-menu" aria-haspopup="dialog">
            <Menu size={21} aria-hidden="true" /><span>Меню</span>
          </button>
        </div>
      </div>
      {menuOpen && <MobileNav view={view} onNavigate={navigate} onClose={() => setMenuOpen(false)} cartCount={cartCount} customer={customer} isAdmin={isAdmin}
        onHelpOpen={() => { setMenuOpen(false); onHelpOpen?.(); }}
        onFeedbackOpen={() => { setMenuOpen(false); onFeedbackOpen?.(); }}
      />}
    </header>
  );
}
