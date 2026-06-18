import { MapPin, ShoppingBasket, Store } from "lucide-react";
import Footer from "../components/Footer.jsx";

export default function ContactsView({ setView }) {
  return (
    <main className="bg-stone-50">
      <section className="eg-ambient border-b border-emerald-100 bg-gradient-to-b from-emerald-50/75 to-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8 lg:py-16">
          <div>
            <p className="w-fit rounded-full border border-emerald-200 bg-white/75 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-800 shadow-sm">
              Evergreen coffee поруч
            </p>

            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-stone-950 sm:text-5xl">
              Контакти, адреса та самовивіз
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-stone-600">
              Знайдіть Evergreen coffee на карті, напишіть нам у Telegram або
              зателефонуйте, якщо хочете уточнити наявність товарів чи
              домовитися про отримання замовлення.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setView("catalog")}
                className="eg-button eg-sweep inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-6 py-4 text-sm font-black text-white hover:bg-emerald-800 hover:shadow-md hover:shadow-emerald-900/20"
              >
                <Store size={18} />
                Перейти до каталогу
              </button>

              <button
                type="button"
                onClick={() => setView("cart")}
                className="eg-button inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white/80 px-6 py-4 text-sm font-black text-stone-950 backdrop-blur hover:bg-white"
              >
                <ShoppingBasket size={18} />
                Відкрити кошик
              </button>
            </div>
          </div>

          <div className="eg-glass eg-premium-card rounded-[2.2rem] p-5">
            <div className="flex items-start gap-4 rounded-[1.7rem] bg-emerald-950 p-5 text-white shadow-xl shadow-emerald-950/15">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-emerald-950">
                <MapPin size={22} />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100">
                  Адреса
                </p>
                <p className="mt-2 text-2xl font-black">
                  Київ, вул. Білицька 20
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-emerald-50/90">
                  Щодня · 09:00-21:00
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer setView={setView} />
    </main>
  );
}
