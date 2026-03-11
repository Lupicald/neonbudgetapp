import React, { useState, useCallback } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GlassCard, NeonText, CategoryIcon } from '../components';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../theme';
import {
    getPlannedIncomes,
    getAllPlannedExpenses,
    addPlannedIncome,
    deletePlannedIncome,
    addPlannedExpense,
    deletePlannedExpense,
    togglePlannedExpenseComplete,
} from '../database/plannedBudgetService';
import { getCategories } from '../database/categoryService';
import { PlannedIncome, PlannedExpense, Category } from '../types';
import { formatCurrency, formatDate } from '../utils';

type ModalMode = 'income' | 'expense' | null;

export const PlannedBudgetScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [incomes, setIncomes] = useState<PlannedIncome[]>([]);
    const [expenses, setExpenses] = useState<PlannedExpense[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [modalMode, setModalMode] = useState<ModalMode>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [formNote, setFormNote] = useState('');
    const [formCategoryId, setFormCategoryId] = useState<number | null>(null);
    const [formLinkedIncomeId, setFormLinkedIncomeId] = useState<number | null>(null);

    const loadData = useCallback(async () => {
        const [inc, exp, cats] = await Promise.all([
            getPlannedIncomes(),
            getAllPlannedExpenses(),
            getCategories(),
        ]);
        setIncomes(inc);
        setExpenses(exp);
        setCategories(cats);
    }, []);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    const resetForm = () => {
        setFormName('');
        setFormAmount('');
        setFormDate(new Date().toISOString().split('T')[0]);
        setFormNote('');
        setFormCategoryId(null);
        setFormLinkedIncomeId(null);
    };

    const openModal = (mode: ModalMode) => {
        resetForm();
        setModalMode(mode);
    };

    const closeModal = () => setModalMode(null);

    const handleSave = async () => {
        const amount = parseFloat(formAmount);
        if (!formName.trim() || isNaN(amount) || amount <= 0) {
            Alert.alert('Error', 'Please enter a name and a valid amount');
            return;
        }
        try {
            if (modalMode === 'income') {
                await addPlannedIncome(formName.trim(), amount, formDate, formNote.trim());
            } else {
                await addPlannedExpense(formName.trim(), amount, formDate, formCategoryId, formLinkedIncomeId, formNote.trim());
            }
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            closeModal();
            loadData();
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to save');
        }
    };

    const handleDeleteIncome = (item: PlannedIncome) => {
        Alert.alert('Delete Income Plan', `Delete "${item.name}"?\nLinked expenses will be unlinked.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    await deletePlannedIncome(item.id);
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    loadData();
                }
            },
        ]);
    };

    const handleDeleteExpense = (item: PlannedExpense) => {
        Alert.alert('Delete Planned Expense', `Delete "${item.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    await deletePlannedExpense(item.id);
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    loadData();
                }
            },
        ]);
    };

    const handleToggleExpense = async (item: PlannedExpense) => {
        await togglePlannedExpenseComplete(item.id, !item.is_completed);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        loadData();
    };

    // Build timeline: merge incomes and expenses sorted by date
    const totalPlannedIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const totalPlannedExpense = expenses.reduce((s, e) => s + e.amount, 0);
    const remainingBalance = totalPlannedIncome - totalPlannedExpense;
    const completedExpenses = expenses.filter(e => e.is_completed).reduce((s, e) => s + e.amount, 0);

    // Group all events by date for the timeline
    type TimelineEvent =
        | { kind: 'income'; data: PlannedIncome }
        | { kind: 'expense'; data: PlannedExpense };

    const allEvents: TimelineEvent[] = [
        ...incomes.map(d => ({ kind: 'income' as const, data: d })),
        ...expenses.map(d => ({ kind: 'expense' as const, data: d })),
    ].sort((a, b) => {
        const dateA = a.kind === 'income' ? a.data.expected_date : a.data.planned_date;
        const dateB = b.kind === 'income' ? b.data.expected_date : b.data.planned_date;
        return dateA.localeCompare(dateB);
    });

    // Group by date
    const grouped: Record<string, TimelineEvent[]> = {};
    for (const ev of allEvents) {
        const date = ev.kind === 'income' ? ev.data.expected_date : ev.data.planned_date;
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(ev);
    }
    const sortedDates = Object.keys(grouped).sort();

    // Running balance calculation
    let runningBalance = 0;
    const balanceByDate: Record<string, number> = {};
    for (const date of sortedDates) {
        for (const ev of grouped[date]) {
            if (ev.kind === 'income') runningBalance += ev.data.amount;
            else runningBalance -= ev.data.amount;
        }
        balanceByDate[date] = runningBalance;
    }

    return (
        <View style={styles.container}>
            {/* Ambient glow */}
            <View style={styles.glow1} pointerEvents="none" />
            <View style={styles.glow2} pointerEvents="none" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>
                    <View>
                        <NeonText variant="caption" color={Colors.textTertiary}>PLANNING</NeonText>
                        <NeonText variant="title">Income Planner</NeonText>
                    </View>
                </View>

                {/* Summary Card */}
                <GlassCard hero style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <NeonText variant="label" color={Colors.textTertiary}>PLANNED INCOME</NeonText>
                            <NeonText variant="subtitle" color={Colors.cyberGreen} style={{ fontWeight: '700', marginTop: 2, fontSize: 22 }}>
                                +{formatCurrency(totalPlannedIncome)}
                            </NeonText>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <NeonText variant="label" color={Colors.textTertiary}>PLANNED EXPENSES</NeonText>
                            <NeonText variant="subtitle" color={Colors.neonPink} style={{ fontWeight: '700', marginTop: 2, fontSize: 22 }}>
                                -{formatCurrency(totalPlannedExpense)}
                            </NeonText>
                        </View>
                    </View>

                    <View style={styles.remainingRow}>
                        <NeonText variant="label" color={Colors.textTertiary}>REMAINING BALANCE</NeonText>
                        <NeonText
                            variant="subtitle"
                            color={remainingBalance >= 0 ? Colors.cyberGreen : Colors.neonPink}
                            style={{ fontWeight: '800', fontSize: 26 }}
                            glow
                            glowColor={remainingBalance >= 0 ? Colors.glowGreen : Colors.glowPink}
                        >
                            {formatCurrency(remainingBalance)}
                        </NeonText>
                    </View>

                    {totalPlannedExpense > 0 && (
                        <View style={styles.progressRow}>
                            <View style={styles.progressTrack}>
                                <LinearGradient
                                    colors={[Colors.cyberGreen, Colors.electricBlue] as [string, string]}
                                    style={[styles.progressFill, {
                                        width: `${Math.min(100, Math.round((completedExpenses / totalPlannedExpense) * 100))}%`
                                    }]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                />
                            </View>
                            <NeonText variant="caption" color={Colors.textTertiary} style={{ marginTop: 4 }}>
                                {Math.round((completedExpenses / totalPlannedExpense) * 100)}% completed
                                ({formatCurrency(completedExpenses)} of {formatCurrency(totalPlannedExpense)})
                            </NeonText>
                        </View>
                    )}
                </GlassCard>

                {/* Action buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openModal('income')} activeOpacity={0.8}>
                        <LinearGradient
                            colors={[Colors.cyberGreen, Colors.electricBlue] as [string, string]}
                            style={styles.actionBtnGrad}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="arrow-down-circle-outline" size={18} color="#FFF" />
                            <NeonText variant="body" color="#FFF" style={{ fontWeight: '700' }}>+ Income</NeonText>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openModal('expense')} activeOpacity={0.8}>
                        <LinearGradient
                            colors={[Colors.neonPink, Colors.neonOrange] as [string, string]}
                            style={styles.actionBtnGrad}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="arrow-up-circle-outline" size={18} color="#FFF" />
                            <NeonText variant="body" color="#FFF" style={{ fontWeight: '700' }}>+ Expense</NeonText>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Timeline */}
                {sortedDates.length === 0 ? (
                    <View style={styles.empty}>
                        <Ionicons name="calendar-outline" size={56} color={Colors.textMuted} />
                        <NeonText variant="subtitle" color={Colors.textMuted} align="center">
                            No plan yet
                        </NeonText>
                        <NeonText variant="caption" color={Colors.textMuted} align="center">
                            Add planned incomes and expenses{'\n'}to see your month at a glance
                        </NeonText>
                    </View>
                ) : (
                    <View style={styles.timeline}>
                        <NeonText variant="subtitle" style={{ marginBottom: Spacing.md }}>Month Timeline</NeonText>
                        {sortedDates.map((date) => (
                            <View key={date} style={styles.dateGroup}>
                                {/* Date header with running balance */}
                                <View style={styles.dateHeader}>
                                    <View style={styles.dateDot} />
                                    <NeonText variant="label" color={Colors.textTertiary} style={styles.dateText}>
                                        {formatDate(date)}
                                    </NeonText>
                                    <NeonText
                                        variant="caption"
                                        color={balanceByDate[date] >= 0 ? Colors.cyberGreen : Colors.neonPink}
                                        style={styles.runningBalance}
                                    >
                                        {formatCurrency(balanceByDate[date])}
                                    </NeonText>
                                </View>

                                {/* Events for this date */}
                                <View style={styles.eventsContainer}>
                                    {grouped[date].map((ev, idx) => {
                                        if (ev.kind === 'income') {
                                            const item = ev.data;
                                            return (
                                                <TouchableOpacity
                                                    key={`inc-${item.id}`}
                                                    onLongPress={() => handleDeleteIncome(item)}
                                                    activeOpacity={0.85}
                                                >
                                                    <View style={[styles.eventCard, styles.incomeCard]}>
                                                        <LinearGradient
                                                            colors={['rgba(48,209,88,0.15)', 'rgba(90,200,250,0.08)'] as [string, string]}
                                                            style={StyleSheet.absoluteFill}
                                                        />
                                                        <View style={[styles.eventStripe, { backgroundColor: Colors.cyberGreen }]} />
                                                        <View style={styles.eventIconWrap}>
                                                            <LinearGradient
                                                                colors={[Colors.cyberGreen, Colors.electricBlue] as [string, string]}
                                                                style={styles.eventIconBg}
                                                            >
                                                                <Ionicons name="arrow-down-circle" size={16} color="#FFF" />
                                                            </LinearGradient>
                                                        </View>
                                                        <View style={styles.eventInfo}>
                                                            <NeonText variant="body" style={{ fontWeight: '600' }}>{item.name}</NeonText>
                                                            {item.note ? <NeonText variant="caption" color={Colors.textMuted}>{item.note}</NeonText> : null}
                                                        </View>
                                                        <NeonText variant="subtitle" color={Colors.cyberGreen} style={{ fontWeight: '700' }}>
                                                            +{formatCurrency(item.amount)}
                                                        </NeonText>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        } else {
                                            const item = ev.data;
                                            return (
                                                <TouchableOpacity
                                                    key={`exp-${item.id}`}
                                                    onPress={() => handleToggleExpense(item)}
                                                    onLongPress={() => handleDeleteExpense(item)}
                                                    activeOpacity={0.85}
                                                >
                                                    <View style={[styles.eventCard, styles.expenseCard, item.is_completed && styles.completedCard]}>
                                                        {!item.is_completed && (
                                                            <LinearGradient
                                                                colors={['rgba(255,55,95,0.12)', 'rgba(255,159,10,0.06)'] as [string, string]}
                                                                style={StyleSheet.absoluteFill}
                                                            />
                                                        )}
                                                        <View style={[styles.eventStripe, { backgroundColor: item.is_completed ? Colors.textMuted : Colors.neonPink }]} />
                                                        <View style={styles.eventIconWrap}>
                                                            {item.is_completed ? (
                                                                <View style={[styles.eventIconBg, { backgroundColor: Colors.cyberGreen }]}>
                                                                    <Ionicons name="checkmark" size={16} color="#FFF" />
                                                                </View>
                                                            ) : item.category_icon ? (
                                                                <CategoryIcon
                                                                    icon={item.category_icon}
                                                                    color={item.category_color || Colors.neonPink}
                                                                    size={32}
                                                                />
                                                            ) : (
                                                                <LinearGradient
                                                                    colors={[Colors.neonPink, Colors.neonOrange] as [string, string]}
                                                                    style={styles.eventIconBg}
                                                                >
                                                                    <Ionicons name="arrow-up-circle" size={16} color="#FFF" />
                                                                </LinearGradient>
                                                            )}
                                                        </View>
                                                        <View style={styles.eventInfo}>
                                                            <NeonText
                                                                variant="body"
                                                                color={item.is_completed ? Colors.textTertiary : Colors.textPrimary}
                                                                style={{ fontWeight: '600', textDecorationLine: item.is_completed ? 'line-through' : 'none' }}
                                                            >
                                                                {item.name}
                                                            </NeonText>
                                                            <NeonText variant="caption" color={Colors.textMuted}>
                                                                {item.category_name || 'No category'}
                                                                {item.note ? ` · ${item.note}` : ''}
                                                            </NeonText>
                                                        </View>
                                                        <NeonText
                                                            variant="subtitle"
                                                            color={item.is_completed ? Colors.textTertiary : Colors.neonPink}
                                                            style={{ fontWeight: '700' }}
                                                        >
                                                            -{formatCurrency(item.amount)}
                                                        </NeonText>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        }
                                    })}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                <NeonText variant="caption" color={Colors.textMuted} align="center" style={{ marginTop: Spacing.md, marginBottom: 8 }}>
                    Tap expense to mark done · Long-press to delete
                </NeonText>
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Add Modal */}
            <Modal
                visible={modalMode !== null}
                transparent
                animationType="slide"
                onRequestClose={closeModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalOverlay}
                >
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeModal} />
                    <View style={styles.modalSheet}>
                        {/* Handle */}
                        <View style={styles.handle} />

                        <NeonText variant="subtitle" style={{ marginBottom: Spacing.xl }}>
                            {modalMode === 'income' ? 'Plan Income' : 'Plan Expense'}
                        </NeonText>

                        {/* Name */}
                        <View style={styles.inputWrap}>
                            <NeonText variant="caption" color={Colors.textTertiary} style={styles.inputLabel}>NAME</NeonText>
                            <TextInput
                                style={styles.input}
                                value={formName}
                                onChangeText={setFormName}
                                placeholder={modalMode === 'income' ? 'e.g. Salary, Freelance payment' : 'e.g. Car detail, Rent'}
                                placeholderTextColor={Colors.textMuted}
                            />
                        </View>

                        {/* Amount */}
                        <View style={styles.inputWrap}>
                            <NeonText variant="caption" color={Colors.textTertiary} style={styles.inputLabel}>AMOUNT</NeonText>
                            <TextInput
                                style={styles.input}
                                value={formAmount}
                                onChangeText={setFormAmount}
                                placeholder="0.00"
                                placeholderTextColor={Colors.textMuted}
                                keyboardType="decimal-pad"
                            />
                        </View>

                        {/* Date */}
                        <View style={styles.inputWrap}>
                            <NeonText variant="caption" color={Colors.textTertiary} style={styles.inputLabel}>DATE (YYYY-MM-DD)</NeonText>
                            <TextInput
                                style={styles.input}
                                value={formDate}
                                onChangeText={setFormDate}
                                placeholder="2026-03-12"
                                placeholderTextColor={Colors.textMuted}
                            />
                        </View>

                        {/* Category (expenses only) */}
                        {modalMode === 'expense' && (
                            <View style={styles.inputWrap}>
                                <NeonText variant="caption" color={Colors.textTertiary} style={styles.inputLabel}>CATEGORY</NeonText>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                                    <View style={styles.chipRow}>
                                        <TouchableOpacity
                                            style={[styles.chip, formCategoryId === null && styles.chipActive]}
                                            onPress={() => setFormCategoryId(null)}
                                        >
                                            <NeonText variant="caption" color={formCategoryId === null ? Colors.electricBlue : Colors.textTertiary}>None</NeonText>
                                        </TouchableOpacity>
                                        {categories.map(c => (
                                            <TouchableOpacity
                                                key={c.id}
                                                style={[styles.chip, formCategoryId === c.id && { backgroundColor: `${c.color}25`, borderColor: c.color }]}
                                                onPress={() => setFormCategoryId(c.id)}
                                            >
                                                <NeonText variant="caption" color={formCategoryId === c.id ? c.color : Colors.textTertiary}>{c.name}</NeonText>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                        )}

                        {/* Link to income (expenses only) */}
                        {modalMode === 'expense' && incomes.length > 0 && (
                            <View style={styles.inputWrap}>
                                <NeonText variant="caption" color={Colors.textTertiary} style={styles.inputLabel}>LINK TO INCOME (OPTIONAL)</NeonText>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={styles.chipRow}>
                                        <TouchableOpacity
                                            style={[styles.chip, formLinkedIncomeId === null && styles.chipActive]}
                                            onPress={() => setFormLinkedIncomeId(null)}
                                        >
                                            <NeonText variant="caption" color={formLinkedIncomeId === null ? Colors.electricBlue : Colors.textTertiary}>None</NeonText>
                                        </TouchableOpacity>
                                        {incomes.map(inc => (
                                            <TouchableOpacity
                                                key={inc.id}
                                                style={[styles.chip, formLinkedIncomeId === inc.id && { backgroundColor: `${Colors.cyberGreen}25`, borderColor: Colors.cyberGreen }]}
                                                onPress={() => setFormLinkedIncomeId(inc.id)}
                                            >
                                                <NeonText variant="caption" color={formLinkedIncomeId === inc.id ? Colors.cyberGreen : Colors.textTertiary}>
                                                    {inc.name} ({formatCurrency(inc.amount)})
                                                </NeonText>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                        )}

                        {/* Note */}
                        <View style={styles.inputWrap}>
                            <NeonText variant="caption" color={Colors.textTertiary} style={styles.inputLabel}>NOTE (OPTIONAL)</NeonText>
                            <TextInput
                                style={styles.input}
                                value={formNote}
                                onChangeText={setFormNote}
                                placeholder="Optional note"
                                placeholderTextColor={Colors.textMuted}
                            />
                        </View>

                        {/* Save button */}
                        <TouchableOpacity onPress={handleSave} activeOpacity={0.85} style={styles.saveBtn}>
                            <LinearGradient
                                colors={modalMode === 'income'
                                    ? [Colors.cyberGreen, Colors.electricBlue] as [string, string]
                                    : [Colors.neonPink, Colors.neonOrange] as [string, string]
                                }
                                style={styles.saveBtnGrad}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <NeonText variant="body" color="#FFF" style={{ fontWeight: '700' }}>
                                    Save {modalMode === 'income' ? 'Income' : 'Expense'}
                                </NeonText>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    glow1: {
        position: 'absolute', width: 280, height: 280, borderRadius: 140,
        backgroundColor: 'rgba(48,209,88,0.06)', top: -60, right: -60,
    },
    glow2: {
        position: 'absolute', width: 240, height: 240, borderRadius: 120,
        backgroundColor: 'rgba(191,90,242,0.05)', top: 200, left: -60,
    },
    scroll: { paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'android' ? 48 : 56 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl, gap: Spacing.md },
    backBtn: { padding: Spacing.xs },
    summaryCard: { marginBottom: Spacing.lg },
    summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
    summaryItem: { flex: 1 },
    summaryDivider: { width: 1, height: 48, backgroundColor: 'rgba(255,255,255,0.10)', marginHorizontal: Spacing.lg },
    remainingRow: { alignItems: 'flex-start', gap: 4 },
    progressRow: { marginTop: Spacing.md },
    progressTrack: {
        height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    progressFill: { height: 6, borderRadius: 3 },
    actionRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
    actionBtn: { flex: 1, borderRadius: BorderRadius.md, overflow: 'hidden' },
    actionBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, gap: Spacing.sm },
    timeline: { marginBottom: Spacing.lg },
    dateGroup: { marginBottom: Spacing.lg },
    dateHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
    dateDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.electricBlue },
    dateText: { flex: 1 },
    runningBalance: { fontWeight: '700' },
    eventsContainer: { marginLeft: 20, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.06)', paddingLeft: Spacing.md, gap: Spacing.sm },
    eventCard: {
        flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        padding: Spacing.md, gap: Spacing.md, overflow: 'hidden',
    },
    incomeCard: { borderColor: 'rgba(48,209,88,0.20)' },
    expenseCard: { borderColor: 'rgba(255,55,95,0.18)' },
    completedCard: { opacity: 0.55, borderColor: 'rgba(255,255,255,0.06)' },
    eventStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
    eventIconWrap: { width: 32, alignItems: 'center' },
    eventIconBg: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    eventInfo: { flex: 1, gap: 2 },
    empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: Spacing.md },
    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: '#16162A',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: Spacing.xl,
        paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.10)',
    },
    handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.20)', alignSelf: 'center', marginBottom: Spacing.xl },
    inputWrap: { marginBottom: Spacing.md },
    inputLabel: { marginBottom: 6 },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
        color: Colors.textPrimary, fontSize: FontSize.md,
    },
    chipRow: { flexDirection: 'row', gap: Spacing.sm },
    chip: {
        paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border,
    },
    chipActive: { backgroundColor: `${Colors.electricBlue}20`, borderColor: Colors.electricBlue },
    saveBtn: { borderRadius: BorderRadius.md, overflow: 'hidden', marginTop: Spacing.sm },
    saveBtnGrad: { paddingVertical: Spacing.md + 2, alignItems: 'center' },
});
