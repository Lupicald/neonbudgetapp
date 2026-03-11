import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert, TextInput, Platform } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GlassCard, NeonText, CategoryIcon } from '../components';
import { Colors, Spacing, BorderRadius, FontSize } from '../theme';
import { getTransactions, deleteTransaction } from '../database/transactionService';
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

    // Compute net total for a day's transactions
    const getDayNet = (txs: Transaction[]) => {
        return txs.reduce((sum, tx) => {
            return sum + (tx.type === 'income' ? tx.amount : -tx.amount);
        }, 0);
    };

    return (
        <View style={styles.container}>
            {/* Ambient glow */}
            <View style={styles.glow1} pointerEvents="none" />

            <View style={styles.header}>
                <NeonText variant="title" style={{ paddingTop: Spacing.xxl }}>Transactions</NeonText>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => navigation.navigate('AddTransaction')}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={[Colors.neonPurple, Colors.electricBlue] as [string, string]}
                        style={styles.addBtnGrad}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="add" size={22} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>
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
                    style={[styles.filterChip, filterType === 'income' && { backgroundColor: `${Colors.cyberGreen}20`, borderColor: Colors.cyberGreen }]}
                    onPress={() => setFilterType(filterType === 'income' ? undefined : 'income')}>
                    <NeonText variant="caption" color={filterType === 'income' ? Colors.cyberGreen : Colors.textTertiary}>Income</NeonText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterChip, filterType === 'expense' && { backgroundColor: `${Colors.neonPink}20`, borderColor: Colors.neonPink }]}
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
                    renderItem={({ item: date }) => {
                        const dayTxs = grouped[date];
                        const dayNet = getDayNet(dayTxs);
                        const dayNetColor = dayNet >= 0 ? Colors.cyberGreen : Colors.neonPink;

                        return (
                            <View style={styles.dateGroup}>
                                {/* Date header with daily total */}
                                <View style={styles.dateHeader}>
                                    <NeonText variant="label" color={Colors.textTertiary}>
                                        {formatDate(date)}
                                    </NeonText>
                                    <NeonText variant="label" color={dayNetColor} style={styles.dayNet}>
                                        {dayNet >= 0 ? '+' : ''}{formatCurrency(dayNet)}
                                    </NeonText>
                                </View>

                                {dayTxs.map(tx => (
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
                                            <View style={styles.amountWrap}>
                                                <NeonText
                                                    variant="subtitle"
                                                    color={tx.type === 'income' ? Colors.cyberGreen : Colors.neonPink}
                                                >
                                                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                </NeonText>
                                            </View>
                                        </GlassCard>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        );
                    }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    glow1: {
        position: 'absolute', width: 300, height: 300, borderRadius: 150,
        backgroundColor: 'rgba(191,90,242,0.06)', top: -100, right: -80,
    },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
        paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'android' ? 48 : Spacing.xl,
        paddingBottom: Spacing.md,
    },
    addBtn: {},
    addBtnGrad: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
    },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: BorderRadius.md,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
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
        borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border,
    },
    filterChipActive: { backgroundColor: `${Colors.electricBlue}20`, borderColor: Colors.electricBlue },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
    listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
    dateGroup: { marginBottom: Spacing.lg },
    dateHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: Spacing.sm, paddingHorizontal: 2,
    },
    dayNet: { fontWeight: '700' },
    txCard: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        marginBottom: Spacing.sm, paddingVertical: Spacing.md,
    },
    txInfo: { flex: 1, gap: 2 },
    txMeta: { flexDirection: 'row' },
    amountWrap: { alignItems: 'flex-end' },
});
