import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSize, FontWeight } from '../theme';

interface GlowInputProps extends TextInputProps {
    label?: string;
    error?: string;
    glowColor?: string;
    containerStyle?: ViewStyle;
    icon?: React.ReactNode;
}

export const GlowInput: React.FC<GlowInputProps> = ({
    label,
    error,
    glowColor = Colors.electricBlue,
    containerStyle,
    icon,
    ...rest
}) => {
    const [focused, setFocused] = useState(false);

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TouchableOpacity
                activeOpacity={1}
                style={[
                    styles.inputWrapper,
                    focused && {
                        borderColor: glowColor,
                        shadowColor: glowColor,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.4,
                        shadowRadius: 8,
                        elevation: 4,
                    },
                    error ? styles.errorBorder : null,
                ]}
                onPress={() => {
                    // El teclado se abrirá al setear el foco en el TextInput automáticamente porque todo el botón es tocable.
                }}
            >
                {icon && <View style={styles.iconWrapper}>{icon}</View>}
                <TextInput
                    style={[styles.input, icon ? styles.inputWithIcon : null, { color: Colors.textPrimary }]}
                    placeholderTextColor={Colors.textMuted}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    {...rest}
                />
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.lg,
    },
    label: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        marginBottom: Spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    iconWrapper: {
        paddingLeft: Spacing.md,
    },
    input: {
        flex: 1,
        color: Colors.textPrimary,
        fontSize: FontSize.lg,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        fontWeight: FontWeight.medium,
    },
    inputWithIcon: {
        paddingLeft: Spacing.sm,
    },
    errorBorder: {
        borderColor: Colors.danger,
    },
    errorText: {
        color: Colors.danger,
        fontSize: FontSize.xs,
        marginTop: Spacing.xs,
    },
});
