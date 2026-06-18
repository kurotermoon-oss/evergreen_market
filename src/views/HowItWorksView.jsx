import {
  ArrowRight,
  BadgeCheck,
  Bean,
  ChevronDown,
  Coffee,
  Cookie,
  CupSoda,
  GlassWater,
  Leaf,
  MapPin,
  Milk,
  PackageCheck,
  ShoppingBag,
  ShoppingBasket,
  Store,
  Truck,
} from "lucide-react";
import logoEvergreen from "../img/logo_evergreen.webp";

const anchorOffset = {
  scrollMarginTop: "calc(var(--eg-header-offset, 88px) + 1.5rem)",
};

const categories = [
  { label: "Молоко та вершки", Icon: Milk },
  { label: "Рослинне молоко", Icon: Leaf },
  { label: "Кава", Icon: Bean },
  { label: "Чай", Icon: Coffee },
  { label: "Сиропи та топінги", Icon: CupSoda },
  { label: "Напої", Icon: GlassWater },
  { label: "Солодощі та снеки", Icon: Cookie },
];

const orderTypes = [
  {
    eyebrow: "є в наявності",
    title: "Можна забрати швидше",
    text: "Такі товари вже є в Evergreen. Їх можна замовляти окремо, без мінімальної суми постачальника.",
    Icon: Store,
    accent: "green",
  },
  {
    eyebrow: "під замовлення",
    title: "Їде з закупівлею кав'ярні",
    text: "Такі товари ми додаємо до закупівлі Evergreen. Постачальницькі мінімуми значно вищі, тому на сайті діє м'якший мінімум для конкретного постачальника.",
    Icon: Truck,
    accent: "amber",
  },
];

const processSteps = [
  {
    title: "Обираєте",
    text: "Додаєте до кошика потрібні товари.",
    Icon: ShoppingBasket,
  },
  {
    title: "Підтверджуємо",
    text: "Ми зв'язуємося з вами й уточнюємо деталі.",
    Icon: BadgeCheck,
  },
  {
    title: "Готуємо",
    text: "Наявні товари відкладаємо, а під замовлення додаємо до закупівлі.",
    Icon: PackageCheck,
  },
  {
    title: "Забираєте",
    text: "Зайшли за кавою — забрали пакет із товарами.",
    Icon: ShoppingBag,
  },
];

const trustItems = [
  "Пояснюємо умови до замовлення.",
  "Не змішуємо різних постачальників в один мінімум.",
  "Тримаємо мінімум м'якшим, ніж у постачальників напряму.",
  "Повідомляємо, коли замовлення можна забрати.",
  "Доставку не обіцяємо, поки вона не працює.",
  "Самовивіз — у знайомій кав'ярні Evergreen.",
];

const faqItems = [
  {
    question: "Чи можна замовити один товар?",
    answer:
      "Так, якщо товар є в наявності. Для товарів під замовлення можуть діяти умови конкретного постачальника.",
  },
  {
    question: "Чому є мінімальна сума?",
    answer:
      "У постачальників мінімальні замовлення зазвичай значно вищі. Evergreen додає ваші товари до своєї закупівлі й робить умови м'якшими, але невеликий мінімум допомагає не збирати багато зовсім дрібних окремих замовлень.",
  },
  {
    question: "Чи можна змішувати товари різних постачальників?",
    answer:
      "У кошику можуть бути різні товари, але мінімальна сума рахується окремо для кожного постачальника.",
  },
  {
    question: "Коли я зможу забрати замовлення?",
    answer:
      "Ми повідомимо вас після підтвердження. Наявні товари можна забрати швидше, товари під замовлення залежать від найближчої закупівлі.",
  },
  {
    question: "Де забирати?",
    answer: "У кав'ярні Evergreen. Це той самий знайомий самовивіз поруч.",
  },
  {
    question: "Чи є доставка?",
    answer:
      "Доставка поки не активна. Зараз головний формат — самовивіз у Evergreen.",
  },
];

function Eyebrow({ children, className = "" }) {
  return (
    <p
      className={`inline-flex w-fit rounded-full border border-emerald-200 bg-white/90 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-800 shadow-sm ${className}`}
    >
      {children}
    </p>
  );
}

