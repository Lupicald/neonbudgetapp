import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    RefreshControl,
    Platform,
    Animated,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, NeonText, ProgressBar, FadeIn } from '../components';
import { Colors, Spacing, BorderRadius, Shadows, FontSize, FontWeight } from '../theme';
import { formatCurrency, getMonthKey } from '../utils';
import { getAccounts, getTotalBalance } from '../database/accountService';
import { getMonthlyTotal, getSpendingByCategory, getDailySpending } from '../database/transactionService';
import { generateProjection, getNextEvent, getProjectionChartData } from '../services/projectionEngine';
import { calculateHealthScore } from '../services/healthScore';
import { getStreak } from '../services/gamification';
import { ProjectedEvent, FinancialHealthScore, Account } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48;

export const DashboardScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [refreshing, setRefreshing] = useState(false);
    const [balance, setBalance] = useState(0);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [monthlyExpense, setMonthlyExpense] = useState(0);
    const [monthlyIncome, setMonthlyIncome] = useState(0);
    const [nextIncome, setNextIncome] = useState<ProjectedEvent | null>(null);
    const [nextExpense, setNextExpense] = useState<ProjectedEvent | null>(null);
    const [categorySpending, setCategorySpending] = useState<any[]>([]);
    const [projectionData, setProjectionData] = useState<{ labels: string[]; data: number[] }>({ labels: ['Now'], data: [0] });
    const [dailySpending, setDailySpending] = useState<{ date: string; total: number }[]>([]);
    const [healthScore, setHealthScore] = useState<FinancialHealthScore>({ score: 100, label: 'Excellent', color: Colors.cyberGreen });
    const [streak, setStreak] = useState(0);

    const loadData = useCallback(async () => {
        try {
            const month = getMonthKey();
            const [accs, totalBal, exp, inc, ni, ne, cats, proj, daily, hs, st] = await Promise.all([
                getAccounts(),
                getTotalBalance(),
                getMonthlyTotal(month, 'expense'),
                getMonthlyTotal(month, 'income'),
                getNextEvent('income'),
                getNextEvent('expense'),
                getSpendingByCategory(month),
                getProjectionChartData(30),
                getDailySpending(month),
                calculateHealthScore(),
                getStreak(),
            ]);
            setAccounts(accs);
            setBalance(totalBal);
            setMonthlyExpense(exp);
            setMonthlyIncome(inc);
            setNextIncome(ni);
            setNextExpense(ne);
            setCategorySpending(cats);
            setProjectionData(proj.data.length > 0 ? proj : { labels: ['Now'], data: [totalBal] });
            setDailySpending(daily);
            setHealthScore(hs);
            setStreak(st);
        } catch (error) {
            console.log('Dashboard load error:', error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const topCategories = categorySpending.slice(0, 5);
    const maxCatAmount = topCategories.reduce((m, c) => Math.max(m, c.total), 0) || 1;

    const lineData = {
        labels: projectionData.labels.slice(0, 8),
        datasets: [{ data: projectionData.data.slice(0, 8), strokeWidth: 2.5 }],
    };

    const barData = {
        labels: dailySpending.slice(-7).map(d => d.date.slice(-2)),
        datasets: [{ data: dailySpending.slice(-7).map(d => d.total || 0.01) }],
    };

    const lineChartConfig = {
        backgroundColor: 'transparent',
        backgroundGradientFrom: Colors.backgroundCard,
        backgroundGradientTo: Colors.backgroundCard,
        backgroundGradientFromOpacity: 0,
        backgroundGradientToOpacity: 0,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(0, 212, 255, ${opacity})`,
        labelColor: () => Colors.textTertiary,
        propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: Colors.electricBlue,
            fill: Colors.electricBlue,
        },
        propsForBackgroundLines: {
            strokeDasharray: '4,4',
            stroke: 'rgba(255,255,255,0.06)',
        },
        fillShadowGradientFrom: Colors.electricBlue,
        fillShadowGradientTo: 'transparent',
        fillShadowGradientFromOpacity: 0.3,
        fillShadowGradientToOpacity: 0,
    };

    const barChartConfig = {
        backgroundColor: 'transparent',
        backgroundGradientFrom: Colors.backgroundCard,
        backgroundGradientTo: Colors.backgroundCard,
        backgroundGradientFromOpacity: 0,
        backgroundGradientToOpacity: 0,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(123, 47, 255, ${opacity})`,
        labelColor: () => Colors.textTertiary,
        propsForBackgroundLines: {
            strokeDasharray: '4,4',
            stroke: 'rgba(255,255,255,0.06)',
        },
        barPercentage: 0.6,
    };

    const spendRatio = monthlyIncome > 0 ? monthlyExpense / monthlyIncome : 0;
    const balanceColor = balance >= 0 ? Colors.cyberGreen : Colors.neonPink;
    const balanceGlow = balance >= 0 ? Colors.glowGreen : Colors.glowPink;

    const now = new Date();
    const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <View style={styles.container}>
            {/* Background ambient glow */}
            <View style={styles.ambientGlow1} pointerEvents="none" />
            <View style={styles.ambientGlow2} pointerEvents="none" />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.electricBlue}
                        colors={[Colors.electricBlue, Colors.neonPurple]}
                    />
                }
            >
                {/* ── HEADER ── */}
                <FadeIn>
                    <View style={styles.header}>
                        <View>
                            <NeonText variant="caption" color={Colors.textTertiary}>{greeting} 👋</NeonText>
                            <NeonText variant="title" color={Colors.textPrimary}>My Finances</NeonText>
                        </View>
                        <TouchableOpacity
                            style={styles.scoreBadge}
                            onPress={() => navigation.navigate('Analytics')}
                        >
                            <LinearGradient
                                colors={[Colors.neonPurple, Colors.electricBlue] as [string, string]}
                                style={styles.scoreBadgeGrad}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <NeonText variant="subtitle" color="#fff" style={{ fontWeight: '800' }}>
                                    {healthScore.score}
                                </NeonText>
                                <NeonText variant="caption" color="rgba(255,255,255,0.75)" style={{ fontSize: 9 }}>
                                    SCORE
                                </NeonText>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </FadeIn>

                {/* ── HERO BALANCE CARD ── */}
                <FadeIn>
                    <GlassCard hero style={styles.heroCard}>
                        {/* Glow orb inside card */}
                        <View style={styles.heroOrb} pointerEvents="none" />

                        <NeonText variant="label" color="rgba(255,255,255,0.5)">TOTAL BALANCE</NeonText>
                        <NeonText
                            variant="hero"
                            glow
                            glowColor={balanceGlow}
                            color={balanceColor}
                            style={styles.heroBalance}
                        >
                            {formatCurrency(balance)}
                        </NeonText>

                        {/* Income / Expense chips */}
                        <View style={styles.heroChips}>
                            <View style={styles.heroChip}>
                                <LinearGradient
                                    colors={['rgba(0,255,136,0.15)', 'rgba(0,212,255,0.08)'] as [string, string]}
                                    style={styles.heroChipGrad}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                >
                                    <View style={[styles.chipDot, { backgroundColor: Colors.cyberGreen }]} />
                                    <View>
                                        <NeonText variant="label" color={Colors.textTertiary}>INCOME</NeonText>
                                        <NeonText variant="body" color={Colors.cyberGreen} style={{ fontWeight: '700' }}>
                                            +{formatCurrency(monthlyIncome)}
                                        </NeonText>
                                    </View>
                                </LinearGradient>
                            </View>
                            <View style={styles.heroChip}>
                                <LinearGradient
                                    colors={['rgba(255,45,110,0.15)', 'rgba(255,140,0,0.08)'] as [string, string]}
                                    style={styles.heroChipGrad}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                >
                                    <View style={[styles.chipDot, { backgroundColor: Colors.neonPink }]} />
                                    <View>
                                        <NeonText variant="label" color={Colors.textTertiary}>EXPENSES</NeonText>
                                        <NeonText variant="body" color={Colors.neonPink} style={{ fontWeight: '700' }}>
                                            -{formatCurrency(monthlyExpense)}
                                        </NeonText>
                                    </View>
                                </LinearGradient>
                            </View>
                        </View>
                    </GlassCard>
                </FadeIn>

                {/* ── QUICK ACTIONS ── */}
                <FadeIn>
                    <View style={styles.quickActions}>
                        {[
                            { icon: 'add-circle', label: 'Add', color: Colors.neonPurple, glow: Colors.glowPurple, action: () => navigation.navigate('AddTransaction') },
                            { icon: 'swap-horizontal', label: 'Transfer', color: Colors.electricBlue, glow: Colors.glowBlue, action: () => navigation.navigate('Accounts') },
                            { icon: 'repeat', label: 'Recurring', color: Colors.cyberGreen, glow: Colors.glowGreen, action: () => navigation.navigate('Settings') },
                            { icon: 'analytics', label: 'Analytics', color: Colors.neonOrange, glow: Colors.glowOrange, action: () => navigation.navigate('Analytics') },
                        ].map((item) => (
                            <TouchableOpacity
                                key={item.label}
                                style={styles.quickActionItem}
                                onPress={item.action}
                                activeOpacity={0.75}
                            >
                                <View style={[styles.quickActionIcon, {
                                    borderColor: `${item.color}44`,
                                    shadowColor: item.glow,
                                    shadowOpacity: 0.6,
                                    shadowRadius: 12,
                                    elevation: 8,
                                }]}>
                                    <LinearGradient
                                        colors={[`${item.color}30`, `${item.color}10`] as [string, string]}
                                        style={StyleSheet.absoluteFill}
                                        borderRadius={20}
                                    />
                                    <Ionicons name={item.icon as any} size={24} color={item.color} />
                                </View>
                                <NeonText variant="caption" color={Colors.textSecondary} align="center" style={{ marginTop: 6 }}>
                                    {item.label}
                                </NeonText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </FadeIn>

                {/* ── MONTHLY SPENDING PROGRESS ── */}
                <FadeIn>
                    <GlassCard style={styles.section} glowColor={spendRatio > 0.9 ? Colors.glowPink : spendRatio > 0.7 ? Colors.glowOrange : Colors.glowBlue}>
                        <View style={styles.sectionHeader}>
                            <NeonText variant="subtitle">Monthly Budget</NeonText>
                            <NeonText variant="caption" color={spendRatio > 0.9 ? Colors.neonPink : Colors.textTertiary}>
                                {Math.round(spendRatio * 100)}% used
                            </NeonText>
                        </View>
                        <ProgressBar
                            progress={spendRatio}
                            height={10}
                            label="Spent"
                            valueLabel={`${formatCurrency(monthlyExpense)} / ${formatCurrency(monthlyIncome)}`}
                            warning={spendRatio > 0.7}
                            danger={spendRatio > 0.9}
                        />
                    </GlassCard>
                </FadeIn>

                {/* ── BALANCE PROJECTION CHART ── */}
                <FadeIn>
                    <GlassCard style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <NeonText variant="subtitle">Balance Projection</NeonText>
                            <View style={styles.chartLegend}>
                                <View style={[styles.legendDot, { backgroundColor: Colors.electricBlue }]} />
                                <NeonText variant="caption" color={Colors.textTertiary}>30 days</NeonText>
                            </View>
                        </View>
                        {lineData.datasets[0].data.length > 1 ? (
                            <LineChart
                                data={lineData}
                                width={CHART_WIDTH}
                                height={170}
                                chartConfig={lineChartConfig}
                                bezier
                                style={styles.chart}
                                withInnerLines={false}
                                withOuterLines={false}
                                withVerticalLabels={true}
                                withHorizontalLabels={true}
                                transparent
                            />
                        ) : (
                            <View style={styles.emptyChart}>
                                <Ionicons name="analytics-outline" size={36} color={Colors.textMuted} />
                                <NeonText variant="caption" color={Colors.textMuted} align="center">
                                    Add recurring items to see projections
                                </NeonText>
                            </View>
                        )}
                    </GlassCard>
                </FadeIn>

                {/* ── NEXT EVENTS ── */}
                <View style={styles.row}>
                    <FadeIn style={{ flex: 1 }}>
                        <GlassCard style={[styles.eventCard]} glowColor={Colors.cyberGreenDark}>
                            <View style={[styles.eventBar, { backgroundColor: Colors.cyberGreen }]} />
                            <Ionicons name="wallet-outline" size={18} color={Colors.cyberGreen} style={{ marginBottom: 4 }} />
                            <NeonText variant="label" color={Colors.textTertiary}>NEXT INCOME</NeonText>
                            {nextIncome ? (
                                <>
                                    <NeonText variant="body" color={Colors.textPrimary} numberOfLines={1} style={{ fontWeight: '600', marginTop: 4 }}>
                                        {nextIncome.label}
                                    </NeonText>
                                    <NeonText variant="subtitle" color={Colors.cyberGreen} glow glowColor={Colors.glowGreen}>
                                        {formatCurrency(nextIncome.amount)}
                                    </NeonText>
                                    <NeonText variant="caption" color={Colors.textTertiary}>{nextIncome.date}</NeonText>
                                </>
                            ) : (
                                <NeonText variant="caption" color={Colors.textMuted} style={{ marginTop: 4 }}>No upcoming</NeonText>
                            )}
                        </GlassCard>
                    </FadeIn>
                    <View style={{ width: Spacing.md }} />
                    <FadeIn style={{ flex: 1 }}>
                        <GlassCard style={[styles.eventCard]} glowColor={Colors.neonPinkDark}>
                            <View style={[styles.eventBar, { backgroundColor: Colors.neonPink }]} />
                            <Ionicons name="card-outline" size={18} color={Colors.neonPink} style={{ marginBottom: 4 }} />
                            <NeonText variant="label" color={Colors.textTertiary}>NEXT EXPENSE</NeonText>
                            {nextExpense ? (
                                <>
                                    <NeonText variant="body" color={Colors.textPrimary} numberOfLines={1} style={{ fontWeight: '600', marginTop: 4 }}>
                                        {nextExpense.label}
                                    </NeonText>
                                    <NeonText variant="subtitle" color={Colors.neonPink} glow glowColor={Colors.glowPink}>
                                        {formatCurrency(nextExpense.amount)}
                                    </NeonText>
                                    <NeonText variant="caption" color={Colors.textTertiary}>{nextExpense.date}</NeonText>
                                </>
                            ) : (
                                <NeonText variant="caption" color={Colors.textMuted} style={{ marginTop: 4 }}>No upcoming</NeonText>
                            )}
                        </GlassCard>
                    </FadeIn>
                </View>

                {/* ── CATEGORY SPENDING ── */}
                {topCategories.length > 0 && (
                    <FadeIn>
                        <GlassCard style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <NeonText variant="subtitle">Spending by Category</NeonText>
                                <TouchableOpacity onPress={() => navigation.navigate('Analytics')}>
                                    <NeonText variant="caption" color={Colors.electricBlue}>See all</NeonText>
                                </TouchableOpacity>
                            </View>
                            {topCategories.map((cat, idx) => (
                                <View key={cat.category_name || idx} style={styles.catRow}>
                                    <View style={[styles.catDot, { backgroundColor: cat.category_color || Colors.neonPurple }]} />
                                    <NeonText variant="body" color={Colors.textSecondary} numberOfLines={1} style={styles.catName}>
                                        {cat.category_name || 'Other'}
                                    </NeonText>
                                    <View style={styles.catBarWrapper}>
                                        <View style={[styles.catBar, {
                                            width: `${Math.round((cat.total / maxCatAmount) * 100)}%`,
                                            backgroundColor: cat.category_color || Colors.neonPurple,
                                            shadowColor: cat.category_color || Colors.neonPurple,
                                            shadowOpacity: 0.7,
                                            shadowRadius: 6,
                                        }]} />
                                    </View>
                                    <NeonText variant="caption" color={Colors.textSecondary} style={styles.catAmount}>
                                        {formatCurrency(cat.total)}
                                    </NeonText>
                                </View>
                            ))}
                        </GlassCard>
                    </FadeIn>
                )}

                {/* ── DAILY SPENDING BAR CHART ── */}
                {dailySpending.length > 0 && (
                    <FadeIn>
                        <GlassCard style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <NeonText variant="subtitle">Daily Spending</NeonText>
                                <NeonText variant="caption" color={Colors.textTertiary}>Last 7 days</NeonText>
                            </View>
                            <BarChart
                                data={barData}
                                width={CHART_WIDTH}
                                height={160}
                                chartConfig={barChartConfig}
                                style={styles.chart}
                                withInnerLines={false}
                                showBarTops={false}
                                yAxisLabel="$"
                                yAxisSuffix=""
                                flatColor
                                fromZero
                            />
                        </GlassCard>
                    </FadeIn>
                )}

                {/* ── ACCOUNTS CARD ── */}
                {accounts.length > 0 && (
                    <FadeIn>
                        <GlassCard style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <NeonText variant="subtitle">Accounts</NeonText>
                                <TouchableOpacity onPress={() => navigation.navigate('Accounts')}>
                                    <NeonText variant="caption" color={Colors.electricBlue}>Manage</NeonText>
                                </TouchableOpacity>
                            </View>
                            {accounts.map(acc => (
                                <View key={acc.id} style={styles.accountRow}>
                                    <View style={styles.accountLeft}>
                                        <View style={[styles.accountDot, { backgroundColor: acc.color, shadowColor: acc.color, shadowOpacity: 0.8, shadowRadius: 6 }]} />
                                        <NeonText variant="body" numberOfLines={1}>{acc.name}</NeonText>
                                    </View>
                                    <NeonText
                                        variant="body"
                                        color={acc.balance >= 0 ? Colors.cyberGreen : Colors.neonPink}
                                        style={{ fontWeight: '700' }}
                                    >
                                        {formatCurrency(acc.balance)}
                                    </NeonText>
                                </View>
                            ))}
                        </GlassCard>
                    </FadeIn>
                )}

                {/* ── STREAK ── */}
                {streak > 0 && (
                    <FadeIn>
                        <GlassCard style={styles.streakCard} glowColor={Colors.glowOrange}>
                            <View style={styles.streakRow}>
                                <Ionicons name="flame" size={22} color={Colors.neonOrange} />
                                <NeonText variant="subtitle" glow glowColor={Colors.glowOrange} color={Colors.neonOrange}>
                                    {streak} Day Streak
                                </NeonText>
                                <Ionicons name="flame" size={22} color={Colors.neonOrange} />
                            </View>
                        </GlassCard>
                    </FadeIn>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ── FLOATING ACTION BUTTON ── */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddTransaction')}
                activeOpacity={0.85}
            >
                <LinearGradient
                    colors={[Colors.neonPurple, Colors.electricBlue] as [string, string]}
                    style={styles.fabGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="add" size={30} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    ambientGlow1: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(123, 47, 255, 0.08)',
        top: -80,
        left: -80,
    },
    ambientGlow2: {
        position: 'absolute',
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(0, 212, 255, 0.06)',
        top: 200,
        right: -60,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Platform.OS === 'android' ? Spacing.xxxl + 8 : Spacing.xxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
        paddingTop: Spacing.xxl,
    },
    scoreBadge: {
        ...Shadows.glowPurple,
    },
    scoreBadgeGrad: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroCard: {
        marginBottom: Spacing.xl,
        position: 'relative',
        overflow: 'visible',
    },
    heroOrb: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(123, 47, 255, 0.15)',
        right: -50,
        top: -40,
    },
    heroBalance: {
        marginTop: Spacing.xs,
        marginBottom: Spacing.xl,
        fontSize: 44,
        letterSpacing: -2,
    },
    heroChips: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    heroChip: {
        flex: 1,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    heroChipGrad: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        gap: Spacing.sm,
    },
    chipDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.xl,
    },
    quickActionItem: {
        alignItems: 'center',
        flex: 1,
    },
    quickActionIcon: {
        width: 54,
        height: 54,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        overflow: 'hidden',
    },
    section: {
        marginBottom: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    row: {
        flexDirection: 'row',
        marginBottom: Spacing.lg,
    },
    eventCard: {
        flex: 1,
        gap: Spacing.xs,
        paddingTop: Spacing.md,
        position: 'relative',
        overflow: 'hidden',
    },
    eventBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        borderRadius: 2,
    },
    chart: {
        borderRadius: BorderRadius.md,
        marginLeft: -Spacing.md,
    },
    emptyChart: {
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    chartLegend: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    legendDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    catRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
        gap: Spacing.sm,
    },
    catDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    catName: {
        width: 80,
        fontSize: 12,
    },
    catBarWrapper: {
        flex: 1,
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    catBar: {
        height: 6,
        borderRadius: 3,
    },
    catAmount: {
        width: 64,
        textAlign: 'right',
        fontSize: 11,
    },
    accountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    accountLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    accountDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    streakCard: {
        marginBottom: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    streakRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    fab: {
        position: 'absolute',
        right: Spacing.xl,
        bottom: Spacing.xl + 4,
        ...Shadows.glowPurple,
    },
    fabGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
