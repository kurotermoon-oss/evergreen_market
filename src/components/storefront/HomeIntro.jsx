import { ArrowUpRight, MapPin, Check } from 'lucide-react';
import coffee from '../../img/coffee-community.jpg';
export default function HomeIntro({ setView }) {
  return <section className="shop-home-intro shop-container">
    <div className="shop-home-copy"><p className="shop-eyebrow">ВАША КАВ’ЯРНЯ. ВАШ МАРКЕТ.</p><h1>За кавою.<br />За продуктами.<br /><em>Просто поруч.</em></h1><p className="shop-lead">Закуповуємо для кав’ярні гуртом — ділимося вигодою з вами.</p><p className="shop-muted">Молоко, кава та смаколики для дому з невеликою націнкою. Обирайте онлайн і забирайте в Evergreen.</p><div className="shop-actions"><button className="shop-button" onClick={() => setView('catalog')}>Обрати товари <ArrowUpRight size={19} /></button><button className="shop-link" onClick={() => setView('how-it-works')}>Як замовити <ArrowUpRight size={17} /></button></div><p className="shop-home-note"><Check size={16} /> Можна без реєстрації <span>·</span> Самовивіз у кав’ярні</p></div>
    <figure className="shop-home-photo"><img src={coffee} width="1200" height="800" alt="Друзі тримають чашки капучино та чорної кави" fetchPriority="high" /><figcaption><MapPin size={19} /><div><strong>Білицька, 20</strong><span>Щодня · 09:00–21:00</span></div><button onClick={() => setView('contacts')} aria-label="Адреса та контакти Evergreen"><ArrowUpRight size={23} /></button></figcaption></figure>
  </section>;
}
