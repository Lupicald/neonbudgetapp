import React, { useState, useCallback } from 'react';
import {
    View, ScrollView, StyleSheet, TouchableOpacity, Alert,
    TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { format, parseISO } from 'date-fns';
import { GlassCard, NeonText, CategoryIcon } from '../components';
import { Colors, Spacing, BorderRadius, FontSize } from '../theme';
import {
    getRecurringItems, addRecurringItem, updateRecurringItem,
    deleteRecurringItem, toggleRecurringItem, recordRecurringPayment,
    generateFutureOccurrences,
} from '../database/recurringService';
import { getCategories } from '../database/categoryService';
import {
    getAllPlannedExpenses, addPlannedExpense, deletePlannedExpense,
} from '../database/plannedBudgetService';
import { RecurringItem, Category, RecurringFrequency, TransactionType, PlannedExpense } from '../types';
import { formatCurrency, getDayOfWeekName, toISODateString } from '../utils';

interface Props { type?: TransactionType; }

type MainTab = TransactionType | 'planner';

const FREQ_OPTIONS: { label: string; value: RecurringFrequency }[] = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Bi-weekly', value: 'biweekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
    { label: 'Custom', value: 'custom' },
];
const DAYS = [0, 1, 2, 3, 4, 5, 6];

/** Returns the estimated monthly amount for a recurring item */
const getMonthlyAmount = (item: RecurringItem): number => {
    switch (item.frequency) {
        case 'weekly':    return item.amount * 4.33;
        case 'biweekly':  return item.amount * 2.17;
        case 'monthly':   return item.amount;
        case 'yearly':    return item.amount / 12;
        case 'custom':    return item.amount * (30 / Math.max(1, item.interval_days));
        default:          return item.amount;
    }
};

const freqLabel = (item: RecurringItem): string => {
    switch (item.frequency) {
        case 'weekly':   return 'Weekly';
        case 'biweekly': return 'Every 2 weeks';
        case 'monthly':  return `Monthly${item.day_of_month ? ` (day ${item.day_of_month})` : ''}`;
        case 'yearly':   return 'Yearly';
        case 'custom':   return `Every ${item.interval_days}d`;
        default:         return item.frequency;
    }
};

