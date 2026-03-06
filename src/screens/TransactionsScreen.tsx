import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassCard, NeonText, CategoryIcon } from '../components';
import { Colors, Spacing, BorderRadius, FontSize } from '../theme';
import { getTransactions, deleteTransaction, updateTransaction } from '../database/transactionService';
import { getAccounts } from '../database/accountService';
import { Transaction, Account } from '../types';
import { formatCurrency, formatDate } from '../utils';

export const TransactionsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [search, setSearch] = useState('');
    const [filterAccountId, setFilterAccountId] = useState<number | undefined>(undefined);
    const [filterType, setFilterType] = useState<'income' | 'expense' | undefined>(undefined);

    const loadData = useCallback(async () => {
        const txs = await getTransactions(200, 0, filterType, undefined, undefined, undefined, filterAccountId, search || undefined);
        setTransactions(txs);
        setAccounts(await getAccounts());
    }, [search, filterAccountId, filterType]);

    useFocusEffect(useCallback(() => {
        loadData();
    }, [loadData]));

    const handleDelete = (tx: Transaction) => {
        Alert.alert('Delete Transaction', `Delete "${tx.merchant_name || 'this transaction'}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await deleteTransaction(tx.id);
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    loadData();
                },
            },
        ]);
    };

    // Group by date
    const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
        const key = tx.date;
        if (!acc[key]) acc[key] = [];
        acc[key].push(tx);
        return acc;
    }, {});

    const sections = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <NeonText variant="title" style={{ paddingTop: Spacing.xxl }}>Transactions</NeonText>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search transactions..."
                    placeholderTextColor={Colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                    returnKeyType="search"
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle-outline" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter Chips */}
            <View style={styles.filterRow}>
                <TouchableOpacity
                    style={[styles.filterChip, !filterType && !filterAccountId && styles.filterChipActive]}
                    onPress={() => { setFilterType(undefined); setFilterAccountId(undefined); }}>
                    <NeonText variant="caption" color={!filterType && !filterAccountId ? Colors.electricBlue : Colors.textTertiary}>All</NeonText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterChip, filterType === 'income' && styles.filterChipActive]}
                    onPress={() => setFilterType(filterType === 'income' ? undefined : 'income')}>
                    <NeonText variant="caption" color={filterType === 'income' ? Colors.cyberGreen : Colors.textTertiary}>Income</NeonText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterChip, filterType === 'expense' && styles.filterChipActive]}
                    onPress={() => setFilterType(filterType === 'expense' ? undefined : 'expense')}>
                    <NeonText variant="caption" color={filterType === 'expense' ? Colors.neonPink : Colors.textTertiary}>Expenses</NeonText>
                </TouchableOpacity>
                {accounts.map(a => (
                    <TouchableOpacity key={a.id}
                        style={[styles.filterChip, filterAccountId === a.id && { backgroundColor: `${a.color}25`, borderColor: a.color }]}
                        onPress={() => setFilterAccountId(filterAccountId === a.id ? undefined : a.id)}>
                        <NeonText variant="caption" color={filterAccountId === a.id ? a.color : Colors.textTertiary}>{a.name}</NeonText>
                    </TouchableOpacity>
                ))}
            </View>

            {transactions.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="receipt-outline" size={64} color={Colors.textMuted} />
                    <NeonText variant="subtitle" color={Colors.textMuted}>
                        {search ? 'No results' : 'No transactions yet'}
                    </NeonText>
                </View>
            ) : (
                <FlatList
                    data={sections}
                    keyExtractor={(item) => item}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item: date }) => (
                        <View style={styles.dateGroup}>
                            <NeonText variant="label" color={Colors.textTertiary} style={styles.dateLabel}>
                                {formatDate(date)}
                            </NeonText>
                            {grouped[date].map(tx => (
                                <TouchableOpacity key={tx.id}
                                    onPress={() => navigation.navigate('EditTransaction', { transaction: tx })}
                                    onLongPress={() => handleDelete(tx)}
                                    activeOpacity={0.7}>
                                    <GlassCard style={styles.txCard}>
                                        <CategoryIcon
                                            icon={tx.category_icon || 'ellipse-outline'}
                                            color={tx.category_color || Colors.electricBlue}
                                            size={40}
                                        />
                                        <View style={styles.txInfo}>
                                            <NeonText variant="body" numberOfLines={1}>
                                                {tx.merchant_name || tx.category_name || 'Transaction'}
                                            </NeonText>
                                            <View style={styles.txMeta}>
                                                <NeonText variant="caption" color={Colors.textTertiary}>{tx.category_name}</NeonText>
                                                {tx.account_name && (
                                                    <NeonText variant="caption" color={Colors.textMuted}> · {tx.account_name}</NeonText>
                                                )}
                                            </View>
                                            {tx.note ? <NeonText variant="caption" color={Colors.textMuted} numberOfLines={1}>{tx.note}</NeonText> : null}
                                        </View>
                                        <NeonText
                                            variant="subtitle"
                                            color={tx.type === 'income' ? Colors.cyberGreen : Colors.neonPink}
                                        >
                                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </NeonText>
                                    </GlassCard>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                />
            )}

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddTransaction')}
                activeOpacity={0.8}
            >
                <View style={styles.fabInner}>
                    <Ionicons name="add-outline" size={28} color={Colors.textPrimary} />
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.sm },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
        borderWidth: 1, borderColor: Colors.border,
        marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.md,
    },
    searchIcon: { marginRight: Spacing.sm },
    searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md, paddingVertical: Spacing.md },
    filterRow: {
        flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs,
        paddingHorizontal: Spacing.lg, marginBottom: Spacing.md,
    },
    filterChip: {
        paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border,
    },
    filterChipActive: { backgroundColor: `${Colors.electricBlue}20`, borderColor: Colors.electricBlue },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
    listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
    dateGroup: { marginBottom: Spacing.lg },
    dateLabel: { marginBottom: Spacing.sm },
    txCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm, paddingVertical: Spacing.md },
    txInfo: { flex: 1, gap: 2 },
    txMeta: { flexDirection: 'row' },
    fab: { position: 'absolute', right: Spacing.xl, bottom: Spacing.xl },
    fabInner: {
        width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.neonPurple,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: Colors.glowPurple, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6, shadowRadius: 12, elevation: 8,
    },
});
