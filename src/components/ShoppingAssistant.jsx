import { useEffect } from "react";
import { ArrowUpRight, X } from "lucide-react";
import BeanMascot from "./BeanMascot.jsx";
import Modal from "./Modal.jsx";
import { getShoppingTip, saveGuideMode } from "../utils/shoppingAssistant.js";
import "../styles/shopping-assistant.css";

const stages = ["Товари", "Замовлення", "Самовивіз"];

export default function ShoppingAssistant({ view, product, groups, groupId, cartCount, catalogCount, completed, onNavigate, onSupplier, isOpen, onOpen, onClose }) {
  const tip = getShoppingTip({ view, product, groups, groupId, cartCount, catalogCount, completed })
    || (isOpen ? getShoppingTip({ view: "home" }) : null);
  useEffect(() => {
    if (isOpen) saveGuideMode(window, "active");
  }, [isOpen]);
  if (!tip) return null;

  function close() {
    saveGuideMode(window, "closed");
    onClose();
  }
  function followAction() {
    onClose();
    if (tip.action.supplierId) onSupplier(tip.action.supplierId);
    else onNavigate(tip.action.view);
  }

  return (
    <div className="eg-assistant-wrap" data-view={view}>
      <button className="eg-assistant-trigger" type="button" onClick={onOpen} aria-expanded={isOpen} aria-haspopup="dialog" aria-label="Зернятко — допомога із замовленням">
        <BeanMascot />
        <span>Потрібна допомога?</span>
      </button>
      {isOpen && (
        <Modal className="eg-storefront eg-assistant-dialog" maxWidth={460} label="Підказки Зернятка" onClose={close}>
          <section id="eg-shopping-assistant" className="eg-assistant" aria-labelledby="eg-assistant-title">
            <header className="eg-assistant-header">
              <div className="eg-assistant-character"><BeanMascot happy={tip.done} /></div>
              <div><p className="eg-assistant-name">Зернятко</p><p className="eg-assistant-subtitle">Допоможу із замовленням</p></div>
              <button type="button" className="eg-assistant-close" onClick={close} aria-label="Закрити підказки Зернятка"><X size={20} aria-hidden="true" /></button>
            </header>
            <ol className="eg-assistant-stages" aria-label="Етапи покупки">{stages.map((stage, index) => <li key={stage} aria-current={index === tip.step ? "step" : undefined}><span aria-hidden="true">{index + 1}</span>{stage}</li>)}</ol>
            <div className="eg-assistant-copy" aria-live="polite" aria-atomic="true">
              <h2 id="eg-assistant-title">{tip.title}</h2>
              <p>{tip.text}</p>
            </div>
            <div className="eg-assistant-actions">
              {tip.done ? <button type="button" className="eg-assistant-primary" onClick={close}>Дякую, зрозуміло</button>
                : tip.action ? <button type="button" className="eg-assistant-primary" onClick={followAction}>{tip.action.label}<ArrowUpRight size={16} aria-hidden="true" /></button>
                : <button type="button" className="eg-assistant-primary" onClick={close}>Повернутися до замовлення</button>}
              {!tip.done && <button type="button" className="eg-assistant-secondary" onClick={close}>Продовжу самостійно</button>}
            </div>
          </section>
        </Modal>
      )}
    </div>
  );
}
