import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from './colors';

export { Colors, CategoryColors } from './colors';

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

export const BorderRadius = {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 24,
    xxl: 32,
    full: 999,
};

export const FontSize = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
    display: 36,
    hero: 48,
};

export const FontWeight = {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
    extrabold: '800' as TextStyle['fontWeight'],
};

export const Shadows = {
    glowPurple: {
        shadowColor: Colors.glowPurple,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
        elevation: 10,
    },
    glowBlue: {
        shadowColor: Colors.glowBlue,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
        elevation: 10,
    },
    glowGreen: {
        shadowColor: Colors.glowGreen,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
        elevation: 10,
    },
    glowPink: {
        shadowColor: Colors.glowPink,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 16,
        elevation: 10,
    },
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    subtle: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
};

export const GlassStyle: ViewStyle = {
    backgroundColor: 'rgba(12, 21, 53, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.12)',
    borderRadius: BorderRadius.lg,
};

export const CommonStyles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    screenPadding: {
        paddingHorizontal: Spacing.lg,
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
