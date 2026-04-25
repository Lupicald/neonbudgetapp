import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
    ActivityIndicator,
    View,
} from 'react-native';
import { BorderRadius, Spacing, FontSize, FontWeight, Colors } from '../theme';

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

const variantStyles = {
    primary: {
        bg: Colors.accent,
        text: Colors.onAccent,
        border: 'transparent',
    },
    secondary: {
        bg: Colors.accent,
        text: Colors.onAccent,
        border: 'transparent',
    },
    danger: {
        bg: 'transparent',
        text: '#FF4C6A',
        border: '#FF4C6A',
    },
    outline: {
        bg: 'transparent',
        text: Colors.accent,
        border: Colors.accent,
    },
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
    const vs = variantStyles[variant];

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.75}
            style={[fullWidth && styles.fullWidth, style]}
        >
            <View
                style={[
                    styles.button,
                    styles[size],
                    {
                        backgroundColor: disabled ? '#162016' : vs.bg,
                        borderColor: disabled ? Colors.accent + '14' : vs.border,
                        borderWidth: vs.border === 'transparent' ? 0 : 1.5,
                    },
                    fullWidth && styles.fullWidth,
                ]}
            >
                {loading ? (
                    <ActivityIndicator
                        color={disabled ? 'rgba(240,245,241,0.20)' : vs.text}
                        size="small"
                    />
                ) : (
                    <>
                        {icon && <>{icon}</>}
                        <Text
                            style={[
                                styles.text,
                                styles[`${size}Text` as keyof typeof styles] as TextStyle,
                                { color: disabled ? 'rgba(240,245,241,0.20)' : vs.text },
                                textStyle,
                            ]}
                        >
                            {title}
                        </Text>
                    </>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
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
        fontWeight: '600',
        letterSpacing: 0.1,
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
    outline: {},
});
