import logo from "../../img/logo_evergreen.webp";

export default function MarketBagIllustration() {
  return (
    <svg className="how-bag-scene" viewBox="0 0 520 420" role="img" aria-label="Паперовий пакет Evergreen із молоком та кавою для дому">
      <ellipse cx="270" cy="215" rx="191" ry="180" fill="#e6eadb" />
      <path d="M52 295c-13-42 6-75 27-89 10 39 6 66-27 89Z" fill="#bac7a4" />
      <path d="M50 303c-6-21-27-41-46-44 0 29 12 42 46 44Z" fill="#ced6bb" />
      <path d="m53 341-2-61" fill="none" stroke="#8a9e74" strokeWidth="2" />
      <ellipse cx="275" cy="383" rx="161" ry="13" fill="#dfe1d3" />
      <g className="how-bag-contents">
        <g transform="rotate(-9 194 202)">
          <path d="m140 114 20-33h72l19 33v166H140Z" fill="#fafbf5" stroke="#c7cdbc" strokeWidth="1.5" />
          <path d="m140 114 20-33 18 33v166h-38Z" fill="#e5e9db" />
          <path d="M160 81h72l-18 33h-36Z" fill="#eef1e6" />
          <path d="M162 74h68v10h-68Z" fill="#6b835d" />
          <rect x="185" y="155" width="50" height="62" rx="25" fill="#e0e8d5" />
          <path d="M210 169c-4 6-10 13-10 20a10 10 0 0 0 20 0c0-7-6-14-10-20Z" fill="#719063" />
          <text x="211" y="239" fill="#54684a" fontFamily="Arial,sans-serif" fontSize="11" letterSpacing="1.4" textAnchor="middle">МОЛОКО</text>
        </g>
        <g transform="rotate(11 325 208)">
          <path d="m270 125 11-11h93l9 11-4 160H268Z" fill="#816248" />
          <path d="M279 115h96v10h-96Z" fill="#6e523a" />
          <rect x="284" y="158" width="81" height="81" rx="3" fill="#f2e9d6" />
          <ellipse cx="324" cy="183" rx="9" ry="13" transform="rotate(35 324 183)" fill="#816248" />
          <path d="M327 171c-10 9 4 12-8 22" stroke="#f2e9d6" fill="none" strokeWidth="1.5" />
          <text x="324" y="222" fill="#6e523a" fontFamily="Arial,sans-serif" fontSize="13" letterSpacing="2" textAnchor="middle">КАВА</text>
        </g>
      </g>
      <g className="how-paper-bag">
        <path d="M210 250v-48c0-49 75-49 75 0v48" fill="none" stroke="#a89973" strokeWidth="9" />
        <path d="m113 229 33-24h222l41 24-24 147H130Z" fill="#c6b993" />
        <path d="m113 229 25 151h231l23-151Z" fill="#e9dfbf" />
        <path d="m392 229 17 0-24 147-16 4Z" fill="#b9ab84" />
        <path d="M214 258v-45c0-49 73-49 73 0v45" fill="none" stroke="#a99a73" strokeWidth="7" strokeLinecap="round" />
        <circle cx="214" cy="257" r="5" fill="#a99a73" /><circle cx="287" cy="257" r="5" fill="#a99a73" />
        <image href={logo} x="211" y="279" width="97" height="66" opacity=".8" />
        <path d="M145 370h216" stroke="#d3c7a5" strokeWidth="1.5" />
      </g>
      <g transform="rotate(9 417 113)">
        <circle cx="417" cy="113" r="40" fill="#f8f7ed" stroke="#d1d9c1" />
        <path d="m403 111 10 10 18-20" stroke="#6f865d" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
