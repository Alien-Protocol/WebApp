type IconProps = { size?: number };

export function UsdcLogo({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#2775CA" />
      <path
        fill="#fff"
        d="M16.1 7.2c-4.9 0-8.8 3.2-8.8 8.8 0 5.6 3.9 8.8 8.8 8.8 2.4 0 4.5-.7 6.1-1.9l-1.8-2.3c-1 .8-2.3 1.3-4.2 1.3-3.2 0-5.4-2-5.4-5.9s2.2-5.9 5.4-5.9c1.9 0 3.2.5 4.2 1.3l1.8-2.3c-1.6-1.2-3.7-1.9-6.1-1.9Zm-2.05 7.15h8.3v3.3h-8.3v-3.3Z"
      />
    </svg>
  );
}

export function XlmLogo({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#0A0B12" />
      <circle cx="16" cy="16" r="15.2" stroke="#ffffff" strokeWidth="1.2" />
      <path
        fill="#fff"
        d="M16 4.8 18.15 14.1 27.2 16 18.15 17.9 16 27.2 13.85 17.9 4.8 16 13.85 14.1 16 4.8Z"
      />
      <circle cx="16" cy="16" r="2.1" fill="#0A0B12" />
    </svg>
  );
}

export function TbillLogo({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#0E7490" />
      <circle cx="16" cy="16" r="12.5" fill="#164E63" />
      <path
        fill="#A5F3FC"
        d="M10 11.2h12v1.6h-5.2V21h-1.6v-8.2H10v-1.6Z"
      />
      <rect x="8.5" y="22.2" width="15" height="1.4" rx="0.7" fill="#A5F3FC" />
      <rect x="10.5" y="24.2" width="11" height="1.1" rx="0.55" fill="#ffffff" opacity="0.7" />
    </svg>
  );
}

export function TreitLogo({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#5B21B6" />
      <path
        fill="#E9D5FF"
        d="M7.5 22.8V14.2l8.5-6.4 8.5 6.4v8.6h-3.2v-5.4h-4.2v5.4h-2.2v-5.4h-4.2v5.4H7.5Z"
      />
      <rect x="14.6" y="17.4" width="2.8" height="5.4" fill="#ffffff" />
    </svg>
  );
}

export function TinvLogo({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#B45309" />
      <path
        fill="#FEF3C7"
        d="M11 8.4h8.2l3.8 3.8V23.6H11V8.4Z"
      />
      <path fill="#F59E0B" d="M19.2 8.4v3.8h3.8" />
      <rect x="13" y="14.2" width="6.8" height="1.3" rx="0.5" fill="#B45309" />
      <rect x="13" y="17" width="6.8" height="1.3" rx="0.5" fill="#B45309" />
      <rect x="13" y="19.8" width="4.4" height="1.3" rx="0.5" fill="#D97706" />
    </svg>
  );
}

export function EurcLogo({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#0F766E" />
      <path
        fill="#CCFBF1"
        d="M18.8 9.2c2.4.7 4.2 2.4 5 4.6h-2.6c-.6-1.1-1.6-1.9-2.9-2.3v2.3h4.2v2.1h-4.2v1.5h4.2v2.1h-4.2v2.3c1.3-.4 2.3-1.2 2.9-2.3h2.6c-.8 2.2-2.6 3.9-5 4.6v-2.1c-3.3-.4-5.6-2.6-5.6-6.2s2.3-5.8 5.6-6.2V9.2Z"
      />
    </svg>
  );
}
