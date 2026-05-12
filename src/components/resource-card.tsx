import Link from "next/link";

export function ResourceCard() {
  return (
    <article className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
      <CourtIllustration />

      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Tennisbane
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Utendørsbane
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            08:00-22:00
          </span>
        </div>

        <Link
          className="flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-5 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          href="/r/tennisbane"
        >
          Book tid
        </Link>
      </div>
    </article>
  );
}

function CourtIllustration() {
  return (
    <div className="relative h-52 overflow-hidden bg-slate-100">
      <svg
        aria-hidden="true"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 430 208"
      >
        <defs>
          <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#dff4ff" />
            <stop offset="68%" stopColor="#f4fbff" />
            <stop offset="100%" stopColor="#d7ead5" />
          </linearGradient>
          <linearGradient id="clay" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#D88A45" />
            <stop offset="56%" stopColor="#C9793A" />
            <stop offset="100%" stopColor="#B7652F" />
          </linearGradient>
          <linearGradient id="clayShade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#E49A58" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#9f5228" stopOpacity="0.92" />
          </linearGradient>
          <linearGradient id="foregroundGrass" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#8DBA72" />
            <stop offset="100%" stopColor="#668F54" />
          </linearGradient>
          <filter id="softShadow" height="160%" width="160%" x="-30%" y="-30%">
            <feDropShadow dx="0" dy="10" floodColor="#0f172a" floodOpacity="0.2" stdDeviation="10" />
          </filter>
        </defs>

        <rect fill="url(#sky)" height="208" width="430" />
        <path d="M0 78 C62 54 128 61 185 78 C245 95 311 54 430 70 L430 124 L0 124Z" fill="#bcd8b7" />

        <g opacity="0.98">
          <circle cx="21" cy="77" fill="#0f3f27" r="42" />
          <circle cx="58" cy="64" fill="#155335" r="51" />
          <circle cx="111" cy="76" fill="#174f32" r="47" />
          <circle cx="164" cy="62" fill="#1b6a41" r="44" />
          <circle cx="223" cy="74" fill="#155335" r="50" />
          <circle cx="287" cy="61" fill="#174f32" r="45" />
          <circle cx="343" cy="78" fill="#0f3f27" r="50" />
          <circle cx="404" cy="70" fill="#155335" r="47" />
          <rect fill="#174f32" height="34" width="430" y="84" />
        </g>

        <g opacity="0.46" stroke="#153b2b" strokeWidth="1">
          <path d="M18 92 H412" />
          <path d="M24 105 H406" />
          <path d="M36 76 V124" />
          <path d="M77 73 V124" />
          <path d="M118 72 V124" />
          <path d="M159 74 V124" />
          <path d="M200 75 V124" />
          <path d="M241 74 V124" />
          <path d="M282 72 V124" />
          <path d="M323 73 V124" />
          <path d="M364 76 V124" />
          <path d="M405 80 V124" />
        </g>

        <path d="M0 116 C78 101 145 106 212 119 C284 133 349 120 430 108 L430 208 L0 208Z" fill="url(#foregroundGrass)" />
        <path d="M56 126 L374 126 L424 198 L6 198 Z" fill="#5f8b58" opacity="0.62" />

        <g filter="url(#softShadow)">
          <path d="M84 119 L346 119 L410 195 L20 195 Z" fill="url(#clayShade)" />
          <path d="M104 127 L326 127 L374 187 L58 187 Z" fill="url(#clay)" />
          <path d="M126 134 L304 134 L340 180 L90 180 Z" fill="none" stroke="#fff7ed" strokeOpacity="0.92" strokeWidth="3" />
          <path d="M215 127 L215 187" stroke="#fff7ed" strokeOpacity="0.88" strokeWidth="2.5" />
          <path d="M104 154 L326 154" stroke="#fff7ed" strokeOpacity="0.9" strokeWidth="2.5" />
          <path d="M159 134 L145 180" stroke="#fff7ed" strokeOpacity="0.62" strokeWidth="2" />
          <path d="M271 134 L285 180" stroke="#fff7ed" strokeOpacity="0.62" strokeWidth="2" />
          <path d="M117 145 L313 145" stroke="#fff7ed" strokeOpacity="0.46" strokeWidth="2" />
          <path d="M93 171 L337 171" stroke="#fff7ed" strokeOpacity="0.42" strokeWidth="2" />
          <path d="M85 153 L346 153" stroke="#1f2937" strokeOpacity="0.55" strokeWidth="4" />
          <path d="M87 150 L344 150" stroke="#f8fafc" strokeOpacity="0.42" strokeWidth="1.5" />
          <path d="M86 153 L65 173" stroke="#1f2937" strokeOpacity="0.34" strokeWidth="2" />
          <path d="M345 153 L365 173" stroke="#1f2937" strokeOpacity="0.34" strokeWidth="2" />
        </g>

        <g opacity="0.18">
          <path d="M75 126 C145 119 258 119 352 126" fill="none" stroke="#fff7ed" strokeWidth="12" />
          <path d="M41 193 C125 184 290 184 392 193" fill="none" stroke="#78350f" strokeWidth="8" />
        </g>
      </svg>

      <div className="absolute left-4 top-4 inline-flex rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
        Ledige tider i dag
      </div>
    </div>
  );
}
