import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, NeonText, NeonButton, GlowInput, CategoryIcon } from '../components';
import { Colors, Spacing, BorderRadius } from '../theme';
import * as Haptics from 'expo-haptics';
import { getRecurringItems, addRecurringItem, updateRecurringItem, deleteRecurringItem, toggleRecurringItem, recordRecurringPayment } from '../database/recurringService';
import { getCategories } from '../database/categoryService';
import { RecurringItem, Category, RecurringFrequency, TransactionType } from '../types';
import { formatCurrency, getDayOfWeekName, toISODateString } from '../utils';

interface Props { type: TransactionType; }

export const RecurringScreen: React.FC<Props> = ({ type }) => {
    const [items, setItems] = useState<RecurringItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
    const [dayOfWeek, setDayOfWeek] = useState<number>(4); // Thursday
    const [dayOfMonth, setDayOfMonth] = useState<number>(1);
    const [intervalDays, setIntervalDays] = useState('30');
    const [selectedCat, setSelectedCat] = useState<Category | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);

    const loadData = useCallback(async () => {
        const [ri, cats] = await Promise.all([getRecurringItems(type), getCategories()]);
        setItems(ri);
        setCategories(cats);
        if (!selectedCat && cats.length > 0) setSelectedCat(cats[0]);
    }, [type]);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    const handleSave = async () => {
        const numAmount = parseFloat(amount.replace(/,/g, ''));
        if (!name.trim() || !numAmount || !selectedCat) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        if (editingId) {
            await updateRecurringItem(
                editingId, name.trim(), numAmount, selectedCat.id,
                frequency, parseInt(intervalDays) || 30,
                ['weekly', 'biweekly'].includes(frequency) ? dayOfWeek : null,
                frequency === 'monthly' ? dayOfMonth : null,
                toISODateString(new Date())
            );
        } else {
            await addRecurringItem(
                type, name.trim(), numAmount, selectedCat.id,
                frequency, parseInt(intervalDays) || 30,
                ['weekly', 'biweekly'].includes(frequency) ? dayOfWeek : null,
                frequency === 'monthly' ? dayOfMonth : null,
                toISODateString(new Date())
            );
        }

        setShowForm(false);
        resetForm();
        loadData();
    };

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setAmount('');
        setFrequency('monthly');
        setDayOfWeek(4);
        setDayOfMonth(1);
        setIntervalDays('30');
        if (categories.length > 0) setSelectedCat(categories[0]);
    };

    const handleEdit = (item: RecurringItem) => {
        setEditingId(item.id);
        setName(item.name);
        setAmount(item.amount.toString());
        setFrequency(item.frequency);
        setDayOfWeek(item.day_of_week ?? 4);
        setDayOfMonth(item.day_of_month ?? 1);
        setIntervalDays(item.interval_days.toString());
        const cat = categories.find(c => c.id === item.category_id);
        if (cat) setSelectedCat(cat);
        setShowForm(true);
    };

    const handleDelete = (item: RecurringItem) => {
        Alert.alert('Delete', `Delete "${item.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await deleteRecurringItem(item.id); loadData(); } },
        ]);
    };

    const handlePayNow = (item: RecurringItem) => {
        Alert.alert('Pay Now', `Record ${formatCurrency(item.amount)} for "${item.name}" today?\nThe next scheduled date will be advanced automatically.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Record Payment', style: 'default', onPress: async () => {
                    try {
                        await recordRecurringPayment(item.id);
                        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        loadData();
                        Alert.alert('Success', `Payment for "${item.name}" recorded.`);
                    } catch (e: any) {
                        Alert.alert('Error', 'Could not record payment: ' + e?.message);
                    }
                }
            },
        ]);
    };

    const freqOptions: { label: string; value: RecurringFrequency }[] = [
        { label: 'Weekly', value: 'weekly' },
        { label: 'Bi-weekly', value: 'biweekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Yearly', value: 'yearly' },
        { label: 'Custom', value: 'custom' },
    ];

    const days = [0, 1, 2, 3, 4, 5, 6];

    const isIncome = type === 'income';
    const accentColor = isIncome ? Colors.cyberGreen : Colors.neonPink;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <NeonText variant="title" style={{ paddingTop: Spacing.xxl }}>
                    Recurring {isIncome ? 'Income' : 'Expenses'}
                </NeonText>
                <TouchableOpacity onPress={() => {
                    if (showForm) {
                        setShowForm(false);
                        resetForm();
                    } else {
                        setShowForm(true);
                    }
                }} style={{ paddingTop: Spacing.xxl }}>
                    <Ionicons name={showForm ? 'close' : 'add-circle'} size={28} color={accentColor} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {showForm && (
                    <GlassCard style={styles.form} glowColor={accentColor}>
                        <GlowInput label="Name" placeholder={isIncome ? 'e.g. Salary' : 'e.g. Netflix'} value={name} onChangeText={setName} glowColor={accentColor} />
                        <GlowInput label="Amount" placeholder="0.00" value={amount} onChangeText={setAmount} keyboardType="numeric" glowColor={accentColor} />

                        <NeonText variant="label" style={styles.label}>FREQUENCY</NeonText>
                        <View style={styles.freqRow}>
                            {freqOptions.map(o => (
                                <TouchableOpacity key={o.value}
                                    style={[styles.freqBtn, frequency === o.value && { backgroundColor: `${accentColor}30`, borderColor: accentColor }]}
                                    onPress={() => setFrequency(o.value)}>
                                    <NeonText variant="caption" color={frequency === o.value ? accentColor : Colors.textTertiary}>{o.label}</NeonText>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {['weekly', 'biweekly'].includes(frequency) && (
                            <>
                                <NeonText variant="label" style={styles.label}>DAY OF WEEK</NeonText>
                                <View style={styles.freqRow}>
                                    {days.map(d => (
                                        <TouchableOpacity key={d}
                                            style={[styles.freqBtn, dayOfWeek === d && { backgroundColor: `${accentColor}30`, borderColor: accentColor }]}
                                            onPress={() => setDayOfWeek(d)}>
                                            <NeonText variant="caption" color={dayOfWeek === d ? accentColor : Colors.textTertiary}>
                                                {getDayOfWeekName(d).slice(0, 3)}
                                            </NeonText>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}

                        {frequency === 'monthly' && (
                            <GlowInput label="Day of Month" placeholder="1-28" value={String(dayOfMonth)}
                                onChangeText={t => setDayOfMonth(parseInt(t) || 1)} keyboardType="number-pad" glowColor={accentColor} />
                        )}

                        {frequency === 'custom' && (
                            <GlowInput label="Interval (days)" placeholder="30" value={intervalDays}
                                onChangeText={setIntervalDays} keyboardType="number-pad" glowColor={accentColor} />
                        )}

                        <NeonText variant="label" style={styles.label}>CATEGORY</NeonText>
                        <View style={styles.catGrid}>
                            {categories.slice(0, 12).map(c => (
                                <TouchableOpacity key={c.id}
                                    style={[styles.catBtn, selectedCat?.id === c.id && { backgroundColor: `${c.color}20`, borderColor: c.color }]}
                                    onPress={() => setSelectedCat(c)}>
                                    <CategoryIcon icon={c.icon} color={c.color} size={28} />
                                    <NeonText variant="caption" color={Colors.textSecondary} numberOfLines={1}>{c.name}</NeonText>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <NeonButton title={editingId ? "Update" : "Save"} onPress={handleSave} variant={isIncome ? 'primary' : 'danger'} fullWidth />
                    </GlassCard>
                )}

                {items.length === 0 && !showForm ? (
                    <View style={styles.empty}>
                        <Ionicons name={isIncome ? 'cash-outline' : 'repeat-outline'} size={64} color={Colors.textMuted} />
                        <NeonText variant="subtitle" color={Colors.textMuted}>No recurring {isIncome ? 'income' : 'expenses'}</NeonText>
                    </View>
                ) : (
                    items.map(item => (
                        <View key={item.id}>
                            <GlassCard style={styles.itemCard} glowColor={item.is_active ? undefined : undefined}>
                                <CategoryIcon icon={item.category_icon || 'repeat'} color={item.category_color || accentColor} size={40} />
                                <View style={{ flex: 1 }}>
                                    <NeonText variant="body">{item.name}</NeonText>
                                    <NeonText variant="caption" color={Colors.textTertiary}>
                                        {item.frequency === 'biweekly' ? 'Every 2 weeks' : item.frequency}
                                        {item.day_of_week !== null ? `, ${getDayOfWeekName(item.day_of_week)}` : ''}
                                        {item.day_of_month ? `, day ${item.day_of_month}` : ''}
                                    </NeonText>
                                    <NeonText variant="caption" color={Colors.textMuted}>Next: {item.next_date}</NeonText>

                                    {/* Edit / Delete Buttons */}
                                    <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
                                        <TouchableOpacity onPress={() => handleEdit(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <Ionicons name="pencil" size={14} color={Colors.electricBlue} />
                                            <NeonText variant="caption" color={Colors.electricBlue}>Edit</NeonText>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDelete(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <Ionicons name="trash" size={14} color={Colors.danger} />
                                            <NeonText variant="caption" color={Colors.danger}>Delete</NeonText>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <NeonText variant="subtitle" color={accentColor} glow glowColor={accentColor}>
                                            {formatCurrency(item.amount)}
                                        </NeonText>
                                        <TouchableOpacity onPress={async () => { await toggleRecurringItem(item.id, !item.is_active); loadData(); }} style={{ marginTop: Spacing.xs }}>
                                            <Ionicons name={item.is_active ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={item.is_active ? Colors.cyberGreen : Colors.textMuted} />
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity
                                        style={{ marginTop: Spacing.sm, backgroundColor: `${accentColor}20`, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm }}
                                        onPress={() => handlePayNow(item)}
                                    >
                                        <NeonText variant="caption" color={accentColor}>Pay Now</NeonText>
                                    </TouchableOpacity>
                                </View>
                            </GlassCard>
                        </View>
                    ))
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
    scrollContent: { paddingHorizontal: Spacing.lg },
    form: { marginBottom: Spacing.lg },
    label: { marginBottom: Spacing.sm, color: Colors.textSecondary },
    freqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.lg },
    freqBtn: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
    catBtn: { alignItems: 'center', gap: 4, padding: Spacing.sm, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: 'transparent', width: 72 },
    empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: Spacing.md },
    itemCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm, paddingVertical: Spacing.md },
});
