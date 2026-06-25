import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "./Icon.jsx";

function getIntegerValue(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return Math.trunc(number);
}

function clampQuantity(value, min, max) {
  const integerValue = getIntegerValue(value);
  const fallbackValue = Number.isFinite(min) ? min : 1;
  const nextValue = integerValue === null ? fallbackValue : integerValue;
  const minValue = Number.isFinite(min) ? min : 1;
  const maxValue = Number.isFinite(max) ? max : null;
  const lowerBoundedValue = Math.max(minValue, nextValue);

  return maxValue === null
    ? lowerBoundedValue
    : Math.min(maxValue, lowerBoundedValue);
}

function sanitizeInput(value) {
  return String(value || "").replace(/\D/g, "");
}

export default function QuantityControl({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
  className = "",
  size = "regular",
  tone = "light",
  ariaLabel = "Кількість товару",
  onClick,
  onRemove,
}) {
  const inputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);

  const minValue = useMemo(() => {
    const number = getIntegerValue(min);
    return number === null ? 1 : Math.max(0, number);
  }, [min]);

  const maxValue = useMemo(() => {
    const number = getIntegerValue(max);
    return number === null ? null : Math.max(minValue, number);
  }, [max, minValue]);

  const normalizedValue = clampQuantity(value, minValue, maxValue);
  const [draftValue, setDraftValue] = useState(String(normalizedValue));

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(String(normalizedValue));
    }
  }, [isEditing, normalizedValue]);

  function commitValue(nextValue) {
    const normalizedNextValue = clampQuantity(nextValue, minValue, maxValue);
    setDraftValue(String(normalizedNextValue));

    if (normalizedNextValue !== normalizedValue) {
      onChange?.(normalizedNextValue);
    }
  }

  function handleChange(event) {
    const sanitizedValue = sanitizeInput(event.target.value);

    setDraftValue(sanitizedValue);

    if (!sanitizedValue) {
      return;
    }

    commitValue(sanitizedValue);
  }

  function handleBlur() {
    setIsEditing(false);
    commitValue(draftValue || normalizedValue || minValue);
  }

  function handleFocus(event) {
    setIsEditing(true);
    event.target.select();
  }

  function handleStep(delta) {
    if (disabled) return;

    if (delta < 0 && normalizedValue <= minValue) {
      if (onRemove) {
        setDraftValue(String(minValue));
        onRemove();
      }

      return;
    }

    commitValue(normalizedValue + delta);
  }

  const decrementDisabled = disabled || (normalizedValue <= minValue && !onRemove);
  const controlClassName = [
    "eg-quantity-control",
    `eg-quantity-control--${size}`,
    `eg-quantity-control--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={controlClassName} aria-label={ariaLabel} onClick={onClick}>
      <button
        type="button"
        onClick={() => handleStep(-1)}
        disabled={decrementDisabled}
        className="eg-counter-button eg-quantity-control__button"
        aria-label="Зменшити кількість"
      >
        <Icon name="minus" size={size === "compact" ? 12 : 15} />
      </button>

      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        enterKeyHint="done"
        value={draftValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        className="eg-quantity-control__input"
        aria-label={ariaLabel}
      />

      <button
        type="button"
        onClick={() => handleStep(1)}
        disabled={disabled}
        className="eg-counter-button eg-quantity-control__button"
        aria-label="Збільшити кількість"
      >
        <Icon name="plus" size={size === "compact" ? 12 : 15} />
      </button>
    </div>
  );
}
