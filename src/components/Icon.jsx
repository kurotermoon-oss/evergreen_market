function SvgIcon({ size, className, title, children, fill = "none" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={`inline-block shrink-0 ${className}`}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

export default function Icon({ name, className = "", size = 20, title }) {
  const commonProps = {
    size,
    className,
    title,
  };

  switch (name) {
    case "cart":
      return (
        <SvgIcon {...commonProps}>
          <path
            d="M4 5h2l1.7 9.2a2 2 0 0 0 2 1.6h6.9a2 2 0 0 0 1.9-1.4L20 8H7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 20h.1M17 20h.1"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </SvgIcon>
      );

    case "coffee":
      return (
        <SvgIcon {...commonProps}>
          <path
            d="M7 8h9v6a4 4 0 0 1-4 4h-1a4 4 0 0 1-4-4V8Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 10h1.2a2.3 2.3 0 0 1 0 4.6H16"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 21h8"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M9 4c-.5.7-.5 1.3 0 2M12 3.5c-.5.8-.5 1.5 0 2.3M15 4c-.5.7-.5 1.3 0 2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </SvgIcon>
      );

    case "search":
      return (
        <SvgIcon {...commonProps}>
          <circle
            cx="10.5"
            cy="10.5"
            r="5.5"
            stroke="currentColor"
            strokeWidth="2.2"
          />
          <path
            d="m15 15 4 4"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </SvgIcon>
      );

    case "plus":
      return (
        <SvgIcon {...commonProps}>
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </SvgIcon>
      );

    case "minus":
      return (
        <SvgIcon {...commonProps}>
          <path
            d="M5 12h14"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </SvgIcon>
      );

    case "trash":
      return (
        <SvgIcon {...commonProps}>
          <path
            d="M5 7h14"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M7 7l.8 12A2 2 0 0 0 9.8 21h4.4a2 2 0 0 0 2-2L17 7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 11v6M14 11v6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </SvgIcon>
      );

    case "send":
    case "telegram":
      return (
        <SvgIcon {...commonProps} fill="currentColor">
          <path d="M21.94 4.16a1.5 1.5 0 0 0-1.58-.2L3.04 10.7c-1.22.48-1.18 2.22.06 2.63l4.38 1.45 1.68 5.28c.37 1.17 1.84 1.52 2.69.64l2.38-2.47 4.32 3.18c1.05.77 2.55.16 2.77-1.12l2.1-14.63a1.5 1.5 0 0 0-.48-1.5ZM8.15 13.52l9.76-6.05-7.86 7.34-.3 3.24-1.6-4.53Zm3.07 5.18.2-2.1 1.46 1.08-1.66 1.02Z" />
        </SvgIcon>
      );

    case "settings":
      return (
        <SvgIcon {...commonProps}>
          <path
            d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
            stroke="currentColor"
            strokeWidth="2.2"
          />
          <path
            d="M19 12a7.9 7.9 0 0 0-.1-1.1l2-1.5-2-3.4-2.4 1a8.6 8.6 0 0 0-1.9-1.1L14.3 3h-4.6l-.4 2.9A8.6 8.6 0 0 0 7.5 7l-2.4-1-2 3.4 2 1.5A7.9 7.9 0 0 0 5 12c0 .4 0 .8.1 1.1l-2 1.5 2 3.4 2.4-1c.6.5 1.2.9 1.9 1.1l.4 2.9h4.6l.4-2.9c.7-.3 1.3-.7 1.9-1.1l2.4 1 2-3.4-2-1.5c0-.3.1-.7.1-1.1Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </SvgIcon>
      );

    case "home":
      return (
        <SvgIcon {...commonProps}>
          <path
            d="M4 11.5 12 5l8 6.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6.8 10.5V19h10.4v-8.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 19v-4h4v4"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </SvgIcon>
      );

    case "package":
      return (
        <SvgIcon {...commonProps}>
          <path
            d="M4.5 8.2 12 4l7.5 4.2v7.6L12 20l-7.5-4.2V8.2Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M4.8 8.4 12 12.5l7.2-4.1M12 12.5V20"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </SvgIcon>
      );

    case "success":
      return (
        <SvgIcon {...commonProps}>
          <path
            d="m5 12.5 4.2 4.2L19 7"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </SvgIcon>
      );

    case "leaf":
      return (
        <SvgIcon {...commonProps}>
          <path
            d="M5 19c7.5-.4 12.8-5.4 14-14-7.7 1-12.9 6.2-14 14Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 19c3.4-4.8 7.4-8.2 12-10.2"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </SvgIcon>
      );

    case "pin":
    case "mapPin":
      return (
        <SvgIcon {...commonProps}>
          <path
            d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="10"
            r="2.2"
            stroke="currentColor"
            strokeWidth="2.2"
          />
        </SvgIcon>
      );

    case "phone":
      return (
        <SvgIcon {...commonProps}>
          <path
            d="M8.5 5.2 10.2 9a1.6 1.6 0 0 1-.4 1.8l-1 1a11.5 11.5 0 0 0 5.4 5.4l1-1a1.6 1.6 0 0 1 1.8-.4l3.8 1.7a1.4 1.4 0 0 1 .8 1.5 3.1 3.1 0 0 1-3.1 2.7C9.7 21.7 2.3 14.3 2.3 5.5A3.1 3.1 0 0 1 5 2.4a1.4 1.4 0 0 1 1.5.8Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </SvgIcon>
      );

    case "instagram":
      return (
        <SvgIcon {...commonProps}>
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="5"
            stroke="currentColor"
            strokeWidth="2.2"
          />
          <circle
            cx="12"
            cy="12"
            r="4"
            stroke="currentColor"
            strokeWidth="2.2"
          />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
        </SvgIcon>
      );

    case "edit":
      return (
        <SvgIcon {...commonProps}>
          <path
            d="M4 20h4.5L19 9.5 14.5 5 4 15.5V20Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="m13.5 6 4.5 4.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </SvgIcon>
      );

    case "eye":
      return (
        <SvgIcon {...commonProps}>
          <path
            d="M3 12s3.2-6 9-6 9 6 9 6-3.2 6-9 6-9-6-9-6Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="12"
            r="2.8"
            stroke="currentColor"
            strokeWidth="2.2"
          />
        </SvgIcon>
      );

    case "eyeOff":
      return (
        <SvgIcon {...commonProps}>
          <path
            d="M4 4l16 16"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M9.5 5.6A9.6 9.6 0 0 1 12 5c5.8 0 9 7 9 7a15.8 15.8 0 0 1-3 4.1M6.1 7.5A15.2 15.2 0 0 0 3 12s3.2 7 9 7c.9 0 1.8-.2 2.6-.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </SvgIcon>
      );

    case "clock":
      return (
        <SvgIcon {...commonProps}>
          <circle
            cx="12"
            cy="12"
            r="8"
            stroke="currentColor"
            strokeWidth="2.2"
          />
          <path
            d="M12 7.5V12l3 2"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </SvgIcon>
      );

    case "navigation":
      return (
        <SvgIcon {...commonProps}>
          <path
            d="M5 19 19 5l-4.5 14-3-6.5L5 19Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </SvgIcon>
      );

    case "popular":
      return (
        <SvgIcon {...commonProps}>
          <path
            d="M12 3c3.8 2.8 6 6 6 9.4A6 6 0 0 1 6 12.4C6 9 8.2 5.8 12 3Z"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 15.8a2.8 2.8 0 0 0 2.8-2.8c0-1.4-.8-2.7-2.8-4.3-2 1.6-2.8 2.9-2.8 4.3a2.8 2.8 0 0 0 2.8 2.8Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </SvgIcon>
      );

    default:
      return (
        <SvgIcon {...commonProps}>
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </SvgIcon>
      );
  }
}