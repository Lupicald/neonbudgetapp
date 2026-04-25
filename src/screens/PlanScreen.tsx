import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput, Modal,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card, HeroCard, Amount, Progress, Pill, SumariButton, SectionHeader, TopBar, CatAvatar,
} from '../components/SumariPrimitives';
import { Colors, Spacing, BorderRadius, CategoryColors, FontFamily } from '../theme';
import { getBudgets, addBudget, deleteBudget } from '../database/budgetService';
import { getGoals, addGoal, addToGoal, deleteGoal } from '../database/goalService';
import { getRecurringItems } from '../database/recurringService';
import { getCategories } from '../database/categoryService';
import { getMonthKey } from '../utils';
import { Budget, Goal, RecurringItem, Category } from '../types';

type Tab = 'budgets' | 'goals' | 'recurring' | 'planner';

export const PlanScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<Tab>('budgets');
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurring, setRecurring] = useState<RecurringItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Budget form
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetCatId, setBudgetCatId] = useState<number | null>(null);
  const [budgetLimit, setBudgetLimit] = useState('');

  // Goal form
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalIcon, setGoalIcon] = useState('trophy-outline');
  const [goalColor, setGoalColor] = useState(Colors.accent);

  // Add-to-goal modal
  const [addGoalId, setAddGoalId] = useState<number | null>(null);
  const [addGoalAmount, setAddGoalAmount] = useState('');

  const load = useCallback(async () => {
    try {
      const month = getMonthKey();
      const [bdgs, gls, rec, cats] = await Promise.all([
        getBudgets(month),
        getGoals(),
        getRecurringItems(),
        getCategories(),
      ]);
      setBudgets(bdgs as Budget[]);
      setGoals(gls);
      setRecurring(rec);
      setCategories(cats);
    } catch (e) { console.log(e); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const budgetTotal = budgets.reduce((s, b) => s + b.monthly_limit, 0);
  const budgetSpent = budgets.reduce((s, b) => s + (b.spent ?? 0), 0);
  const budgetPct = budgetTotal > 0 ? Math.round((budgetSpent / budgetTotal) * 100) : 0;
  const recurringIn = recurring.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const recurringOut = recurring.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);

  const saveBudget = async () => {
    if (!budgetCatId || !budgetLimit) return Alert.alert('Fill all fields');
    await addBudget(budgetCatId, parseFloat(budgetLimit));
    setShowBudgetForm(false);
    setBudgetLimit('');
    load();
  };

  const saveGoal = async () => {
    if (!goalName || !goalTarget) return Alert.alert('Fill all fields');
    await addGoal(goalName, parseFloat(goalTarget), goalIcon, goalColor);
    setShowGoalForm(false);
    setGoalName('');
    setGoalTarget('');
    load();
  };

  const saveAddToGoal = async () => {
    if (!addGoalId || !addGoalAmount) return;
    await addToGoal(addGoalId, parseFloat(addGoalAmount));
    setAddGoalId(null);
    setAddGoalAmount('');
    load();
  };

  const curMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const GOAL_ICONS = ['trophy-outline','airplane-outline','shield-outline','home-outline','sparkles-outline','diamond-outline','car-outline','heart-outline'];

  // Upcoming planner events from recurring
  const upcomingEvents = recurring
    .filter(r => r.is_active)
    .sort((a, b) => a.next_date.localeCompare(b.next_date))
    .slice(0, 8);

  const projectedBalance = recurringIn - recurringOut;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <TopBar title="Plan" subtitle={curMonth} large
          right={
            <TouchableOpacity
              onPress={() => {
                if (tab === 'budgets') setShowBudgetForm(true);
                else if (tab === 'goals') setShowGoalForm(true);
                else navigation.navigate('AddTransaction' as never);
              }}
              style={s.addBtn}
            >
              <Ionicons name="add" size={18} color={Colors.onAccent} />
            </TouchableOpacity>
          }
        />

        {/* Tab pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll}
          contentContainerStyle={s.tabContent}>
          {([
            { v: 'budgets', l: 'Budgets', i: 'pie-chart-outline' },
            { v: 'goals', l: 'Goals', i: 'trophy-outline' },
            { v: 'recurring', l: 'Recurring', i: 'repeat-outline' },
            { v: 'planner', l: 'Planner', i: 'calendar-outline' },
          ] as { v: Tab; l: string; i: string }[]).map(o => (
            <Pill key={o.v} active={tab === o.v} onPress={() => setTab(o.v)} size="md"
              style={{ flexDirection: 'row', gap: 6 }}>
              <Ionicons name={o.i as any} size={13} color={tab === o.v ? Colors.bg : Colors.textSecondary} />
              <Text style={{ fontSize: 13, fontWeight: tab === o.v ? '600' : '500',
                color: tab === o.v ? Colors.bg : Colors.textSecondary }}>{o.l}</Text>
            </Pill>
          ))}
        </ScrollView>

        {/* BUDGETS */}
        {tab === 'budgets' && (
          <>
            <View style={s.padH}>
              <HeroCard>
                <Text style={s.heroLabel}>Monthly budget</Text>
                <Amount value={budgetSpent} size="xl" color={Colors.onHero} />
                <Text style={s.heroSub}>of ${budgetTotal.toLocaleString()} · {budgetPct}% used</Text>
                <Progress value={budgetSpent} max={budgetTotal || 1} height={6}
                  style={{ marginTop: Spacing.md, backgroundColor: 'rgba(255,255,255,0.1)' }} />
              </HeroCard>
            </View>
            <SectionHeader label="Categories" action="Manage"
              onAction={() => navigation.navigate('CategoriesManage')}
              style={{ paddingTop: Spacing.xl, paddingBottom: Spacing.sm }} />
            <SectionHeader label="Budget limits" action="Full view"
              onAction={() => navigation.navigate('BudgetsManage')}
              style={{ paddingBottom: Spacing.sm }} />
            <View style={[s.padH, { gap: Spacing.sm }]}>
              {budgets.map(b => {
                const pct = b.monthly_limit > 0 ? (b.spent ?? 0) / b.monthly_limit : 0;
                const warn = pct > 0.9;
                return (
                  <TouchableOpacity key={b.id} onLongPress={() => Alert.alert('Delete budget?', '', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: async () => { await deleteBudget(b.id); load(); } },
                  ])} activeOpacity={0.85}>
                    <Card>
                      <View style={s.budgetCard}>
                        <CatAvatar
                          icon={<Ionicons name={(b.category_icon ?? 'pricetag-outline') as any} size={19}
                            color={b.category_color ?? Colors.accent} />}
                          color={b.category_color ?? Colors.accent}
                          size={38}
                        />
                        <View style={s.budgetInfo}>
                          <Text style={s.budgetName}>{b.category_name ?? 'Budget'}</Text>
                          <Text style={s.budgetLimit}>${b.monthly_limit.toLocaleString()} limit</Text>
                        </View>
                        <View style={s.budgetRight}>
                          <Amount value={b.spent ?? 0} size="sm" color={warn ? Colors.negative : Colors.textPrimary} />
                          <Text style={[s.budgetPct, { color: warn ? Colors.negative : Colors.textTertiary }]}>
                            {Math.round(pct * 100)}%
                          </Text>
                        </View>
                      </View>
                      <Progress value={b.spent ?? 0} max={b.monthly_limit} height={5}
                        color={warn ? Colors.negative : (b.category_color ?? Colors.accent)}
                        style={{ marginTop: Spacing.md }} />
                    </Card>
                  </TouchableOpacity>
                );
              })}
              {budgets.length === 0 && (
                <View style={s.empty}>
                  <Text style={s.emptyText}>No budgets yet</Text>
                  <Text style={s.emptySubText}>Tap + to create one</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* GOALS */}
        {tab === 'goals' && (
          <>
          <SectionHeader label="Goals" action="Full view"
            onAction={() => navigation.navigate('GoalsManage')}
            style={{ paddingTop: Spacing.lg, paddingBottom: Spacing.sm }} />
          <View style={[s.padH, { gap: Spacing.md }]}>
            {goals.map(g => {
              const pct = g.target_amount > 0 ? g.saved_amount / g.target_amount : 0;
              return (
                <Card key={g.id} style={{ padding: Spacing.xl }}>
                  <View style={s.goalCard}>
                    <View style={[s.goalIcon, { backgroundColor: (g.color ?? Colors.accent) + '20' }]}>
                      <Ionicons name={(g.icon ?? 'trophy-outline') as any} size={22} color={g.color ?? Colors.accent} />
                    </View>
                    <View style={s.goalInfo}>
                      <Text style={s.goalName}>{g.name}</Text>
                    </View>
                    <Text style={[s.goalPct, { color: g.color ?? Colors.accent }]}>
                      {Math.round(pct * 100)}%
                    </Text>
                  </View>
                  <View style={s.goalAmounts}>
                    <Amount value={g.saved_amount} size="md" />
                    <Text style={s.goalTarget}>/ ${g.target_amount.toLocaleString()}</Text>
                  </View>
                  <Progress value={g.saved_amount} max={g.target_amount} height={8}
                    color={g.color ?? Colors.accent} style={{ marginTop: Spacing.sm }} />
                  <View style={s.goalActions}>
                    <TouchableOpacity onPress={() => { setAddGoalId(g.id); setAddGoalAmount(''); }} style={s.goalBtn}>
                      <Ionicons name="add" size={14} color={Colors.accent} />
                      <Text style={s.goalBtnText}>Add</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onLongPress={() => Alert.alert('Delete goal?', '', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteGoal(g.id); load(); } },
                    ])} style={s.goalBtnGhost}>
                      <Ionicons name="trash-outline" size={14} color={Colors.textTertiary} />
                      <Text style={s.goalBtnGhostText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}
            {goals.length === 0 && (
              <View style={s.empty}>
                <Text style={s.emptyText}>No goals yet</Text>
                <Text style={s.emptySubText}>Tap + to create one</Text>
              </View>
            )}
          </View>
          </>
        )}

        {/* RECURRING */}
        {tab === 'recurring' && (
          <>
            <View style={[s.padH, s.recurringStats]}>
              <Card style={{ flex: 1, padding: Spacing.md }}>
                <Text style={s.statLabel}>In</Text>
                <Amount value={recurringIn} size="sm" color={Colors.accent} />
              </Card>
              <Card style={{ flex: 1, padding: Spacing.md }}>
                <Text style={s.statLabel}>Out</Text>
                <Amount value={recurringOut} size="sm" color={Colors.negative} />
              </Card>
              <Card style={{ flex: 1, padding: Spacing.md }}>
                <Text style={s.statLabel}>Net</Text>
                <Amount value={recurringIn - recurringOut} size="sm" sign color={Colors.textPrimary} />
              </Card>
            </View>
            <SectionHeader label="Upcoming" action="Manage"
              onAction={() => navigation.navigate('RecurringManage')}
              style={{ paddingTop: Spacing.xl, paddingBottom: Spacing.sm }} />
            <View style={[s.padH, { gap: Spacing.sm }]}>
              {recurring.map(r => (
                <Card key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <View style={[s.recurringBar, { backgroundColor: r.type === 'income' ? Colors.accent : Colors.negative }]} />
                  <CatAvatar
                    icon={<Ionicons name={(r.category_icon ?? 'repeat-outline') as any} size={18}
                      color={r.category_color ?? Colors.accent} />}
                    color={r.category_color ?? Colors.accent}
                    size={38}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.recurringName}>{r.name}</Text>
                    <Text style={s.recurringMeta}>{r.frequency} · next {r.next_date.slice(5)}</Text>
                  </View>
                  <Amount value={r.amount} size="sm" sign={r.type === 'income'}
                    color={r.type === 'income' ? Colors.accent : Colors.textPrimary} />
                </Card>
              ))}
              {recurring.length === 0 && (
                <View style={s.empty}>
                  <Text style={s.emptyText}>No recurring items</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* PLANNER */}
        {tab === 'planner' && (
          <View style={s.padH}>
            <HeroCard style={{ marginBottom: Spacing.lg }}>
              <Text style={s.heroLabel}>Projected end of month</Text>
              <Amount value={projectedBalance} size="xl" color={projectedBalance >= 0 ? Colors.accent : Colors.negative} />
              <Text style={s.heroSub}>Based on {recurring.length} scheduled items</Text>
            </HeroCard>
            <SectionHeader label="Timeline" style={{ padding: 0, paddingBottom: Spacing.md }} />
            {upcomingEvents.map((e, i) => (
              <View key={e.id} style={s.timelineRow}>
                <View style={s.timelineLine}>
                  <View style={[s.timelineDot, { backgroundColor: e.type === 'income' ? Colors.accent : Colors.negative }]} />
                  {i < upcomingEvents.length - 1 && <View style={s.timelineConnector} />}
                </View>
                <Card style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
                  padding: Spacing.md, marginBottom: Spacing.sm }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.timelineDate}>{e.next_date.slice(5)}</Text>
                    <Text style={s.timelineName}>{e.name}</Text>
                  </View>
                  <Amount value={e.amount} size="sm" sign={e.type === 'income'}
                    color={e.type === 'income' ? Colors.accent : Colors.textPrimary} />
                </Card>
              </View>
            ))}
            {upcomingEvents.length === 0 && (
              <View style={s.empty}>
                <Text style={s.emptyText}>No upcoming items</Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Budget form modal */}
      <Modal visible={showBudgetForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>New budget</Text>
            <TouchableOpacity onPress={() => setShowBudgetForm(false)} style={s.closeBtn}>
              <Ionicons name="close" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={s.modalContent}>
            <Text style={s.fieldLabel}>Category</Text>
            <View style={s.catGrid}>
              {categories.map(c => (
                <TouchableOpacity key={c.id} onPress={() => setBudgetCatId(c.id)}
                  style={[s.catOption, budgetCatId === c.id && { borderColor: c.color, backgroundColor: c.color + '18' }]}>
                  <Ionicons name={(c.icon ?? 'pricetag-outline') as any} size={18} color={c.color} />
                  <Text style={[s.catOptionText, budgetCatId === c.id && { color: c.color }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.fieldLabel}>Monthly limit</Text>
            <View style={s.field}>
              <TextInput style={s.fieldInput} value={budgetLimit} onChangeText={setBudgetLimit}
                placeholder="0.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
            </View>
            <View style={{ marginTop: Spacing.xxl }}>
              <SumariButton onPress={saveBudget} variant="primary" size="lg" fullWidth>
                Create budget
              </SumariButton>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Goal form modal */}
      <Modal visible={showGoalForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>New goal</Text>
            <TouchableOpacity onPress={() => setShowGoalForm(false)} style={s.closeBtn}>
              <Ionicons name="close" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={s.modalContent}>
            <Text style={s.fieldLabel}>Goal name</Text>
            <View style={s.field}>
              <TextInput style={s.fieldInput} value={goalName} onChangeText={setGoalName}
                placeholder="e.g. Japan 2026" placeholderTextColor={Colors.textMuted} />
            </View>
            <Text style={s.fieldLabel}>Target amount</Text>
            <View style={s.field}>
              <TextInput style={s.fieldInput} value={goalTarget} onChangeText={setGoalTarget}
                placeholder="0.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
            </View>
            <Text style={s.fieldLabel}>Icon</Text>
            <View style={s.iconGrid}>
              {GOAL_ICONS.map(ic => (
                <TouchableOpacity key={ic} onPress={() => setGoalIcon(ic)}
                  style={[s.iconOption, goalIcon === ic && s.iconOptionActive]}>
                  <Ionicons name={ic as any} size={20} color={goalIcon === ic ? Colors.accent : Colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.fieldLabel}>Color</Text>
            <View style={s.colorRow}>
              {CategoryColors.slice(0, 8).map(c => (
                <TouchableOpacity key={c} onPress={() => setGoalColor(c)}
                  style={[s.colorDot, { backgroundColor: c }, goalColor === c && s.colorDotActive]} />
              ))}
            </View>
            <View style={{ marginTop: Spacing.xxl }}>
              <SumariButton onPress={saveGoal} variant="primary" size="lg" fullWidth>
                Create goal
              </SumariButton>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add to goal modal */}
      <Modal visible={!!addGoalId} animationType="slide" presentationStyle="formSheet" transparent>
        <View style={s.addToGoalOverlay}>
          <View style={s.addToGoalSheet}>
            <Text style={s.modalTitle}>Add to goal</Text>
            <View style={[s.field, { marginVertical: Spacing.lg }]}>
              <TextInput style={s.fieldInput} value={addGoalAmount} onChangeText={setAddGoalAmount}
                placeholder="Amount" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" autoFocus />
            </View>
            <SumariButton onPress={saveAddToGoal} variant="primary" size="lg" fullWidth>Save</SumariButton>
            <TouchableOpacity onPress={() => setAddGoalId(null)} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ color: Colors.textTertiary, fontSize: 13 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const GOAL_ICONS = ['trophy-outline','airplane-outline','shield-outline','home-outline','sparkles-outline','diamond-outline','car-outline','heart-outline'];

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingBottom: 20 },
  padH: { paddingHorizontal: Spacing.xl },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center' },
  tabScroll: { marginBottom: Spacing.lg },
  tabContent: { gap: Spacing.xs, paddingHorizontal: Spacing.xl, paddingBottom: 2 },
  heroLabel: { fontSize: 12, color: 'rgba(244,245,240,0.55)', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 8 },
  heroSub: { fontSize: 13, color: 'rgba(244,245,240,0.6)', marginTop: 4 },
  budgetCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  budgetInfo: { flex: 1, minWidth: 0 },
  budgetName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  budgetLimit: { fontSize: 11, color: Colors.textTertiary },
  budgetRight: { alignItems: 'flex-end' },
  budgetPct: { fontSize: 10, marginTop: 2 },
  goalCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  goalIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  goalInfo: { flex: 1, minWidth: 0 },
  goalName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.2 },
  goalPct: { fontSize: 20, fontWeight: '600', letterSpacing: -0.5 },
  goalAmounts: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: Spacing.sm },
  goalTarget: { fontSize: 13, color: Colors.textTertiary },
  goalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  goalBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 999, backgroundColor: Colors.accentSoft },
  goalBtnText: { fontSize: 13, fontWeight: '600', color: Colors.accent },
  goalBtnGhost: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 999, borderWidth: 1, borderColor: Colors.border },
  goalBtnGhostText: { fontSize: 13, fontWeight: '500', color: Colors.textTertiary },
  recurringStats: { flexDirection: 'row', gap: Spacing.sm },
  statLabel: { fontSize: 10, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1 },
  recurringBar: { width: 6, alignSelf: 'stretch', borderRadius: 3, marginRight: -4 },
  recurringName: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  recurringMeta: { fontSize: 11, color: Colors.textTertiary, textTransform: 'capitalize' },
  timelineRow: { flexDirection: 'row', gap: Spacing.md },
  timelineLine: { width: 18, alignItems: 'center', paddingTop: 14 },
  timelineDot: { width: 9, height: 9, borderRadius: 5 },
  timelineConnector: { flex: 1, width: 1, backgroundColor: Colors.border, marginTop: 4 },
  timelineDate: { fontSize: 11, color: Colors.textTertiary },
  timelineName: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  emptySubText: { fontSize: 13, color: Colors.textTertiary },
  // Modal
  modal: { flex: 1, backgroundColor: Colors.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  modalTitle: { fontSize: 22, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCardAlt,
    alignItems: 'center', justifyContent: 'center' },
  modalContent: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  fieldLabel: { fontSize: 11, fontWeight: '500', color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 8, marginTop: Spacing.lg },
  field: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.lg, paddingVertical: 14 },
  fieldInput: { fontSize: 15, color: Colors.textPrimary },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  catOption: { flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  catOptionText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  iconOption: { width: 44, height: 44, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  iconOptionActive: { borderColor: Colors.accent, backgroundColor: Colors.accentSoft },
  colorRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: Colors.textPrimary },
  addToGoalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  addToGoalSheet: { backgroundColor: Colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.xxl, paddingBottom: 40 },
});
