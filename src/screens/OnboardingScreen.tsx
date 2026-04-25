import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SumariButton } from '../components/SumariPrimitives';
import { Colors, Spacing, BorderRadius, FontFamily } from '../theme';

interface Props {
  onComplete: () => void;
}

const steps = [
  {
    icon: 'leaf-outline' as const,
    title: 'Welcome to\nSumari',
    desc: 'Clarity over complexity.\nA calmer way to understand your money.',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'Track with\nbreathing room',
    desc: 'Every transaction takes seconds.\nSumari learns the rest.',
  },
  {
    icon: 'trophy-outline' as const,
    title: 'Goals that\nactually land',
    desc: 'Plan ahead, see the future.\nStay in flow with your rhythm.',
  },
];

const { width } = Dimensions.get('window');

export const OnboardingScreen: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const cur = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <SafeAreaView style={s.safe}>
      {/* Skip */}
      <View style={s.skipRow}>
        <TouchableOpacity onPress={onComplete} style={s.skipBtn}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Icon */}
      <View style={s.iconWrap}>
        <View style={s.iconCircle}>
          <Ionicons name={cur.icon} size={56} color="#fff" />
        </View>
      </View>

      {/* Text */}
      <View style={s.textSection}>
        <Text style={s.title}>{cur.title}</Text>
        <Text style={s.desc}>{cur.desc}</Text>
      </View>

      {/* Bottom */}
      <View style={s.bottom}>
        {/* Dots */}
        <View style={s.dots}>
          {steps.map((_, i) => (
            <View key={i} style={[s.dot, i === step && s.dotActive]} />
          ))}
        </View>

        {/* CTA */}
        <SumariButton
          onPress={() => isLast ? onComplete() : setStep(step + 1)}
          variant="primary"
          size="lg"
          fullWidth
          icon={<Ionicons name={isLast ? 'checkmark' : 'arrow-forward-outline'} size={18} color={Colors.onAccent} />}
        >
          {isLast ? 'Get started' : 'Continue'}
        </SumariButton>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  skipRow: { flexDirection: 'row', justifyContent: 'flex-end', padding: Spacing.xl },
  skipBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1, borderColor: Colors.border },
  skipText: { fontSize: 13, fontWeight: '500', color: Colors.textTertiary },
  iconWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: Spacing.xxl },
  iconCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35, shadowRadius: 40, elevation: 20,
  },
  textSection: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl, alignItems: 'center' },
  title: {
    fontFamily: FontFamily.display,
    fontSize: 44, lineHeight: 48,
    color: Colors.textPrimary, letterSpacing: -1.2,
    textAlign: 'center', marginBottom: 18,
  },
  desc: {
    fontSize: 15, color: Colors.textSecondary, lineHeight: 22,
    textAlign: 'center', maxWidth: 300,
  },
  bottom: { padding: Spacing.xl, paddingBottom: Spacing.xxl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: Spacing.lg },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { width: 24, backgroundColor: Colors.accent },
});
