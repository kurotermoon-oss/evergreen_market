import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import BeanMascot from "./BeanMascot.jsx";
import { getShoppingTip, readGuideMode, saveGuideMode } from "../utils/shoppingAssistant.js";
import "../styles/shopping-assistant.css";

const stages = ["Товари", "Замовлення", "Самовивіз"];

export default function ShoppingAssistant({ view, product, groups, groupId, cartCount, catalogCount, completed, onNavigate, onSupplier }) {
  const [mode, setMode] = useState(() => readGuideMode(window));
  const invitedView = useRef(null);
  const triggerRef = useRef(null);
  const titleRef = useRef(null);
  const tip = getShoppingTip({ view, product, groups, groupId, cartCount, catalogCount, completed });
  const canInvite = ["home", "catalog", "how-it-works"].includes(view) && !cartCount;
  const inviting = mode === "new" && canInvite && (!invitedView.current || invitedView.current === view);

  useEffect(() => {
    if (mode !== "new") return;
    if (invitedView.current && (invitedView.current !== view || !canInvite)) {
      setMode("closed");
    } else if (canInvite) {
      invitedView.current = view;
      saveGuideMode(window, "closed");
    }
  }, [mode, view, canInvite]);

  if (!tip) return null;

  function open() {
    saveGuideMode(window, "active");
    setMode("active");
    requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true }));
  }

  function close() {
    saveGuideMode(window, "closed");
    setMode("closed");
    requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
  }

  function followAction() {
    if (tip.action.supplierId) onSupplier(tip.action.supplierId);
    else onNavigate(tip.action.view);
    requestAnimationFrame(() => titleRef.current?.focus({ preventScroll: true }));
  }

  return (
    <div className="eg-assistant-wrap">
      {mode !== "active" && !inviting ? (
        <button ref={triggerRef} className="eg-assistant-trigger" type="button" onClick={open} aria-expanded="false" aria-controls="eg-shopping-assistant">
          <BeanMascot /><span>Допомогти із замовленням?</span><ArrowUpRight size={15} aria-hidden="true" />
        </button>
      ) : (
        <aside id="eg-shopping-assistant" className={"eg-assistant " + (inviting ? "eg-assistant-invite" : "")} aria-labelledby="eg-assistant-title"
          onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); close(); } }}>
          <div className="eg-assistant-character"><BeanMascot happy={tip.done || inviting} /></div>
          <div className="eg-assistant-copy">
            <div className="eg-assistant-meta">
              <span>Зернятко · ваш помічник</span>
              {!inviting && <ol aria-label="Етапи покупки">{stages.map((stage, index) => <li key={stage} aria-current={index === tip.step ? "step" : undefined}><span aria-hidden="true">{index + 1}</span>{stage}</li>)}</ol>}
            </div>
            <div aria-live="polite" aria-atomic="true">
              <h2 id="eg-assistant-title" ref={titleRef} tabIndex={-1}>{inviting ? "Перший раз в Evergreen?" : tip.title}</h2>
              <p>{inviting ? "Привіт! Я Зернятко. Покажу, як обрати товари й оформити самовивіз. Почнемо?" : tip.text}</p>
            </div>
          </div>
          <div className="eg-assistant-actions">
            {inviting ? <><button type="button" className="eg-assistant-primary" onClick={open}>Покажи <ArrowUpRight size={16} aria-hidden="true" /></button><button type="button" className="eg-assistant-secondary" onClick={close}>Самостійно</button></>
              : tip.done ? <button type="button" className="eg-assistant-primary" onClick={close}>Дякую, зрозуміло</button>
              : tip.action ? <button type="button" className="eg-assistant-primary" onClick={followAction}>{tip.action.label}<ArrowUpRight size={16} aria-hidden="true" /></button>
              : <span className="eg-assistant-hint">Продовжуйте на сторінці нижче</span>}
          </div>
          <button type="button" className="eg-assistant-close" onClick={close} aria-label="Згорнути підказки Зернятка"><X size={18} aria-hidden="true" /></button>
        </aside>
      )}
    </div>
  );
}
