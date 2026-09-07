import logo from '../img/logo_evergreen.webp';
export default function PageLoader({show=true}) {
  if(!show)return null;
  return <div className="shop-boot" role="status" aria-live="polite"><img src={logo} alt="Evergreen coffee" width="120" height="80" /><p>Завантажуємо каталог…</p></div>;
}
