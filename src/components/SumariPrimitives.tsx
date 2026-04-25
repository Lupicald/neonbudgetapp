import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, FontFamily } from '../theme';

// ── Card
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  onPress?: () => void;
}
export const Card: React.FC<CardProps> = ({ children, style, elevated, onPress }) => {
  const content = (
    <View style={[styles.card, elevated && styles.cardElevated, style]}>
      {children}
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.75}>{content}</TouchableOpacity>;
  return content;
};

// ── HeroCard (pure black card)
interface HeroCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}
export const HeroCard: React.FC<HeroCardProps> = ({ children, style, onPress }) => {
  const content = (
    <View style={[styles.heroCard, style]}>
      {children}
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.75}>{content}</TouchableOpacity>;
  return content;
};

// ── Pill tab/chip
interface PillProps {
  children: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'accent';
}
export const Pill: React.FC<PillProps> = ({ children, active, onPress, style, textStyle, size = 'md', variant = 'default' }) => {
  const h = size === 'sm' ? 28 : size === 'lg' ? 40 : 32;
  const fs = size === 'sm' ? 12 : size === 'lg' ? 15 : 13;
  const px = size === 'sm' ? 10 : size === 'lg' ? 18 : 14;
  const bg = active
    ? (variant === 'accent' ? Colors.accent : Colors.textPrimary)
    : 'transparent';
  const color = active
    ? (variant === 'accent' ? Colors.onAccent : Colors.bg)
    : Colors.textSecondary;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[{
        height: h, paddingHorizontal: px, borderRadius: BorderRadius.full,
        backgroundColor: bg,
        borderWidth: active ? 0 : 1,
        borderColor: Colors.border,
        flexDirection: 'row', alignItems: 'center', gap: 6,
      }, style]}
    >
      {typeof children === 'string' ? (
        <Text style={[{ fontSize: fs, fontWeight: active ? '600' : '500', color }, textStyle]}>{children}</Text>
      ) : children}
    </TouchableOpacity>
  );
};

// ── Button
interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'dark' | 'ghost' | 'soft' | 'danger' | 'light';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
}
export const SumariButton: React.FC<ButtonProps> = ({
  children, onPress, variant = 'primary', size = 'md', fullWidth, icon, style, disabled
}) => {
  const h = size === 'sm' ? 36 : size === 'lg' ? 56 : 48;
  const fs = size === 'sm' ? 13 : size === 'lg' ? 16 : 15;
  const px = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
  let bg: string, fg: string, border: string | undefined;
  if (variant === 'primary') { bg = Colors.accent; fg = Colors.onAccent; }
  else if (variant === 'dark') { bg = Colors.bgHero; fg = Colors.onHero; }
  else if (variant === 'light') { bg = Colors.textPrimary; fg = Colors.bg; }
  else if (variant === 'soft') { bg = Colors.accentSoft; fg = Colors.accent; }
  else if (variant === 'danger') { bg = Colors.negative; fg = '#fff'; }
  else { bg = 'transparent'; fg = Colors.textPrimary; border = Colors.borderStrong; }
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[{
        height: h, paddingHorizontal: px, borderRadius: BorderRadius.full,
        backgroundColor: bg, borderWidth: border ? 1 : 0, borderColor: border,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: disabled ? 0.5 : 1,
        ...(fullWidth ? { width: '100%' } : {}),
      } as ViewStyle, style]}
    >
      {icon}
      <Text style={{ fontSize: fs, fontWeight: '600', color: fg }}>{children as string}</Text>
    </TouchableOpacity>
  );
};

// ── Icon button (circle)
interface IconBtnProps {
  icon: React.ReactNode;
  onPress?: () => void;
  size?: number;
  variant?: 'ghost' | 'accent' | 'dark' | 'soft';
  style?: ViewStyle;
}
export const IconBtn: React.FC<IconBtnProps> = ({ icon, onPress, size = 40, variant = 'ghost', style }) => {
  const bg = variant === 'accent' ? Colors.accent : variant === 'dark' ? Colors.bgHero : variant === 'soft' ? Colors.bgCardAlt : 'transparent';
  const border = variant === 'ghost' ? Colors.border : undefined;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[{
        width: size, height: size, borderRadius: BorderRadius.full,
        backgroundColor: bg, borderWidth: border ? 1 : 0, borderColor: border,
        alignItems: 'center', justifyContent: 'center',
      }, style]}
    >
      {icon}
    </TouchableOpacity>
  );
};

// ── Amount display
interface AmountProps {
  value: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  currency?: string;
  sign?: boolean;
  color?: string;
  style?: TextStyle;
}
export const Amount: React.FC<AmountProps> = ({ value, size = 'md', sign, color, style }) => {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [intPart, decPart] = formatted.split('.');
  const fs = size === 'hero' ? 52 : size === 'xl' ? 36 : size === 'lg' ? 26 : size === 'md' ? 17 : 14;
  const signStr = sign ? (value >= 0 ? '+' : '−') : (value < 0 ? '−' : '');
  const col = color ?? Colors.textPrimary;
  const isLarge = size === 'hero' || size === 'xl';
  return (
    <Text style={[{
      fontSize: fs, fontWeight: isLarge ? '500' : '600', color: col,
      letterSpacing: size === 'hero' ? -1.5 : size === 'xl' ? -1 : -0.3,
      fontVariant: ['tabular-nums'],
    }, style]}>
      {signStr}
      <Text style={{ fontSize: isLarge ? fs * 0.38 : fs * 0.7, opacity: 0.6, fontWeight: '500' }}>$</Text>
      {intPart}
      <Text style={{ fontSize: fs * (isLarge ? 0.5 : 0.8), opacity: 0.45 }}>.{decPart}</Text>
    </Text>
  );
};

