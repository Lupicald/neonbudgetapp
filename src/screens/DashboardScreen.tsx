import React, { useState, useCallback } from 'react';
import {
  View, ScrollView, Text, TouchableOpacity, StyleSheet, RefreshControl, Linking,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card, HeroCard, Amount, Ring, Progress, AreaChart,
  SectionHeader, CatAvatar,
} from '../components/SumariPrimitives';
import { Colors, Spacing, BorderRadius } from '../theme';
import { formatCurrency, getMonthKey } from '../utils';
import { getTotalBalance } from '../database/accountService';
import { getMonthlyTotal, getTransactions } from '../database/transactionService';
import { getSetting } from '../database/settingsService';
import { getNextEvent, getProjectionChartData } from '../services/projectionEngine';
import { calculateHealthScore } from '../services/healthScore';
import { getStreak, getLevelData, LevelData } from '../services/gamification';
import { getBudgets } from '../database/budgetService';
import { getGoals } from '../database/goalService';
import { Budget, Goal, Transaction, FinancialHealthScore, ProjectedEvent } from '../types';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [healthScore, setHealthScore] = useState<FinancialHealthScore>({ score: 78, label: 'Good', color: Colors.accent });
  const [streak, setStreak] = useState(0);
  const [levelData, setLevelData] = useState<LevelData>({ level: 1, xp: 0, xpForThisLevel: 0, xpNeeded: 100 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [nextExpense, setNextExpense] = useState<ProjectedEvent | null>(null);
  const [balanceSeries, setBalanceSeries] = useState<number[]>([]);
  const [userName, setUserName] = useState('Sumari');

  const loadData = useCallback(async () => {
    try {
      const month = getMonthKey();
      const [totalBal, exp, inc, hs, st, lvl, bdgs, gls, txs, ne, proj, name] = await Promise.all([
        getTotalBalance(),
        getMonthlyTotal(month, 'expense'),
        getMonthlyTotal(month, 'income'),
        calculateHealthScore(),
        getStreak(),
        getLevelData(),
        getBudgets(month),
        getGoals(),
        getTransactions(5),
        getNextEvent('expense'),
        getProjectionChartData(30),
        getSetting('name'),
      ]);
      setBalance(totalBal);
      setMonthlyExpense(exp);
      setMonthlyIncome(inc);
      setHealthScore(hs);
      setStreak(st);
      setLevelData(lvl);
      setBudgets(bdgs as Budget[]);
      setGoals(gls);
      setTransactions(txs as Transaction[]);
      setNextExpense(ne);
      if (name) setUserName(name);
      if (proj.data && proj.data.length >= 2) {
        const step = Math.max(1, Math.floor(proj.data.length / 12));
        const series = Array.from({ length: Math.min(12, proj.data.length) }, (_, i) =>
          proj.data[Math.min(i * step, proj.data.length - 1)] || totalBal);
        setBalanceSeries(series);
      } else {
        setBalanceSeries([totalBal, totalBal]);
      }
    } catch (err) {
      console.log('HomeScreen error:', err);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const budgetTotal = budgets.reduce((s, b) => s + b.monthly_limit, 0);
  const budgetSpent = budgets.reduce((s, b) => s + (b.spent ?? 0), 0);
  const budgetPct = budgetTotal > 0 ? Math.round((budgetSpent / budgetTotal) * 100) : 0;
  const topGoal = goals[0] ?? null;
  const savingsRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100) : 0;
  const curMonthLabel = MONTHS[new Date().getMonth()];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        {/* Top bar */}
        <View style={s.topBar}>
          <View style={s.topLeft}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>S</Text>
            </View>
            <View>
              <Text style={s.greeting}>{greeting}</Text>
              <View style={s.nameRow}>
                <Text style={s.userName}>{userName}</Text>
                <View style={s.lvlBadge}>
                  <Text style={s.lvlText}>LVL {levelData.level}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={s.topRight}>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')} style={s.iconBtn}>
              <Ionicons name="search-outline" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={() => Linking.openSettings()}>
              <Ionicons name="notifications-outline" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero — Total Balance */}
        <View style={s.padH}>
          <HeroCard style={{ position: 'relative', overflow: 'hidden' }}>
            {streak > 0 && (
              <View style={s.streakBadge}>
                <Ionicons name="flame" size={11} color="#FF8A3D" />
                <Text style={s.streakText}>{streak}-day streak</Text>
              </View>
            )}
            <Text style={s.heroLabel}>Total balance</Text>
            <View style={{ marginBottom: Spacing.lg }}>
              <Amount value={balance} size="hero" color={Colors.onHero} />
            </View>
            <View style={s.heroPills}>
              <View style={s.heroPill}>
                <View style={[s.heroPillIcon, { backgroundColor: 'rgba(31,204,88,0.18)' }]}>
                  <Ionicons name="arrow-down" size={12} color={Colors.accent} />
                </View>
                <View>
                  <Text style={s.heroPillLabel}>Income</Text>
                  <Amount value={monthlyIncome} size="sm" color={Colors.onHero} />
                </View>
              </View>
              <View style={s.heroPill}>
                <View style={[s.heroPillIcon, { backgroundColor: 'rgba(255,90,107,0.18)' }]}>
                  <Ionicons name="arrow-up" size={12} color={Colors.negative} />
                </View>
                <View>
                  <Text style={s.heroPillLabel}>Spent</Text>
                  <Amount value={monthlyExpense} size="sm" color={Colors.onHero} />
                </View>
              </View>
            </View>
          </HeroCard>
        </View>

        {/* Quick actions */}
        <View style={s.quickActions}>
          {[
            { icon: 'arrow-down-outline', label: 'Income',  color: Colors.accent,
              onPress: () => navigation.navigate('AddTransaction', { type: 'income' }) },
            { icon: 'arrow-up-outline',  label: 'Expense', color: Colors.negative,
              onPress: () => navigation.navigate('AddTransaction', { type: 'expense' }) },
            { icon: 'repeat-outline',    label: 'Transfer', color: Colors.info,
              onPress: () => navigation.navigate('Accounts', { screen: 'TransferMoney' }) },
            { icon: 'trophy-outline',    label: 'Goals',    color: Colors.orange,
              onPress: () => navigation.navigate('Plan') },
          ].map((a) => (
            <TouchableOpacity key={a.label} style={s.quickAction} onPress={a.onPress} activeOpacity={0.7}>
              <View style={s.quickActionIcon}>
                <Ionicons name={a.icon as any} size={20} color={a.color} />
              </View>
              <Text style={s.quickActionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Health Score */}
        <View style={s.padH}>
          <Card>
            <View style={s.healthRow}>
              <Ring value={healthScore.score} size={84} stroke={7} color={Colors.accent}
                label={String(healthScore.score)} sublabel="Score" />
              <View style={s.healthText}>
                <Text style={s.healthCategory}>Financial health</Text>
                <Text style={s.healthLabel}>{healthScore.label}</Text>
                <Text style={s.healthDesc}>You save {Math.max(0, savingsRate)}% of income this month.</Text>
              </View>
            </View>
            <View style={s.healthPills}>
              <View style={[s.miniPill, { backgroundColor: Colors.accentSoft }]}>
                <Ionicons name="checkmark" size={10} color={Colors.accent} />
                <Text style={[s.miniPillText, { color: Colors.accent }]}>Savings {Math.max(0, savingsRate)}%</Text>
              </View>
              {streak > 0 && (
                <View style={[s.miniPill, { backgroundColor: 'rgba(255,138,61,0.15)' }]}>
                  <Ionicons name="flame" size={10} color={Colors.orange} />
                  <Text style={[s.miniPillText, { color: Colors.orange }]}>{streak} day streak</Text>
                </View>
              )}
            </View>
          </Card>
        </View>

        {/* Budget */}
        {budgets.length > 0 && (
          <>
            <SectionHeader label={`${curMonthLabel} budget`} action="Details"
              onAction={() => navigation.navigate('Plan')}
              style={{ paddingTop: Spacing.xl, paddingBottom: Spacing.sm }} />
            <View style={s.padH}>
              <Card>
                <View style={s.budgetHeader}>
                  <View>
                    <Text style={s.budgetSub}>Spent of limit</Text>
                    <View style={s.budgetAmounts}>
                      <Amount value={budgetSpent} size="lg" />
                      <Text style={s.budgetLimit}>/ {formatCurrency(budgetTotal)}</Text>
                    </View>
                  </View>
                  <View style={s.budgetPctBox}>
                    <Text style={s.budgetPctLabel}>Used</Text>
                    <Text style={[s.budgetPct, { color: budgetPct > 90 ? Colors.negative : Colors.textPrimary }]}>
                      {budgetPct}%
                    </Text>
                  </View>
                </View>
                <Progress value={budgetSpent} max={budgetTotal} height={8}
                  color={budgetPct > 90 ? Colors.negative : budgetPct > 70 ? Colors.warning : Colors.accent} />
              </Card>
            </View>
          </>
        )}

        {/* Balance trend */}
        {balanceSeries.length >= 2 && (
          <>
            <SectionHeader label="Balance trend" action="Timeline"
              onAction={() => navigation.navigate('Timeline')}
              style={{ paddingTop: Spacing.xl, paddingBottom: Spacing.sm }} />
            <View style={s.padH}>
              <Card style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.lg }}>
                <View style={s.chartHeader}>
                  <Text style={s.chartLabel}>30 days</Text>
                  <Text style={s.chartGrowth}>{savingsRate >= 0 ? '+' : ''}{savingsRate}%</Text>
                </View>
                <AreaChart data={balanceSeries} width={300} height={90} color={Colors.accent} />
              </Card>
            </View>
          </>
        )}

        {/* Next bill + Top goal */}
        {(nextExpense || topGoal) && (
          <View style={s.twoCol}>
            {nextExpense && (
              <Card style={{ flex: 1, padding: Spacing.lg }}>
                <Text style={s.miniCardLabel}>Next bill</Text>
                <View style={s.miniCardContent}>
                  <CatAvatar
                    icon={<Ionicons name="pricetag-outline" size={17} color={nextExpense.categoryColor ?? Colors.accent} />}
                    color={nextExpense.categoryColor ?? Colors.accent}
                    size={34}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.miniCardName} numberOfLines={1}>{nextExpense.label}</Text>
                    <Text style={s.miniCardSub}>upcoming</Text>
                  </View>
                </View>
                <Amount value={nextExpense.amount} size="md" />
              </Card>
            )}
            {topGoal && (
              <Card style={{ flex: 1, padding: Spacing.lg }}>
                <Text style={s.miniCardLabel}>Top goal</Text>
                <View style={s.miniCardContent}>
                  <CatAvatar
                    icon={<Ionicons name={(topGoal.icon ?? 'trophy-outline') as any} size={17} color={topGoal.color ?? Colors.accent} />}
                    color={topGoal.color ?? Colors.accent}
                    size={34}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.miniCardName} numberOfLines={1}>{topGoal.name}</Text>
                    <Text style={s.miniCardSub}>{Math.round((topGoal.saved_amount / topGoal.target_amount) * 100)}%</Text>
                  </View>
                </View>
                <Progress value={topGoal.saved_amount} max={topGoal.target_amount} height={6}
                  color={topGoal.color ?? Colors.accent} />
              </Card>
            )}
          </View>
        )}

        {/* Recent transactions */}
        {transactions.length > 0 && (
          <>
            <SectionHeader label="Recent" action="All"
              onAction={() => navigation.navigate('Transactions')}
              style={{ paddingTop: Spacing.xl, paddingBottom: Spacing.sm }} />
            <View style={s.padH}>
              <Card style={{ padding: 0 }}>
                {transactions.slice(0, 4).map((tx, i) => (
                  <TouchableOpacity key={tx.id} activeOpacity={0.75}
                    onPress={() => navigation.navigate('EditTransaction', { transaction: tx })}
                    style={[s.txRow, i < 3 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}>
                    <CatAvatar
                      icon={<Ionicons name={(tx.category_icon ?? 'pricetag-outline') as any} size={18} color={tx.category_color ?? Colors.accent} />}
                      color={tx.category_color ?? Colors.accent}
                      size={38}
                    />
                    <View style={s.txInfo}>
                      <Text style={s.txMerchant} numberOfLines={1}>{tx.merchant_name}</Text>
                      <Text style={s.txMeta}>{tx.category_name} · {tx.date.slice(5)}</Text>
                    </View>
                    <Amount value={tx.amount} size="sm" color={tx.type === 'income' ? Colors.accent : Colors.textPrimary} />
                  </TouchableOpacity>
                ))}
              </Card>
            </View>
          </>
        )}

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
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  topRight: { flexDirection: 'row', gap: Spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '700', color: Colors.onAccent },
  greeting: { fontSize: 12, color: Colors.textTertiary, letterSpacing: 0.2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.2 },
  lvlBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: Colors.accentSoft },
  lvlText: { fontSize: 10, fontWeight: '600', color: Colors.accent, letterSpacing: 0.5 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center' },
  streakBadge: { position: 'absolute', top: Spacing.lg, right: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,138,61,0.15)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  streakText: { fontSize: 11, fontWeight: '600', color: '#FF8A3D' },
  heroLabel: { fontSize: 12, color: 'rgba(244,245,240,0.55)', textTransform: 'uppercase',
    letterSpacing: 1.6, marginBottom: 10 },
  heroPills: { flexDirection: 'row', gap: Spacing.sm },
  heroPill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, borderRadius: BorderRadius.md, backgroundColor: 'rgba(255,255,255,0.06)' },
  heroPillIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  heroPillLabel: { fontSize: 10, color: 'rgba(244,245,240,0.5)', textTransform: 'uppercase', letterSpacing: 1 },
  quickActions: { flexDirection: 'row', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, justifyContent: 'space-between' },
  quickAction: { flex: 1, alignItems: 'center', gap: 6 },
  quickActionIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  healthText: { flex: 1, minWidth: 0 },
  healthCategory: { fontSize: 11, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1.4 },
  healthLabel: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.4, marginTop: 2 },
  healthDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17, marginTop: 4 },
  healthPills: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg, flexWrap: 'wrap' },
  miniPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  miniPillText: { fontSize: 11, fontWeight: '600' },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.md },
  budgetSub: { fontSize: 12, color: Colors.textTertiary },
  budgetAmounts: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 },
  budgetLimit: { fontSize: 14, color: Colors.textTertiary },
  budgetPctBox: { alignItems: 'flex-end' },
  budgetPctLabel: { fontSize: 10, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1 },
  budgetPct: { fontSize: 20, fontWeight: '600', letterSpacing: -0.5 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.sm, marginBottom: Spacing.md },
  chartLabel: { fontSize: 11, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1.2 },
  chartGrowth: { fontSize: 11, fontWeight: '600', color: Colors.accent },
  twoCol: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  miniCardLabel: { fontSize: 11, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  miniCardContent: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  miniCardName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  miniCardSub: { fontSize: 11, color: Colors.textTertiary },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  txInfo: { flex: 1, minWidth: 0 },
  txMerchant: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  txMeta: { fontSize: 11, color: Colors.textTertiary, marginTop: 1 },
});
