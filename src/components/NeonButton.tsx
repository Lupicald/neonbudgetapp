// Legacy shim — kept temporarily so unmigrated screens still mount.
// New code MUST use <SumariButton /> from SumariPrimitives.
import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import { SumariButton } from './SumariPrimitives';

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

const mapVariant = (v: NeonButtonProps['variant']) =>
  v === 'outline' ? 'ghost'
    : v === 'danger' ? 'danger'
    : v === 'secondary' ? 'soft'
    : 'primary';

export const NeonButton: React.FC<NeonButtonProps> = ({
  title, onPress, variant, size, disabled, icon, style, fullWidth,
}) => (
  <SumariButton
    onPress={onPress}
    disabled={disabled}
    icon={icon}
    size={size}
    fullWidth={fullWidth}
    style={style}
    variant={mapVariant(variant) as any}
  >
    {title}
  </SumariButton>
);
