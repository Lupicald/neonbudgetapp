// Legacy shim — kept temporarily so unmigrated screens still mount.
// New code MUST use <Text variant=... /> from SumariPrimitives.
import React from 'react';
import { TextStyle } from 'react-native';
import { Text } from './SumariPrimitives';
import { Colors, FontFamily } from '../theme';

type NeonVariant = 'hero' | 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';

interface NeonTextProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
  variant?: NeonVariant;
  color?: string;
  glow?: boolean;
  glowColor?: string;
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
}

// Map old neon variants onto the editorial system.
const variantMap = (v: NeonVariant): { size: number; weight: TextStyle['fontWeight']; family?: string; italic?: boolean; letter?: number; color?: string } => {
  switch (v) {
    case 'hero':     return { size: 44, weight: '500', family: FontFamily.display, italic: true, letter: -1.4 };
    case 'display':  return { size: 28, weight: '500', family: FontFamily.display, italic: true, letter: -0.6 };
    case 'title':    return { size: 22, weight: '500', family: FontFamily.display, italic: true, letter: -0.4 };
    case 'subtitle': return { size: 17, weight: '600', letter: -0.2 };
    case 'body':     return { size: 14, weight: '400' };
    case 'caption':  return { size: 12, weight: '400', color: Colors.textSecondary };
    case 'label':    return { size: 10, weight: '500', letter: 1.6, color: Colors.textTertiary };
  }
};

export const NeonText: React.FC<NeonTextProps> = ({ children, style, variant = 'body', color, align, numberOfLines }) => {
  const m = variantMap(variant);
  const merged: TextStyle = {
    fontSize: m.size,
    fontWeight: m.weight,
    color: color ?? m.color ?? Colors.textPrimary,
    ...(m.family ? { fontFamily: m.family } : null),
    ...(m.italic ? { fontStyle: 'italic' as const } : null),
    ...(m.letter != null ? { letterSpacing: m.letter } : null),
    ...(align ? { textAlign: align } : null),
    ...(variant === 'label' ? { textTransform: 'uppercase' as const } : null),
  };
  return (
    <Text variant="body" style={[merged, ...(Array.isArray(style) ? style : [style])].filter(Boolean) as any} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
};
