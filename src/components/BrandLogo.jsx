import logoEvergreen from "../img/logo_evergreen.webp";

export default function BrandLogo({
  size = "md",
  showText = true,
  animated = false,
  className = "",
}) {
  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-24 w-24",
    xl: "h-32 w-32",
  };

  return (
    <div className={`group flex items-center gap-4 ${className}`}>
      <div
        className={`shrink-0 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200 ${
          sizeClasses[size] || sizeClasses.md
        } ${
          animated
            ? "brand-logo-float transition duration-300 group-hover:-translate-y-1 group-hover:scale-[1.04] group-hover:shadow-xl"
            : ""
        }`}
      >
        <img
          src={logoEvergreen}
          alt="Evergreen coffee"
          className="h-full w-full object-contain p-1.5"
        />
      </div>

      {showText && (
        <div className="min-w-0">
          <p className="text-lg font-black leading-tight text-stone-950">
            Evergreen coffee
          </p>
          <p className="mt-1 text-sm font-medium leading-tight text-stone-500">
            local market
          </p>
        </div>
      )}
    </div>
  );
}