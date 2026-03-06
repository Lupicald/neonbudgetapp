import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight } from '../theme';

interface NeonTextProps {
    children: React.ReactNode;
    style?: TextStyle;
    variant?: 'hero' | 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';
    color?: string;
    glow?: boolean;
    glowColor?: string;
    align?: 'left' | 'center' | 'right';
    numberOfLines?: number;
}

export const NeonText: React.FC<NeonTextProps> = ({
    children,
    style,
    variant = 'body',
    color,
    glow = false,
    glowColor,
    align = 'left',
    numberOfLines,
}) => {
    const resolvedColor = color || Colors.textPrimary;
    const effectiveGlowColor = glowColor || resolvedColor;

    const glowStyle: TextStyle = glow
        ? {
            textShadowColor: effectiveGlowColor,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 12,
        }
        : {};

    return (
        <Text
            style={[
                styles[variant],
                { color: resolvedColor, textAlign: align },
                glowStyle,
                style,
            ]}
            numberOfLines={numberOfLines}
        >
            {children}
        </Text>
    );
};

const styles = StyleSheet.create({
    hero: {
        fontSize: FontSize.hero,
        fontWeight: FontWeight.extrabold,
        letterSpacing: -1.5,
    },
    display: {
        fontSize: FontSize.display,
        fontWeight: FontWeight.bold,
        letterSpacing: -0.5,
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
    },
    subtitle: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.semibold,
    },
    body: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.regular,
    },
    caption: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.regular,
        color: Colors.textSecondary,
    },
    label: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        color: Colors.textTertiary,
    },
});
