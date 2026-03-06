import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassCard, NeonText, NeonButton, GlowInput } from '../components';
import { Colors, Spacing, BorderRadius } from '../theme';
import { getAccounts } from '../database/accountService';
import { createTransfer, getTransfers, deleteTransfer, Transfer, ensureTransfersTable } from '../database/transferService';
import { Account } from '../types';
import { formatCurrency } from '../utils';

export const TransferScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [fromId, setFromId] = useState<number | null>(null);
    const [toId, setToId] = useState<number | null>(null);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [showForm, setShowForm] = useState(false);

    const loadData = useCallback(async () => {
        await ensureTransfersTable();
        setAccounts(await getAccounts());
        setTransfers(await getTransfers());
    }, []);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    const handleTransfer = async () => {
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
        if (!fromId || !toId) { Alert.alert('Error', 'Select both accounts'); return; }
        if (fromId === toId) { Alert.alert('Error', 'Cannot transfer to the same account'); return; }

        await createTransfer(fromId, toId, numAmount, note);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAmount(''); setNote(''); setShowForm(false);
        loadData();
    };

    const handleDeleteTransfer = (t: Transfer) => {
        Alert.alert('Delete Transfer', `Delete ${formatCurrency(t.amount)} transfer?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    await deleteTransfer(t.id, t.from_account_id, t.to_account_id, t.amount);
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    loadData();
                }
            },
        ]);
    };

    const fromAccount = accounts.find(a => a.id === fromId);
    const toAccount = accounts.find(a => a.id === toId);

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back-outline" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <NeonText variant="title">Transfers</NeonText>
                    <TouchableOpacity onPress={() => setShowForm(!showForm)}>
                        <Ionicons name={showForm ? 'close-outline' : 'add-circle-outline'} size={28} color={Colors.electricBlue} />
                    </TouchableOpacity>
                </View>

                {showForm && (
                    <GlassCard style={styles.form} glowColor={Colors.neonPurple}>
                        <NeonText variant="subtitle">New Transfer</NeonText>

                        {/* From Account */}
                        <NeonText variant="label" style={styles.label}>FROM</NeonText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountScroll}>
                            {accounts.map(a => (
                                <TouchableOpacity key={a.id}
                                    style={[styles.accountChip, fromId === a.id && { backgroundColor: `${a.color}30`, borderColor: a.color }]}
                                    onPress={() => setFromId(a.id)}>
                                    <Ionicons name={a.icon as any} size={16} color={fromId === a.id ? a.color : Colors.textTertiary} />
                                    <NeonText variant="caption" color={fromId === a.id ? a.color : Colors.textTertiary}>{a.name}</NeonText>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Arrow */}
                        <View style={styles.arrowContainer}>
                            <Ionicons name="arrow-down-outline" size={28} color={Colors.electricBlue} />
                        </View>

                        {/* To Account */}
                        <NeonText variant="label" style={styles.label}>TO</NeonText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountScroll}>
                            {accounts.filter(a => a.id !== fromId).map(a => (
                                <TouchableOpacity key={a.id}
                                    style={[styles.accountChip, toId === a.id && { backgroundColor: `${a.color}30`, borderColor: a.color }]}
                                    onPress={() => setToId(a.id)}>
                                    <Ionicons name={a.icon as any} size={16} color={toId === a.id ? a.color : Colors.textTertiary} />
                                    <NeonText variant="caption" color={toId === a.id ? a.color : Colors.textTertiary}>{a.name}</NeonText>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <GlowInput label="Amount" placeholder="0.00" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
                        <GlowInput label="Note (optional)" placeholder="Reason..." value={note} onChangeText={setNote} />

                        {/* Summary */}
                        {fromAccount && toAccount && amount && (
                            <GlassCard style={styles.summary}>
                                <NeonText variant="body" color={Colors.textSecondary}>
                                    {fromAccount.name} → {toAccount.name}
                                </NeonText>
                                <NeonText variant="subtitle" glow glowColor={Colors.electricBlue} color={Colors.electricBlue}>
                                    {formatCurrency(parseFloat(amount) || 0)}
                                </NeonText>
                            </GlassCard>
                        )}

                        <NeonButton title="Transfer" onPress={handleTransfer} variant="primary" fullWidth />
                    </GlassCard>
                )}

                {/* Transfer History */}
                <NeonText variant="subtitle" style={styles.historyTitle}>History</NeonText>
                {transfers.map(t => (
                    <TouchableOpacity key={t.id} onLongPress={() => handleDeleteTransfer(t)} activeOpacity={0.7}>
                        <GlassCard style={styles.transferCard}>
                            <View style={styles.transferRow}>
                                <View style={{ flex: 1 }}>
                                    <NeonText variant="body">{t.from_account_name} → {t.to_account_name}</NeonText>
                                    {t.note ? <NeonText variant="caption" color={Colors.textTertiary}>{t.note}</NeonText> : null}
                                    <NeonText variant="caption" color={Colors.textMuted}>{t.date}</NeonText>
                                </View>
                                <NeonText variant="subtitle" color={Colors.electricBlue}>{formatCurrency(t.amount)}</NeonText>
                            </View>
                        </GlassCard>
                    </TouchableOpacity>
                ))}

                {transfers.length === 0 && !showForm && (
                    <View style={styles.empty}>
                        <Ionicons name="swap-horizontal-outline" size={64} color={Colors.textMuted} />
                        <NeonText variant="body" color={Colors.textMuted}>No transfers yet</NeonText>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { paddingHorizontal: Spacing.lg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.xxl + Spacing.xl, paddingBottom: Spacing.md },
    form: { marginBottom: Spacing.lg },
    label: { marginBottom: Spacing.sm, color: Colors.textSecondary },
    accountScroll: { marginBottom: Spacing.md },
    accountChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, marginRight: Spacing.sm },
    arrowContainer: { alignItems: 'center', marginVertical: Spacing.sm },
    summary: { alignItems: 'center', marginBottom: Spacing.md, paddingVertical: Spacing.md },
    historyTitle: { marginBottom: Spacing.md },
    transferCard: { marginBottom: Spacing.sm },
    transferRow: { flexDirection: 'row', alignItems: 'center' },
    empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.md },
});
