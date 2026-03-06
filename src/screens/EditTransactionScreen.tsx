import React, { useState, useEffect } from 'react';
import {
    View, ScrollView, StyleSheet, TouchableOpacity, Alert,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassCard, NeonText, NeonButton, GlowInput, CategoryIcon } from '../components';
import { Colors, Spacing, BorderRadius } from '../theme';
import { updateTransaction, deleteTransaction } from '../database/transactionService';
import { getCategories } from '../database/categoryService';
import { getAccounts } from '../database/accountService';
import { Account, Category, Transaction, TransactionType } from '../types';

export const EditTransactionScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const tx: Transaction = route.params?.transaction;

    const [type, setType] = useState<TransactionType>(tx?.type || 'expense');
    const [amount, setAmount] = useState(tx?.amount?.toString() || '');
    const [merchantName, setMerchantName] = useState(tx?.merchant_name || '');
    const [note, setNote] = useState(tx?.note || '');
    const [date, setDate] = useState(tx?.date || '');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showCategories, setShowCategories] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [showAccounts, setShowAccounts] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadCategories();
        loadAccounts();
    }, []);

    const loadCategories = async () => {
        const cats = await getCategories();
        setCategories(cats);
        if (tx?.category_id) {
            const found = cats.find(c => c.id === tx.category_id);
            if (found) setSelectedCategory(found);
        }
    };

    const loadAccounts = async () => {
        const accs = await getAccounts();
        setAccounts(accs);
        if (tx?.account_id) {
            const found = accs.find(a => a.id === tx.account_id);
            setSelectedAccount(found ?? null);
        } else {
            const def = accs.find(a => a.is_default === 1) ?? accs[0] ?? null;
            setSelectedAccount(def);
        }
    };

    const handleSave = async () => {
        const numAmount = parseFloat(amount.replace(/,/g, ''));
        if (!numAmount || numAmount <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        } if (!selectedCategory) { Alert.alert('Error', 'Select a category'); return; }

        setSaving(true);
        try {
            await updateTransaction(tx.id, type, numAmount, merchantName, selectedCategory.id, date, note, selectedAccount?.id ?? null);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert('Delete', 'Delete this transaction?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    await deleteTransaction(tx.id);
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    navigation.goBack();
                }
            },
        ]);
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close-outline" size={28} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <NeonText variant="title">Edit Transaction</NeonText>
                    <TouchableOpacity onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={24} color={Colors.neonPink} />
                    </TouchableOpacity>
                </View>

                {/* Type Toggle */}
                <View style={styles.typeRow}>
                    <TouchableOpacity
                        style={[styles.typeBtn, type === 'expense' && { backgroundColor: `${Colors.neonPink}20`, borderColor: Colors.neonPink }]}
                        onPress={() => setType('expense')}>
                        <NeonText variant="body" color={type === 'expense' ? Colors.neonPink : Colors.textTertiary}>Expense</NeonText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeBtn, type === 'income' && { backgroundColor: `${Colors.cyberGreen}20`, borderColor: Colors.cyberGreen }]}
                        onPress={() => setType('income')}>
                        <NeonText variant="body" color={type === 'income' ? Colors.cyberGreen : Colors.textTertiary}>Income</NeonText>
                    </TouchableOpacity>
                </View>

                <GlowInput label="Amount" placeholder="0.00" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
                <GlowInput label="Merchant" placeholder="Name..." value={merchantName} onChangeText={setMerchantName} />
                <GlowInput label="Date" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />
                <GlowInput label="Note" placeholder="Note..." value={note} onChangeText={setNote} />

                {/* Category */}
                <NeonText variant="label" style={styles.label}>CATEGORY</NeonText>
                <TouchableOpacity onPress={() => setShowCategories(!showCategories)}>
                    <GlassCard style={styles.catPicker}>
                        {selectedCategory && (
                            <View style={styles.catSelected}>
                                <CategoryIcon icon={selectedCategory.icon} color={selectedCategory.color} size={28} />
                                <NeonText variant="body">{selectedCategory.name}</NeonText>
                            </View>
                        )}
                        <Ionicons name={showCategories ? 'chevron-up-outline' : 'chevron-down-outline'} size={20} color={Colors.textTertiary} />
                    </GlassCard>
                </TouchableOpacity>

                {showCategories && (
                    <GlassCard style={styles.catList}>
                        {categories.map(cat => (
                            <TouchableOpacity key={cat.id}
                                style={[styles.catItem, selectedCategory?.id === cat.id && styles.catItemActive]}
                                onPress={() => { setSelectedCategory(cat); setShowCategories(false); }}>
                                <CategoryIcon icon={cat.icon} color={cat.color} size={24} />
                                <NeonText variant="body">{cat.name}</NeonText>
                            </TouchableOpacity>
                        ))}
                    </GlassCard>
                )}

                {/* Account */}
                <NeonText variant="label" style={styles.label}>ACCOUNT</NeonText>
                <TouchableOpacity onPress={() => setShowAccounts(!showAccounts)}>
                    <GlassCard style={styles.catPicker}>
                        {selectedAccount ? (
                            <View style={styles.catSelected}>
                                <Ionicons name={(selectedAccount.icon as any) || 'wallet-outline'} size={24} color={selectedAccount.color} />
                                <NeonText variant="body">{selectedAccount.name}</NeonText>
                            </View>
                        ) : (
                            <NeonText variant="body" color={Colors.textTertiary}>Sin cuenta</NeonText>
                        )}
                        <Ionicons name={showAccounts ? 'chevron-up-outline' : 'chevron-down-outline'} size={20} color={Colors.textTertiary} />
                    </GlassCard>
                </TouchableOpacity>

                {showAccounts && (
                    <GlassCard style={styles.catList}>
                        {accounts.map(acc => (
                            <TouchableOpacity key={acc.id}
                                style={[styles.catItem, selectedAccount?.id === acc.id && styles.catItemActive]}
                                onPress={() => { setSelectedAccount(acc); setShowAccounts(false); }}>
                                <Ionicons name={(acc.icon as any) || 'wallet-outline'} size={24} color={acc.color} />
                                <View style={{ flex: 1 }}>
                                    <NeonText variant="body">{acc.name}</NeonText>
                                    <NeonText variant="caption" color={Colors.textTertiary}>{acc.type}</NeonText>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </GlassCard>
                )}

                <View style={{ height: Spacing.xl }} />

                <NeonButton title={saving ? 'Saving...' : 'Save Changes'} onPress={handleSave} variant="primary" fullWidth loading={saving} />
                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xxl },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xxl, paddingTop: Spacing.xl },
    typeRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
    typeBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border },
    label: { marginBottom: Spacing.sm, color: Colors.textSecondary },
    catPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
    catSelected: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    catList: { marginTop: -Spacing.md, marginBottom: Spacing.lg, padding: Spacing.sm },
    catItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.sm },
    catItemActive: { backgroundColor: Colors.surfaceLight },
});
