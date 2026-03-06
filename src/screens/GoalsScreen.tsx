import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, NeonText, NeonButton, GlowInput, ProgressBar } from '../components';
import { Colors, Spacing, BorderRadius, CategoryColors } from '../theme';
import { getGoals, addGoal, addToGoal, deleteGoal } from '../database/goalService';
import { Goal } from '../types';
import { formatCurrency } from '../utils';

const GOAL_ICONS = ['trophy', 'car', 'airplane', 'home', 'laptop', 'school', 'heart', 'diamond', 'gift', 'rocket', 'planet', 'star'];

export const GoalsScreen: React.FC = () => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [target, setTarget] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('trophy');
    const [selectedColor, setSelectedColor] = useState(CategoryColors[0]);
    const [addAmountId, setAddAmountId] = useState<number | null>(null);
    const [addAmount, setAddAmount] = useState('');

    const loadData = useCallback(async () => {
        setGoals(await getGoals());
    }, []);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    const handleSave = async () => {
        if (!name.trim() || !parseFloat(target)) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        await addGoal(name.trim(), parseFloat(target), selectedIcon, selectedColor);
        setShowForm(false);
        setName(''); setTarget('');
        loadData();
    };

    const handleAddToGoal = async (id: number) => {
        const amt = parseFloat(addAmount);
        if (!amt || amt <= 0) return;
        await addToGoal(id, amt);
        setAddAmountId(null);
        setAddAmount('');
        loadData();
    };

    const handleDelete = (g: Goal) => {
        Alert.alert('Delete Goal', `Delete "${g.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await deleteGoal(g.id); loadData(); } },
        ]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <NeonText variant="title" style={{ paddingTop: Spacing.xxl }}>Savings Goals</NeonText>
                <TouchableOpacity onPress={() => setShowForm(!showForm)} style={{ paddingTop: Spacing.xxl }}>
                    <Ionicons name={showForm ? 'close' : 'add-circle'} size={28} color={Colors.neonPurple} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={showForm ? [{ isForm: true } as any, ...goals] : goals}
                keyExtractor={(item, i) => item.isForm ? 'form' : String(item.id)}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    !showForm ? (
                        <View style={styles.empty}>
                            <Ionicons name="flag-outline" size={64} color={Colors.textMuted} />
                            <NeonText variant="subtitle" color={Colors.textMuted}>No savings goals</NeonText>
                            <NeonText variant="caption" color={Colors.textMuted}>Set a goal and start saving!</NeonText>
                        </View>
                    ) : null
                }
                renderItem={({ item }: any) => {
                    if (item.isForm) {
                        return (
                            <GlassCard style={styles.form} glowColor={Colors.neonPurple}>
                                <GlowInput label="Goal Name" placeholder="e.g. New Laptop" value={name} onChangeText={setName} glowColor={Colors.neonPurple} />
                                <GlowInput label="Target Amount" placeholder="0.00" value={target} onChangeText={setTarget} keyboardType="decimal-pad" glowColor={Colors.neonPurple} />

                                <NeonText variant="label" style={styles.label}>ICON</NeonText>
                                <View style={styles.iconRow}>
                                    {GOAL_ICONS.map(ic => (
                                        <TouchableOpacity key={ic}
                                            style={[styles.iconBtn, selectedIcon === ic && { backgroundColor: `${selectedColor}30`, borderColor: selectedColor }]}
                                            onPress={() => setSelectedIcon(ic)}>
                                            <Ionicons name={ic as any} size={20} color={selectedIcon === ic ? selectedColor : Colors.textTertiary} />
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <NeonText variant="label" style={styles.label}>COLOR</NeonText>
                                <View style={styles.colorRow}>
                                    {CategoryColors.slice(0, 10).map(c => (
                                        <TouchableOpacity key={c}
                                            style={[styles.colorBtn, { backgroundColor: c }, selectedColor === c && styles.colorBtnSelected]}
                                            onPress={() => setSelectedColor(c)} />
                                    ))}
                                </View>

                                <NeonButton title="Create Goal" onPress={handleSave} variant="primary" fullWidth />
                            </GlassCard>
                        );
                    }

                    const goal = item as Goal;
                    const progress = goal.target_amount > 0 ? goal.saved_amount / goal.target_amount : 0;
                    const isComplete = goal.saved_amount >= goal.target_amount;

                    return (
                        <TouchableOpacity onLongPress={() => handleDelete(goal)}>
                            <GlassCard style={styles.goalCard} glowColor={isComplete ? Colors.cyberGreen : goal.color}>
                                <View style={styles.goalHeader}>
                                    <View style={[styles.goalIcon, { backgroundColor: `${goal.color}20` }]}>
                                        <Ionicons name={goal.icon as any} size={24} color={goal.color} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <NeonText variant="subtitle">{goal.name}</NeonText>
                                        <NeonText variant="caption" color={Colors.textTertiary}>
                                            {formatCurrency(goal.saved_amount)} / {formatCurrency(goal.target_amount)}
                                        </NeonText>
                                    </View>
                                    {isComplete ? (
                                        <Ionicons name="checkmark-circle" size={28} color={Colors.cyberGreen} />
                                    ) : (
                                        <TouchableOpacity onPress={() => setAddAmountId(addAmountId === goal.id ? null : goal.id)}>
                                            <Ionicons name="add-circle" size={28} color={goal.color} />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <ProgressBar
                                    progress={progress}
                                    height={10}
                                    gradientColors={[goal.color, `${goal.color}88`] as [string, string]}
                                    style={{ marginTop: Spacing.md }}
                                    showPercentage
                                />

                                {addAmountId === goal.id && (
                                    <View style={styles.addAmountRow}>
                                        <GlowInput
                                            placeholder="Amount to save"
                                            value={addAmount}
                                            onChangeText={setAddAmount}
                                            keyboardType="decimal-pad"
                                            glowColor={goal.color}
                                            containerStyle={{ flex: 1, marginBottom: 0 }}
                                        />
                                        <NeonButton title="Add" onPress={() => handleAddToGoal(goal.id)} size="sm" />
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
    iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
    iconBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
    colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
    colorBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
    colorBtnSelected: { borderColor: Colors.textPrimary, transform: [{ scale: 1.2 }] },
    goalCard: { marginBottom: Spacing.md },
    goalHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    goalIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    addAmountRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.md },
});