// ── Section header
interface SectionHeaderProps {
  label: string;
  action?: string;
  onAction?: () => void;
  style?: ViewStyle;
}
export const SectionHeader: React.FC<SectionHeaderProps> = ({ label, action, onAction, style }) => (
  <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl }, style]}>
    <Text style={{ fontSize: 11, fontWeight: '500', color: Colors.textTertiary,
      textTransform: 'uppercase', letterSpacing: 1.6 }}>{label}</Text>
    {action && (
      <TouchableOpacity onPress={onAction} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ fontSize: 12, fontWeight: '500', color: Colors.textSecondary }}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ── Top bar
interface TopBarProps {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  large?: boolean;
  style?: ViewStyle;
}
export const TopBar: React.FC<TopBarProps> = ({ title, subtitle, left, right, large, style }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.lg }, style]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 }}>
      {left}
      <View>
        {subtitle && <Text style={{ fontSize: 11, color: Colors.textTertiary,
          textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 2 }}>{subtitle}</Text>}
        <Text style={{
          fontFamily: large ? FontFamily.display : undefined,
          fontWeight: large ? '400' : '600',
          fontSize: large ? 30 : 18,
          color: Colors.textPrimary, letterSpacing: large ? -0.8 : -0.3,
        }}>{title}</Text>
      </View>
    </View>
    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>{right}</View>
  </View>
);

// ── Category avatar
interface CatAvatarProps {
  icon: React.ReactNode;
  color: string;
  size?: number;
  style?: ViewStyle;
}
export const CatAvatar: React.FC<CatAvatarProps> = ({ icon, color, size = 40, style }) => (
  <View style={[{
    width: size, height: size, borderRadius: BorderRadius.full,
    backgroundColor: color + '20',
    alignItems: 'center', justifyContent: 'center',
  }, style]}>
    {icon}
  </View>
);

// ── Progress bar
interface ProgressProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  style?: ViewStyle;
}
export const Progress: React.FC<ProgressProps> = ({ value, max = 100, color, height = 6, style }) => {
  const pct = Math.max(0, Math.min(1, value / max));
  const c = color ?? Colors.accent;
  return (
    <View style={[{ width: '100%', height, backgroundColor: Colors.bgCardAlt,
      borderRadius: BorderRadius.full, overflow: 'hidden' }, style]}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: c,
        borderRadius: BorderRadius.full }}/>
    </View>
  );
};

// ── Ring (SVG)
interface RingProps {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}
export const Ring: React.FC<RingProps> = ({ value, max = 100, size = 80, stroke = 8, color, label, sublabel }) => {
  const pct = Math.max(0, Math.min(1, value / max));
  const r = (size - stroke) / 2;
  const cf = 2 * Math.PI * r;
  const c = color ?? Colors.accent;
  return (
    <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={Colors.border} strokeWidth={stroke} fill="none"/>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c} strokeWidth={stroke} fill="none"
          strokeDasharray={`${cf} ${cf}`}
          strokeDashoffset={cf * (1 - pct)}
          strokeLinecap="round"/>
      </Svg>
      <View style={{ alignItems: 'center' }}>
        {label && <Text style={{ fontSize: size > 70 ? 20 : 14, fontWeight: '600', color: Colors.textPrimary }}>{label}</Text>}
        {sublabel && <Text style={{ fontSize: 9, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1 }}>{sublabel}</Text>}
      </View>
    </View>
  );
};

// ── Mini bars chart
interface MiniBarsProps {
  data: number[];
  color?: string;
  height?: number;
  barWidth?: number;
  gap?: number;
  activeIdx?: number;
}
export const MiniBars: React.FC<MiniBarsProps> = ({ data, color, height = 48, barWidth = 10, gap = 6, activeIdx }) => {
  const max = Math.max(...data.map(Math.abs), 1);
  const c = color ?? Colors.accent;
  return (
    <View style={{ flexDirection: 'row', gap, alignItems: 'flex-end', height }}>
      {data.map((v, i) => {
        const h = Math.max(3, (Math.abs(v) / max) * height);
        const active = activeIdx === i;
        return (
          <View key={i} style={{
            width: barWidth, height: h, borderRadius: 3,
            backgroundColor: v < 0 ? Colors.negative : c,
            opacity: active ? 1 : 0.7,
          }}/>
        );
      })}
    </View>
  );
};

// ── Area chart (SVG sparkline)
interface AreaChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}
export const AreaChart: React.FC<AreaChartProps> = ({ data, width = 300, height = 80, color, strokeWidth = 2 }) => {
  const c = color ?? Colors.accent;
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = 4;
  const step = (width - pad * 2) / (data.length - 1);
  const pts: [number, number][] = data.map((v, i) => [pad + i * step, pad + (1 - (v - min) / range) * (height - pad * 2)]);

  const linePath = pts.reduce((acc, [x, y], i) => {
    if (i === 0) return `M${x},${y}`;
    const [px, py] = pts[i - 1];
    const cx1 = px + step / 2, cx2 = x - step / 2;
    return acc + ` C${cx1},${py} ${cx2},${y} ${x},${y}`;
  }, '');

  const last = pts[pts.length - 1];
  const first = pts[0];
  const areaPath = `${linePath} L${last[0]},${height} L${first[0]},${height} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={c} stopOpacity="0.25"/>
          <Stop offset="100%" stopColor={c} stopOpacity="0"/>
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill="url(#ag)"/>
      <Path d={linePath} stroke={c} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardElevated: {
    backgroundColor: Colors.bgElevated,
  },
  heroCard: {
    backgroundColor: Colors.bgHero,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    overflow: 'hidden',
  },
});
