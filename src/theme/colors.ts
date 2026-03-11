// Premium minimal palette — clean dark with precise accent touches
export const Colors = {
  // Backgrounds — true dark charcoal, not navy
  background: '#0C0C0C',
  backgroundLight: '#131313',
  backgroundCard: '#181818',
  backgroundCardLight: '#202020',
  surface: '#181818',
  surfaceLight: '#202020',

  // Accent system — used sparingly, not on every element
  neonPurple: '#7C3AED',        // rare accent, hero gradient only
  neonPurpleLight: '#A78BFA',
  neonPurpleDark: '#5B21B6',
  electricBlue: '#3B82F6',      // interactive elements, links
  electricBlueLight: '#60A5FA',
  electricBlueDark: '#1D4ED8',
  cyberGreen: '#10B981',        // income, positive balance
  cyberGreenLight: '#34D399',
  cyberGreenDark: '#059669',
  neonPink: '#EF4444',          // expense, negative balance
  neonPinkLight: '#F87171',
  neonPinkDark: '#DC2626',
  neonOrange: '#F59E0B',        // warnings
  neonYellow: '#FCD34D',

  // Text — clean white/gray hierarchy
  textPrimary: '#F9FAFB',
  textSecondary: 'rgba(249, 250, 251, 0.60)',
  textTertiary: 'rgba(249, 250, 251, 0.35)',
  textMuted: 'rgba(249, 250, 251, 0.18)',

  // Semantic
  income: '#10B981',
  expense: '#EF4444',
  warning: '#F59E0B',
  danger: '#EF4444',
  success: '#10B981',

  // Borders — barely visible, professional
  border: 'rgba(255, 255, 255, 0.06)',
  borderLight: 'rgba(255, 255, 255, 0.11)',
  borderNeon: 'rgba(124, 58, 237, 0.22)',

  // Gradients — subtle, not vivid
  gradientPurple: ['#7C3AED', '#5B21B6'] as string[],
  gradientPurpleBlue: ['#7C3AED', '#3B82F6'] as string[],
  gradientBlue: ['#3B82F6', '#60A5FA'] as string[],
  gradientGreen: ['#10B981', '#059669'] as string[],
  gradientPink: ['#EF4444', '#DC2626'] as string[],
  gradientDark: ['#202020', '#0C0C0C'] as string[],
  gradientCard: ['#1E1E1E', '#161616'] as string[],
  gradientHero: ['#1A103A', '#0C0C0C'] as string[],
  gradientIncome: ['#10B981', '#3B82F6'] as string[],
  gradientExpense: ['#EF4444', '#F59E0B'] as string[],
  gradientPlanned: ['#7C3AED', '#3B82F6'] as string[],

  // Glow — used only on key numbers, not decorative
  glowPurple: '#7C3AED',
  glowBlue: '#3B82F6',
  glowGreen: '#10B981',
  glowPink: '#EF4444',
  glowOrange: '#F59E0B',

  // Tab bar
  tabBarBackground: '#111111',
  tabBarActive: '#10B981',
  tabBarInactive: 'rgba(249, 250, 251, 0.28)',
};

export const CategoryColors = [
  '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#FCD34D',
  '#7C3AED', '#8B5CF6', '#60A5FA', '#F87171', '#6B7280',
  '#34D399', '#FCA5A5', '#A78BFA', '#1D4ED8', '#DC2626',
];
