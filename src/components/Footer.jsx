import Icon from "./Icon.jsx";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">

          {/* Brand */}
          <div>
            <p className="text-lg font-black text-stone-950">Evergreen coffee</p>
            <p className="mt-1 text-sm text-stone-500">Кава та товари поруч</p>
            <p className="mt-3 text-sm text-stone-400">вул. Білицька 20, Київ</p>
          </div>

          {/* Contacts */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-black uppercase tracking-widest text-stone-400">Контакти</p>

            <a
              href="tel:+380997592367"
              className="flex items-center gap-2 text-sm text-stone-600 transition hover:text-emerald-700"
            >
              <Icon name="phone" size={15} />
              +380 99 759 23 67
            </a>

            <a
              href="https://t.me/EvergreeenCofee"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-stone-600 transition hover:text-emerald-700"
            >
              <Icon name="send" size={15} />
              @EvergreeenCofee
            </a>

            <a
              href="https://instagram.com/evergreen___coffee/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-stone-600 transition hover:text-emerald-700"
            >
              <Icon name="camera" size={15} />
              evergreen___coffee
            </a>
          </div>
        </div>

        {/* Bottom line */}
        <div className="mt-8 border-t border-stone-100 pt-6 text-center text-xs text-stone-400">
          © {new Date().getFullYear()} Evergreen coffee
        </div>
      </div>
    </footer>
  );
}