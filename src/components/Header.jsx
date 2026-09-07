import { Menu, X, ArrowUpRight, UserRound, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import logo from '../img/logo_evergreen.webp';
import { getPathForView } from '../utils/routes.js';

export default function Header({ view, setView, onContactsClick, isAdmin = false, customer = null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const toggleRef = useRef(null);
  useEffect(() => {
    const update = () => document.documentElement.style.setProperty('--eg-header-offset', `${Math.ceil(headerRef.current?.getBoundingClientRect().height || 88)}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(headerRef.current);
    return () => { observer.disconnect(); document.documentElement.style.removeProperty('--eg-header-offset'); };
  }, []);
  useEffect(() => { setMenuOpen(false); }, [view]);
  useEffect(() => {
    const escape = event => { if (event.key === 'Escape' && menuOpen) { setMenuOpen(false); toggleRef.current?.focus(); } };
    const outside = event => { if (!headerRef.current?.contains(event.target)) setMenuOpen(false); };
    const desktop = window.matchMedia('(min-width: 1024px)');
    const resize = () => { if (desktop.matches) setMenuOpen(false); };
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    desktop.addEventListener('change', resize);
    return () => { document.removeEventListener('keydown', escape); document.removeEventListener('pointerdown', outside); desktop.removeEventListener('change', resize); };
  }, [menuOpen]);
  function navigate(event, target) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setMenuOpen(false);
    target === 'contacts' ? onContactsClick() : setView(target);
  }
  const items = [['home', 'Головна'], ['how-it-works', 'Як це працює?'], ['contacts', 'Контакти']];
  const accountView = customer ? 'account' : 'customer-auth';
  return (
    <header ref={headerRef} className="eg-site-header shop-header">
      <div className="shop-container shop-header-row">
        <a href="/" onClick={event => navigate(event, 'home')} className="shop-logo" aria-label="Evergreen coffee — головна"><img src={logo} alt="Evergreen coffee" width="134" height="70" /></a>
        <nav className="shop-desktop-nav" aria-label="Головна навігація">{items.map(([target, label]) => <a key={target} href={getPathForView(target)} onClick={event => navigate(event, target)} aria-current={view === target ? 'page' : undefined}>{label}</a>)}</nav>
        <div className="shop-header-actions">
          <a href="/catalog" onClick={event => navigate(event, 'catalog')} className="shop-button shop-header-catalog">Каталог <ArrowUpRight size={17} /></a>
          <a className="shop-account" href={getPathForView(accountView)} onClick={event => navigate(event, accountView)} aria-label={customer ? 'Особистий кабінет' : 'Увійти'}><UserRound size={20} /><span>{customer ? 'Кабінет' : 'Увійти'}</span></a>
          {isAdmin && <a className="shop-icon-button" href="/admin" onClick={event => navigate(event, 'admin')} aria-label="Адмін-панель"><Settings size={20} /></a>}
          <button ref={toggleRef} className="shop-icon-button shop-menu-toggle" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="shop-mobile-menu" aria-label={menuOpen ? 'Закрити меню' : 'Відкрити меню'}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>
      {menuOpen && <nav id="shop-mobile-menu" className="shop-mobile-menu" aria-label="Мобільне меню">{[...items, [accountView, customer ? 'Кабінет' : 'Увійти']].map(([target, label]) => <a key={target} href={getPathForView(target)} onClick={event => navigate(event, target)} aria-current={view === target ? 'page' : undefined}>{label}<ArrowUpRight size={17} /></a>)}<a href="https://t.me/EvergreeenCofee" target="_blank" rel="noopener noreferrer">Написати в Telegram <ArrowUpRight size={17} /></a></nav>}
    </header>
  );
}
