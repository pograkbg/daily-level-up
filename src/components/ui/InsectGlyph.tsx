/** 그림으로 그린 곤충 아이콘 표시 값 (lib/game/insects.ts 의 icon 과 같아야 합니다). */
export const MANTIS_GLYPH = "svg:mantis";
export const DRAGONFLY_GLYPH = "svg:dragonfly";

/**
 * 곤충 그림 한 개. 대부분은 이모지 글자이고, 사마귀·잠자리는 직접 그린 SVG 입니다.
 * className 으로 크기를 줍니다 (SVG 는 width/height, 이모지는 text-크기).
 */
export function InsectGlyph({ icon, className = "" }: { icon: string; className?: string }) {
  if (icon === MANTIS_GLYPH) {
    return (
      <svg
        aria-hidden
        viewBox="8 6 52 50"
        className={`shrink-0 ${className}`}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* 뒷다리 (두 쌍, 땅을 짚은 모양) */}
        <path d="M30 38 L24 47 L21 54 M34 38 L40 47 L43 54" stroke="#558b2f" strokeWidth="2.2" />
        {/* 긴 몸통 (배) */}
        <path d="M32 33 L33 52" stroke="#8bc34a" strokeWidth="5" />
        {/* 가슴 */}
        <ellipse cx="32" cy="29" rx="5.5" ry="4" fill="#7cb342" />
        {/* 앞다리: 가슴 앞에서 접어 올린 낫 모양 */}
        <path d="M27 26 L20 17 L18 26 M37 26 L44 17 L46 26" stroke="#558b2f" strokeWidth="2.4" />
        <path d="M20 17 L17 21 M44 17 L47 21" stroke="#33691e" strokeWidth="1.4" />
        {/* 머리 (삼각형) */}
        <path d="M32 9 L38 18 L32 21 L26 18 Z" fill="#9ccc65" />
        <circle cx="29.5" cy="15" r="1.4" fill="#33691e" />
        <circle cx="34.5" cy="15" r="1.4" fill="#33691e" />
        {/* 더듬이 */}
        <path d="M30 10 L27 4 M34 10 L37 4" stroke="#558b2f" strokeWidth="1" />
      </svg>
    );
  }
  if (icon === DRAGONFLY_GLYPH) {
    return (
      <svg
        aria-hidden
        viewBox="4 10 56 40"
        className={`shrink-0 ${className}`}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* 날개 네 장 (반투명 하늘색) */}
        <ellipse cx="28" cy="18" rx="12" ry="4.5" transform="rotate(-18 28 18)" fill="#b3e5fc" fillOpacity="0.85" stroke="#0288d1" strokeWidth="0.8" />
        <ellipse cx="28" cy="34" rx="12" ry="4.5" transform="rotate(18 28 34)" fill="#b3e5fc" fillOpacity="0.85" stroke="#0288d1" strokeWidth="0.8" />
        <ellipse cx="38" cy="20" rx="8" ry="3" transform="rotate(-12 38 20)" fill="#e1f5fe" fillOpacity="0.9" stroke="#0288d1" strokeWidth="0.6" />
        <ellipse cx="38" cy="32" rx="8" ry="3" transform="rotate(12 38 32)" fill="#e1f5fe" fillOpacity="0.9" stroke="#0288d1" strokeWidth="0.6" />
        {/* 가느다란 몸통 (배 마디) */}
        <path d="M22 27 L54 30" stroke="#0277bd" strokeWidth="3" />
        <path d="M36 28.4 L48 30.6" stroke="#29b6f6" strokeWidth="1.2" />
        {/* 다리 */}
        <path d="M26 29 L22 34 M30 29 L28 35" stroke="#01579b" strokeWidth="1" />
        {/* 큰 겹눈 */}
        <circle cx="18" cy="25" r="5" fill="#4fc3f7" />
        <circle cx="16" cy="23.5" r="1.2" fill="#ffffff" fillOpacity="0.8" />
        {/* 더듬이 */}
        <path d="M17 20 L13 16" stroke="#01579b" strokeWidth="0.9" />
      </svg>
    );
  }
  return (
    <span aria-hidden className={`inline-flex shrink-0 items-center justify-center ${className}`}>
      {icon}
    </span>
  );
}
