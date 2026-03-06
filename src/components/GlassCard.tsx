import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing, Shadows } from '../theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    glowColor?: string;
    noBorder?: boolean;
    gradient?: boolean;
    hero?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    glowColor,
    noBorder = false,
    gradient = false,
    hero = false,
}) => {
    const glowShadow = glowColor
        ? {
            shadowColor: glowColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.55,
            shadowRadius: 20,
            elevation: 12,
        }
        : Shadows.card;

    if (hero) {
        return (
            <LinearGradient
                colors={['#1A0A4A', '#0A1A40', '#050A1A'] as [string, string, string]}
                style={[
                    styles.card,
                    styles.heroCard,
                    !noBorder && styles.heroBorder,
                    glowShadow,
                    style,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {children}
            </LinearGradient>
        );
    }

    if (gradient) {
        return (
            <LinearGradient
                colors={Colors.gradientCard as [string, string]}
                style={[
                    styles.card,
                    !noBorder && styles.border,
                    glowShadow,
                    style,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {children}
            </LinearGradient>
        );
    }

    return (
        <View
            style={[
                styles.card,
                !noBorder && styles.border,
                glowShadow,
                style,
            ]}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        overflow: 'hidden',
    },
    heroCard: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xxl,
    },
    border: {
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.14)',
    },
    heroBorder: {
        borderWidth: 1,
        borderColor: 'rgba(123, 47, 255, 0.35)',
    },
});
