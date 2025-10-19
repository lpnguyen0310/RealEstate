// inline SVG -> data URL (nhẹ, không cần asset riêng)
const svgToDataUrl = (s) => `data:image/svg+xml;utf8,${encodeURIComponent(s)}`;

export const IMG_USERS = svgToDataUrl(`
<svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#eaf1ff"/><stop offset="100%" stop-color="#f7fbff"/></linearGradient></defs>
  <circle cx="90" cy="95" r="44" fill="url(#g1)"/>
  <circle cx="62" cy="56" r="18" fill="#2b59ff" fill-opacity="0.22"/>
  <rect x="34" y="84" rx="12" ry="12" width="56" height="24" fill="#2b59ff" fill-opacity="0.18"/>
  <circle cx="96" cy="64" r="10" fill="#2b59ff" fill-opacity="0.28"/>
  <circle cx="112" cy="78" r="6" fill="#2b59ff" fill-opacity="0.18"/>
</svg>
`);

export const IMG_AGENTS = svgToDataUrl(`
<svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f3e9ff"/><stop offset="100%" stop-color="#fbf7ff"/></linearGradient></defs>
  <circle cx="95" cy="95" r="44" fill="url(#g2)"/>
  <path d="M58 58 l18 -12 l18 12 v20 h-36z" fill="#7a33ff" fill-opacity="0.25"/>
  <rect x="62" y="66" width="28" height="16" rx="3" fill="#7a33ff" fill-opacity="0.3"/>
  <circle cx="102" cy="62" r="8" fill="#7a33ff" fill-opacity="0.28"/>
</svg>
`);

export const IMG_ACTIVE = svgToDataUrl(`
<svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#eaffe9"/><stop offset="100%" stop-color="#f8fff7"/></linearGradient></defs>
  <circle cx="95" cy="95" r="44" fill="url(#g3)"/>
  <circle cx="64" cy="64" r="20" fill="#0ea85f" fill-opacity="0.22"/>
  <path d="M56 66 l7 7 l15 -15" stroke="#0ea85f" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="108" cy="70" r="7" fill="#0ea85f" fill-opacity="0.26"/>
</svg>
`);

export const IMG_LOCKED = svgToDataUrl(`
<svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffeaea"/><stop offset="100%" stop-color="#fff7f7"/></linearGradient></defs>
  <circle cx="95" cy="95" r="44" fill="url(#g4)"/>
  <rect x="52" y="70" width="36" height="24" rx="6" fill="#e03434" fill-opacity="0.22"/>
  <path d="M60 70 v-6 a10 10 0 0 1 20 0 v6" stroke="#e03434" stroke-width="5" fill="none" stroke-linecap="round"/>
  <circle cx="108" cy="68" r="7" fill="#e03434" fill-opacity="0.26"/>
</svg>
`);
