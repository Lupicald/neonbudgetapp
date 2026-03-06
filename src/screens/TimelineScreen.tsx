import React, { useState, useCallback } from 'react';
import { View, SectionList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, NeonText } from '../components';
import { Colors, Spacing } from '../theme';
import { generateProjection } from '../services/projectionEngine';
import { getTransactions } from '../database/transactionService';
import { ProjectedEvent, Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { format } from 'date-fns';

interface TimelineEvent {
    id: string;
    label: string;
    amount: number;
    type: 'income' | 'expense';
    projectedBalance?: number;
    isProjected: boolean;
}

export const TimelineScreen: React.FC = () => {
    const [sections, setSections] = useState<{ title: string; data: TimelineEvent[] }[]>([]);

    const loadData = useCallback(async () => {
        const events = await generateProjection(30);
        const txs = await getTransactions(50);

        // Combine projected + past into timeline
        const allEvents: { date: string; event: TimelineEvent }[] = [];

        for (const tx of txs) {
            allEvents.push({
                date: tx.date,
                event: {
                    id: `tx-${tx.id}`,
                    label: tx.merchant_name || tx.category_name || 'Transaction',
                    amount: tx.amount,
                    type: tx.type,
                    isProjected: false,
                },
            });
        }

        for (const ev of events) {
            allEvents.push({
                date: ev.date,
                event: {
                    id: `proj-${ev.date}-${ev.label}`,
                    label: ev.label,
                    amount: ev.amount,
                    type: ev.type,
                    projectedBalance: ev.projectedBalance,
                    isProjected: true,
                },
            });
        }

        // Group by date
        const grouped: Record<string, TimelineEvent[]> = {};
        for (const { date, event } of allEvents) {
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(event);
        }

        const sectionData = Object.keys(grouped)
            .sort()
            .map(date => ({
                title: date,
                data: grouped[date],
            }));

        setSections(sectionData);
    }, []);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <NeonText variant="title" style={{ paddingTop: Spacing.xxl }}>Financial Timeline</NeonText>
            </View>

            <SectionList
                sections={sections}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="time-outline" size={64} color={Colors.textMuted} />
                        <NeonText variant="subtitle" color={Colors.textMuted}>No events</NeonText>
                    </View>
                }
                renderSectionHeader={({ section }) => (
                    <View style={styles.dateHeader}>
                        <View style={styles.dateDot} />
                        <NeonText variant="label" color={Colors.electricBlue} glow glowColor={Colors.electricBlue}>
                            {formatDate(section.title)}
                        </NeonText>
                    </View>
                )}
                renderItem={({ item }) => (
                    <View style={styles.eventRow}>
                        <View style={styles.timeline}>
                            <View style={[styles.dot, { backgroundColor: item.type === 'income' ? Colors.cyberGreen : Colors.neonPink }]} />
                            <View style={styles.line} />
                        </View>
                        <GlassCard style={styles.eventCard}>
                            <View style={{ flex: 1 }}>
                                <View style={styles.eventLabel}>
                                    <NeonText variant="body">{item.label}</NeonText>
                                    {item.isProjected && (
                                        <View style={styles.projectedBadge}>
                                            <NeonText variant="caption" color={Colors.neonPurple}>Projected</NeonText>
                                        </View>
                                    )}
                                </View>
                                {item.projectedBalance !== undefined && (
                                    <NeonText variant="caption" color={Colors.textTertiary}>
                                        Balance: {formatCurrency(item.projectedBalance)}
                                    </NeonText>
                                )}
                            </View>
                            <NeonText
                                variant="subtitle"
                                color={item.type === 'income' ? Colors.cyberGreen : Colors.neonPink}
                                glow
                                glowColor={item.type === 'income' ? Colors.cyberGreen : Colors.neonPink}
                            >
                                {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                            </NeonText>
                        </GlassCard>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
    listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
    empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: Spacing.md },
    dateHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg, marginBottom: Spacing.sm },
    dateDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.electricBlue },
    eventRow: { flexDirection: 'row', marginBottom: Spacing.xs },
    timeline: { width: 24, alignItems: 'center', paddingTop: Spacing.lg },
    dot: { width: 10, height: 10, borderRadius: 5 },
    line: { flex: 1, width: 2, backgroundColor: Colors.border, marginTop: 4 },
    eventCard: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: Spacing.sm, paddingVertical: Spacing.md },
    eventLabel: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    projectedBadge: { backgroundColor: `${Colors.neonPurple}20`, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: 4 },
});
