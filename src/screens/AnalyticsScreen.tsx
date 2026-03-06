import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { GlassCard, NeonText, ProgressBar } from '../components';
import { Colors, Spacing, BorderRadius } from '../theme';
import { formatCurrency, getMonthKey } from '../utils';
import { getMonthlyTotal, getSpendingByCategory, getDailySpending } from '../database/transactionService';
import { calculateHealthScore } from '../services/healthScore';
import { generateInsights } from '../services/insightsGenerator';
import { getProjectionChartData } from '../services/projectionEngine';
import { FinancialHealthScore, Insight } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;

export const AnalyticsScreen: React.FC = () => {
    const [healthScore, setHealthScore] = useState<FinancialHealthScore>({ score: 100, label: 'Excellent', color: Colors.cyberGreen });
    const [insights, setInsights] = useState<Insight[]>([]);
    const [categorySpending, setCategorySpending] = useState<any[]>([]);
    const [dailySpending, setDailySpending] = useState<{ date: string; total: number }[]>([]);
    const [projectionData, setProjectionData] = useState<{ labels: string[]; data: number[] }>({ labels: ['Now'], data: [0] });
    const [monthlyExpense, setMonthlyExpense] = useState(0);
    const [monthlyIncome, setMonthlyIncome] = useState(0);

    const loadData = useCallback(async () => {
        const month = getMonthKey();
        const [hs, ins, cats, daily, proj, exp, inc] = await Promise.all([
            calculateHealthScore(),
            generateInsights(),
            getSpendingByCategory(month),
            getDailySpending(month),
            getProjectionChartData(30),
            getMonthlyTotal(month, 'expense'),
            getMonthlyTotal(month, 'income'),
        ]);
        setHealthScore(hs);
        setInsights(ins);
        setCategorySpending(cats);
        setDailySpending(daily);
        setProjectionData(proj);
        setMonthlyExpense(exp);
        setMonthlyIncome(inc);
    }, []);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    const chartConfig = {
        backgroundColor: 'transparent',
        backgroundGradientFrom: Colors.backgroundCard,
        backgroundGradientTo: Colors.backgroundCard,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(0, 212, 255, ${opacity})`,
        labelColor: () => Colors.textTertiary,
        propsForBackgroundLines: { stroke: Colors.border },
    };

    const insightIcon = (type: string) => {
        switch (type) {
            case 'warning': return Colors.neonYellow;
            case 'success': return Colors.cyberGreen;
            case 'tip': return Colors.neonPurple;
            default: return Colors.electricBlue;
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <NeonText variant="title" style={{ paddingTop: Spacing.xxl, marginBottom: Spacing.xl }}>Analytics</NeonText>

                {/* Health Score */}
                <GlassCard style={styles.scoreCard} glowColor={healthScore.color}>
                    <NeonText variant="label" color={Colors.textTertiary}>FINANCIAL HEALTH</NeonText>
                    <View style={styles.scoreRow}>
                        <NeonText variant="hero" glow glowColor={healthScore.color} color={healthScore.color}>
                            {healthScore.score}
                        </NeonText>
                        <View style={{ marginLeft: Spacing.lg }}>
                            <NeonText variant="title" color={healthScore.color}>{healthScore.label}</NeonText>
                            <NeonText variant="caption" color={Colors.textTertiary}>out of 100</NeonText>
                        </View>
                    </View>
                    <ProgressBar
                        progress={healthScore.score / 100}
                        height={6}
                        gradientColors={[healthScore.color, `${healthScore.color}88`] as [string, string]}
                        style={{ marginTop: Spacing.md }}
                    />
                </GlassCard>

                {/* Monthly Summary */}
                <GlassCard style={styles.section}>
                    <NeonText variant="subtitle" style={styles.sectionTitle}>Monthly Summary</NeonText>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <NeonText variant="caption" color={Colors.textTertiary}>Income</NeonText>
                            <NeonText variant="subtitle" color={Colors.cyberGreen}>{formatCurrency(monthlyIncome)}</NeonText>
                        </View>
                        <View style={styles.summaryItem}>
                            <NeonText variant="caption" color={Colors.textTertiary}>Expenses</NeonText>
                            <NeonText variant="subtitle" color={Colors.neonPink}>{formatCurrency(monthlyExpense)}</NeonText>
                        </View>
                        <View style={styles.summaryItem}>
                            <NeonText variant="caption" color={Colors.textTertiary}>Net</NeonText>
                            <NeonText variant="subtitle" color={monthlyIncome - monthlyExpense >= 0 ? Colors.cyberGreen : Colors.neonPink}>
                                {formatCurrency(monthlyIncome - monthlyExpense)}
                            </NeonText>
                        </View>
                    </View>
                </GlassCard>

                {/* Insights */}
                {insights.length > 0 && (
                    <View style={styles.section}>
                        <NeonText variant="subtitle" style={styles.sectionTitle}>Insights</NeonText>
                        {insights.map(insight => (
                            <GlassCard key={insight.id} style={styles.insightCard} glowColor={insightIcon(insight.type)}>
                                <Ionicons name={insight.icon as any} size={24} color={insightIcon(insight.type)} />
                                <View style={{ flex: 1 }}>
                                    <NeonText variant="body" color={insightIcon(insight.type)}>{insight.title}</NeonText>
                                    <NeonText variant="caption" color={Colors.textSecondary}>{insight.description}</NeonText>
                                </View>
                            </GlassCard>
                        ))}
                    </View>
                )}

                {/* Spending by Category */}
                {categorySpending.length > 0 && (
                    <GlassCard style={styles.section}>
                        <NeonText variant="subtitle" style={styles.sectionTitle}>Category Breakdown</NeonText>
                        <PieChart
                            data={categorySpending.slice(0, 6).map(c => ({
                                name: c.category_name,
                                amount: c.total,
                                color: c.category_color,
                                legendFontColor: Colors.textSecondary,
                                legendFontSize: 11,
                            }))}
                            width={CHART_WIDTH}
                            height={180}
                            chartConfig={chartConfig}
                            accessor="amount"
                            backgroundColor="transparent"
                            paddingLeft="0"
                            style={styles.chart}
                        />
                    </GlassCard>
                )}

                {/* Projection */}
                {projectionData.data.length > 1 && (
                    <GlassCard style={styles.section}>
                        <NeonText variant="subtitle" style={styles.sectionTitle}>30-Day Projection</NeonText>
                        <LineChart
                            data={{ labels: projectionData.labels.slice(0, 8), datasets: [{ data: projectionData.data.slice(0, 8) }] }}
                            width={CHART_WIDTH}
                            height={180}
                            chartConfig={chartConfig}
                            bezier
                            style={styles.chart}
                            withInnerLines={false}
                        />
                    </GlassCard>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { paddingHorizontal: Spacing.lg },
    scoreCard: { marginBottom: Spacing.lg, alignItems: 'center' },
    scoreRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md },
    section: { marginBottom: Spacing.lg },
    sectionTitle: { marginBottom: Spacing.md },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryItem: { alignItems: 'center', gap: Spacing.xs },
    insightCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm, paddingVertical: Spacing.md },
    chart: { borderRadius: BorderRadius.md, marginLeft: -Spacing.md },
});
