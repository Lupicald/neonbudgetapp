import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, NeonText, NeonButton, GlowInput, ProgressBar, CategoryIcon } from '../components';
import { Colors, Spacing, BorderRadius } from '../theme';
import { getBudgets, addBudget, deleteBudget } from '../database/budgetService';
import { getCategories } from '../database/categoryService';
import { Budget, Category } from '../types';
import { formatCurrency, getMonthKey } from '../utils';

export const BudgetsScreen: React.FC = () => {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedCat, setSelectedCat] = useState<Category | null>(null);
    const [limitAmount, setLimitAmount] = useState('');

    const loadData = useCallback(async () => {
        const [b, c] = await Promise.all([getBudgets(), getCategories()]);
        setBudgets(b);
        setCategories(c);
    }, []);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    const handleSave = async () => {
        if (!selectedCat || !parseFloat(limitAmount)) {
            Alert.alert('Error', 'Please select a category and enter a limit');
            return;
        }
        await addBudget(selectedCat.id, parseFloat(limitAmount));
        setShowForm(false);
        setLimitAmount('');
        loadData();
    };

    const handleDelete = (b: Budget) => {
        Alert.alert('Delete Budget', `Delete "${b.category_name}" budget?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await deleteBudget(b.id); loadData(); } },
        ]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <NeonText variant="title" style={{ paddingTop: Spacing.xxl }}>Budgets</NeonText>
                <TouchableOpacity onPress={() => setShowForm(!showForm)} style={{ paddingTop: Spacing.xxl }}>
                    <Ionicons name={showForm ? 'close' : 'add-circle'} size={28} color={Colors.electricBlue} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={[{ isForm: true }, ...budgets.map(b => ({ ...b, isForm: false }))]}
                keyExtractor={(_, i) => String(i)}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    !showForm ? (
                        <View style={styles.empty}>
                            <Ionicons name="pie-chart-outline" size={64} color={Colors.textMuted} />
                            <NeonText variant="subtitle" color={Colors.textMuted}>No budgets set</NeonText>
                        </View>
                    ) : null
                }
                renderItem={({ item }: any) => {
                    if (item.isForm && showForm) {
                        return (
                            <GlassCard style={styles.form} glowColor={Colors.electricBlue}>
                                <NeonText variant="label" style={styles.label}>CATEGORY</NeonText>
                                <View style={styles.catGrid}>
                                    {categories.filter(c => !budgets.some(b => b.category_id === c.id)).map(c => (
                                        <TouchableOpacity key={c.id}
                                            style={[styles.catBtn, selectedCat?.id === c.id && { backgroundColor: `${c.color}20`, borderColor: c.color }]}
                                            onPress={() => setSelectedCat(c)}>
                                            <CategoryIcon icon={c.icon} color={c.color} size={24} />
                                            <NeonText variant="caption" numberOfLines={1}>{c.name}</NeonText>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <GlowInput label="Monthly Limit" placeholder="0.00" value={limitAmount} onChangeText={setLimitAmount} keyboardType="decimal-pad" />
                                <NeonButton title="Set Budget" onPress={handleSave} variant="secondary" fullWidth />
                            </GlassCard>
                        );
                    }
                    if (item.isForm) return null;

                    const b = item as Budget;
                    const spent = b.spent || 0;
                    const progress = b.monthly_limit > 0 ? spent / b.monthly_limit : 0;
                    const isWarning = progress > 0.7 && progress <= 0.9;
                    const isDanger = progress > 0.9;

                    return (
                        <TouchableOpacity onLongPress={() => handleDelete(b)}>
                            <GlassCard style={styles.budgetCard} glowColor={isDanger ? Colors.neonPink : isWarning ? Colors.neonYellow : undefined}>
                                <View style={styles.budgetHeader}>
                                    <View style={styles.budgetInfo}>
                                        <CategoryIcon icon={b.category_icon || 'ellipse'} color={b.category_color || Colors.electricBlue} size={36} />
                                        <View>
                                            <NeonText variant="body">{b.category_name}</NeonText>
                                            <NeonText variant="caption" color={Colors.textTertiary}>{getMonthKey()}</NeonText>
                                        </View>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <NeonText variant="subtitle" color={isDanger ? Colors.neonPink : isWarning ? Colors.neonYellow : Colors.textPrimary}>
                                            {formatCurrency(spent)}
                                        </NeonText>
                                        <NeonText variant="caption" color={Colors.textTertiary}>of {formatCurrency(b.monthly_limit)}</NeonText>
                                    </View>
                                </View>
                                <ProgressBar
                                    progress={progress}
                                    height={8}
                                    warning={isWarning}
                                    danger={isDanger}
                                    style={{ marginTop: Spacing.md }}
                                    showPercentage
                                />
                                {isDanger && (
                                    <View style={styles.warningBanner}>
                                        <Ionicons name="warning" size={14} color={Colors.neonPink} />
                                        <NeonText variant="caption" color={Colors.neonPink}>Over budget!</NeonText>
                                    </View>
                                )}
                            </GlassCard>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
    listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
    empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: Spacing.md },
    form: { marginBottom: Spacing.lg },
    label: { marginBottom: Spacing.sm, color: Colors.textSecondary },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
    catBtn: { alignItems: 'center', gap: 4, padding: Spacing.sm, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: 'transparent', width: 72 },
    budgetCard: { marginBottom: Spacing.md },
    budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    budgetInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    warningBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.sm, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm, backgroundColor: `${Colors.neonPink}15`, borderRadius: BorderRadius.sm },
});
