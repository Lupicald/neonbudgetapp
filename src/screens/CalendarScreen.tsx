import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, NeonText, CategoryIcon } from '../components';
import { Colors, Spacing, BorderRadius } from '../theme';
import { generateProjection } from '../services/projectionEngine';
import { getTransactions } from '../database/transactionService';
import { ProjectedEvent, Transaction } from '../types';
import { formatCurrency } from '../utils';

export const CalendarScreen: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState('');
    const [projectedEvents, setProjectedEvents] = useState<ProjectedEvent[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [markedDates, setMarkedDates] = useState<any>({});

    const loadData = useCallback(async () => {
        const events = await generateProjection(60);
        const txs = await getTransactions(200);
        setProjectedEvents(events);
        setTransactions(txs);

        // Build marked dates
        const marks: any = {};
        for (const event of events) {
            marks[event.date] = {
                marked: true,
                dotColor: event.type === 'income' ? Colors.cyberGreen : Colors.neonPink,
            };
        }
        for (const tx of txs) {
            if (marks[tx.date]) {
                marks[tx.date].dots = [
                    { color: marks[tx.date].dotColor || Colors.electricBlue },
                    { color: tx.type === 'income' ? Colors.cyberGreen : Colors.neonPink },
                ];
            } else {
                marks[tx.date] = {
                    marked: true,
                    dotColor: tx.type === 'income' ? Colors.cyberGreen : Colors.neonPink,
                };
            }
        }
        setMarkedDates(marks);
    }, []);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    const getEventsForDate = (date: string) => {
        const projected = projectedEvents.filter(e => e.date === date);
        const pastTx = transactions.filter(t => t.date === date);
        return { projected, pastTx };
    };

    const { projected, pastTx } = selectedDate ? getEventsForDate(selectedDate) : { projected: [], pastTx: [] };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <NeonText variant="title" style={{ paddingTop: Spacing.xxl }}>Financial Calendar</NeonText>
            </View>

            <Calendar
                style={styles.calendar}
                theme={{
                    calendarBackground: Colors.backgroundCard,
                    textSectionTitleColor: Colors.textTertiary,
                    dayTextColor: Colors.textPrimary,
                    todayTextColor: Colors.electricBlue,
                    selectedDayBackgroundColor: Colors.neonPurple,
                    selectedDayTextColor: Colors.textPrimary,
                    monthTextColor: Colors.textPrimary,
                    arrowColor: Colors.electricBlue,
                    textDisabledColor: Colors.textMuted,
                    dotColor: Colors.electricBlue,
                    selectedDotColor: Colors.textPrimary,
                }}
                markedDates={{
                    ...markedDates,
                    ...(selectedDate ? { [selectedDate]: { ...markedDates[selectedDate], selected: true, selectedColor: Colors.neonPurple } } : {}),
                }}
                onDayPress={(day: any) => setSelectedDate(day.dateString)}
            />

            {selectedDate && (
                <FlatList
                    data={[...pastTx.map(t => ({ ...t, isProjected: false })), ...projected.map(p => ({ ...p, isProjected: true }))]}
                    keyExtractor={(_, i) => String(i)}
                    style={styles.eventList}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    ListHeaderComponent={
                        <NeonText variant="label" color={Colors.textTertiary} style={{ marginBottom: Spacing.sm }}>
                            {selectedDate}
                        </NeonText>
                    }
                    ListEmptyComponent={
                        <NeonText variant="caption" color={Colors.textMuted}>No events on this date</NeonText>
                    }
                    renderItem={({ item }: any) => (
                        <GlassCard style={styles.eventCard}>
                            <Ionicons
                                name={item.type === 'income' ? 'arrow-down-circle' : 'arrow-up-circle'}
                                size={24}
                                color={item.type === 'income' ? Colors.cyberGreen : Colors.neonPink}
                            />
                            <View style={{ flex: 1 }}>
                                <NeonText variant="body">{item.label || item.merchant_name || item.category_name || 'Transaction'}</NeonText>
                                {item.isProjected && <NeonText variant="caption" color={Colors.neonPurple}>Projected</NeonText>}
                            </View>
                            <NeonText variant="subtitle" color={item.type === 'income' ? Colors.cyberGreen : Colors.neonPink}>
                                {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                            </NeonText>
                        </GlassCard>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
    calendar: { marginHorizontal: Spacing.lg, borderRadius: BorderRadius.lg, overflow: 'hidden' },
    eventList: { flex: 1, paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
    eventCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm, paddingVertical: Spacing.md },
});