function SectionIntro({ eyebrow, title, text, align = "left" }) {
  return (
    <div
      className={`mb-7 min-w-0 ${
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"
      }`}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-4 text-3xl font-black leading-tight text-emerald-950 sm:text-4xl">
        {title}
      </h2>
      {text && (
        <p className="mt-4 text-base leading-7 text-stone-600 sm:text-lg sm:leading-8">
          {text}
        </p>
      )}
    </div>
  );
}

function HeroPickupCard() {
  const receiptItems = [
    { label: "молоко", Icon: Milk },
    { label: "кава", Icon: Bean },
    { label: "чай", Icon: Coffee },
  ];

  return (
    <div className="mx-auto w-full max-w-[620px] overflow-hidden rounded-[2rem] border border-emerald-100 bg-[#fffdf8] p-4 shadow-[0_24px_70px_rgba(20,83,45,0.10)] sm:p-5">
      <div className="relative min-h-[300px] overflow-hidden rounded-[1.55rem] bg-emerald-50/75 sm:min-h-[430px]">
        <div className="absolute inset-x-8 bottom-9 h-8 rounded-full bg-emerald-950/10" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-[#f2e7ce]" />
        <div className="absolute left-5 top-5 z-20 rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-900 shadow-sm ring-1 ring-emerald-100 sm:left-7 sm:top-7">
          кав'ярня поруч
        </div>
        <div className="absolute right-5 top-5 z-20 inline-flex items-center gap-2 rounded-full bg-[#fffaf0] px-4 py-2 text-xs font-black text-emerald-950 ring-1 ring-amber-100 sm:right-7 sm:top-7">
          <MapPin size={15} />
          Evergreen
        </div>

        <div className="absolute left-5 top-[88px] z-10 w-[178px] rotate-[-2deg] rounded-[1.2rem] bg-white p-3 shadow-lg shadow-emerald-950/10 ring-1 ring-emerald-100 sm:left-9 sm:top-[126px] sm:w-[232px] sm:rounded-[1.35rem] sm:p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
            чек замовлення
          </p>
          <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
            {receiptItems.map(({ label, Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100 sm:h-8 sm:w-8">
                  <Icon size={16} strokeWidth={2.25} />
                </span>
                <span className="text-xs font-black text-emerald-950 sm:text-sm">
                  {label}
                </span>
                <span className="ml-auto h-2 w-2 rounded-full bg-emerald-600" />
              </div>
            ))}
          </div>
          <div className="mt-4 h-2 rounded-full bg-emerald-100" />
        </div>

        <div className="absolute bottom-9 right-5 z-20 w-[205px] rounded-b-[1.35rem] rounded-t-[0.65rem] bg-[#fff7ed] px-4 pb-5 pt-9 shadow-xl shadow-emerald-950/15 ring-1 ring-amber-100 sm:bottom-14 sm:right-8 sm:w-[260px] sm:rounded-b-[1.5rem] sm:px-5 sm:pb-6 sm:pt-12">
          <div className="absolute -top-7 left-1/2 h-12 w-20 -translate-x-1/2 rounded-t-full border-[8px] border-emerald-900 border-b-0 sm:-top-9 sm:h-16 sm:w-24 sm:border-[9px]" />
          <div className="flex items-center gap-3">
            <img
              src={logoEvergreen}
              alt=""
              className="h-11 w-11 shrink-0 rounded-2xl bg-white object-contain p-1.5 ring-1 ring-emerald-100 sm:h-14 sm:w-14"
            />
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                pickup
              </p>
              <p className="mt-1 text-xl font-black leading-tight text-emerald-950 sm:text-2xl">
                пакет для дому
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs font-bold leading-5 text-stone-700 sm:mt-4 sm:text-sm sm:leading-6">
            Зайшли за кавою — забрали своє замовлення.
          </p>
        </div>

        <div className="absolute bottom-14 left-9 z-20 hidden h-28 w-28 rounded-[1.6rem] bg-white shadow-lg shadow-emerald-950/10 ring-1 ring-emerald-100 sm:block">
          <Coffee
            className="absolute left-7 top-7 text-emerald-800"
            size={48}
            strokeWidth={2.1}
          />
        </div>

        <div className="absolute bottom-7 left-7 right-7 h-5 rounded-full bg-emerald-950 sm:bottom-10" />
        <div className="absolute bottom-2 left-16 right-16 h-7 rounded-full bg-[#eadfc9] sm:bottom-5" />
      </div>
    </div>
  );
}

function CategoryGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map(({ label, Icon }) => (
        <article
          key={label}
          className="flex min-w-0 items-center gap-3 rounded-[1.1rem] border border-emerald-100 bg-white px-4 py-4 shadow-sm"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[0.95rem] bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100">
            <Icon size={21} strokeWidth={2.2} />
          </span>
          <h3 className="text-sm font-black leading-5 text-emerald-950">
            {label}
          </h3>
        </article>
      ))}
    </div>
  );
}

