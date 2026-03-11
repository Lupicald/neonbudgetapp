import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, NeonText, ProgressBar } from '../components';
import { Colors, Spacing, BorderRadius, FontSize } from '../theme';
import { formatCurrency, getMonthKey } from '../utils';
import { getMonthlyTotal, getSpendingByCategory, getMonthlyTotalsRange } from '../database/transactionService';
import { getRecurringItems, generateFutureOccurrences } from '../database/recurringService';
import { calculateHealthScore } from '../services/healthScore';
import { generateInsights } from '../services/insightsGenerator';
import { FinancialHealthScore, Insight, RecurringItem } from '../types';
import { format, subMonths, addMonths, parseISO } from 'date-fns';

const NOW_KEY = format(new Date(), 'yyyy-MM');

const buildRange = (past: number, future: number): string[] => {
    const now = new Date();
    const r: string[] = [];
    for (let i = past; i >= 0; i--) r.push(format(subMonths(now, i), 'yyyy-MM'));
    for (let i = 1; i <= future; i++) r.push(format(addMonths(now, i), 'yyyy-MM'));
    return r;
};

const lbl = (ym: string) => {
    const [y, m] = ym.split('-');
    return format(new Date(+y, +m - 1, 1), 'MMM').toLowerCase() + ' \'' + y.slice(2);
};

interface MD { month: string; label: string; income: number; expense: number; isProjected: boolean; isCurrent: boolean; }

