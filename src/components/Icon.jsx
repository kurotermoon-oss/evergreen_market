const ICONS = {
  cart: "🛒",
  coffee: "☕",
  search: "🔎",
  plus: "+",
  minus: "−",
  trash: "🗑️",
  send: "✈️",
  settings: "⚙️",
  home: "⌂",
  package: "📦",
  success: "✓",
  leaf: "🌿",
  pin: "📍",
  phone: "☎️",
  instagram: "◎",
  telegram: "💬",
  edit: "✎",
  eye: "👁",
  eyeOff: "◌",
};

export default function Icon({ name, className = "", size = 20, title }) {
  return (
    <span
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={`inline-flex shrink-0 items-center justify-center leading-none ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(12, size * 0.82),
      }}
    >
      {ICONS[name] || "•"}
    </span>
  );
}