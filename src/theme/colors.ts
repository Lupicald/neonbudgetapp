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

  // Back-compat aliases (so untouched screens keep working under new palette)
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

  // Legacy color tokens — repointed to Editorial Carbon equivalents.
  // Kept ONLY so any unmigrated reference still compiles; new code must use semantic names.
  neonPink: '#C9603D',
  neonOrange: '#D9A246',
  neonYellow: '#D9A246',
  cyberGreen: '#4A8F5C',
  neonPurple: '#5C8FA8',
  neonPurpleLight: '#6BAF7B',
  neonPurpleDark: '#1F3A28',
  electricBlue: '#5C8FA8',
  electricBlueLight: '#7AA9BE',
  electricBlueDark: '#3D6C81',
  cyberGreenLight: '#6BAF7B',
  cyberGreenDark: '#1F3A28',
  neonPinkLight: '#E07A55',
  neonPinkDark: '#9B4530',
  glowPurple: '#5C8FA8',
  glowBlue: '#5C8FA8',
  glowGreen: '#4A8F5C',
  glowPink: '#C9603D',
  glowOrange: '#D9A246',
  // Gradient arrays — kept as flat dual-tone (no actual gradient in Editorial Carbon).
  gradientPurple:     ['#4A8F5C', '#1F3A28'] as string[],
  gradientPurpleBlue: ['#4A8F5C', '#5C8FA8'] as string[],
  gradientBlue:       ['#5C8FA8', '#3D6C81'] as string[],
  gradientGreen:      ['#4A8F5C', '#1F3A28'] as string[],
  gradientPink:       ['#C9603D', '#3D1E14'] as string[],
  gradientDark:       ['#262A2C', '#1B1E1F'] as string[],
  gradientCard:       ['#262A2C', '#1B1E1F'] as string[],
  gradientHero:       ['#16181B', '#0E0F0D'] as string[],
  gradientIncome:     ['#4A8F5C', '#1F3A28'] as string[],
  gradientExpense:    ['#C9603D', '#3D1E14'] as string[],
  gradientPlanned:    ['#D9A246', '#3D1E14'] as string[],
  backgroundCardLight: '#262A2C',
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
