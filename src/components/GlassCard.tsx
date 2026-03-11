import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing, Shadows } from '../theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
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
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.20,
            shadowRadius: 16,
            elevation: 8,
        }
        : Shadows.card;

    if (hero) {
        return (
            <LinearGradient
                colors={['#1E1230', '#141414', '#0C0C0C'] as [string, string, string]}
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
                colors={['#1E1E1E', '#161616'] as [string, string]}
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
        backgroundColor: '#181818',
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
        borderColor: 'rgba(255, 255, 255, 0.07)',
    },
    heroBorder: {
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.20)',
    },
});
