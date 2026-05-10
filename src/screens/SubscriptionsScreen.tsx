import React, { useState, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
    TextInput, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, CategoryColors } from '../theme';
import {
    getSubscriptions, addSubscription, updateSubscription,
    toggleSubscription, deleteSubscription, Subscription,
} from '../database/subscriptionService';
import { getCategories } from '../database/categoryService';
import { Category } from '../types';
import { formatCurrency } from '../utils';

const SUB_ICONS = [
    'repeat-outline', 'tv-outline', 'musical-notes-outline', 'cloud-outline',
    'game-controller-outline', 'headset-outline', 'newspaper-outline', 'fitness-outline',
    'desktop-outline', 'phone-portrait-outline', 'shield-outline', 'wifi-outline',
    'storefront-outline', 'cart-outline', 'film-outline', 'mic-outline',
];

const BLANK = { name: '', amount: '', billingDay: '1', color: '#ffe66d', icon: 'repeat-outline', note: '', categoryId: null as number | null };

export const SubscriptionsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [subs, setSubs] = useState<Subscription[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState(BLANK);

    const load = useCallback(async () => {
        const [s, c] = await Promise.all([getSubscriptions(), getCategories()]);
        setSubs(s);
        setCategories(c);
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const totalMonthly = subs.filter(s => s.is_active).reduce((acc, s) => acc + s.amount, 0);

    const openAdd = () => { setEditId(null); setForm(BLANK); setShowForm(true); };
    const openEdit = (s: Subscription) => {
        setEditId(s.id);
        setForm({ name: s.name, amount: String(s.amount), billingDay: String(s.billing_day), color: s.color, icon: s.icon, note: s.note, categoryId: s.category_id });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return Alert.alert('Enter a name');
        const amt = parseFloat(form.amount.replace(/,/g, ''));
        if (!amt || amt <= 0) return Alert.alert('Enter a valid amount');
        const day = Math.min(28, Math.max(1, parseInt(form.billingDay) || 1));
        if (editId) {
            await updateSubscription(editId, form.name.trim(), amt, day, form.color, form.icon, form.note, form.categoryId);
        } else {
            await addSubscription(form.name.trim(), amt, day, form.color, form.icon, form.note, form.categoryId);
        }
        setShowForm(false);
        load();
    };

    const handleDelete = (s: Subscription) => {
        Alert.alert('Delete', `Delete "${s.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await deleteSubscription(s.id); load(); } },
        ]);
    };

    return (
        <SafeAreaView style={st.safe} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
                {/* Header */}
                <View style={st.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4, marginRight: Spacing.md }}>
                        <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={st.titleSub}>TRACKING</Text>
                        <Text style={st.title}>Subscriptions</Text>
                    </View>
                    <TouchableOpacity onPress={openAdd} style={st.addBtn}>
                        <Ionicons name="add" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Monthly total */}
                <View style={st.heroCard}>
                    <Text style={st.heroLabel}>MONTHLY TOTAL</Text>
                    <Text style={st.heroAmount}>{formatCurrency(totalMonthly)}</Text>
                    <Text style={st.heroSub}>
                        {subs.filter(s => s.is_active).length} active · {subs.filter(s => !s.is_active).length} paused
                    </Text>
                    <Text style={st.heroNote}>Subscriptions are tracked for awareness only — they don't record automatic transactions.</Text>
                </View>

                {/* List */}
                {subs.length === 0 ? (
                    <View style={st.empty}>
                        <Ionicons name="repeat-outline" size={56} color={Colors.textMuted} />
                        <Text style={st.emptyTitle}>No subscriptions yet</Text>
                        <Text style={st.emptyDesc}>Add Netflix, Spotify, rent, gym — anything you pay regularly.</Text>
                        <TouchableOpacity onPress={openAdd} style={[st.addBtn, { marginTop: Spacing.md }]}>
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 4 }}>Add first</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    subs.map(sub => (
                        <TouchableOpacity key={sub.id} onPress={() => openEdit(sub)} onLongPress={() => handleDelete(sub)} activeOpacity={0.8}>
                            <View style={[st.subCard, !sub.is_active && st.subInactive]}>
                                <View style={[st.subStripe, { backgroundColor: sub.is_active ? sub.color : Colors.border }]} />
                                <View style={[st.subIconBox, { backgroundColor: sub.color + '22' }]}>
                                    <Ionicons name={sub.icon as any} size={20} color={sub.color} />
                                </View>
                                <View style={st.subBody}>
                                    <Text style={st.subName}>{sub.name}</Text>
                                    <Text style={st.subMeta}>
                                        Day {sub.billing_day} of each month
                                        {sub.category_name ? ` · ${sub.category_name}` : ''}
                                    </Text>
                                </View>
                                <View style={st.subRight}>
                                    <Text style={[st.subAmount, { color: sub.color }]}>{formatCurrency(sub.amount)}</Text>
                                    <Text style={st.subPeriod}>/mo</Text>
                                </View>
                                <TouchableOpacity onPress={async () => { await toggleSubscription(sub.id, !sub.is_active); load(); }} style={st.subToggle}>
                                    <Ionicons name={sub.is_active ? 'pause-circle-outline' : 'play-circle-outline'} size={20} color={sub.is_active ? Colors.textTertiary : Colors.accent} />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))
                )}

                <View style={{ height: 80 }} />
            </ScrollView>

            {/* Add/Edit Modal */}
            <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowForm(false)}>
                <SafeAreaView style={st.modal}>
                    <View style={st.modalHeader}>
                        <Text style={st.modalTitle}>{editId ? 'Edit subscription' : 'New subscription'}</Text>
                        <TouchableOpacity onPress={() => setShowForm(false)} style={st.closeBtn}>
                            <Ionicons name="close" size={18} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={st.modalContent} showsVerticalScrollIndicator={false}>
                        <Text style={st.label}>NAME</Text>
                        <View style={st.field}>
                            <TextInput style={st.fieldInput} value={form.name}
                                onChangeText={v => setForm(f => ({ ...f, name: v }))}
                                placeholder="Netflix, Spotify, Gym…" placeholderTextColor={Colors.textMuted} />
                        </View>

                        <Text style={st.label}>MONTHLY AMOUNT</Text>
                        <View style={st.field}>
                            <TextInput style={st.fieldInput} value={form.amount}
                                onChangeText={v => setForm(f => ({ ...f, amount: v }))}
                                placeholder="0.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
                        </View>

                        <Text style={st.label}>BILLING DAY (1–28)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
                            <View style={{ flexDirection: 'row', gap: 6 }}>
                                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                                    <TouchableOpacity key={d}
                                        style={[st.dayChip, parseInt(form.billingDay) === d && { backgroundColor: form.color + '30', borderColor: form.color }]}
                                        onPress={() => setForm(f => ({ ...f, billingDay: String(d) }))}>
                                        <Text style={[st.dayChipText, parseInt(form.billingDay) === d && { color: form.color }]}>{d}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <Text style={st.label}>ICON</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.lg }}>
                            {SUB_ICONS.map(ic => (
                                <TouchableOpacity key={ic}
                                    style={[st.iconOption, form.icon === ic && { borderColor: form.color, backgroundColor: form.color + '20' }]}
                                    onPress={() => setForm(f => ({ ...f, icon: ic }))}>
                                    <Ionicons name={ic as any} size={20} color={form.icon === ic ? form.color : Colors.textSecondary} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={st.label}>COLOR</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.lg }}>
                            {CategoryColors.slice(0, 10).map(c => (
                                <TouchableOpacity key={c}
                                    style={[st.colorDot, { backgroundColor: c }, form.color === c && st.colorDotActive]}
                                    onPress={() => setForm(f => ({ ...f, color: c }))} />
                            ))}
                        </View>

                        <Text style={st.label}>CATEGORY (optional)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity
                                    style={[st.catChip, form.categoryId === null && { borderColor: Colors.border, backgroundColor: Colors.bgCard }]}
                                    onPress={() => setForm(f => ({ ...f, categoryId: null }))}>
                                    <Text style={{ color: form.categoryId === null ? Colors.textPrimary : Colors.textMuted, fontSize: 12 }}>None</Text>
                                </TouchableOpacity>
                                {categories.map(c => (
                                    <TouchableOpacity key={c.id}
                                        style={[st.catChip, form.categoryId === c.id && { borderColor: c.color, backgroundColor: c.color + '20' }]}
                                        onPress={() => setForm(f => ({ ...f, categoryId: c.id }))}>
                                        <Ionicons name={c.icon as any} size={14} color={form.categoryId === c.id ? c.color : Colors.textMuted} />
                                        <Text style={[{ fontSize: 11 }, form.categoryId === c.id ? { color: c.color } : { color: Colors.textMuted }]}>{c.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <Text style={st.label}>NOTE (optional)</Text>
                        <View style={st.field}>
                            <TextInput style={st.fieldInput} value={form.note}
                                onChangeText={v => setForm(f => ({ ...f, note: v }))}
                                placeholder="Add a note…" placeholderTextColor={Colors.textMuted} />
                        </View>

                        <TouchableOpacity onPress={handleSave} style={[st.saveBtn, { backgroundColor: form.color }]}>
                            <Text style={st.saveBtnText}>{editId ? 'Save changes' : 'Add subscription'}</Text>
                        </TouchableOpacity>

                        {editId && (
                            <TouchableOpacity onPress={() => { setShowForm(false); handleDelete(subs.find(s => s.id === editId)!); }}
                                style={st.deleteBtn}>
                                <Ionicons name="trash-outline" size={16} color={Colors.negative} />
                                <Text style={{ color: Colors.negative, fontWeight: '500' }}>Delete</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const st = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    scroll: { paddingHorizontal: Spacing.xl },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
    titleSub: { fontSize: 10, color: Colors.textTertiary, letterSpacing: 1.5, textTransform: 'uppercase' },
    title: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5 },
    addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.accent, borderRadius: 24, width: 44, height: 44, justifyContent: 'center' },
    heroCard: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, marginBottom: Spacing.xl },
    heroLabel: { fontSize: 10, color: Colors.textTertiary, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
    heroAmount: { fontSize: 40, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -1, marginBottom: 4 },
    heroSub: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
    heroNote: { fontSize: 11, color: Colors.textTertiary, lineHeight: 16 },
    empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
    emptyDesc: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19 },
    subCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm, overflow: 'hidden' },
    subInactive: { opacity: 0.45 },
    subStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
    subIconBox: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
    subBody: { flex: 1 },
    subName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
    subMeta: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
    subRight: { alignItems: 'flex-end' },
    subAmount: { fontSize: 16, fontWeight: '700' },
    subPeriod: { fontSize: 10, color: Colors.textTertiary },
    subToggle: { padding: 4 },
    modal: { flex: 1, backgroundColor: Colors.bg },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
    modalTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.4 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
    modalContent: { paddingHorizontal: Spacing.xl, paddingBottom: 60 },
    label: { fontSize: 10, fontWeight: '600', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 8, marginTop: Spacing.lg },
    field: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.lg, paddingVertical: 14 },
    fieldInput: { fontSize: 15, color: Colors.textPrimary },
    dayChip: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
    dayChipText: { fontSize: 12, color: Colors.textSecondary },
    iconOption: { width: 44, height: 44, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
    colorDot: { width: 32, height: 32, borderRadius: 16 },
    colorDotActive: { borderWidth: 3, borderColor: Colors.textPrimary },
    catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
    saveBtn: { borderRadius: BorderRadius.lg, paddingVertical: Spacing.md + 2, alignItems: 'center', marginTop: Spacing.xl },
    saveBtnText: { fontSize: 16, fontWeight: '700', color: '#000' },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: Spacing.lg, paddingVertical: 12 },
});
