import React from 'react';
import {
  View, Text as RNText, TouchableOpacity, StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, FontFamily } from '../theme';

// ───────────────────────────────────────────────────────────
// Editorial typographic primitive
// ───────────────────────────────────────────────────────────
type TextVariant = 'display' | 'heading' | 'body' | 'meta' | 'overline' | 'mono' | 'caption' | 'label';

interface TextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  color?: string;
  size?: number;
  weight?: TextStyle['fontWeight'];
  italic?: boolean;
  align?: TextStyle['textAlign'];
  numberOfLines?: number;
  style?: TextStyle | TextStyle[];
}
const variantStyle: Record<TextVariant, TextStyle> = {
  display:  { fontFamily: FontFamily.display, fontSize: 22, letterSpacing: -0.4, color: Colors.textPrimary, fontStyle: 'italic' },
  heading:  { fontSize: 17, fontWeight: '600', letterSpacing: -0.2, color: Colors.textPrimary },
  body:     { fontSize: 14, fontWeight: '400', color: Colors.textPrimary, lineHeight: 20 },
  meta:     { fontSize: 12, color: Colors.textTertiary },
  overline: { fontSize: 10, fontWeight: '500', letterSpacing: 1.8, textTransform: 'uppercase', color: Colors.textTertiary },
  mono:     { fontFamily: FontFamily.mono, fontSize: 10, color: Colors.textTertiary, letterSpacing: 0.2 },
  caption:  { fontSize: 11, fontWeight: '400', color: Colors.textSecondary },
  label:    { fontSize: 10, fontWeight: '500', letterSpacing: 1.4, textTransform: 'uppercase', color: Colors.textTertiary },
};
export const Text: React.FC<TextProps> = ({ children, variant = 'body', color, size, weight, italic, align, numberOfLines, style }) => {
  const base = variantStyle[variant];
  const extra: TextStyle = {
    ...(color ? { color } : null),
    ...(size != null ? { fontSize: size } : null),
    ...(weight ? { fontWeight: weight } : null),
    ...(italic ? { fontStyle: 'italic' as const } : null),
    ...(align ? { textAlign: align } : null),
  };
  return <RNText style={[base, extra, style as any]} numberOfLines={numberOfLines}>{children}</RNText>;
};

// ── Card
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  elevated?: boolean;
  onPress?: () => void;
}
export const Card: React.FC<CardProps> = ({ children, style, elevated, onPress }) => {
  const content = (
    <View style={[styles.card, elevated && styles.cardElevated, style as any]}>
      {children}
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.75}>{content}</TouchableOpacity>;
  return content;
};

// ── HeroCard — editorial hero with hairline corner glow
interface HeroCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
}
export const HeroCard: React.FC<HeroCardProps> = ({ children, style, onPress }) => {
  const content = (
    <View style={[styles.heroCard, style as any]}>
      {children}
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.75}>{content}</TouchableOpacity>;
  return content;
};

// ── Pill — segmented chip
interface PillProps {
  children: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'accent' | 'rust' | 'amber';
}
export const Pill: React.FC<PillProps> = ({ children, active, onPress, style, textStyle, size = 'md', variant = 'default' }) => {
  const h = size === 'sm' ? 26 : size === 'lg' ? 40 : 32;
  const fs = size === 'sm' ? 11 : size === 'lg' ? 15 : 13;
  const px = size === 'sm' ? 11 : size === 'lg' ? 18 : 14;
  let bg = 'rgba(242,237,227,0.04)';
  let fg = Colors.textSecondary;
  let border: string | undefined = Colors.border;
  if (active) { bg = Colors.textPrimary; fg = Colors.bg; border = undefined; }
  else if (variant === 'accent') { bg = Colors.accentSoft; fg = Colors.accentLight; border = undefined; }
  else if (variant === 'rust')   { bg = Colors.rustSoft;   fg = Colors.rustLight;   border = undefined; }
  else if (variant === 'amber')  { bg = Colors.amberSoft;  fg = Colors.amber;       border = undefined; }
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[{
        height: h, paddingHorizontal: px, borderRadius: BorderRadius.full,
        backgroundColor: bg,
        borderWidth: border ? 1 : 0,
        borderColor: border,
        flexDirection: 'row', alignItems: 'center', gap: 6,
      }, style]}
    >
      {typeof children === 'string' ? (
        <RNText style={[{ fontSize: fs, fontWeight: active ? '600' : '500', color: fg }, textStyle]}>{children}</RNText>
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
  else if (variant === 'soft') { bg = Colors.accentSoft; fg = Colors.accentLight; }
  else if (variant === 'danger') { bg = Colors.rust; fg = Colors.onRust; }
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
      <RNText style={{ fontSize: fs, fontWeight: '600', color: fg }}>{children as string}</RNText>
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
export const IconBtn: React.FC<IconBtnProps> = ({ icon, onPress, size = 36, variant = 'ghost', style }) => {
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

// ── Money — editorial typographic numeral
// $ is rendered in serif italic at reduced opacity. Numbers are tabular.
// Uses Unicode minus (U+2212) and plus signs, not hyphen-minus.
interface AmountProps {
  value: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero' | 'mega';
  sign?: boolean;
  color?: string;
  style?: TextStyle;
}
export const Amount: React.FC<AmountProps> = ({ value, size = 'md', sign, color, style }) => {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [intPart, decPart] = formatted.split('.');
  const fs = size === 'mega' ? 56 : size === 'hero' ? 44 : size === 'xl' ? 32 : size === 'lg' ? 24 : size === 'md' ? 17 : 13;
  const signStr = sign ? (value >= 0 ? '+' : '−') : (value < 0 ? '−' : '');
  const col = color ?? Colors.textPrimary;
  const isLarge = size === 'mega' || size === 'hero' || size === 'xl';
  const curSize = isLarge ? Math.round(fs * 0.42) : Math.round(fs * 0.7);
  const decSize = isLarge ? Math.round(fs * 0.42) : Math.round(fs * 0.82);
  return (
    <RNText style={[{
      fontSize: fs,
      fontWeight: isLarge ? '500' : '600',
      color: col,
      letterSpacing: size === 'mega' ? -2 : size === 'hero' ? -1.4 : size === 'xl' ? -0.8 : -0.2,
      fontVariant: ['tabular-nums'],
    }, style]}>
      {signStr}
      <RNText style={{
        fontFamily: FontFamily.display, fontStyle: 'italic', fontWeight: '400',
        fontSize: curSize, color: Colors.textTertiary,
      }}>$</RNText>
      {intPart}
      <RNText style={{ fontSize: decSize, color: Colors.textTertiary, fontWeight: '400' }}>.{decPart}</RNText>
    </RNText>
  );
};
// Alias to align with design `<Money/>` nomenclature.
export const Money = Amount;

// ── Section header — overline label + optional action
interface SectionHeaderProps {
  label: string;
  action?: string;
  onAction?: () => void;
  style?: ViewStyle;
}
export const SectionHeader: React.FC<SectionHeaderProps> = ({ label, action, onAction, style }) => (
  <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl }, style]}>
    <RNText style={{ fontSize: 10, fontWeight: '500', color: Colors.textTertiary,
      textTransform: 'uppercase', letterSpacing: 1.8 }}>{label}</RNText>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <RNText style={{ fontSize: 11, fontWeight: '500', color: Colors.textTertiary,
          textTransform: 'uppercase', letterSpacing: 1.4 }}>{action}</RNText>
      </TouchableOpacity>
    )}
  </View>
);

