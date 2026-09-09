export default function BeanMascot({ happy = false }) {
  return (
    <svg className="eg-bean" viewBox="0 0 112 124" fill="none" aria-hidden="true" focusable="false">
      <ellipse cx="56" cy="115" rx="31" ry="5" fill="#35543c" opacity=".09" />
      <g className="eg-bean-body">
        <path d="M37 95 32 110M72 98l5 12" stroke="#5b4230" strokeWidth="5" strokeLinecap="round" />
        <path d="M25 69c-9 0-13-6-14-12M84 65c9-3 11-10 10-15" stroke="#5b4230" strokeWidth="4" strokeLinecap="round" />
        <path d="M83 39C69 21 45 25 30 45 12 69 23 101 47 105c28 5 55-43 36-66Z" fill="#bb8c5e" stroke="#5b4230" strokeWidth="2.5" />
        <path d="M67 30c-21 17-5 36-19 49-7 7-11 14-11 22" stroke="#785339" strokeWidth="4" strokeLinecap="round" />
        <path d="M56 30C37 29 32 17 35 9c15 0 26 6 24 20" fill="#638656" stroke="#35543c" strokeWidth="2" />
        <path d="M59 29c-3-17 10-25 23-24 1 15-8 25-23 24Z" fill="#8eaa70" stroke="#35543c" strokeWidth="2" />
        <path d="m58 31 13-15M57 29 43 18" stroke="#35543c" strokeWidth="2" strokeLinecap="round" />
        <g stroke="#352d27" strokeWidth="3.5" strokeLinecap="round">
          {happy ? <><path d="m36 61 3-3 3 3" /><path d="m66 60 3-3 3 3" /></> : <><path d="M39 58v4" /><path d="M70 57v4" /></>}
          <path d="M50 71q7 7 14-1" />
        </g>
        <ellipse cx="35" cy="69" rx="5" ry="3" fill="#dba781" />
        <ellipse cx="76" cy="67" rx="5" ry="3" fill="#dba781" />
      </g>
    </svg>
  );
}
