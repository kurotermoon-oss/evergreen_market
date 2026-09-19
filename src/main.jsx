import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
const App = lazy(() => import("./App.jsx"));
const TelegramAdmin = lazy(() => import("./telegram/AdminApp.jsx"));
const TelegramPreview = import.meta.env.DEV && import.meta.env.VITE_READONLY_PREVIEW === "1"
  ? lazy(() => import("./telegram/AdminPreview.jsx")) : null;
const Root = location.pathname.replace(/\/$/, "") === "/telegram/admin" ? TelegramAdmin
  : TelegramPreview && location.pathname === "/preview/telegram-admin" ? TelegramPreview : App;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Suspense fallback={<p role="status" style={{ padding: 24 }}>Завантажуємо…</p>}><Root /></Suspense>
  </StrictMode>
);