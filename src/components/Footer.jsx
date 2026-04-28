import Icon from "./Icon.jsx";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-stone-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p>© Evergreen coffee. MVP prototype.</p>

        <div className="flex flex-wrap gap-4">
          <span className="flex items-center gap-2">
            <Icon name="pin" size={16} />
            вул. Білицька 20
          </span>

          <span className="flex items-center gap-2">
            <Icon name="phone" size={16} />
            Telegram / Phone
          </span>

          <span className="flex items-center gap-2">
            <Icon name="settings" size={16} />
            CMS-ready
          </span>
        </div>
      </div>
    </footer>
  );
}