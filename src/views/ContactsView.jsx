import { ArrowUpRight, Clock3, MapPin, Phone, Send } from "lucide-react";
import Footer from "../components/Footer.jsx";
import photo from "../img/coffee-community.jpg";

export default function ContactsView({ setView }) {
  return <main className="shop-contacts">
    <section className="shop-container shop-contact-layout">
      <div className="shop-contact-copy">
        <p className="shop-eyebrow">EVERGREEN COFFEE · КИЇВ</p>
        <h1>Поруч, коли<br />потрібні кава й продукти.</h1>
        <p className="shop-contact-lead">Заходьте до нас за кавою та забирайте свої замовлення. Ми на Білицькій, 20 — будемо раді бачити.</p>
        <dl className="shop-contact-details">
          <div><MapPin size={21} /><div><dt>Де нас знайти</dt><dd>Київ, вул. Білицька, 20</dd></div></div>
          <div><Clock3 size={21} /><div><dt>Коли відчинено</dt><dd>Щодня · 09:00–21:00</dd></div></div>
        </dl>
        <a className="shop-button" href="https://www.google.com/maps/search/?api=1&query=%D0%9A%D0%B8%D1%97%D0%B2%2C%20%D0%91%D1%96%D0%BB%D0%B8%D1%86%D1%8C%D0%BA%D0%B0%2020" target="_blank" rel="noopener noreferrer">Відкрити на карті <ArrowUpRight size={18} /></a>
      </div>
      <aside className="shop-contact-card">
        <img src={photo} alt="Кава в Evergreen coffee" width="600" height="400" />
        <div><h2>Залишаймося на зв’язку</h2><p>Допоможемо з вибором і підкажемо щодо отримання замовлення.</p>
          <a href="https://t.me/EvergreeenCofee" target="_blank" rel="noopener noreferrer"><Send size={19} /><span>Написати в Telegram</span><ArrowUpRight size={17} /></a>
          <a href="tel:+380997592367"><Phone size={19} /><span>+380 99 759 23 67</span><ArrowUpRight size={17} /></a>
          <small>Зараз доступний самовивіз. Доставку ще не підключено.</small>
        </div>
      </aside>
    </section>
    <Footer setView={setView} />
  </main>;
}
