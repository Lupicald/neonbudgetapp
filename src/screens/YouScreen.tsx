import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, HeroCard, Progress, Ring, SectionHeader, TopBar } from '../components/SumariPrimitives';
import { Colors, Spacing, BorderRadius, FontFamily } from '../theme';
import { getAchievements, getLevelData, getStreak, LevelData } from '../services/gamification';
import { calculateHealthScore } from '../services/healthScore';
import { getSetting, setSetting } from '../database/settingsService';
import { resetDatabase } from '../database/database';
import { shareCSV } from '../services/csvService';
import { Achievement, FinancialHealthScore } from '../types';

const CURRENCIES = ['MXN', 'USD', 'EUR', 'GBP', 'CAD', 'COP', 'ARS', 'BRL', 'JPY'];

export const YouScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [levelData, setLevelData] = useState<LevelData>({ level: 1, xp: 0, xpForThisLevel: 0, xpNeeded: 100 });
  const [streak, setStreak] = useState(0);
  const [healthScore, setHealthScore] = useState<FinancialHealthScore>({ score: 78, label: 'Good', color: Colors.accent });
  const [currency, setCurrency] = useState('MXN');
  const [userName, setUserName] = useState('Sumari');
  const [language, setLanguage] = useState('English');

  const load = useCallback(async () => {
    try {
      const [ach, lvl, st, hs, cur, name, lang] = await Promise.all([
        getAchievements(),
        getLevelData(),
        getStreak(),
        calculateHealthScore(),
        getSetting('currency'),
        getSetting('name'),
        getSetting('language'),
      ]);
      setAchievements(ach);
      setLevelData(lvl);
      setStreak(st);
      setHealthScore(hs);
      if (cur) setCurrency(cur);
      if (name) setUserName(name);
      if (lang) setLanguage(lang === 'es' ? 'Español' : 'English');
    } catch (e) { console.log(e); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const xpPct = levelData.xpNeeded > 0 ? (levelData.xp - levelData.xpForThisLevel) / (levelData.xpNeeded - levelData.xpForThisLevel) : 0;
  const earned = achievements.filter(a => !!a.unlocked_at);

  const handleCurrencyChange = async (cur: string) => {
    setCurrency(cur);
    await setSetting('currency', cur);
  };

  const handleReset = () => {
    Alert.alert('Reset all data', 'This will permanently delete all your transactions, accounts, and settings. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: async () => {
          try {
            await resetDatabase();
            setCurrency('MXN');
            setUserName('Sumari');
          } catch {
            Alert.alert('Error', 'Could not reset data. Please try again.');
          }
        },
      },
    ]);
  };

  const handleLanguage = () => {
    Alert.alert('Language', 'Select your language', [
      { text: 'English', onPress: async () => { await setSetting('language', 'en'); setLanguage('English'); } },
      { text: 'Español', onPress: async () => { await setSetting('language', 'es'); setLanguage('Español'); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleNotifications = () => {
    Linking.openSettings();
  };

  const handleExport = async () => {
    try {
      await shareCSV();
    } catch {
      Alert.alert('Error', 'Could not export data.');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <TopBar title="You" large
          right={
            <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          }
        />

        {/* Profile hero */}
        <View style={s.padH}>
          <HeroCard style={{ alignItems: 'center', paddingVertical: Spacing.xxl }}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>S</Text>
            </View>
            <Text style={s.profileName}>{userName}</Text>
            <Text style={s.profileRole}>Financial explorer</Text>

            {/* Level + XP */}
            <View style={s.xpBox}>
              <View style={s.xpHeader}>
                <View style={s.levelBadge}>
                  <Text style={s.levelBadgeText}>{levelData.level}</Text>
                </View>
                <Text style={s.levelLabel}>Level {levelData.level} · Saver</Text>
                <Text style={s.xpCount}>{levelData.xp} / {levelData.xpNeeded} XP</Text>
              </View>
              <Progress value={xpPct * 100} max={100} height={5}
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            </View>

            {/* Streak + Score */}
            <View style={s.metaRow}>
              <View style={[s.metaBadge, { backgroundColor: 'rgba(255,138,61,0.12)' }]}>
                <Ionicons name="flame" size={20} color="#FF8A3D" />
                <View>
                  <Text style={[s.metaVal, { color: '#FF8A3D' }]}>{streak} days</Text>
                  <Text style={s.metaLabel}>Streak</Text>
                </View>
              </View>
              <View style={[s.metaBadge, { backgroundColor: 'rgba(31,204,88,0.12)' }]}>
                <Ionicons name="shield-outline" size={20} color={Colors.accent} />
                <View>
                  <Text style={[s.metaVal, { color: Colors.accent }]}>{healthScore.score}</Text>
                  <Text style={s.metaLabel}>Score</Text>
                </View>
              </View>
            </View>
          </HeroCard>
        </View>

        {/* Achievements */}
        <SectionHeader label="Achievements" action={`${earned.length}/${achievements.length}`}
          onAction={() => navigation.navigate('Achievements')}
          style={{ paddingTop: Spacing.xl, paddingBottom: Spacing.sm }} />
        <View style={[s.padH, s.achievementsGrid]}>
          {achievements.map(a => (
            <View key={a.id} style={[s.achievementCardWrap, { opacity: a.unlocked_at ? 1 : 0.45 }]}>
          <Card style={s.achievementCard}>
              <View style={[s.achievementIcon, a.unlocked_at && { backgroundColor: Colors.accent + '20',
                borderColor: Colors.accent + '40' }]}>
                <Ionicons name={(a.icon ?? 'trophy-outline') as any} size={18}
                  color={a.unlocked_at ? Colors.accent : Colors.textMuted} />
              </View>
              <Text style={s.achievementName} numberOfLines={2}>{a.title}</Text>
            </Card>
          </View>
          ))}
          {achievements.length === 0 && (
            <Text style={[s.achievementName, { color: Colors.textTertiary }]}>No achievements yet — keep logging!</Text>
          )}
        </View>

        {/* Insights */}
        <SectionHeader label="Insights for you" style={{ paddingTop: Spacing.xl, paddingBottom: Spacing.sm }} />
        <View style={[s.padH, { gap: Spacing.sm }]}>
          {[
            { icon: 'sparkles-outline', c: Colors.accent, title: 'Stay on track', desc: 'Log daily transactions to keep your score high.' },
            { icon: 'shield-outline', c: Colors.info, title: `Health score: ${healthScore.score}`, desc: healthScore.label + ' — keep your spending balanced.' },
            { icon: 'flame-outline', c: Colors.orange, title: streak > 0 ? `${streak}-day streak!` : 'Start your streak', desc: streak > 0 ? 'Great consistency. Keep it going.' : 'Log a transaction today to start.' },
          ].map((ins, i) => (
            <Card key={i} style={s.insightCard}>
              <View style={[s.insightIcon, { backgroundColor: ins.c + '18' }]}>
                <Ionicons name={ins.icon as any} size={16} color={ins.c} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.insightTitle}>{ins.title}</Text>
                <Text style={s.insightDesc}>{ins.desc}</Text>
              </View>
            </Card>
          ))}
        </View>

        {/* Preferences */}
        <SectionHeader label="Preferences" style={{ paddingTop: Spacing.xl, paddingBottom: Spacing.sm }} />
        <View style={s.padH}>
          {/* Currency */}
          <Card style={{ padding: 0, marginBottom: Spacing.sm }}>
            <View style={s.settingRow}>
              <View style={s.settingIcon}><Ionicons name="cash-outline" size={16} color={Colors.textSecondary} /></View>
              <Text style={s.settingLabel}>Currency</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {CURRENCIES.map(c => (
                    <TouchableOpacity key={c} onPress={() => handleCurrencyChange(c)}
                      style={[s.currencyChip, c === currency && s.currencyChipActive]}>
                      <Text style={[s.currencyChipText, c === currency && { color: Colors.bg }]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </Card>

          {/* Settings rows */}
          <Card style={{ padding: 0 }}>
            {([
              { icon: 'globe-outline', l: 'Language', v: language, onPress: handleLanguage },
              { icon: 'notifications-outline', l: 'Notifications', onPress: handleNotifications },
              { icon: 'download-outline', l: 'Import / Export', onPress: handleExport },
              { icon: 'lock-closed-outline', l: 'Privacy & Security', onPress: () => Alert.alert('Privacy & Security', 'Coming soon in a future update.') },
            ] as { icon: string; l: string; v?: string; onPress: () => void }[]).map((row, i, a) => (
              <TouchableOpacity key={row.l} onPress={row.onPress}
                style={[s.settingRow, i < a.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}>
                <View style={s.settingIcon}><Ionicons name={row.icon as any} size={16} color={Colors.textSecondary} /></View>
                <Text style={s.settingLabel}>{row.l}</Text>
                {row.v && <Text style={s.settingValue}>{row.v}</Text>}
                <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </Card>

          {/* Reset */}
          <TouchableOpacity onPress={handleReset} style={s.resetBtn}>
            <Ionicons name="trash-outline" size={15} color={Colors.negative} />
            <Text style={s.resetBtnText}>Reset all data</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingBottom: 20 },
  padH: { paddingHorizontal: Spacing.xl },
  iconBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center' },
  // Profile hero
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 3, borderColor: 'rgba(31,204,88,0.3)' },
  avatarText: { fontSize: 28, fontWeight: '700', color: Colors.onAccent },
  profileName: { fontFamily: FontFamily.display, fontSize: 28, color: Colors.onHero, letterSpacing: -0.5 },
  profileRole: { fontSize: 12, color: 'rgba(244,245,240,0.5)', marginBottom: Spacing.lg },
  xpBox: { width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: BorderRadius.md,
    padding: Spacing.md, marginTop: 0 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  levelBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center' },
  levelBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.onAccent },
  levelLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.onHero, marginLeft: 8 },
  xpCount: { fontSize: 11, color: 'rgba(244,245,240,0.5)' },
  metaRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, width: '100%' },
  metaBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: Spacing.md, borderRadius: BorderRadius.md },
  metaVal: { fontSize: 16, fontWeight: '600', letterSpacing: -0.3 },
  metaLabel: { fontSize: 10, color: 'rgba(244,245,240,0.5)', textTransform: 'uppercase', letterSpacing: 1 },
  // Achievements
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  achievementCardWrap: { width: '30%' },
  achievementCard: { padding: Spacing.md, alignItems: 'center' },
  achievementIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgCardAlt,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  achievementName: { fontSize: 11, fontWeight: '600', color: Colors.textPrimary,
    letterSpacing: -0.1, textAlign: 'center' },
  // Insights
  insightCard: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.md },
  insightIcon: { width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: 'center',
    justifyContent: 'center', flexShrink: 0 },
  insightTitle: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  insightDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 17 },
  // Settings
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  settingIcon: { width: 34, height: 34, borderRadius: BorderRadius.xs, backgroundColor: Colors.bgCardAlt,
    alignItems: 'center', justifyContent: 'center' },
  settingLabel: { flex: 1, fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  settingValue: { fontSize: 12, color: Colors.textTertiary },
  currencyChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
    backgroundColor: Colors.bgCardAlt },
  currencyChipActive: { backgroundColor: Colors.textPrimary },
  currencyChipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center',
    marginTop: Spacing.xl, paddingVertical: 12 },
  resetBtnText: { fontSize: 14, fontWeight: '500', color: Colors.negative },
});
