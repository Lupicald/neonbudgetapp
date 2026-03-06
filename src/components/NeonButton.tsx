import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing, FontSize, FontWeight, Shadows } from '../theme';

interface NeonButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
    fullWidth?: boolean;
}

const gradientMap = {
    primary: Colors.gradientPurpleBlue as [string, string],
    secondary: Colors.gradientBlue as [string, string],
    danger: Colors.gradientExpense as [string, string],
    outline: Colors.gradientDark as [string, string],
};

const glowMap = {
    primary: Shadows.glowPurple,
    secondary: Shadows.glowBlue,
    danger: Shadows.glowPink,
    outline: {},
};

export const NeonButton: React.FC<NeonButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    style,
    textStyle,
    fullWidth = false,
}) => {
    const isOutline = variant === 'outline';

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.75}
            style={[fullWidth && styles.fullWidth, style]}
        >
            <LinearGradient
                colors={
                    disabled
                        ? (['#1A1A2E', '#0F0F1E'] as [string, string])
                        : gradientMap[variant]
                }
                style={[
                    styles.button,
                    styles[size],
                    isOutline && styles.outline,
                    !disabled && !isOutline && (glowMap[variant] as ViewStyle),
                    fullWidth && styles.fullWidth,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                {loading ? (
                    <ActivityIndicator color={Colors.textPrimary} size="small" />
                ) : (
                    <>
                        {icon && <>{icon}</>}
                        <Text
                            style={[
                                styles.text,
                                styles[`${size}Text` as keyof typeof styles] as TextStyle,
                                isOutline && styles.outlineText,
                                disabled && styles.disabledText,
                                textStyle,
                            ]}
                        >
                            {title}
                        </Text>
                    </>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
    },
    fullWidth: {
        width: '100%',
    },
    sm: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
    },
    md: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
    },
    lg: {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xxl,
    },
    text: {
        color: Colors.textPrimary,
        fontWeight: FontWeight.semibold,
    },
    smText: {
        fontSize: FontSize.sm,
    },
    mdText: {
        fontSize: FontSize.md,
    },
    lgText: {
        fontSize: FontSize.lg,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.neonPurple,
    },
    outlineText: {
        color: Colors.neonPurple,
    },
    disabledText: {
        color: Colors.textTertiary,
    },
});