export const RecurringScreen: React.FC<Props> = () => {
    const [tab, setTab] = useState<MainTab>('income');
    const [items, setItems] = useState<RecurringItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [modalOpen, setModalOpen] = useState(false);

    // recurring form
    const [editId, setEditId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
    const [dayOfWeek, setDayOfWeek] = useState(4);
    const [dayOfMonthStr, setDayOfMonthStr] = useState('1');
    const [intervalDays, setIntervalDays] = useState('30');
    const [selectedCat, setSelectedCat] = useState<Category | null>(null);

    // planner
    const [plannerItems, setPlannerItems] = useState<PlannedExpense[]>([]);
    const [plannerModal, setPlannerModal] = useState(false);
    const [pName, setPName] = useState('');
    const [pAmount, setPAmount] = useState('');
    const [pDate, setPDate] = useState(toISODateString(new Date()));
    const [pCat, setPCat] = useState<Category | null>(null);

    const load = useCallback(async () => {
        const [ri, cats, allExpenses] = await Promise.all([
            getRecurringItems(),
            getCategories(),
            getAllPlannedExpenses(),
        ]);
        setItems(ri as RecurringItem[]);
        setCategories(cats);
        if (!selectedCat && cats.length > 0) setSelectedCat(cats[0]);

        const monthStr = format(new Date(), 'yyyy-MM');
        const oneTime = allExpenses.filter(
            (e: PlannedExpense) => e.planned_income_id == null && e.planned_date.startsWith(monthStr)
        );
        setPlannerItems(oneTime);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const resetForm = () => {
        setEditId(null); setName(''); setAmount('');
        setFrequency('monthly'); setDayOfWeek(4); setDayOfMonthStr('1'); setIntervalDays('30');
        if (categories.length > 0) setSelectedCat(categories[0]);
    };

    const openAdd = () => { resetForm(); setModalOpen(true); };

    const openEdit = (item: RecurringItem) => {
        setEditId(item.id); setName(item.name); setAmount(item.amount.toString());
        setFrequency(item.frequency); setDayOfWeek(item.day_of_week ?? 4);
        setDayOfMonthStr(String(item.day_of_month ?? 1));
        setIntervalDays(item.interval_days.toString());
        const cat = categories.find(c => c.id === item.category_id);
        if (cat) setSelectedCat(cat);
        setModalOpen(true);
    };

    const handleSave = async () => {
        const num = parseFloat(amount.replace(/,/g, ''));
        if (!name.trim() || !num || !selectedCat) { Alert.alert('Error', 'Fill all required fields'); return; }
        const dow = ['weekly', 'biweekly'].includes(frequency) ? dayOfWeek : null;
        const dom = frequency === 'monthly' ? (parseInt(dayOfMonthStr) || 1) : null;
        const intv = parseInt(intervalDays) || 30;
        const today = toISODateString(new Date());

        if (editId) {
            await updateRecurringItem(editId, name.trim(), num, selectedCat.id, frequency, intv, dow, dom, today);
        } else {
            await addRecurringItem(tab === 'planner' ? 'expense' : tab, name.trim(), num, selectedCat.id, frequency, intv, dow, dom, today);
        }
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setModalOpen(false);
        resetForm();
        load();
    };

    const handleDelete = (item: RecurringItem) => {
        Alert.alert('Delete', `Delete "${item.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await deleteRecurringItem(item.id); load(); } },
        ]);
    };

    const handlePayNow = (item: RecurringItem) => {
        Alert.alert('Record Payment', `Record ${formatCurrency(item.amount)} for "${item.name}" today?\nNext date will advance automatically.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Record', onPress: async () => {
                    try {
                        await recordRecurringPayment(item.id);
                        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        load();
                    } catch (e: any) { Alert.alert('Error', e?.message); }
                }
            },
        ]);
    };

    // ── Planner helpers ──────────────────────────────────────────────────────
    const handleAddPlannerExpense = async () => {
        const num = parseFloat(pAmount.replace(/,/g, ''));
        if (!pName.trim() || !num) { Alert.alert('Error', 'Enter name and amount'); return; }
        await addPlannedExpense(pName.trim(), num, pDate || toISODateString(new Date()), pCat?.id ?? null, null);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPlannerModal(false);
        setPName(''); setPAmount(''); setPDate(toISODateString(new Date()));
        load();
    };

    const handleDeletePlannerItem = (id: number) => {
        Alert.alert('Remove', 'Remove this one-time expense from the planner?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: async () => { await deletePlannedExpense(id); load(); } },
        ]);
    };

    // Build planner timeline for current month
    const buildPlannerTimeline = () => {
        const monthStr = format(new Date(), 'yyyy-MM');
        type PlanEvent = { date: string; name: string; amount: number; type: 'income' | 'expense'; isOneTime: boolean; id?: number; icon?: string; color?: string };

        const recurring: PlanEvent[] = items
            .filter(i => i.is_active)
            .flatMap(i =>
                generateFutureOccurrences(i, 60)
                    .filter(e => e.date.startsWith(monthStr))
                    .map(e => ({
                        date: e.date, name: e.label, amount: e.amount, type: e.type,
                        isOneTime: false,
                        icon: i.category_icon, color: i.category_color,
                    }))
            );

        const oneTime: PlanEvent[] = plannerItems.map(e => ({
            date: e.planned_date, name: e.name, amount: e.amount, type: 'expense' as const,
            isOneTime: true, id: e.id,
            icon: e.category_icon, color: e.category_color,
        }));

        return [...recurring, ...oneTime].sort((a, b) => a.date.localeCompare(b.date));
    };

    const filtered = items.filter(i => i.type === tab);
    const accentColor = tab === 'income' ? Colors.cyberGreen : Colors.neonPink;
    const incomeTotal = items.filter(i => i.type === 'income' && i.is_active).reduce((s, i) => s + getMonthlyAmount(i), 0);
    const expenseTotal = items.filter(i => i.type === 'expense' && i.is_active).reduce((s, i) => s + getMonthlyAmount(i), 0);
    const monthlyNet = incomeTotal - expenseTotal;

    return (
        <View style={s.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

                {/* Header */}
                <View style={s.header}>
                    <View>
                        <NeonText variant="caption" color={Colors.textMuted} style={{ letterSpacing: 1.5 }}>AUTOMATION</NeonText>
                        <NeonText variant="title">Recurring</NeonText>
                    </View>
                    {tab !== 'planner' && (
                        <TouchableOpacity onPress={openAdd} style={s.addBtn} activeOpacity={0.8}>
                            <LinearGradient
                                colors={accentColor === Colors.cyberGreen
                                    ? [Colors.cyberGreen, Colors.cyberGreenDark] as [string, string]
                                    : [Colors.neonPink, Colors.neonPinkDark] as [string, string]
                                }
                                style={s.addBtnGrad}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="add" size={22} color="#FFF" />
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                    {tab === 'planner' && (
                        <TouchableOpacity onPress={() => setPlannerModal(true)} style={s.addBtn} activeOpacity={0.8}>
                            <LinearGradient
                                colors={['#F59E0B', '#D97706'] as [string, string]}
                                style={s.addBtnGrad}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="add" size={22} color="#FFF" />
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Monthly summary strip */}
                <GlassCard style={s.summaryCard}>
                    <NeonText variant="caption" color={Colors.textMuted} style={{ marginBottom: 8, letterSpacing: 1 }}>MONTHLY ESTIMATE</NeonText>
                    <View style={s.summaryRow}>
                        <View style={s.sumItem}>
                            <NeonText variant="label" color={Colors.textMuted}>IN</NeonText>
                            <NeonText variant="subtitle" color={Colors.cyberGreen} style={{ fontWeight: '700' }}>
                                +{formatCurrency(incomeTotal)}
                            </NeonText>
                        </View>
                        <View style={s.sumDiv} />
                        <View style={s.sumItem}>
                            <NeonText variant="label" color={Colors.textMuted}>OUT</NeonText>
                            <NeonText variant="subtitle" color={Colors.neonPink} style={{ fontWeight: '700' }}>
                                -{formatCurrency(expenseTotal)}
                            </NeonText>
                        </View>
                        <View style={s.sumDiv} />
                        <View style={s.sumItem}>
                            <NeonText variant="label" color={Colors.textMuted}>NET</NeonText>
                            <NeonText variant="subtitle" color={monthlyNet >= 0 ? Colors.cyberGreen : Colors.neonPink} style={{ fontWeight: '700' }}>
                                {formatCurrency(monthlyNet)}
                            </NeonText>
                        </View>
                    </View>
                </GlassCard>

                {/* Tabs */}
                <View style={s.tabs}>
                    {(['income', 'expense', 'planner'] as MainTab[]).map(t => {
                        const color = t === 'income' ? Colors.cyberGreen : t === 'expense' ? Colors.neonPink : '#F59E0B';
                        const gradColors: [string, string] = t === 'income'
                            ? [Colors.cyberGreen, Colors.cyberGreenDark]
                            : t === 'expense'
                                ? [Colors.neonPink, Colors.neonPinkDark]
                                : ['#F59E0B', '#D97706'];
                        const icon = t === 'income' ? 'arrow-down-circle-outline' : t === 'expense' ? 'arrow-up-circle-outline' : 'calendar-outline';
                        return (
                            <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)} activeOpacity={0.8}>
                                {tab === t && (
                                    <LinearGradient
                                        colors={gradColors}
                                        style={StyleSheet.absoluteFill}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    />
                                )}
                                <Ionicons name={icon as any} size={14} color={tab === t ? '#FFF' : Colors.textTertiary} />
                                <NeonText
                                    variant="caption"
                                    color={tab === t ? '#FFF' : Colors.textTertiary}
                                    style={{ fontWeight: tab === t ? '700' : '400', textTransform: 'capitalize' }}
                                >
                                    {t === 'income' ? 'Income' : t === 'expense' ? 'Expenses' : 'Planner'}
                                </NeonText>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* ── Income / Expense lists ── */}
                {(tab === 'income' || tab === 'expense') && (
                    filtered.length === 0 ? (
                        <View style={s.empty}>
                            <Ionicons name="repeat-outline" size={48} color={Colors.textMuted} />
                            <NeonText variant="body" color={Colors.textMuted} align="center">
                                No recurring {tab === 'income' ? 'income' : 'expenses'} yet
                            </NeonText>
                            <TouchableOpacity onPress={openAdd} style={s.emptyBtn}>
                                <NeonText variant="caption" color={accentColor}>+ Add one</NeonText>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        filtered.map(item => {
                            const monthly = getMonthlyAmount(item);
                            const showMonthly = item.frequency !== 'monthly' && Math.abs(monthly - item.amount) > 0.5;
                            return (
                                <View key={item.id} style={[s.itemCard, !item.is_active && s.itemInactive]}>
                                    <View style={[s.strip, { backgroundColor: item.is_active ? accentColor : Colors.border }]} />
                                    <CategoryIcon icon={item.category_icon || 'repeat'} color={item.category_color || accentColor} size={42} />
                                    <View style={s.itemBody}>
                                        <View style={s.itemTopRow}>
                                            <NeonText variant="body" style={{ fontWeight: '600', flex: 1 }} numberOfLines={1}>{item.name}</NeonText>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <NeonText variant="subtitle" color={accentColor} style={{ fontWeight: '700' }}>
                                                    {formatCurrency(item.amount)}
                                                </NeonText>
                                                {showMonthly && (
                                                    <NeonText variant="caption" color={Colors.textMuted} style={{ fontSize: 10 }}>
                                                        ~{formatCurrency(monthly)}/mo
                                                    </NeonText>
                                                )}
                                            </View>
                                        </View>
                                        <View style={s.itemMetaRow}>
                                            <NeonText variant="caption" color={Colors.textTertiary}>{freqLabel(item)}</NeonText>
                                            {item.day_of_week !== null && ['weekly','biweekly'].includes(item.frequency) && (
                                                <NeonText variant="caption" color={Colors.textTertiary}>, {getDayOfWeekName(item.day_of_week)}</NeonText>
                                            )}
                                            <NeonText variant="caption" color={Colors.textMuted}> · next: {item.next_date}</NeonText>
                                        </View>
                                        <View style={s.itemActions}>
                                            <TouchableOpacity style={[s.actionChip, { borderColor: accentColor + '40' }]} onPress={() => handlePayNow(item)}>
                                                <NeonText variant="caption" color={accentColor}>Record now</NeonText>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => openEdit(item)} style={s.iconBtn}>
                                                <Ionicons name="pencil-outline" size={15} color={Colors.electricBlue} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={async () => { await toggleRecurringItem(item.id, !item.is_active); load(); }} style={s.iconBtn}>
                                                <Ionicons name={item.is_active ? 'pause-circle-outline' : 'play-circle-outline'} size={15} color={item.is_active ? Colors.textTertiary : Colors.cyberGreen} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => handleDelete(item)} style={s.iconBtn}>
                                                <Ionicons name="trash-outline" size={15} color={Colors.neonPink} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )
                )}

                {/* ── Planner tab ── */}
                {tab === 'planner' && (() => {
                    const timeline = buildPlannerTimeline();
                    const monthLabel = format(new Date(), 'MMMM yyyy');
                    let runningBalance = 0;

                    if (timeline.length === 0) {
                        return (
                            <View style={s.empty}>
                                <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
                                <NeonText variant="body" color={Colors.textMuted} align="center">
                                    No recurring events this month
                                </NeonText>
                                <NeonText variant="caption" color={Colors.textMuted} align="center">
                                    Add income/expense items to see them here,{'\n'}or add a one-time future expense.
                                </NeonText>
                            </View>
                        );
                    }

                    return (
                        <View>
                            <View style={s.plannerHeader}>
                                <NeonText variant="body" color={Colors.textTertiary}>{monthLabel} — Cash Flow</NeonText>
                                <NeonText variant="caption" color={Colors.textMuted}>Running balance</NeonText>
                            </View>

                            {timeline.map((event, idx) => {
                                const isIncome = event.type === 'income';
                                runningBalance += isIncome ? event.amount : -event.amount;
                                const color = isIncome ? Colors.cyberGreen : Colors.neonPink;
                                const sign = isIncome ? '+' : '-';

                                return (
                                    <View key={idx} style={s.planRow}>
                                        {/* Timeline line */}
                                        <View style={s.timelineCol}>
                                            <View style={[s.timelineDot, { backgroundColor: color }]} />
                                            {idx < timeline.length - 1 && <View style={s.timelineLine} />}
                                        </View>

                                        <View style={s.planCard}>
                                            <View style={s.planCardTop}>
                                                <View style={{ flex: 1 }}>
                                                    <NeonText variant="caption" color={Colors.textMuted}>{event.date}</NeonText>
                                                    <NeonText variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>{event.name}</NeonText>
                                                    {event.isOneTime && (
                                                        <NeonText variant="caption" color="#F59E0B">one-time</NeonText>
                                                    )}
                                                </View>
                                                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                                                    <NeonText variant="subtitle" color={color} style={{ fontWeight: '700' }}>
                                                        {sign}{formatCurrency(event.amount)}
                                                    </NeonText>
                                                    <NeonText variant="caption" color={runningBalance >= 0 ? Colors.cyberGreen : Colors.neonPink}>
                                                        bal: {runningBalance >= 0 ? '' : '-'}{formatCurrency(Math.abs(runningBalance))}
                                                    </NeonText>
                                                </View>
                                            </View>
                                            {event.isOneTime && event.id && (
                                                <TouchableOpacity style={s.planDeleteBtn} onPress={() => handleDeletePlannerItem(event.id!)}>
                                                    <Ionicons name="close-circle-outline" size={16} color={Colors.textMuted} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}

                            {/* Month summary */}
                            <GlassCard style={[s.summaryCard, { marginTop: Spacing.lg }]}>
                                <NeonText variant="caption" color={Colors.textMuted} style={{ marginBottom: 6, letterSpacing: 1 }}>MONTH END BALANCE</NeonText>
                                <NeonText variant="subtitle" color={runningBalance >= 0 ? Colors.cyberGreen : Colors.neonPink} style={{ fontWeight: '700', fontSize: 22 }}>
                                    {runningBalance >= 0 ? '+' : ''}{formatCurrency(runningBalance)}
                                </NeonText>
                                <NeonText variant="caption" color={Colors.textMuted} style={{ marginTop: 4 }}>
                                    Based on scheduled recurring items{plannerItems.length > 0 ? ` + ${plannerItems.length} one-time` : ''}
                                </NeonText>
                            </GlassCard>
                        </View>
                    );
                })()}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ── Add/Edit Recurring Modal ── */}
            <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setModalOpen(false)} />
                    <ScrollView style={s.sheet} contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl }} showsVerticalScrollIndicator={false}>
                        <View style={s.handle} />
                        <NeonText variant="subtitle" style={{ marginBottom: Spacing.xl }}>
                            {editId ? 'Edit' : 'Add'} Recurring {tab === 'income' ? 'Income' : 'Expense'}
                        </NeonText>

                        {/* Type toggle (only when adding) */}
                        {!editId && tab !== 'planner' && (
                            <View style={[s.tabs, { marginBottom: Spacing.lg }]}>
                                {(['income', 'expense'] as TransactionType[]).map(t => (
                                    <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t as MainTab)}>
                                        {tab === t && (
                                            <LinearGradient
                                                colors={t === 'income' ? [Colors.cyberGreen, Colors.cyberGreenDark] as [string, string] : [Colors.neonPink, Colors.neonPinkDark] as [string, string]}
                                                style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                            />
                                        )}
                                        <NeonText variant="caption" color={tab === t ? '#FFF' : Colors.textTertiary} style={{ fontWeight: tab === t ? '700' : '400' }}>
                                            {t === 'income' ? 'Income' : 'Expense'}
                                        </NeonText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <View style={s.fInput}>
                            <NeonText variant="label" color={Colors.textMuted} style={s.fLabel}>NAME</NeonText>
                            <TextInput style={s.input} value={name} onChangeText={setName} placeholder={tab === 'income' ? 'Salary, Freelance…' : 'Netflix, Rent…'} placeholderTextColor={Colors.textMuted} />
                        </View>
                        <View style={s.fInput}>
                            <NeonText variant="label" color={Colors.textMuted} style={s.fLabel}>AMOUNT</NeonText>
                            <TextInput style={s.input} value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
                        </View>

                        <NeonText variant="label" color={Colors.textMuted} style={s.fLabel}>FREQUENCY</NeonText>
                        <View style={s.chipRow}>
                            {FREQ_OPTIONS.map(o => (
                                <TouchableOpacity key={o.value}
                                    style={[s.chip, frequency === o.value && { backgroundColor: `${accentColor}22`, borderColor: accentColor }]}
                                    onPress={() => setFrequency(o.value)}
                                >
                                    <NeonText variant="caption" color={frequency === o.value ? accentColor : Colors.textTertiary}>{o.label}</NeonText>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {['weekly', 'biweekly'].includes(frequency) && (
                            <>
                                <NeonText variant="label" color={Colors.textMuted} style={s.fLabel}>DAY OF WEEK</NeonText>
                                <View style={s.chipRow}>
                                    {DAYS.map(d => (
                                        <TouchableOpacity key={d}
                                            style={[s.chip, dayOfWeek === d && { backgroundColor: `${accentColor}22`, borderColor: accentColor }]}
                                            onPress={() => setDayOfWeek(d)}
                                        >
                                            <NeonText variant="caption" color={dayOfWeek === d ? accentColor : Colors.textTertiary}>{getDayOfWeekName(d).slice(0, 3)}</NeonText>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}

                        {frequency === 'monthly' && (
                            <>
                                <NeonText variant="label" color={Colors.textMuted} style={s.fLabel}>DAY OF MONTH</NeonText>
                                {/* Day picker chips: 1–28 + Last */}
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
                                    <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                                        {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                                            <TouchableOpacity key={d}
                                                style={[s.dayChip, parseInt(dayOfMonthStr) === d && { backgroundColor: `${accentColor}22`, borderColor: accentColor }]}
                                                onPress={() => setDayOfMonthStr(String(d))}
                                            >
                                                <NeonText variant="caption" color={parseInt(dayOfMonthStr) === d ? accentColor : Colors.textTertiary}>{d}</NeonText>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </>
                        )}

                        {frequency === 'custom' && (
                            <View style={s.fInput}>
                                <NeonText variant="label" color={Colors.textMuted} style={s.fLabel}>INTERVAL (DAYS)</NeonText>
                                <TextInput style={s.input} value={intervalDays} onChangeText={setIntervalDays} keyboardType="number-pad" placeholderTextColor={Colors.textMuted} />
                            </View>
                        )}

                        <NeonText variant="label" color={Colors.textMuted} style={s.fLabel}>CATEGORY</NeonText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
                            <View style={s.chipRow}>
                                {categories.slice(0, 14).map(c => (
                                    <TouchableOpacity key={c.id}
                                        style={[s.catChip, selectedCat?.id === c.id && { backgroundColor: `${c.color}22`, borderColor: c.color }]}
                                        onPress={() => setSelectedCat(c)}
                                    >
                                        <CategoryIcon icon={c.icon} color={c.color} size={24} />
                                        <NeonText variant="caption" color={selectedCat?.id === c.id ? c.color : Colors.textTertiary} numberOfLines={1} style={{ fontSize: 9 }}>{c.name}</NeonText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <TouchableOpacity onPress={handleSave} activeOpacity={0.85} style={s.saveBtn}>
                            <LinearGradient
                                colors={accentColor === Colors.cyberGreen
                                    ? [Colors.cyberGreen, Colors.cyberGreenDark] as [string, string]
                                    : [Colors.neonPink, Colors.neonPinkDark] as [string, string]
                                }
                                style={s.saveBtnGrad}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            >
                                <NeonText variant="body" color="#FFF" style={{ fontWeight: '700' }}>
                                    {editId ? 'Update' : 'Save'}
                                </NeonText>
                            </LinearGradient>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>

            {/* ── Add One-Time Planner Expense Modal ── */}
            <Modal visible={plannerModal} transparent animationType="slide" onRequestClose={() => setPlannerModal(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setPlannerModal(false)} />
                    <View style={s.sheet}>
                        <View style={s.handle} />
                        <NeonText variant="subtitle" style={{ marginBottom: Spacing.xl }}>Add Future Expense</NeonText>
                        <NeonText variant="caption" color={Colors.textMuted} style={{ marginBottom: Spacing.lg }}>
                            This appears in your monthly planner to adjust the running balance. It won't auto-record or become recurring.
                        </NeonText>

                        <View style={s.fInput}>
                            <NeonText variant="label" color={Colors.textMuted} style={s.fLabel}>DESCRIPTION</NeonText>
                            <TextInput style={s.input} value={pName} onChangeText={setPName} placeholder="Rent, trip, repair…" placeholderTextColor={Colors.textMuted} />
                        </View>
                        <View style={s.fInput}>
                            <NeonText variant="label" color={Colors.textMuted} style={s.fLabel}>AMOUNT</NeonText>
                            <TextInput style={s.input} value={pAmount} onChangeText={setPAmount} placeholder="0.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
                        </View>
                        <View style={s.fInput}>
                            <NeonText variant="label" color={Colors.textMuted} style={s.fLabel}>DATE (YYYY-MM-DD)</NeonText>
                            <TextInput style={s.input} value={pDate} onChangeText={setPDate} placeholder={toISODateString(new Date())} placeholderTextColor={Colors.textMuted} keyboardType="numbers-and-punctuation" />
                        </View>

                        <NeonText variant="label" color={Colors.textMuted} style={s.fLabel}>CATEGORY (optional)</NeonText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
                            <View style={s.chipRow}>
                                <TouchableOpacity
                                    style={[s.catChip, pCat === null && { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: Colors.textTertiary }]}
                                    onPress={() => setPCat(null)}
                                >
                                    <Ionicons name="close-circle-outline" size={24} color={Colors.textMuted} />
                                    <NeonText variant="caption" color={Colors.textMuted} style={{ fontSize: 9 }}>None</NeonText>
                                </TouchableOpacity>
                                {categories.slice(0, 12).map(c => (
                                    <TouchableOpacity key={c.id}
                                        style={[s.catChip, pCat?.id === c.id && { backgroundColor: `${c.color}22`, borderColor: c.color }]}
                                        onPress={() => setPCat(c)}
                                    >
                                        <CategoryIcon icon={c.icon} color={c.color} size={24} />
                                        <NeonText variant="caption" color={pCat?.id === c.id ? c.color : Colors.textTertiary} numberOfLines={1} style={{ fontSize: 9 }}>{c.name}</NeonText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <TouchableOpacity onPress={handleAddPlannerExpense} activeOpacity={0.85} style={s.saveBtn}>
                            <LinearGradient
                                colors={['#F59E0B', '#D97706'] as [string, string]}
                                style={s.saveBtnGrad}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            >
                                <NeonText variant="body" color="#FFF" style={{ fontWeight: '700' }}>Add to Planner</NeonText>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'android' ? 48 : 56 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
    addBtn: {},
    addBtnGrad: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    summaryCard: { marginBottom: Spacing.lg },
    summaryRow: { flexDirection: 'row', alignItems: 'center' },
    sumItem: { flex: 1, alignItems: 'center', gap: 4 },
    sumDiv: { width: 1, height: 40, backgroundColor: Colors.border },
    tabs: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.lg },
    tab: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 5, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
        borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    },
    tabActive: { borderColor: 'transparent' },
    empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
    emptyBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
    itemCard: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg,
        borderWidth: 1, borderColor: Colors.border,
        padding: Spacing.md, marginBottom: Spacing.sm, overflow: 'hidden',
    },
    itemInactive: { opacity: 0.48 },
    strip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
    itemBody: { flex: 1, gap: 4 },
    itemTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    itemMetaRow: { flexDirection: 'row', flexWrap: 'wrap' },
    itemActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
    actionChip: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm, borderWidth: 1 },
    iconBtn: { padding: 4 },
    // planner
    plannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    planRow: { flexDirection: 'row', marginBottom: Spacing.sm },
    timelineCol: { width: 24, alignItems: 'center', marginRight: Spacing.sm, paddingTop: 6 },
    timelineDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
    timelineLine: { flex: 1, width: 1, backgroundColor: Colors.border, minHeight: 20 },
    planCard: {
        flex: 1, backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.md,
        borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
    },
    planCardTop: { flexDirection: 'row', gap: Spacing.sm },
    planDeleteBtn: { position: 'absolute', top: 8, right: 8 },
    // modals
    overlay: { flex: 1, justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: '#141414', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.borderLight,
        maxHeight: '90%',
    },
    handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginBottom: Spacing.xl },
    fInput: { marginBottom: Spacing.md },
    fLabel: { marginBottom: 6, letterSpacing: 0.8 },
    input: {
        backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: Colors.border,
        borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
        color: Colors.textPrimary, fontSize: FontSize.md,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.lg },
    chip: {
        paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border,
    },
    dayChip: {
        width: 36, height: 36, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: Colors.border,
    },
    catChip: {
        alignItems: 'center', gap: 3, padding: Spacing.sm,
        borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: 'transparent', width: 60,
    },
    saveBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
    saveBtnGrad: { paddingVertical: Spacing.md + 2, alignItems: 'center' },
});
