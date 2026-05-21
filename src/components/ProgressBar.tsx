// Legacy shim — kept temporarily so unmigrated screens still mount.
// New code MUST use <Progress /> from SumariPrimitives.
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Progress } from './SumariPrimitives';
import { Colors, Spacing } from '../theme';
import { Text } from './SumariPrimitives';

interface ProgressBarProps {
  progress: number;
  height?: number;
  gradientColors?: [string, string];
  label?: string;
  valueLabel?: string;
  showPercentage?: boolean;
  style?: ViewStyle;
  animated?: boolean;
  warning?: boolean;
  danger?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress, height = 6, gradientColors, label, valueLabel, showPercentage, style, warning, danger,
}) => {
  const clamped = Math.min(1, Math.max(0, progress));
  const color = danger ? Colors.rust : warning ? Colors.amber : (gradientColors?.[0] ?? Colors.accent);
  return (
    <View style={style}>
      {(label || valueLabel || showPercentage) && (
        <View style={s.labelRow}>
          {label ? <Text variant="meta">{label}</Text> : <View />}
          <Text variant="meta">{valueLabel || (showPercentage ? `${Math.round(clamped * 100)}%` : '')}</Text>
        </View>
      )}
      <Progress value={clamped * 100} max={100} height={height} color={color} />
    </View>
  );
};

const s = StyleSheet.create({
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
});
