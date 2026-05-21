import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  Card, Text, Money, Progress, SectionHeader, EditorialHeading, CatAvatar,
} from '../components/SumariPrimitives';
import { Colors, Spacing, BorderRadius, FontFamily } from '../theme';
import { formatCurrency, getMonthKey } from '../utils';
import {
  getMonthlyTotal, getSpendingByCategory, getMonthlyTotalsRange,
} from '../database/transactionService';
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
  return format(new Date(+y, +m - 1, 1), 'MMM').toLowerCase() + " '" + y.slice(2);
};

interface MD {
  month: string; label: string;
  income: number; expense: number;
  isProjected: boolean; isCurrent: boolean;
}

export const AnalyticsScreen: React.FC = () => {
  const [hs, setHs] = useState<FinancialHealthScore>({ score: 100, label: 'Excellent', color: Colors.accent });
  const [insights, setInsights] = useState<Insight[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [monthlyExp, setMonthlyExp] = useState(0);
  const [monthlyInc, setMonthlyInc] = useState(0);
  const [flow, setFlow] = useState<MD[]>([]);

  const load = useCallback(async () => {
    const month = getMonthKey();
    const range = buildRange(4, 2);
    const pastKeys = range.filter(m => m <= NOW_KEY);

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
      return { month: m, label: lbl(m), income, expense, isProjected: fut, isCurrent: m === NOW_KEY };
    }));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const maxBar = Math.max(...flow.map(d => Math.max(d.income, d.expense)), 1);
  const BAR = 84;
  const maxCat = cats.reduce((m, c) => Math.max(m, c.total), 0) || 1;
  const projected = flow.filter(d => d.isProjected);
  const current = flow.find(d => d.isCurrent);

  const insightTone = (t: string) =>
    t === 'warning' ? Colors.amber
      : t === 'success' ? Colors.accent
      : t === 'tip' ? Colors.info
      : Colors.textPrimary;

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.titleBlock}>
          <Text variant="overline">Sección</Text>
          <Text variant="display" size={32} style={{ marginTop: 4 }}>Análisis</Text>
        </View>

        {/* ── CASH FLOW ── */}
        <EditorialHeading>Flujo de efectivo</EditorialHeading>
        <View style={s.padH}>
          <Card>
            <View style={s.rowBetween}>
              <Text variant="overline">Últimos 5 · proyectado 2</Text>
              <View style={s.legendRow}>
                <View style={[s.legendDot, { backgroundColor: Colors.accent }]} />
                <Text variant="meta">ingresos</Text>
                <View style={[s.legendDot, { backgroundColor: Colors.rust, marginLeft: 10 }]} />
                <Text variant="meta">gastos</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.lg }}>
              <View style={s.barsWrap}>
                {flow.map(d => {
                  const iH = Math.max(d.income > 0 ? 4 : 0, Math.round((d.income / maxBar) * BAR));
                  const eH = Math.max(d.expense > 0 ? 4 : 0, Math.round((d.expense / maxBar) * BAR));
                  const incLbl = d.income >= 1000 ? `${(d.income / 1000).toFixed(0)}k` : d.income > 0 ? String(Math.round(d.income)) : '';
                  const expLbl = d.expense >= 1000 ? `−${(d.expense / 1000).toFixed(0)}k` : d.expense > 0 ? `−${Math.round(d.expense)}` : '';
                  return (
                    <View key={d.month} style={s.barCol}>
                      <Text variant="mono" align="center" style={{ height: 14, color: d.income > 0 ? Colors.accentLight : 'transparent' }}>{incLbl}</Text>
                      <View style={[s.topTrack, { height: BAR }]}>
                        {d.income > 0 && (
                          <View style={{
                            width: 22, height: iH,
                            borderTopLeftRadius: 4, borderTopRightRadius: 4,
                            backgroundColor: d.isProjected ? Colors.accentSoft : Colors.accent,
                            borderWidth: d.isProjected ? 1 : 0,
                            borderColor: Colors.accent,
                          }} />
                        )}
                      </View>
                      <View style={s.axis} />
                      <View style={[s.botTrack, { height: BAR }]}>
                        {d.expense > 0 && (
                          <View style={{
                            width: 22, height: eH,
                            borderBottomLeftRadius: 4, borderBottomRightRadius: 4,
                            backgroundColor: d.isProjected ? Colors.rustSoft : Colors.rust,
                            borderWidth: d.isProjected ? 1 : 0,
                            borderColor: Colors.rust,
                          }} />
                        )}
                      </View>
                      <Text variant="mono" align="center" style={{ height: 14, color: d.expense > 0 ? Colors.rustLight : 'transparent' }}>{expLbl}</Text>
                      <View style={[s.mChip, d.isCurrent && s.mChipActive]}>
                        <Text variant="mono" align="center"
                          style={{ fontSize: 9, color: d.isCurrent ? Colors.textPrimary : d.isProjected ? Colors.textMuted : Colors.textTertiary }}>
                          {d.label}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </Card>
        </View>

        {/* ── PROJECTED ── */}
        {(current || projected.length > 0) && (
          <>
            <EditorialHeading>Proyección</EditorialHeading>
            <View style={s.padH}>
              <Card>
                <View style={[s.rowBetween, { marginBottom: Spacing.md }]}>
                  <Text variant="overline">Actual + recurrente</Text>
                  <Text variant="meta">{projected.length + (current ? 1 : 0)} meses</Text>
                </View>
                {[...(current ? [current] : []), ...projected].map((d, i) => {
                  const net = d.income - d.expense;
                  const pct = d.income > 0 ? Math.min(100, Math.round((d.expense / d.income) * 100)) : 100;
                  const fillColor = pct > 90 ? Colors.rust : pct > 70 ? Colors.amber : Colors.accent;
                  return (
                    <View key={d.month} style={[s.projRow, i > 0 && { borderTopWidth: 1, borderTopColor: Colors.border }]}>
                      <View style={{ flex: 1, gap: 6 }}>
                        <View style={s.projHead}>
                          <Text variant="body" weight="600" style={{ textTransform: 'capitalize' }}>
                            {format(parseISO(`${d.month}-01`), 'MMMM yyyy')}
                          </Text>
                          {d.isProjected && (
                            <View style={s.projBadge}>
                              <Text variant="mono" style={{ fontSize: 9, color: Colors.amber }}>EST</Text>
                            </View>
                          )}
                        </View>
                        <Progress value={pct} max={100} height={3} color={fillColor}
                          style={{ opacity: d.isProjected ? 0.6 : 1 }} />
                      </View>
                      <View style={s.projNums}>
                        <Text variant="meta" color={Colors.accentLight} style={{ opacity: d.isProjected ? 0.65 : 1 }}>
                          +{formatCurrency(d.income)}
                        </Text>
                        <Text variant="meta" color={Colors.rustLight} style={{ opacity: d.isProjected ? 0.65 : 1 }}>
                          −{formatCurrency(d.expense)}
                        </Text>
                        <Text variant="body" weight="700"
                          color={net >= 0 ? Colors.accentLight : Colors.rustLight}>
                          {net >= 0 ? '+' : '−'}{formatCurrency(Math.abs(net))}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </Card>
            </View>
          </>
        )}

        {/* ── THIS MONTH ── */}
        <EditorialHeading>Este mes</EditorialHeading>
        <View style={s.padH}>
          <Card>
            <View style={s.sumRow}>
              <View style={s.sumItem}>
                <Text variant="overline">Ingresos</Text>
                <Money value={monthlyInc} size="md" color={Colors.accentLight} />
              </View>
              <View style={s.vDiv} />
              <View style={s.sumItem}>
                <Text variant="overline">Gastos</Text>
                <Money value={monthlyExp} size="md" color={Colors.rustLight} />
              </View>
              <View style={s.vDiv} />
              <View style={s.sumItem}>
                <Text variant="overline">Neto</Text>
                <Money value={monthlyInc - monthlyExp} size="md" sign
                  color={monthlyInc - monthlyExp >= 0 ? Colors.accentLight : Colors.rustLight} />
              </View>
            </View>
          </Card>
        </View>

        {/* ── HEALTH ── */}
        <EditorialHeading>Salud financiera</EditorialHeading>
        <View style={s.padH}>
          <Card>
            <View style={s.rowBetween}>
              <View>
                <Text variant="overline">Puntaje</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                  <Text style={{ fontFamily: FontFamily.display, fontStyle: 'italic', fontSize: 44, letterSpacing: -1.4, color: Colors.textPrimary }}>{hs.score}</Text>
                  <Text variant="overline" style={{ fontSize: 9 }}>/ 100</Text>
                </View>
              </View>
              <View style={[s.scoreBadge, { backgroundColor: hs.color + '18', borderColor: hs.color + '44' }]}>
                <Text variant="body" weight="700" color={hs.color}>{hs.label}</Text>
              </View>
            </View>
            <Progress value={hs.score} max={100} height={3} color={hs.color} style={{ marginTop: Spacing.lg }} />
          </Card>
        </View>

        {/* ── CATEGORIES ── */}
        {cats.length > 0 && (
          <>
            <EditorialHeading>Categorías</EditorialHeading>
            <View style={s.padH}>
              <Card>
                {cats.slice(0, 8).map((c, i) => (
                  <View key={c.category_name || i} style={[s.catRow, i > 0 && { borderTopWidth: 1, borderTopColor: Colors.border }]}>
                    <View style={[s.catDot, { backgroundColor: c.category_color || Colors.accent }]} />
                    <Text variant="body" numberOfLines={1} style={s.catName}>{c.category_name || 'Otro'}</Text>
                    <View style={s.catTrack}>
                      <View style={[s.catFill, {
                        width: `${Math.round((c.total / maxCat) * 100)}%`,
                        backgroundColor: c.category_color || Colors.accent,
                      }]} />
                    </View>
                    <Text variant="meta" style={s.catAmt}>{formatCurrency(c.total)}</Text>
                  </View>
                ))}
              </Card>
            </View>
          </>
        )}

        {/* ── INSIGHTS ── */}
        {insights.length > 0 && (
          <>
            <EditorialHeading>Notas del editor</EditorialHeading>
            <View style={s.padH}>
              <Card>
                {insights.map((ins, i) => {
                  const tone = insightTone(ins.type);
                  return (
                    <View key={ins.id} style={[s.insRow, i > 0 && { borderTopWidth: 1, borderTopColor: Colors.border }]}>
                      <CatAvatar
                        icon={<Ionicons name={ins.icon as any} size={15} color={tone} />}
                        color={tone}
                        size={32}
                      />
                      <View style={{ flex: 1 }}>
                        <Text variant="body" weight="600">{ins.title}</Text>
                        <Text variant="meta" style={{ marginTop: 2 }}>{ins.description}</Text>
                      </View>
                    </View>
                  );
                })}
              </Card>
            </View>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingTop: Platform.OS === 'android' ? 48 : 56, paddingBottom: 40 },
  padH: { paddingHorizontal: Spacing.xl },
  titleBlock: { paddingHorizontal: Spacing.xl, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  barsWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 4 },
  barCol: { alignItems: 'center', width: 50 },
  topTrack: { width: 22, justifyContent: 'flex-end' },
  axis: { width: 34, height: 1, backgroundColor: Colors.border, marginVertical: 2 },
  botTrack: { width: 22, justifyContent: 'flex-start' },
  mChip: { marginTop: 6, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  mChipActive: { backgroundColor: Colors.bgCardAlt },
  projRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  projHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  projBadge: { backgroundColor: Colors.amberSoft, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  projNums: { alignItems: 'flex-end', gap: 3, minWidth: 96 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sumItem: { flex: 1, alignItems: 'center', gap: 6 },
  vDiv: { width: 1, height: 32, backgroundColor: Colors.border },
  scoreBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catName: { flex: 1, fontSize: 13 },
  catTrack: { width: 90, height: 3, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  catFill: { height: 3, borderRadius: 2 },
  catAmt: { width: 72, textAlign: 'right' },
  insRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
});
