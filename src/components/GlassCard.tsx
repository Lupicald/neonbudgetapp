// Legacy shim — kept temporarily so unmigrated screens still mount.
// New code MUST use <Card /> or <HeroCard /> from SumariPrimitives.
import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import { Card, HeroCard } from './SumariPrimitives';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glowColor?: string;
  noBorder?: boolean;
  gradient?: boolean;
  hero?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, hero }) => {
  if (hero) return <HeroCard style={style as any}>{children}</HeroCard>;
  return <Card style={style as any}>{children}</Card>;
};
