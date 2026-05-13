import { useEffect, useState } from "react";
import BrandLogo from "./BrandLogo.jsx";

export default function PageLoader({ show = true }) {
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShouldRender(false);
    }, 520);

    return () => window.clearTimeout(timeoutId);
  }, [show]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[2000] flex items-center justify-center overflow-hidden bg-stone-950 transition-all duration-500 ${
        show ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.14),transparent_34%)]" />

      <div className="absolute left-[12%] top-[18%] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl eg-loader-orb" />
      <div className="absolute bottom-[16%] right-[12%] h-80 w-80 rounded-full bg-amber-300/10 blur-3xl eg-loader-orb-delayed" />

      <div className="relative z-10 mx-4 w-full max-w-md rounded-[2.5rem] border border-white/10 bg-white/[0.08] p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
        <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
          <div className="absolute inset-0 rounded-[2rem] bg-emerald-400/20 blur-2xl eg-loader-pulse" />

          <div className="relative z-10 rounded-[2rem] bg-white/90 p-4 shadow-2xl">
            <BrandLogo size="lg" showText={false} animated={true} />
          </div>

          <span className="eg-steam-line left-[38%]" />
          <span className="eg-steam-line left-[50%] delay-150" />
          <span className="eg-steam-line left-[62%] delay-300" />
        </div>

        <p className="mt-7 text-xs font-black uppercase tracking-[0.28em] text-emerald-200">
          Evergreen coffee
        </p>

        <h2 className="mt-3 text-3xl font-black text-white">
          Готуємо сайт
        </h2>

        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-stone-300">
          Заварюємо каву, оновлюємо каталог і підтягуємо товари.
        </p>

        <div className="mt-7 overflow-hidden rounded-full bg-white/10 p-1">
          <div className="h-2 rounded-full bg-gradient-to-r from-emerald-300 via-emerald-500 to-amber-300 eg-loader-bar" />
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs font-bold text-stone-400">
          <span className="h-2 w-2 rounded-full bg-emerald-300 eg-loader-dot" />
          <span className="h-2 w-2 rounded-full bg-emerald-300 eg-loader-dot delay-150" />
          <span className="h-2 w-2 rounded-full bg-emerald-300 eg-loader-dot delay-300" />
        </div>
      </div>
    </div>
  );
}