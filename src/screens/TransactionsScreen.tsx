import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Amount, Pill, SectionHeader, CatAvatar, MiniBars, TopBar } from '../components/SumariPrimitives';
import { Colors, Spacing, BorderRadius, FontFamily } from '../theme';
import { getTransactions, deleteTransaction, getMonthlyTotal, getDailySpending } from '../database/transactionService';
import { getMonthKey } from '../utils';
import { Transaction } from '../types';

type Filter = 'all' | 'income' | 'expense';

export const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [monthIncome, setMonthIncome] = useState(0);
  const [monthExpense, setMonthExpense] = useState(0);
  const [spend7d, setSpend7d] = useState<number[]>([]);

  const load = useCallback(async () => {
    try {
      const month = getMonthKey();
      const [txs, inc, exp, daily] = await Promise.all([
        getTransactions(200),
        getMonthlyTotal(month, 'income'),
        getMonthlyTotal(month, 'expense'),
        getDailySpending(month),
      ]);
      setTransactions(txs as Transaction[]);
      setMonthIncome(inc);
      setMonthExpense(exp);
      // Last 7 days bar data
      const last7 = [...daily].slice(-7).map(d => d.total);
      setSpend7d(last7.length > 0 ? last7 : [0, 0, 0, 0, 0, 0, 0]);
    } catch (e) { console.log(e); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (tx: Transaction) => {
    Alert.alert('Delete', `Delete "${tx.merchant_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteTransaction(tx.id); load(); } },
    ]);
  };

  // Filter and search
  const filtered = transactions.filter(tx => {
    if (filter === 'income' && tx.type !== 'income') return false;
    if (filter === 'expense' && tx.type !== 'expense') return false;
    if (search && !tx.merchant_name.toLowerCase().includes(search.toLowerCase())
      && !(tx.category_name ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Group by date
  const groups: Record<string, Transaction[]> = {};
  filtered.forEach(tx => { (groups[tx.date] ??= []).push(tx); });
  const dates = Object.keys(groups).sort().reverse();

  const dateLabel = (d: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (d === today) return 'Today';
    if (d === yesterday) return 'Yesterday';
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const net = monthIncome - monthExpense;
  const month = new Date().toLocaleString('en-US', { month: 'long' });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <TopBar title="Transactions" large
          right={
            <>
              <TouchableOpacity onPress={() => setShowSearch(v => !v)} style={s.iconBtn}>
                <Ionicons name="search-outline" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={s.iconBtn}>
                <Ionicons name="filter-outline" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
            </>
          }
        />

        {/* Search bar */}
        {showSearch && (
          <View style={s.searchBox}>
            <Ionicons name="search-outline" size={16} color={Colors.textTertiary} />
            <TextInput style={s.searchInput} value={search} onChangeText={setSearch}
              placeholder="Search transactions…" placeholderTextColor={Colors.textMuted} autoFocus />
          </View>
        )}

        {/* Month summary */}
        <View style={s.padH}>
          <Card>
            <Text style={s.monthLabel}>{month}</Text>
            <View style={s.monthRow}>
              <View>
                <Text style={s.monthSub}>Net</Text>
                <Amount value={net} size="lg" sign color={net >= 0 ? Colors.accent : Colors.textPrimary} />
              </View>
              <MiniBars data={spend7d} color={Colors.accent} height={40} barWidth={8} gap={5}
                activeIdx={spend7d.length - 1} />
            </View>
          </Card>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll}
          contentContainerStyle={s.filterContent}>
          {([
            { v: 'all', l: 'All' },
            { v: 'income', l: 'Income' },
            { v: 'expense', l: 'Expense' },
          ] as { v: Filter; l: string }[]).map(o => (
            <Pill key={o.v} active={filter === o.v} onPress={() => setFilter(o.v)} size="sm">
              {o.l}
            </Pill>
          ))}
        </ScrollView>

        {/* Transaction groups */}
        <View style={s.padH}>
          {dates.map(d => {
            const dayTx = groups[d];
            const dayNet = dayTx.reduce((s, tx) => s + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
            return (
              <View key={d} style={s.dateGroup}>
                <View style={s.dateHeader}>
                  <Text style={s.dateLabel}>{dateLabel(d)}</Text>
                  <Amount value={Math.abs(dayNet)} size="sm" sign={dayNet >= 0}
                    color={dayNet >= 0 ? Colors.accent : Colors.textTertiary} />
                </View>
                <Card style={{ padding: 0 }}>
                  {dayTx.map((tx, i) => (
                    <TouchableOpacity
                      key={tx.id}
                      onPress={() => navigation.navigate('EditTransaction', { transaction: tx })}
                      onLongPress={() => handleDelete(tx)}
                      activeOpacity={0.75}
                      style={[s.txRow, i < dayTx.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}
                    >
                      <CatAvatar
                        icon={<Ionicons name={(tx.category_icon ?? 'pricetag-outline') as any} size={18}
                          color={tx.category_color ?? Colors.accent} />}
                        color={tx.category_color ?? Colors.accent}
                        size={38}
                      />
                      <View style={s.txInfo}>
                        <Text style={s.txMerchant} numberOfLines={1}>{tx.merchant_name}</Text>
                        <Text style={s.txMeta}>{tx.category_name} · {tx.date.slice(11, 16) || tx.date.slice(5)}</Text>
                      </View>
                      <Amount value={tx.amount} size="sm" sign={tx.type === 'income'}
                        color={tx.type === 'income' ? Colors.accent : Colors.textPrimary} />
                    </TouchableOpacity>
                  ))}
                </Card>
              </View>
            );
          })}

          {filtered.length === 0 && (
            <View style={s.empty}>
              <Ionicons name="receipt-outline" size={40} color={Colors.textMuted} />
              <Text style={s.emptyText}>No transactions yet</Text>
              <Text style={s.emptySubText}>Tap + to add your first one</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingBottom: 20 },
  padH: { paddingHorizontal: Spacing.xl },
  iconBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  monthLabel: { fontSize: 11, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 6 },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  monthSub: { fontSize: 11, color: Colors.textTertiary },
  filterScroll: { marginTop: Spacing.lg },
  filterContent: { gap: Spacing.xs, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg },
  dateGroup: { marginBottom: Spacing.lg },
  dateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm, paddingHorizontal: 4, marginBottom: Spacing.sm },
  dateLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  txInfo: { flex: 1, minWidth: 0 },
  txMerchant: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  txMeta: { fontSize: 11, color: Colors.textTertiary, marginTop: 1 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  emptySubText: { fontSize: 13, color: Colors.textTertiary },
});
