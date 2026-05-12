export function ResourceCard() {
  return (
    <article className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
      <CourtIllustration />

      <div className="relative z-10 -mt-7 flex items-start justify-between gap-3 px-5 pb-3.5">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Tennisbane
          </h1>
          <p className="mt-0.5 text-sm font-semibold text-slate-500">
            Utendørsbane
          </p>
        </div>

        <div className="mt-1 inline-flex max-w-[118px] shrink-0 rounded-full bg-emerald-500 px-2.5 py-1 text-center text-[11px] font-bold leading-tight text-white shadow-sm min-[380px]:max-w-none min-[380px]:px-3 min-[380px]:text-xs">
          Ledige tider i dag
        </div>
      </div>
    </article>
  );
}

function CourtIllustration() {
  return (
    <div className="relative h-48 overflow-hidden bg-slate-100">
      <svg
        aria-hidden="true"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 430 192"
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
            <feDropShadow
              dx="0"
              dy="10"
              floodColor="#0f172a"
              floodOpacity="0.2"
              stdDeviation="10"
            />
          </filter>
        </defs>

        <rect fill="url(#sky)" height="192" width="430" />
        <path
          d="M0 72 C62 50 128 56 185 72 C245 88 311 50 430 64 L430 114 L0 114Z"
          fill="#bcd8b7"
        />

        <g opacity="0.98">
          <circle cx="21" cy="70" fill="#0f3f27" r="42" />
          <circle cx="58" cy="58" fill="#155335" r="51" />
          <circle cx="111" cy="70" fill="#174f32" r="47" />
          <circle cx="164" cy="56" fill="#1b6a41" r="44" />
          <circle cx="223" cy="68" fill="#155335" r="50" />
          <circle cx="287" cy="55" fill="#174f32" r="45" />
          <circle cx="343" cy="72" fill="#0f3f27" r="50" />
          <circle cx="404" cy="64" fill="#155335" r="47" />
          <rect fill="#174f32" height="34" width="430" y="78" />
        </g>

        <g opacity="0.46" stroke="#153b2b" strokeWidth="1">
          <path d="M18 86 H412" />
          <path d="M24 99 H406" />
          <path d="M36 70 V118" />
          <path d="M77 67 V118" />
          <path d="M118 66 V118" />
          <path d="M159 68 V118" />
          <path d="M200 69 V118" />
          <path d="M241 68 V118" />
          <path d="M282 66 V118" />
          <path d="M323 67 V118" />
          <path d="M364 70 V118" />
          <path d="M405 74 V118" />
        </g>

        <path
          d="M0 108 C78 94 145 99 212 111 C284 124 349 112 430 101 L430 192 L0 192Z"
          fill="url(#foregroundGrass)"
        />
        <path d="M56 117 L374 117 L424 182 L6 182 Z" fill="#5f8b58" opacity="0.62" />

        <g filter="url(#softShadow)">
          <path d="M84 110 L346 110 L410 181 L20 181 Z" fill="url(#clayShade)" />
          <path d="M104 118 L326 118 L374 173 L58 173 Z" fill="url(#clay)" />
          <path
            d="M126 124 L304 124 L340 167 L90 167 Z"
            fill="none"
            stroke="#fff7ed"
            strokeOpacity="0.92"
            strokeWidth="3"
          />
          <path d="M215 118 L215 173" stroke="#fff7ed" strokeOpacity="0.88" strokeWidth="2.5" />
          <path d="M104 143 L326 143" stroke="#fff7ed" strokeOpacity="0.9" strokeWidth="2.5" />
          <path d="M159 124 L145 167" stroke="#fff7ed" strokeOpacity="0.62" strokeWidth="2" />
          <path d="M271 124 L285 167" stroke="#fff7ed" strokeOpacity="0.62" strokeWidth="2" />
          <path d="M117 135 L313 135" stroke="#fff7ed" strokeOpacity="0.46" strokeWidth="2" />
          <path d="M93 159 L337 159" stroke="#fff7ed" strokeOpacity="0.42" strokeWidth="2" />
          <path d="M85 142 L346 142" stroke="#1f2937" strokeOpacity="0.55" strokeWidth="4" />
          <path d="M87 139 L344 139" stroke="#f8fafc" strokeOpacity="0.42" strokeWidth="1.5" />
          <path d="M86 142 L65 161" stroke="#1f2937" strokeOpacity="0.34" strokeWidth="2" />
          <path d="M345 142 L365 161" stroke="#1f2937" strokeOpacity="0.34" strokeWidth="2" />
        </g>

        <g opacity="0.18">
          <path d="M75 117 C145 110 258 110 352 117" fill="none" stroke="#fff7ed" strokeWidth="12" />
          <path d="M41 180 C125 172 290 172 392 180" fill="none" stroke="#78350f" strokeWidth="8" />
        </g>
      </svg>

      <div className="absolute inset-x-0 bottom-0 h-16">
        <svg
          aria-hidden="true"
          className="h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 430 64"
        >
          <path d="M0 18 C78 8 132 28 204 40 C282 53 351 48 430 39 L430 64 L0 64Z" fill="white" />
        </svg>
      </div>
    </div>
  );
}
