type PostoLoadingScreenProps = {
  message?: string;
  title?: string;
  variant?: 'screen' | 'panel';
};

export function PostoLoadingScreen({
  message = 'Sincronizando informacoes do posto...',
  title = 'Abastecendo dados',
  variant = 'screen',
}: PostoLoadingScreenProps) {
  return (
    <div className={`posto-loader posto-loader-${variant}`} role="status" aria-live="polite">
      <div className="posto-loader-shell">
        <div className="posto-loader-scene" aria-hidden="true">
          <svg className="posto-loader-svg" viewBox="0 0 520 230" xmlns="http://www.w3.org/2000/svg">
            <path className="loader-ground" d="M48 184H476" />

            <g className="loader-pump">
              <rect className="loader-pump-body" height="126" rx="10" width="78" x="70" y="48" />
              <rect className="loader-pump-face" height="38" rx="6" width="50" x="84" y="64" />
              <path className="loader-pump-meter" d="M92 87h18M92 76h32" />
              <rect className="loader-pump-base" height="16" rx="5" width="96" x="61" y="170" />
              <path className="loader-nozzle" d="M145 86h28c9 0 16 7 16 16v14" />
              <path className="loader-nozzle-tip" d="M184 116h21" />
            </g>

            <path className="loader-hose-shadow" d="M188 116C238 86 293 89 332 123C359 147 381 148 407 132" />
            <path className="loader-hose" d="M188 116C238 86 293 89 332 123C359 147 381 148 407 132" />
            <path className="loader-fuel-flow" d="M188 116C238 86 293 89 332 123C359 147 381 148 407 132" />

            <g className="loader-car">
              <path className="loader-car-window" d="M345 105h63l27 32H322l23-32Z" />
              <path className="loader-car-body" d="M304 136h146c18 0 31 14 31 31v12H276v-13c0-17 11-30 28-30Z" />
              <path className="loader-car-line" d="M323 151h94" />
              <circle className="loader-wheel" cx="326" cy="181" r="18" />
              <circle className="loader-wheel-core" cx="326" cy="181" r="7" />
              <circle className="loader-wheel" cx="431" cy="181" r="18" />
              <circle className="loader-wheel-core" cx="431" cy="181" r="7" />
            </g>

            <circle className="loader-drop loader-drop-a" cx="212" cy="105" r="5" />
            <circle className="loader-drop loader-drop-b" cx="272" cy="101" r="4" />
            <circle className="loader-drop loader-drop-c" cx="345" cy="132" r="4" />
          </svg>
        </div>

        <div className="posto-loader-copy">
          <strong>{title}</strong>
          <span>{message}</span>
        </div>

        <div className="posto-loader-progress" aria-hidden="true">
          <i />
        </div>
      </div>
    </div>
  );
}
