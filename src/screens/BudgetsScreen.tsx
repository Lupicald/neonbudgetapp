import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, NeonText, NeonButton, GlowInput, ProgressBar, CategoryIcon } from '../components';
import { Colors, Spacing, BorderRadius } from '../theme';
import { getBudgets, addBudget, updateBudget, deleteBudget } from '../database/budgetService';
import { getCategories } from '../database/categoryService';
import { Budget, Category } from '../types';
import { formatCurrency, getMonthKey } from '../utils';

export const BudgetsScreen: React.FC = () => {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedCat, setSelectedCat] = useState<Category | null>(null);
    const [limitAmount, setLimitAmount] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);

    const loadData = useCallback(async () => {
        const [b, c] = await Promise.all([getBudgets(), getCategories()]);
        setBudgets(b);
        // Inject "All Expenses" category at the beginning
        const globalCat: Category = { id: -1, name: 'All Expenses', icon: 'apps-outline', color: Colors.electricBlue, is_default: 1 };
        setCategories([globalCat, ...c]);
    }, []);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    const handleSave = async () => {
        const numLimit = parseFloat(limitAmount.replace(/,/g, ''));
        if (!selectedCat || !numLimit || numLimit <= 0) {
            Alert.alert('Error', 'Please select a category and enter a valid limit');
            return;
        }

        if (editingId) {
            await updateBudget(editingId, numLimit);
        } else {
            // Check if budget already exists for this category
            const exists = budgets.find(b => b.category_id === selectedCat.id);
            if (exists) {
                Alert.alert('Error', 'A budget for this category already exists');
                return;
            }
            await addBudget(selectedCat.id, numLimit);
        }

        setShowForm(false);
        resetForm();
        loadData();
    };

    const resetForm = () => {
        setEditingId(null);
        setLimitAmount('');
        setSelectedCat(null);
    };

    const handleEdit = (b: Budget) => {
        setEditingId(b.id);
        const cat = categories.find(c => c.id === b.category_id) || { id: b.category_id, name: b.category_name!, icon: b.category_icon!, color: b.category_color!, is_default: 1 };
        setSelectedCat(cat);
        setLimitAmount(b.monthly_limit.toString());
        setShowForm(true);
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
                <TouchableOpacity onPress={() => {
                    if (showForm) {
                        setShowForm(false);
                        resetForm();
                    } else {
                        setShowForm(true);
                    }
                }} style={{ paddingTop: Spacing.xxl }}>
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
                                    {categories.filter(c => c.id === selectedCat?.id || !budgets.some(b => b.category_id === c.id)).map(c => (
                                        <TouchableOpacity key={c.id}
                                            style={[styles.catBtn, selectedCat?.id === c.id && { backgroundColor: `${c.color}20`, borderColor: c.color }]}
                                            onPress={() => setSelectedCat(c)}
                                            disabled={!!editingId}>
                                            <CategoryIcon icon={c.icon} color={c.color} size={24} />
                                            <NeonText variant="caption" numberOfLines={1}>{c.name}</NeonText>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <GlowInput label="Monthly Limit" placeholder="0.00" value={limitAmount} onChangeText={setLimitAmount} keyboardType="numeric" />
                                <NeonButton title={editingId ? "Update Budget" : "Set Budget"} onPress={handleSave} variant="secondary" fullWidth />
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
                        <View key={b.id}>
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
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md, marginTop: Spacing.md }}>
                                    <TouchableOpacity onPress={() => handleEdit(b)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Ionicons name="pencil" size={14} color={Colors.electricBlue} />
                                        <NeonText variant="caption" color={Colors.electricBlue}>Edit</NeonText>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(b)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Ionicons name="trash" size={14} color={Colors.danger} />
                                        <NeonText variant="caption" color={Colors.danger}>Delete</NeonText>
                                    </TouchableOpacity>
                                </View>
                            </GlassCard>
                        </View>
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
