import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, NeonText, NeonButton, GlowInput, CategoryIcon } from '../components';
import { Colors, Spacing, BorderRadius, CategoryColors } from '../theme';
import { getAccounts, addAccount, updateAccount, updateAccountBalance, deleteAccount } from '../database/accountService';
import { Account, AccountType } from '../types';
import { formatCurrency } from '../utils';

const ACCOUNT_TYPES: { label: string; value: AccountType; icon: string }[] = [
    { label: 'Bank', value: 'bank', icon: 'card-outline' },
    { label: 'Cash', value: 'cash', icon: 'cash-outline' },
    { label: 'Credit', value: 'credit', icon: 'card-outline' },
    { label: 'Savings', value: 'savings', icon: 'wallet-outline' },
    { label: 'Investment', value: 'investment', icon: 'trending-up-outline' },
    { label: 'Other', value: 'other', icon: 'ellipse-outline' },
];

const ACCOUNT_ICONS = [
    'card-outline', 'cash-outline', 'wallet-outline', 'trending-up-outline',
    'business-outline', 'globe-outline', 'shield-outline', 'diamond-outline',
];

export const AccountsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [balance, setBalance] = useState('');
    const [selectedType, setSelectedType] = useState<AccountType>('bank');
    const [selectedIcon, setSelectedIcon] = useState('card-outline');
    const [selectedColor, setSelectedColor] = useState(Colors.electricBlue);
    const [editBalanceId, setEditBalanceId] = useState<number | null>(null);
    const [editBalanceVal, setEditBalanceVal] = useState('');

    const loadData = useCallback(async () => {
        setAccounts(await getAccounts());
    }, []);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    const resetForm = () => {
        setShowForm(false); setEditId(null);
        setName(''); setBalance('');
        setSelectedType('bank'); setSelectedIcon('card-outline');
        setSelectedColor(Colors.electricBlue);
    };

    const handleSave = async () => {
        if (!name.trim()) { Alert.alert('Error', 'Enter an account name'); return; }
        if (editId) {
            await updateAccount(editId, name.trim(), selectedType, selectedIcon, selectedColor);
        } else {
            await addAccount(name.trim(), selectedType, parseFloat(balance) || 0, selectedIcon, selectedColor);
        }
        resetForm();
        loadData();
    };

    const handleEdit = (acc: Account) => {
        setEditId(acc.id); setName(acc.name);
        setSelectedType(acc.type); setSelectedIcon(acc.icon);
        setSelectedColor(acc.color); setShowForm(true);
    };

    const handleDelete = (acc: Account) => {
        Alert.alert('Delete Account', `Are you sure you want to delete "${acc.name}"?\nTransactions will be kept but unlinked.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await deleteAccount(acc.id);
                    if (editId === acc.id) resetForm();
                    loadData();
                }
            },
        ]);
    };

    const handleBalanceSave = async (id: number) => {
        await updateAccountBalance(id, parseFloat(editBalanceVal) || 0);
        setEditBalanceId(null); setEditBalanceVal('');
        loadData();
    };

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <NeonText variant="title" style={{ paddingTop: Spacing.xxl }}>Accounts</NeonText>
                    <TouchableOpacity onPress={() => showForm ? resetForm() : setShowForm(true)} style={{ paddingTop: Spacing.xxl }}>
                        <Ionicons name={showForm ? 'close-outline' : 'add-circle-outline'} size={28} color={Colors.electricBlue} />
                    </TouchableOpacity>
                </View>

                {/* Total */}
                <GlassCard style={styles.totalCard} glowColor={Colors.electricBlue}>
                    <NeonText variant="label" color={Colors.textTertiary}>TOTAL BALANCE</NeonText>
                    <NeonText variant="display" glow glowColor={Colors.electricBlue} color={totalBalance >= 0 ? Colors.electricBlue : Colors.neonPink}>
                        {formatCurrency(totalBalance)}
                    </NeonText>
                </GlassCard>

                {/* Transfer Button */}
                <TouchableOpacity style={styles.transferBtn} onPress={() => navigation.navigate('TransferMoney')}>
                    <Ionicons name="swap-horizontal-outline" size={20} color={Colors.electricBlue} />
                    <NeonText variant="body" color={Colors.electricBlue}>Transfer Between Accounts</NeonText>
                    <Ionicons name="chevron-forward-outline" size={18} color={Colors.textTertiary} />
                </TouchableOpacity>

                {/* Add/Edit Form */}
                {showForm && (
                    <GlassCard style={styles.form} glowColor={Colors.neonPurple}>
                        <NeonText variant="subtitle">{editId ? 'Edit Account' : 'New Account'}</NeonText>
                        <GlowInput label="Name" placeholder="e.g. BBVA, Cash" value={name} onChangeText={setName} />
                        {!editId && (
                            <GlowInput label="Initial Balance" placeholder="0.00" value={balance} onChangeText={setBalance} keyboardType="decimal-pad" />
                        )}

                        <NeonText variant="label" style={styles.label}>TYPE</NeonText>
                        <View style={styles.typeRow}>
                            {ACCOUNT_TYPES.map(t => (
                                <TouchableOpacity key={t.value}
                                    style={[styles.typeBtn, selectedType === t.value && { backgroundColor: `${selectedColor}30`, borderColor: selectedColor }]}
                                    onPress={() => { setSelectedType(t.value); setSelectedIcon(t.icon); }}>
                                    <Ionicons name={t.icon as any} size={16} color={selectedType === t.value ? selectedColor : Colors.textTertiary} />
                                    <NeonText variant="caption" color={selectedType === t.value ? selectedColor : Colors.textTertiary}>{t.label}</NeonText>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <NeonText variant="label" style={styles.label}>ICON</NeonText>
                        <View style={styles.iconRow}>
                            {ACCOUNT_ICONS.map(ic => (
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

                        <NeonButton title={editId ? 'Update' : 'Add Account'} onPress={handleSave} variant="primary" fullWidth />

                        {editId && (
                            <View style={{ marginTop: Spacing.sm }}>
                                <NeonButton
                                    title="Delete Account"
                                    onPress={() => handleDelete(accounts.find(a => a.id === editId)!)}
                                    variant="danger"
                                    fullWidth
                                />
                            </View>
                        )}
                    </GlassCard>
                )}

                {/* Account Cards */}
                {accounts.map(acc => (
                    <TouchableOpacity key={acc.id} onPress={() => handleEdit(acc)} onLongPress={() => handleDelete(acc)} activeOpacity={0.7}>
                        <GlassCard style={styles.accountCard} glowColor={acc.color}>
                            <View style={styles.accountRow}>
                                <View style={[styles.accountIcon, { backgroundColor: `${acc.color}20` }]}>
                                    <Ionicons name={acc.icon as any} size={22} color={acc.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <NeonText variant="body">{acc.name}</NeonText>
                                    <NeonText variant="caption" color={Colors.textTertiary}>{acc.type.charAt(0).toUpperCase() + acc.type.slice(1)}</NeonText>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    {editBalanceId === acc.id ? (
                                        <View style={styles.editBalRow}>
                                            <GlowInput
                                                value={editBalanceVal} onChangeText={setEditBalanceVal}
                                                keyboardType="numeric" glowColor={acc.color}
                                                containerStyle={{ width: 120, marginBottom: 0 }}
                                            />
                                            <TouchableOpacity onPress={() => handleBalanceSave(acc.id)}>
                                                <Ionicons name="checkmark-circle-outline" size={24} color={Colors.cyberGreen} />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TouchableOpacity onPress={() => { setEditBalanceId(acc.id); setEditBalanceVal(String(acc.balance)); }}>
                                            <NeonText variant="subtitle" color={acc.balance >= 0 ? acc.color : Colors.neonPink} glow glowColor={acc.color}>
                                                {formatCurrency(acc.balance)}
                                            </NeonText>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </GlassCard>
                    </TouchableOpacity>
                ))}

                {accounts.length === 0 && !showForm && (
                    <View style={styles.empty}>
                        <Ionicons name="wallet-outline" size={64} color={Colors.textMuted} />
                        <NeonText variant="subtitle" color={Colors.textMuted}>No accounts</NeonText>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { paddingHorizontal: Spacing.lg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.md },
    totalCard: { alignItems: 'center', marginBottom: Spacing.lg },
    form: { marginBottom: Spacing.lg },
    label: { marginBottom: Spacing.sm, color: Colors.textSecondary },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.lg },
    typeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border },
    iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
    iconBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
    colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
    colorBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
    colorBtnSelected: { borderColor: Colors.textPrimary, transform: [{ scale: 1.2 }] },
    accountCard: { marginBottom: Spacing.sm },
    accountRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    accountIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    editBalRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    transferBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, marginBottom: Spacing.lg, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.electricBlue, backgroundColor: `${Colors.electricBlue}10` },
    empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: Spacing.md },
});
