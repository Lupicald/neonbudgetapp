import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BorderRadius, Spacing, Colors } from '../theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    glowColor?: string;  // kept for API compat — unused
    noBorder?: boolean;
    gradient?: boolean;  // kept for API compat — unused
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
    return (
        <View
            style={[
                styles.card,
                hero ? styles.heroCard : styles.normalCard,
                !noBorder && styles.border,
                style,
            ]}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    normalCard: {
        backgroundColor: '#101710',
        padding: Spacing.lg,
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 6,
    },
    heroCard: {
        backgroundColor: '#162016',
        padding: Spacing.xxl,
        borderRadius: 20,
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 8,
    },
    border: {
        borderWidth: 1,
        borderColor: Colors.accent + '1A',
    },
});
