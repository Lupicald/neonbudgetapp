import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { BorderRadius, Spacing, FontSize, FontWeight, Colors } from '../theme';

interface GlowInputProps extends TextInputProps {
    label?: string;
    error?: string;
    glowColor?: string;  // kept for API compat — controls focused border color
    containerStyle?: ViewStyle;
    icon?: React.ReactNode;
}

export const GlowInput: React.FC<GlowInputProps> = ({
    label,
    error,
    glowColor = Colors.accent,
    containerStyle,
    icon,
    ...rest
}) => {
    const [focused, setFocused] = useState(false);

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View
                style={[
                    styles.inputWrapper,
                    focused && { borderColor: glowColor, borderWidth: 1.5 },
                    error ? styles.errorBorder : null,
                ]}
            >
                {icon && <View style={styles.iconWrapper}>{icon}</View>}
                <TextInput
                    style={[styles.input, icon ? styles.inputWithIcon : null]}
                    placeholderTextColor="rgba(240, 245, 241, 0.28)"
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    {...rest}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.lg,
    },
    label: {
        color: '#6B8F74',
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        marginBottom: Spacing.xs,
        letterSpacing: 0.3,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#101710',
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: '#1A5C38',
    },
    iconWrapper: {
        paddingLeft: Spacing.md,
    },
    input: {
        flex: 1,
        color: '#F0F5F1',
        fontSize: FontSize.lg,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        fontWeight: FontWeight.medium,
    },
    inputWithIcon: {
        paddingLeft: Spacing.sm,
    },
    errorBorder: {
        borderColor: '#FF4C6A',
    },
    errorText: {
        color: '#FF4C6A',
        fontSize: FontSize.xs,
        marginTop: Spacing.xs,
    },
});
