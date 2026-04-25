import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight } from '../theme';

interface NeonTextProps {
    children: React.ReactNode;
    style?: TextStyle;
    variant?: 'hero' | 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';
    color?: string;
    glow?: boolean;       // kept for API compat — no longer renders glow
    glowColor?: string;   // kept for API compat — unused
    align?: 'left' | 'center' | 'right';
    numberOfLines?: number;
}

export const NeonText: React.FC<NeonTextProps> = ({
    children,
    style,
    variant = 'body',
    color,
    glow,
    glowColor,
    align = 'left',
    numberOfLines,
}) => {
    const resolvedColor = color || Colors.textPrimary;

    return (
        <Text
            style={[
                styles[variant],
                { color: resolvedColor, textAlign: align },
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
        letterSpacing: -0.3,
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
        letterSpacing: 1.0,
        color: Colors.textTertiary,
    },
});