export const AnalyticsScreen: React.FC = () => {
    const [hs, setHs] = useState<FinancialHealthScore>({ score: 100, label: 'Excellent', color: Colors.cyberGreen });
    const [insights, setInsights] = useState<Insight[]>([]);
    const [cats, setCats] = useState<any[]>([]);
    const [monthlyExp, setMonthlyExp] = useState(0);
    const [monthlyInc, setMonthlyInc] = useState(0);
    const [flow, setFlow] = useState<MD[]>([]);

    const load = useCallback(async () => {
        const month = getMonthKey();
        const range = buildRange(4, 2);
        const pastKeys = range.filter(m => m <= NOW_KEY);
        const futureKeys = range.filter(m => m > NOW_KEY);

        const [hScore, ins, catData, exp, inc, pastTotals, recurring] = await Promise.all([
            calculateHealthScore(),
            generateInsights(),
            getSpendingByCategory(month),
            getMonthlyTotal(month, 'expense'),
            getMonthlyTotal(month, 'income'),
            getMonthlyTotalsRange(pastKeys),
            getRecurringItems(),
        ]);

        setHs(hScore);
        setInsights(ins);
        setCats(catData);
        setMonthlyExp(exp);
        setMonthlyInc(inc);

        // Project all months (current + future) from active recurring
        const proj: Record<string, { income: number; expense: number }> = {};
        for (const m of range) proj[m] = { income: 0, expense: 0 };
        for (const item of (recurring as RecurringItem[]).filter(r => r.is_active)) {
            for (const occ of generateFutureOccurrences(item, 120)) {
                const k = occ.date.slice(0, 7);
                if (proj[k]) {
                    if (occ.type === 'income') proj[k].income += occ.amount;
                    else proj[k].expense += occ.amount;
                }
            }
        }

        setFlow(range.map(m => {
            const fut = m > NOW_KEY;
            const act = pastTotals.find(p => p.month === m);
            // Past months: actual data only
            // Current month: actual + recurring scheduled for rest of month
            // Future months: purely recurring projection
            const income = fut
                ? (proj[m]?.income || 0)
                : m === NOW_KEY
                    ? (act?.income || 0) + (proj[m]?.income || 0)
                    : (act?.income || 0);
            const expense = fut
                ? (proj[m]?.expense || 0)
                : m === NOW_KEY
                    ? (act?.expense || 0) + (proj[m]?.expense || 0)
                    : (act?.expense || 0);
            return {
                month: m, label: lbl(m),
                income, expense,
                isProjected: fut, isCurrent: m === NOW_KEY,
            };
        }));
    }, []);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const maxBar = Math.max(...flow.map(d => Math.max(d.income, d.expense)), 1);
    const BAR = 88;
    const maxCat = cats.reduce((m, c) => Math.max(m, c.total), 0) || 1;
    const projected = flow.filter(d => d.isProjected);
    const current = flow.find(d => d.isCurrent);

    const iColor = (t: string) =>
        t === 'warning' ? Colors.neonOrange : t === 'success' ? Colors.cyberGreen : t === 'tip' ? Colors.neonPurple : Colors.electricBlue;

    return (
        <View style={s.container}>
            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                <NeonText variant="title" style={s.title}>Analytics</NeonText>

                {/* ── CASH FLOW CHART ── */}
                <GlassCard style={s.card}>
                    <View style={s.row}>
                        <NeonText variant="subtitle">Cash Flow</NeonText>
                        <View style={s.legendRow}>
                            <View style={[s.dot6, { backgroundColor: Colors.cyberGreen }]} />
                            <NeonText variant="caption" color={Colors.textMuted}>income</NeonText>
                            <View style={[s.dot6, { backgroundColor: Colors.neonOrange, marginLeft: 8 }]} />
                            <NeonText variant="caption" color={Colors.textMuted}>expense</NeonText>
                        </View>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.lg }}>
                        <View style={s.barsWrap}>
                            {flow.map(d => {
                                const iH = Math.max(d.income > 0 ? 4 : 0, Math.round((d.income / maxBar) * BAR));
                                const eH = Math.max(d.expense > 0 ? 4 : 0, Math.round((d.expense / maxBar) * BAR));
                                const incLbl = d.income >= 1000 ? `${(d.income / 1000).toFixed(0)}k` : d.income > 0 ? String(Math.round(d.income)) : '';
                                const expLbl = d.expense >= 1000 ? `-${(d.expense / 1000).toFixed(0)}k` : d.expense > 0 ? `-${Math.round(d.expense)}` : '';
                                return (
                                    <View key={d.month} style={s.barCol}>
                                        <NeonText style={s.barLbl} variant="caption" color={Colors.cyberGreen}>{incLbl}</NeonText>
                                        <View style={[s.topTrack, { height: BAR }]}>
                                            {d.income > 0 && (
                                                <LinearGradient
                                                    colors={d.isProjected ? ['rgba(16,185,129,0.38)','rgba(16,185,129,0.12)'] as [string,string] : ['#10B981','#059669'] as [string,string]}
                                                    style={{ width: 24, height: iH, borderTopLeftRadius: 5, borderTopRightRadius: 5 }}
                                                    start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                                                />
                                            )}
                                        </View>
                                        <View style={s.axis} />
                                        <View style={[s.botTrack, { height: BAR }]}>
                                            {d.expense > 0 && (
                                                <LinearGradient
                                                    colors={d.isProjected ? ['rgba(245,158,11,0.12)','rgba(245,158,11,0.38)'] as [string,string] : ['#F59E0B','#D97706'] as [string,string]}
                                                    style={{ width: 24, height: eH, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 }}
                                                    start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                                                />
                                            )}
                                        </View>
                                        <NeonText style={s.barLbl} variant="caption" color={Colors.neonOrange}>{expLbl}</NeonText>
                                        <View style={[s.mChip, d.isCurrent && s.mChipActive]}>
                                            <NeonText style={{ fontSize: 9, fontWeight: d.isCurrent ? '700' : '400' }}
                                                color={d.isCurrent ? Colors.textPrimary : d.isProjected ? Colors.textMuted : Colors.textTertiary}
                                                variant="caption"
                                            >{d.label}</NeonText>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </ScrollView>
                </GlassCard>

                {/* ── PROJECTED ── */}
                {(current || projected.length > 0) && (
                    <GlassCard style={s.card}>
                        <View style={[s.row, { marginBottom: Spacing.md }]}>
                            <NeonText variant="subtitle">Projected</NeonText>
                            <NeonText variant="caption" color={Colors.textMuted}>actual + recurring</NeonText>
                        </View>
                        {[...(current ? [current] : []), ...projected].map((d, i) => {
                            const net = d.income - d.expense;
                            const pct = d.income > 0 ? Math.min(100, Math.round((d.expense / d.income) * 100)) : 100;
                            const fillColor = pct > 90 ? Colors.neonPink : pct > 70 ? Colors.neonOrange : Colors.cyberGreen;
                            return (
                                <View key={d.month} style={[s.projRow, i > 0 && { borderTopWidth: 1, borderTopColor: Colors.border }]}>
                                    <View style={{ flex: 1, gap: 5 }}>
                                        <View style={s.projHead}>
                                            <NeonText variant="body" style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                                                {format(parseISO(`${d.month}-01`), 'MMMM yyyy')}
                                            </NeonText>
                                            {d.isProjected && (
                                                <View style={s.projBadge}>
                                                    <NeonText variant="caption" color={Colors.textMuted} style={{ fontSize: 9 }}>EST</NeonText>
                                                </View>
                                            )}
                                        </View>
                                        <View style={s.projTrack}>
                                            <View style={[s.projFill, { width: `${pct}%`, backgroundColor: fillColor, opacity: d.isProjected ? 0.5 : 1 }]} />
                                        </View>
                                    </View>
                                    <View style={s.projNums}>
                                        <NeonText variant="caption" color={Colors.cyberGreen} style={{ opacity: d.isProjected ? 0.65 : 1 }}>
                                            +{formatCurrency(d.income)}
                                        </NeonText>
                                        <NeonText variant="caption" color={Colors.neonPink} style={{ opacity: d.isProjected ? 0.65 : 1 }}>
                                            -{formatCurrency(d.expense)}
                                        </NeonText>
                                        <NeonText variant="caption" color={net >= 0 ? Colors.cyberGreen : Colors.neonPink} style={{ fontWeight: '700' }}>
                                            {net >= 0 ? '+' : ''}{formatCurrency(net)}
                                        </NeonText>
                                    </View>
                                </View>
                            );
                        })}
                    </GlassCard>
                )}

                {/* ── THIS MONTH ── */}
                <GlassCard style={s.card}>
                    <NeonText variant="subtitle" style={{ marginBottom: Spacing.md }}>This Month</NeonText>
                    <View style={s.sumRow}>
                        <View style={s.sumItem}>
                            <NeonText variant="caption" color={Colors.textTertiary}>Income</NeonText>
                            <NeonText variant="subtitle" color={Colors.cyberGreen} style={{ fontWeight: '700' }}>{formatCurrency(monthlyInc)}</NeonText>
                        </View>
                        <View style={s.vDiv} />
                        <View style={s.sumItem}>
                            <NeonText variant="caption" color={Colors.textTertiary}>Expenses</NeonText>
                            <NeonText variant="subtitle" color={Colors.neonPink} style={{ fontWeight: '700' }}>{formatCurrency(monthlyExp)}</NeonText>
                        </View>
                        <View style={s.vDiv} />
                        <View style={s.sumItem}>
                            <NeonText variant="caption" color={Colors.textTertiary}>Net</NeonText>
                            <NeonText variant="subtitle" color={monthlyInc - monthlyExp >= 0 ? Colors.cyberGreen : Colors.neonPink} style={{ fontWeight: '700' }}>
                                {formatCurrency(monthlyInc - monthlyExp)}
                            </NeonText>
                        </View>
                    </View>
                </GlassCard>

                {/* ── HEALTH ── */}
                <GlassCard style={s.card}>
                    <View style={s.row}>
                        <NeonText variant="subtitle">Financial Health</NeonText>
                        <View style={[s.scoreBadge, { borderColor: `${hs.color}44` }]}>
                            <NeonText variant="body" color={hs.color} style={{ fontWeight: '800' }}>{hs.score}</NeonText>
                        </View>
                    </View>
                    <ProgressBar progress={hs.score / 100} height={4} gradientColors={[hs.color, `${hs.color}55`] as [string, string]} style={{ marginTop: Spacing.sm }} />
                    <NeonText variant="caption" color={Colors.textTertiary} style={{ marginTop: 4 }}>{hs.label}</NeonText>
                </GlassCard>

                {/* ── CATEGORIES ── */}
                {cats.length > 0 && (
                    <GlassCard style={s.card}>
                        <NeonText variant="subtitle" style={{ marginBottom: Spacing.md }}>Categories</NeonText>
                        {cats.slice(0, 8).map((c, i) => (
                            <View key={c.category_name || i} style={s.catRow}>
                                <View style={[s.dot6, { backgroundColor: c.category_color || Colors.neonPurple, width: 8, height: 8 }]} />
                                <NeonText variant="caption" color={Colors.textSecondary} style={s.catName} numberOfLines={1}>{c.category_name || 'Other'}</NeonText>
                                <View style={s.catTrack}><View style={[s.catFill, { width: `${Math.round((c.total / maxCat) * 100)}%`, backgroundColor: c.category_color || Colors.neonPurple }]} /></View>
                                <NeonText variant="caption" color={Colors.textSecondary} style={s.catAmt}>{formatCurrency(c.total)}</NeonText>
                            </View>
                        ))}
                    </GlassCard>
                )}

                {/* ── INSIGHTS ── */}
                {insights.length > 0 && (
                    <GlassCard style={s.card}>
                        <NeonText variant="subtitle" style={{ marginBottom: Spacing.md }}>Insights</NeonText>
                        {insights.map((ins, i) => (
                            <View key={ins.id} style={[s.insRow, i > 0 && { borderTopWidth: 1, borderTopColor: Colors.border }]}>
                                <View style={[s.insIcon, { backgroundColor: `${iColor(ins.type)}12` }]}>
                                    <Ionicons name={ins.icon as any} size={15} color={iColor(ins.type)} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <NeonText variant="body" style={{ fontWeight: '600' }}>{ins.title}</NeonText>
                                    <NeonText variant="caption" color={Colors.textSecondary}>{ins.description}</NeonText>
                                </View>
                            </View>
                        ))}
                    </GlassCard>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'android' ? 48 : 56 },
    title: { marginBottom: Spacing.xl },
    card: { marginBottom: Spacing.lg },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dot6: { width: 6, height: 6, borderRadius: 3 },
    barsWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 4 },
    barCol: { alignItems: 'center', width: 50 },
    barLbl: { fontSize: 9, height: 14, textAlign: 'center' },
    topTrack: { width: 24, justifyContent: 'flex-end' },
    axis: { width: 36, height: 1, backgroundColor: 'rgba(255,255,255,0.10)', marginVertical: 1 },
    botTrack: { width: 24, justifyContent: 'flex-start' },
    mChip: { marginTop: 6, paddingHorizontal: 3, paddingVertical: 2, borderRadius: 4 },
    mChipActive: { backgroundColor: 'rgba(255,255,255,0.08)' },
    projRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
    projHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    projBadge: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
    projTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' },
    projFill: { height: 3, borderRadius: 2 },
    projNums: { alignItems: 'flex-end', gap: 2, minWidth: 96 },
    sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sumItem: { flex: 1, alignItems: 'center', gap: 4 },
    vDiv: { width: 1, height: 36, backgroundColor: Colors.border },
    scoreBadge: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    catRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 8 },
    catName: { width: 82, fontSize: 11 },
    catTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
    catFill: { height: 4, borderRadius: 2 },
    catAmt: { width: 66, textAlign: 'right', fontSize: 11 },
    insRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.sm },
    insIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
