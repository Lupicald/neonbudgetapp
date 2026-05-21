import { Platform, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from './colors';

export { Colors, CategoryColors } from './colors';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

export const BorderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 999,
};

export const FontSize = {
  xs: 10,
  sm: 11,
  md: 12,
  base: 13,
  lg: 14,
  xl: 15,
  xxl: 16,
  xxxl: 18,
  display: 22,
  hero: 28,
  giant: 40,
  mega: 56,
};

export const FontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  extrabold: '800' as TextStyle['fontWeight'],
};

// Font families — Editorial Carbon system
// display: Instrument Serif italic — section titles, hero amounts, "moments"
// serif:   Instrument Serif roman — editorial closer, currency glyph
// sans:    system SF Pro / Roboto — UI / body / numerals
// mono:    Menlo — micro labels, ticker-style meta
export const FontFamily = {
  sans: undefined as string | undefined,
  display: 'InstrumentSerif_400Regular_Italic' as string | undefined,
  serif: 'InstrumentSerif_400Regular' as string | undefined,
  mono: Platform.OS === 'ios' ? 'Menlo' : 'monospace' as string | undefined,
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 30,
    elevation: 14,
  },
};

export const GlassStyle: ViewStyle = {
  backgroundColor: Colors.bgCard,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: BorderRadius.lg,
};

export const CommonStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  screenPadding: {
    paddingHorizontal: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
