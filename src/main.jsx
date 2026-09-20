import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
const App = lazy(() => import("./App.jsx"));
const TelegramAdmin = lazy(() => import("./telegram/AdminApp.jsx"));
const SupplyApp = lazy(() => import("./supply/SupplyApp.jsx"));
const SupplyPreview = import.meta.env.DEV && import.meta.env.VITE_READONLY_PREVIEW === "1"
  ? lazy(() => import("./supply/SupplyPreview.jsx")) : null;
const TelegramPreview = import.meta.env.DEV && import.meta.env.VITE_READONLY_PREVIEW === "1"
  ? lazy(() => import("./telegram/AdminPreview.jsx")) : null;
const Root = location.pathname.replace(/\/$/, "") === "/telegram/admin" ? TelegramAdmin
  : location.pathname.replace(/\/$/, "") === "/telegram/supply" ? SupplyApp
  : SupplyPreview && location.pathname === "/preview/supply" ? SupplyPreview
  : TelegramPreview && location.pathname === "/preview/telegram-admin" ? TelegramPreview : App;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Suspense fallback={<p role="status" style={{ padding: 24 }}>Завантажуємо…</p>}><Root /></Suspense>
  </StrictMode>
);
