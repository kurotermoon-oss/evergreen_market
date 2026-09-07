import { useEffect, useRef } from "react";
import { ArrowUpRight, Check, ChevronDown, Clock3, MapPin, MessageCircle, PackageCheck, ShoppingBag } from "lucide-react";
import MarketBagIllustration from "../components/storefront/MarketBagIllustration.jsx";
import { getPathForView } from "../utils/routes.js";
import "../styles/shopping-guide.css";

const steps = [
  {
    title: "Оберіть товари",
    text: "Знайдіть потрібне в каталозі. Перевірте ціну, фасування й наявність. Додайте потрібну кількість до кошика.",
  },
  {
    title: "Оформіть замовлення",
    text: "Оберіть групу в кошику та перевірте її мінімум. Вкажіть ім’я й телефон або Telegram — реєстрація не обов’язкова.",
  },
  {
    title: "Заберіть у кав’ярні",
    text: "Ми зв’яжемося з вами, уточнимо деталі та повідомимо про готовність. Після цього заходьте за своїми покупками.",
  },
];

const questions = [
  {
    question: "Звідки вигода?",
    answer: "Ми вже купуємо продукти гуртом для кав’ярні. Частину цих товарів пропонуємо вам із невеликою націнкою. Актуальну ціну та фасування завжди видно в картці товару.",
  },
  {
    question: "Чому в кошику кілька груп?",
    answer: "Наявні товари утворюють одну групу, а товари під замовлення — окрему для кожного постачальника. Кожну групу потрібно оформити окремо. Товари з інших груп не зараховуються до її мінімальної суми. Кошик покаже, скільки ще потрібно додати.",
  },
  {
    question: "Коли замовлення буде готове?",
    answer: "Точний час повідомимо після підтвердження. Наявні товари можна підготувати швидше, а товари під замовлення залежать від найближчої закупівлі. Перед візитом дочекайтеся повідомлення про готовність.",
  },
];

function PageLink({ view, setView, className, children }) {
  function navigate(event) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    setView(view);
  }
  return <a href={getPathForView(view)} className={className} onClick={navigate}>{children}</a>;
}

export default function HowItWorksView({ setView }) {
  const pageRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("how-entered");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    pageRef.current.querySelectorAll("[data-how-reveal]").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <main ref={pageRef} className="how-page">
      <section className="how-hero how-wrap" aria-labelledby="how-title">
        <div className="how-hero-copy">
          <p className="how-eyebrow">ЯК ЦЕ ПРАЦЮЄ</p>
          <h1 id="how-title">Покупки для дому.<br /><em>Разом з Evergreen.</em></h1>
          <p className="how-intro">Ми закуповуємо продукти гуртом для кав’ярні. Ви берете потрібне для дому — з невеликою націнкою.</p>
          <PageLink view="catalog" setView={setView} className="how-button">Перейти до товарів <ArrowUpRight size={19} aria-hidden="true" /></PageLink>
          <div className="how-hero-notes"><span><Check size={15} aria-hidden="true" /> Без реєстрації</span><span><MapPin size={15} aria-hidden="true" /> Самовивіз у Києві</span></div>
        </div>
        <figure className="how-hero-art">
          <MarketBagIllustration />
          <figcaption>Улюблене з кав’ярні — тепер і вдома.</figcaption>
        </figure>
      </section>

      <section className="how-journey how-wrap" aria-labelledby="how-steps-title" data-how-reveal>
        <div className="how-section-heading"><h2 id="how-steps-title">Всього три кроки.</h2><p>Від вашого списку — до готового пакета.</p></div>
        <ol className="how-steps">
          {steps.map((step, index) => (
            <li className="how-step" key={step.title}>
              <span className="how-step-number" aria-hidden="true">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              {index === 1 && <PageLink view="cart" setView={setView} className="how-text-link">Відкрити кошик <ArrowUpRight size={15} aria-hidden="true" /></PageLink>}
            </li>
          ))}
        </ol>
      </section>

      <section className="how-formats how-wrap" aria-labelledby="how-formats-title" data-how-reveal>
        <div className="how-formats-intro"><p className="how-eyebrow">ПЕРЕД ТИМ ЯК ОБРАТИ</p><h2 id="how-formats-title">Два статуси.<br /> Різні умови.</h2><p>Статус є в кожній картці товару. Ось що він означає для вас.</p></div>
        <article className="how-format">
          <span className="how-format-icon"><PackageCheck size={24} strokeWidth={1.6} aria-hidden="true" /></span>
          <h3>Є в наявності</h3>
          <p>Товари вже в Evergreen.</p>
          <dl><dt>Мінімальна сума</dt><dd>Без мінімуму постачальника. Можна обрати один товар.</dd><dt>Коли забирати</dt><dd>Після повідомлення про готовність.</dd></dl>
        </article>
        <article className="how-format">
          <span className="how-format-icon how-format-icon-order"><ShoppingBag size={24} strokeWidth={1.6} aria-hidden="true" /></span>
          <h3>Під замовлення</h3>
          <p>Додаємо до закупівлі кав’ярні.</p>
          <dl><dt>Мінімальна сума</dt><dd>Може діяти для окремого постачальника. Суму видно в кошику.</dd><dt>Коли забирати</dt><dd>Після закупівлі та нашого підтвердження.</dd></dl>
        </article>
      </section>

      <section className="how-details how-wrap" aria-label="Самовивіз та відповіді на запитання" data-how-reveal>
        <div className="how-pickup">
          <MapPin size={26} strokeWidth={1.5} aria-hidden="true" />
          <h2>Зустрінемось<br />в Evergreen.</h2>
          <p className="how-address">Київ, Білицька, 20</p>
          <p className="how-hours"><Clock3 size={16} aria-hidden="true" /> Щодня, 09:00–21:00</p>
          <p className="how-pickup-note">Зараз працюємо із самовивозом.<br />Доставка поки не активна.</p>
          <PageLink view="contacts" setView={setView} className="how-pickup-link">Адреса та контакти <ArrowUpRight size={17} aria-hidden="true" /></PageLink>
        </div>
        <div className="how-faq">
          <h2>Ще кілька відповідей.</h2>
          <div className="how-questions">
            {questions.map(({ question, answer }) => (
              <details key={question} name="evergreen-how-faq">
                <summary>{question}<ChevronDown size={19} aria-hidden="true" /></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
          <a className="how-help" href="https://t.me/EvergreeenCofee" target="_blank" rel="noopener noreferrer"><MessageCircle size={20} aria-hidden="true" /><span>Допомогти з першим замовленням?<strong>Напишіть нам у Telegram <ArrowUpRight size={14} aria-hidden="true" /></strong></span></a>
        </div>
      </section>

      <section className="how-finish how-wrap" aria-label="Перейти до покупок">
        <p>Що додамо до вашого списку?</p>
        <PageLink view="catalog" setView={setView} className="how-button">Обрати товари <ArrowUpRight size={19} aria-hidden="true" /></PageLink>
      </section>
    </main>
  );
}
