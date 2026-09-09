import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

let openModals = 0;
let bodyOverflow = "";

/** Native modal: inert background, keyboard containment, Escape and focus return. */
export default function Modal({ children, onClose, label, className = "eg-admin", maxWidth }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    if (openModals === 0) bodyOverflow = document.body.style.overflow;
    openModals += 1;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      openModals -= 1;
      if (openModals === 0) document.body.style.overflow = bodyOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return createPortal(
    <dialog
      ref={dialogRef}
      className={`eg-dialog ${className}`}
      style={maxWidth ? { "--dialog-width": `${maxWidth}px` } : undefined}
      aria-label={label}
      onCancel={event => { event.preventDefault(); event.stopPropagation(); closeRef.current?.(); }}
      onKeyDown={event => {
        if (event.key !== "Tab" || event.target.closest("dialog") !== event.currentTarget) return;
        const controls = [...event.currentTarget.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])')].filter(element => element.getClientRects().length > 0 && !element.closest("[inert]"));
        if (!controls.length) { event.preventDefault(); return; }
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeRef.current?.();
      }}
    >{children}</dialog>,
    document.body
  );
}