function OrderTypes() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {orderTypes.map(({ eyebrow, title, text, Icon, accent }) => {
        const isGreen = accent === "green";
        return (
          <article
            key={title}
            className={`min-w-0 rounded-[1.35rem] border p-5 shadow-sm sm:p-6 ${
              isGreen
                ? "border-emerald-900/15 bg-emerald-950 text-white"
                : "border-amber-100 bg-[#fffaf0] text-emerald-950"
            }`}
          >
            <div className="flex gap-4">
              <span
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-[1rem] ${
                  isGreen
                    ? "bg-white/12 text-emerald-50 ring-1 ring-white/15"
                    : "bg-white text-emerald-900 ring-1 ring-amber-100"
                }`}
              >
                <Icon size={23} />
              </span>
              <div className="min-w-0">
                <p
                  className={`text-xs font-black uppercase tracking-[0.16em] ${
                    isGreen ? "text-emerald-100" : "text-amber-900"
                  }`}
                >
                  {eyebrow}
                </p>
                <h3 className="mt-2 text-2xl font-black leading-tight">
                  {title}
                </h3>
                <p
                  className={`mt-3 text-base leading-7 ${
                    isGreen ? "text-emerald-50/90" : "text-stone-700"
                  }`}
                >
                  {text}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ProcessTimeline() {
  return (
    <ol className="grid gap-4 lg:grid-cols-4">
      {processSteps.map(({ title, text, Icon }, index) => (
        <li
          key={title}
          className="relative min-w-0 rounded-[1.2rem] border border-emerald-100 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[1rem] bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100">
              <Icon size={21} strokeWidth={2.2} />
            </span>
            <span className="text-sm font-black text-emerald-700">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <h3 className="mt-4 text-lg font-black leading-6 text-emerald-950">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-stone-600">{text}</p>
        </li>
      ))}
    </ol>
  );
}

function TrustChecklist() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {trustItems.map((item) => (
        <li
          key={item}
          className="flex min-w-0 items-start gap-3 rounded-[1rem] bg-white px-4 py-3 ring-1 ring-emerald-100"
        >
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-900 text-white">
            <BadgeCheck size={15} strokeWidth={2.4} />
          </span>
          <span className="text-sm font-semibold leading-6 text-stone-700">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

function FaqList() {
  return (
    <div className="divide-y divide-emerald-100 overflow-hidden rounded-[1.25rem] border border-emerald-100 bg-white shadow-sm">
      {faqItems.map((item) => (
        <details key={item.question} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-left text-base font-black leading-6 text-emerald-950 hover:bg-emerald-50/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-emerald-100 sm:px-6">
            <span>{item.question}</span>
            <ChevronDown
              size={20}
              className="shrink-0 text-emerald-800 transition group-open:rotate-180"
            />
          </summary>
          <p className="px-5 pb-5 text-sm leading-7 text-stone-600 sm:px-6">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}

export default function HowItWorksView({ setView }) {
  const scrollToExplanation = () => {
    document
      .getElementById("how-explanation")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="max-w-full overflow-x-clip bg-[#fbfaf6] pb-40 text-stone-950 md:pb-32">
      <section className="relative overflow-hidden border-b border-emerald-100/80 bg-gradient-to-b from-emerald-50/55 via-[#fffdf8] to-[#fbfaf6]">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-20 pt-10 sm:px-6 sm:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-16">
          <div className="min-w-0 max-w-2xl">
            <Eyebrow>Evergreen Market</Eyebrow>
            <h1 className="mt-5 max-w-full text-4xl font-black leading-[1.05] text-emerald-950 sm:text-5xl lg:text-[3.6rem]">
              Як працює Evergreen Market?
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-stone-700 sm:text-xl sm:leading-9">
              Evergreen вже закуповує частину товарів напряму для роботи
              кав'ярні. Тепер ці товари можна замовити для дому й забрати в
              Evergreen поруч із домом.
            </p>
            <p className="mt-4 max-w-xl border-l-4 border-emerald-800 pl-4 text-base font-semibold leading-7 text-emerald-950">
              Молоко, кава, чай, сиропи, напої та солодощі — без зайвого шуму:
              обрали, підтвердили, забрали.
            </p>

            <div className="mt-6 flex max-w-full flex-wrap gap-2 text-sm font-black text-emerald-950">
              {[
                "наявні товари — без мінімуму",
                "під замовлення — за умовами постачальника",
                "самовивіз у Evergreen",
              ].map((chip) => (
                <span
                  key={chip}
                  className="max-w-full whitespace-normal rounded-full bg-white/88 px-4 py-2 leading-5 shadow-sm ring-1 ring-emerald-100"
                >
                  {chip}
                </span>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setView("catalog")}
                className="eg-button eg-sweep inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-6 py-3.5 text-sm font-black text-white hover:bg-emerald-800 hover:shadow-md hover:shadow-emerald-900/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 sm:w-auto"
              >
                Перейти до товарів
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                onClick={scrollToExplanation}
                className="eg-button inline-flex min-h-14 w-full items-center justify-center rounded-2xl border border-stone-300 bg-white/85 px-6 py-3.5 text-sm font-black text-stone-900 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 sm:w-auto"
              >
                Дізнатись, як замовити
              </button>
            </div>
          </div>

          <HeroPickupCard />
        </div>
      </section>

      <section
        id="how-explanation"
        style={anchorOffset}
        className="mx-auto max-w-[66rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
      >
        <div className="grid gap-6 rounded-[1.6rem] border border-emerald-100 bg-emerald-950 p-5 text-white shadow-sm sm:p-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:p-10">
          <div className="min-w-0">
            <Eyebrow className="border-white/15 bg-white/10 text-emerald-50 shadow-none">
              головна ідея
            </Eyebrow>
            <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl lg:text-[3rem]">
              Не склад. Не супермаркет. Кав'ярня поруч.
            </h2>
          </div>
          <p className="min-w-0 text-base leading-8 text-emerald-50/85 sm:text-lg">
            Ми просто відкриваємо частину кав'ярних закупівель для сусідів:
            зрозумілі товари, чесні умови й самовивіз там, де ви й так берете
            каву.
          </p>
        </div>
      </section>

      <section
        style={anchorOffset}
        className="mx-auto max-w-[66rem] px-4 py-7 sm:px-6 lg:px-8 lg:py-10"
      >
        <SectionIntro
          eyebrow="що можна замовити?"
          title="Реальні товари, з якими кав'ярня працює щодня"
          text="Це не випадкова складська полиця. Це молоко, кава, чай, сиропи, напої, солодощі та снеки — позиції, які природно пов'язані з Evergreen."
        />
        <CategoryGrid />
      </section>

      <section
        style={anchorOffset}
        className="mx-auto max-w-[66rem] px-4 py-7 sm:px-6 lg:px-8 lg:py-10"
      >
        <SectionIntro
          eyebrow="два типи товарів"
          title="Два типи товарів — два різні шляхи"
          text="Одні товари вже є поруч. Інші ми додаємо до закупівлі кав'ярні. Різниця має бути зрозумілою до замовлення."
        />
        <OrderTypes />
      </section>

      <section
        style={anchorOffset}
        className="mx-auto max-w-[66rem] px-4 py-7 sm:px-6 lg:px-8 lg:py-10"
      >
        <div className="grid gap-5 rounded-[1.35rem] border border-amber-100 bg-[#fffaf0] p-5 shadow-sm sm:p-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="min-w-0">
            <Eyebrow className="border-amber-200 text-amber-900">
              чесно про мінімум
            </Eyebrow>
            <h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight text-emerald-950 sm:text-4xl">
              Чому мінімум нижчий, але все ж є?
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-stone-700 sm:text-lg sm:leading-8">
              У постачальників мінімальне замовлення зазвичай значно вище, ніж
              на нашому сайті. Evergreen додає ваші позиції до своєї кав'ярної
              закупівлі, тому умови для вас м'якші. Невеликий мінімум допомагає
              нам не збирати десятки зовсім дрібних окремих замовлень вручну й
              тримати сервіс зручним.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[1rem] bg-white px-4 py-4 ring-1 ring-emerald-100">
              <p className="text-sm font-black text-emerald-950">
                Наявні товари
              </p>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                Можна замовляти окремо — без такого мінімуму.
              </p>
            </div>
            <div className="rounded-[1rem] bg-white px-4 py-4 ring-1 ring-amber-100">
              <p className="text-sm font-black text-emerald-950">
                Товари під замовлення
              </p>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                Мінімум м'якший, ніж напряму у постачальника, і рахується
                окремо для конкретної закупівлі.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-order"
        style={anchorOffset}
        className="mx-auto max-w-[66rem] px-4 py-7 sm:px-6 lg:px-8 lg:py-10"
      >
        <SectionIntro
          eyebrow="від каталогу до пакета"
          title="Від каталогу до пакета в кав'ярні"
          text="Короткий шлях без складського квесту: обрали, підтвердили, підготували, забрали."
        />
        <ProcessTimeline />
      </section>

      <section
        style={anchorOffset}
        className="mx-auto max-w-[66rem] px-4 py-7 sm:px-6 lg:px-8 lg:py-10"
      >
        <div className="grid gap-6 rounded-[1.45rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:grid-cols-[1fr_0.86fr] lg:items-center">
          <div className="min-w-0">
            <Eyebrow>самовивіз</Eyebrow>
            <h2 className="mt-4 text-3xl font-black leading-tight text-emerald-950 sm:text-4xl">
              Забрати можна в Evergreen
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-stone-700 sm:text-lg sm:leading-8">
              Коли замовлення буде готове, ми повідомимо вас. Забрати його можна
              в кав'ярні — так само просто, як зайти за кавою.
            </p>
            <p className="mt-4 rounded-[1rem] bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-950 ring-1 ring-amber-100">
              Доставка поки не активна. Зараз головний формат — самовивіз у
              Evergreen.
            </p>
          </div>
          <div className="rounded-[1.25rem] bg-emerald-50 p-5 ring-1 ring-emerald-100">
            <div className="flex items-center gap-3 rounded-[1rem] bg-white px-4 py-3 shadow-sm ring-1 ring-emerald-100">
              <MapPin className="text-emerald-800" size={25} />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  Evergreen
                </p>
                <p className="text-lg font-black leading-tight text-emerald-950">
                  Зайшли за кавою — забрали своє замовлення.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[1rem] bg-white p-4 text-emerald-950 ring-1 ring-emerald-100">
                <Coffee size={31} className="text-emerald-800" />
                <p className="mt-3 text-sm font-black">кава поруч</p>
              </div>
              <div className="rounded-[1rem] bg-white p-4 text-emerald-950 ring-1 ring-emerald-100">
                <ShoppingBag size={31} className="text-emerald-800" />
                <p className="mt-3 text-sm font-black">пакет готовий</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        style={anchorOffset}
        className="mx-auto max-w-[66rem] px-4 py-7 sm:px-6 lg:px-8 lg:py-10"
      >
        <div className="grid gap-6 lg:grid-cols-[0.58fr_1fr] lg:items-start">
          <SectionIntro
            eyebrow="щоб усе було зрозуміло"
            title="Менше обіцянок. Більше ясності."
          />
          <TrustChecklist />
        </div>
      </section>

      <section
        style={anchorOffset}
        className="mx-auto max-w-[66rem] px-4 py-7 sm:px-6 lg:px-8 lg:py-10"
      >
        <div className="grid gap-6 lg:grid-cols-[0.5fr_1fr] lg:items-start">
          <SectionIntro
            eyebrow="коротко"
            title="Питання, які знімають плутанину"
          />
          <FaqList />
        </div>
      </section>

      <section className="mx-auto max-w-[66rem] px-4 pb-2 pt-7 sm:px-6 lg:px-8 lg:pt-10">
        <div className="grid gap-5 rounded-[1.45rem] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/65 to-[#fffaf0] p-5 shadow-sm sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
          <div className="min-w-0">
            <Eyebrow>спробуйте поруч</Eyebrow>
            <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight text-emerald-950 sm:text-4xl">
              Спробуйте замовити товари поруч із домом
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-stone-700">
              Почніть із простого: відкрийте каталог, оберіть потрібні товари,
              а ми підкажемо, як зручно забрати замовлення в Evergreen.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setView("catalog")}
            className="eg-button eg-sweep inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-6 py-3.5 text-sm font-black text-white hover:bg-emerald-800 hover:shadow-md hover:shadow-emerald-900/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 sm:w-auto"
          >
            Перейти до товарів
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </main>
  );
}