// ── EditorialHeading — serif italic section title (Inicio, Plan, etc.)
interface EditorialHeadingProps {
  children: React.ReactNode;
  action?: string;
  onAction?: () => void;
  style?: ViewStyle;
}
export const EditorialHeading: React.FC<EditorialHeadingProps> = ({ children, action, onAction, style }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    marginHorizontal: Spacing.xl, marginTop: 28, marginBottom: 10 }, style]}>
    <RNText style={{ fontFamily: FontFamily.display, fontStyle: 'italic',
      fontSize: 22, letterSpacing: -0.4, color: Colors.textPrimary }}>{children}</RNText>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <RNText style={{ fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase',
          color: Colors.textTertiary }}>{action}</RNText>
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
        {subtitle && <RNText style={{ fontSize: 10, color: Colors.textTertiary,
          textTransform: 'uppercase', letterSpacing: 1.6, marginBottom: 2 }}>{subtitle}</RNText>}
        <RNText style={{
          fontFamily: large ? FontFamily.display : undefined,
          fontStyle: large ? 'italic' : 'normal',
          fontWeight: large ? '400' : '600',
          fontSize: large ? 28 : 17,
          color: Colors.textPrimary, letterSpacing: large ? -0.6 : -0.2,
        }}>{title}</RNText>
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
export const CatAvatar: React.FC<CatAvatarProps> = ({ icon, color, size = 36, style }) => (
  <View style={[{
    width: size, height: size, borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(242,237,227,0.05)',
    borderWidth: 1, borderColor: color + '22',
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
export const Progress: React.FC<ProgressProps> = ({ value, max = 100, color, height = 4, style }) => {
  const pct = Math.max(0, Math.min(1, value / max));
  const c = color ?? Colors.accent;
  return (
    <View style={[{ width: '100%', height, backgroundColor: 'rgba(242,237,227,0.07)',
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
  children?: React.ReactNode;
}
export const Ring: React.FC<RingProps> = ({ value, max = 100, size = 80, stroke = 6, color, label, sublabel, children }) => {
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
        {children ? children : (
          <>
            {label && <RNText style={{ fontFamily: FontFamily.display, fontStyle: 'italic',
              fontSize: size > 70 ? 26 : 16, color: Colors.textPrimary, lineHeight: size > 70 ? 28 : 18 }}>{label}</RNText>}
            {sublabel && <RNText style={{ fontSize: 9, color: Colors.textTertiary, textTransform: 'uppercase',
              letterSpacing: 1.4, marginTop: 2 }}>{sublabel}</RNText>}
          </>
        )}
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
            backgroundColor: v < 0 ? Colors.rust : c,
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
export const AreaChart: React.FC<AreaChartProps> = ({ data, width = 300, height = 80, color, strokeWidth = 1.5 }) => {
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
          <Stop offset="0%" stopColor={c} stopOpacity="0.22"/>
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
    backgroundColor: Colors.bgElevated,
    borderRadius: BorderRadius.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    overflow: 'hidden',
  },
});
