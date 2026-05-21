// Sumari — Editorial Carbon (dark, dual-tone)
// Verde billete + terracota sobre carbón cálido. No neón, no glassmorphism.
export const Colors = {
  // Surfaces
  bg: '#0E0F0D',          // carbón cálido
  bgElevated: '#16181B',
  bgCard: '#1B1E1F',
  bgCardAlt: '#262A2C',
  bgHero: '#0A0B0A',
  bgPressed: '#0B0C0A',

  // Foreground (cream, no white)
  textPrimary: '#F2EDE3',
  textSecondary: '#A8A398',
  textTertiary: '#6E6A60',
  textMuted: '#4A4740',

  // Verde billete (positive / income / healthy)
  accent: '#4A8F5C',
  accentLight: '#6BAF7B',
  accentSoft: 'rgba(74,143,92,0.16)',
  accentGlow: 'rgba(74,143,92,0.22)',
  greenDeep: '#1F3A28',

  // Terracota (expense / serious alert)
  rust: '#C9603D',
  rustLight: '#E07A55',
  rustSoft: 'rgba(201,96,61,0.14)',
  rustDeep: '#3D1E14',

  // Ámbar (warning / upcoming)
  amber: '#D9A246',
  amberSoft: 'rgba(217,162,70,0.14)',

  // Semantic
  positive: '#4A8F5C',
  negative: '#C9603D',
  negativeSoft: 'rgba(201,96,61,0.14)',
  warning: '#D9A246',
  warningSoft: 'rgba(217,162,70,0.14)',
  info: '#5C8FA8',         // azul plomo (único frío)
  infoSoft: 'rgba(92,143,168,0.14)',
  orange: '#C9603D',       // alias → rust

  // Borders (hairlines)
  border: 'rgba(242,237,227,0.07)',
  borderStrong: 'rgba(242,237,227,0.13)',

  // Foreground-on-X
  onAccent: '#0E0F0D',
  onHero: '#F2EDE3',
  onRust: '#F2EDE3',

  // Semantic back-compat aliases still referenced by a handful of unmigrated screens.
  // Slated for removal once every screen uses the canonical name above.
  background: '#0E0F0D',
  backgroundCard: '#1B1E1F',
  backgroundLight: '#16181B',
  surface: '#1B1E1F',
  surfaceLight: '#262A2C',
  income: '#4A8F5C',
  expense: '#C9603D',
  danger: '#C9603D',
  success: '#4A8F5C',
  borderLight: 'rgba(242,237,227,0.13)',
  tabBarBackground: '#0E0F0D',
  tabBarActive: '#F2EDE3',
  tabBarInactive: '#6E6A60',
};

// Editorial dual-tone palette — verde billete, terracota, ámbar y tonos planos.
export const CategoryColors = [
  '#4A8F5C', // verde billete
  '#C9603D', // terracota
  '#D9A246', // ámbar
  '#7A8F5C', // verde salvia
  '#A8A398', // gris cálido
  '#8FA34A', // oliva
  '#6E6A60', // fango
  '#B58A4A', // mostaza
  '#5C8FA8', // azul plomo
  '#9E6E5C', // tierra
];
