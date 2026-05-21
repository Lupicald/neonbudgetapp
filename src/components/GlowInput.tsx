// Legacy shim — kept temporarily so unmigrated screens still mount.
// New code should use a plain TextInput with theme styles.
import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { BorderRadius, Spacing, FontSize, FontWeight, Colors } from '../theme';

interface GlowInputProps extends TextInputProps {
  label?: string;
  error?: string;
  glowColor?: string;
  containerStyle?: ViewStyle;
  icon?: React.ReactNode;
}

export const GlowInput: React.FC<GlowInputProps> = ({
  label, error, glowColor = Colors.accent, containerStyle, icon, ...rest
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          focused && { borderColor: glowColor, borderWidth: 1 },
          error ? styles.errorBorder : null,
        ]}
      >
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <TextInput
          style={[styles.input, icon ? styles.inputWithIcon : null]}
          placeholderTextColor={Colors.textMuted}
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
  container: { marginBottom: Spacing.lg },
  label: {
    color: Colors.textTertiary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrapper: { paddingLeft: Spacing.md },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontWeight: FontWeight.medium,
  },
  inputWithIcon: { paddingLeft: Spacing.sm },
  errorBorder: { borderColor: Colors.rust },
  errorText: { color: Colors.rust, fontSize: FontSize.xs, marginTop: Spacing.xs },
});
