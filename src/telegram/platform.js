let sdkPromise;
export function loadTelegram() {
  if (window.Telegram?.WebApp) return Promise.resolve(window.Telegram.WebApp);
  if (!sdkPromise) sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timer = setTimeout(() => { script.remove(); reject(new Error("Telegram не відповідає. Закрийте й відкрийте застосунок ще раз.")); }, 12000);
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.onload = () => { clearTimeout(timer); resolve(window.Telegram?.WebApp); };
    script.onerror = () => { clearTimeout(timer); reject(new Error("Не вдалося з’єднатися з Telegram.")); };
    document.head.append(script);
  });
  return sdkPromise;
}
export function initializeTelegram(app) {
  app?.ready();
  app?.expand();
  if (app?.isVersionAtLeast?.("6.9")) {
    app.setHeaderColor("#f6f8f3");
    app.setBackgroundColor("#f6f8f3");
  }
  const updateInsets = () => {
    for (const side of ["top", "bottom", "left", "right"]) {
      const inset = Number(app?.safeAreaInset?.[side] || 0) + Number(app?.contentSafeAreaInset?.[side] || 0);
      document.documentElement.style.setProperty(`--mini-safe-${side}`, `${inset}px`);
    }
  };
  updateInsets();
  app?.onEvent("safeAreaChanged", updateInsets);
  app?.onEvent("contentSafeAreaChanged", updateInsets);
  return () => { app?.offEvent("safeAreaChanged", updateInsets); app?.offEvent("contentSafeAreaChanged", updateInsets); };
}
