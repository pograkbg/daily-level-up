/**
 * 모험 가이드 드래곤 (SVG로 직접 그린 마스코트)
 * 나중에 일러스트 이미지로 바꿀 때는 이 파일만 교체하면 됩니다.
 */
export function DragonMascot({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="모험 가이드 드래곤 포포"
      className={className}
    >
      {/* 날개 */}
      <path d="M70 90 C 20 40, 15 110, 60 120 Z" fill="#b9a8ff" stroke="#7c6cf0" strokeWidth="4" />
      <path d="M130 90 C 180 40, 185 110, 140 120 Z" fill="#b9a8ff" stroke="#7c6cf0" strokeWidth="4" />
      {/* 꼬리 */}
      <path
        d="M140 150 C 180 170, 185 135, 165 130"
        fill="none"
        stroke="#7cd8a6"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <polygon points="162,120 176,128 160,140" fill="#7cd8a6" />
      {/* 몸통 */}
      <ellipse cx="100" cy="135" rx="55" ry="45" fill="#a6e8c4" stroke="#4fc38a" strokeWidth="4" />
      {/* 배 */}
      <ellipse cx="100" cy="145" rx="30" ry="25" fill="#e9fff3" />
      {/* 발 */}
      <ellipse cx="70" cy="178" rx="16" ry="9" fill="#ffd9a8" />
      <ellipse cx="130" cy="178" rx="16" ry="9" fill="#ffd9a8" />
      {/* 머리 */}
      <circle cx="100" cy="75" r="45" fill="#a6e8c4" stroke="#4fc38a" strokeWidth="4" />
      {/* 뿔 */}
      <polygon points="75,40 82,20 90,42" fill="#ffc93c" />
      <polygon points="125,40 118,20 110,42" fill="#ffc93c" />
      {/* 눈 */}
      <circle cx="85" cy="72" r="7" fill="#3b3660" />
      <circle cx="115" cy="72" r="7" fill="#3b3660" />
      <circle cx="87" cy="70" r="2.5" fill="#fff" />
      <circle cx="117" cy="70" r="2.5" fill="#fff" />
      {/* 볼 */}
      <circle cx="75" cy="90" r="7" fill="#ffb3c7" opacity="0.8" />
      <circle cx="125" cy="90" r="7" fill="#ffb3c7" opacity="0.8" />
      {/* 입 */}
      <path d="M92 90 Q 100 98 108 90" fill="none" stroke="#3b3660" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
