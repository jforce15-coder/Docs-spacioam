/* ===================================================
   Spacio AM — Brand chrome components
   Uses official SVG assets.
   =================================================== */

function LogoPrimary({ width = 132 }) {
  return (
    <img
      src="assets/brand/logo-primary-transparent.png"
      alt="Spacio AM"
      style={{ width, display: "block" }}
    />
  );
}

function LogoMonogram({ width = 58 }) {
  return (
    <img
      src="assets/logo-monogram.svg"
      alt="Spacio AM monogram"
      style={{ width, display: "block" }}
    />
  );
}

function LogoStamp({ size = 96 }) {
  return (
    <img
      src="assets/logo-stamp-circular.svg"
      alt="Spacio AM stamp"
      style={{ width: size, height: size, display: "block" }}
    />
  );
}

function Star({ size = 14, color = "#3E3F3F" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill={color} style={{ display: "block" }}>
      <path d="M50 4 C 52 32, 58 42, 96 50 C 58 58, 52 68, 50 96 C 48 68, 42 58, 4 50 C 42 42, 48 32, 50 4 Z" />
    </svg>
  );
}

/* ── Organic pill outline (decorative, on cover page) ── */
function PillOutline({ width = 60, height = 110 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 60 110"
      fill="none"
      style={{ display: "block", transform: "rotate(-10deg)" }}
    >
      <path
        d="M30 5 C 16 5, 8 22, 9 38 C 10 56, 4 80, 16 96 C 28 108, 50 100, 52 80 C 54 60, 52 38, 50 22 C 48 10, 42 5, 30 5 Z"
        stroke="#3E3F3F"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

Object.assign(window, { LogoPrimary, LogoMonogram, LogoStamp, Star, PillOutline });
