import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, SumariButton, SectionHeader } from '../components/SumariPrimitives';
import { Colors, Spacing, BorderRadius, FontFamily } from '../theme';
import { addTransaction } from '../database/transactionService';
import { getCategories } from '../database/categoryService';
import { getAccounts } from '../database/accountService';
import { getSetting } from '../database/settingsService';
import { checkAndAwardAchievements } from '../services/gamification';
import { Category, Account, TransactionType } from '../types';

export const AddTransactionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialType: TransactionType = route.params?.type ?? 'expense';

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [selectedAcc, setSelectedAcc] = useState<number | null>(null);
  const [date] = useState(new Date().toISOString().slice(0, 10));
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState('MXN');

  useEffect(() => {
    Promise.all([getCategories(), getAccounts(), getSetting('currency')]).then(([cats, accs, cur]) => {
      setCategories(cats as Category[]);
      setAccounts(accs as Account[]);
      if ((cats as Category[]).length > 0) setSelectedCat((cats as Category[])[0].id);
      const def = (accs as Account[]).find(a => a.is_default) ?? (accs as Account[])[0];
      if (def) setSelectedAcc(def.id);
      if (cur) setCurrency(cur);
    });
  }, []);

  const amountColor = type === 'income' ? Colors.accent : Colors.textPrimary;

  const handleSave = async () => {
    const val = parseFloat(amount.replace(/,/g, ''));
    if (!val || val <= 0) return Alert.alert('Enter a valid amount');
    if (!merchant.trim()) return Alert.alert('Enter a merchant or description');
    setSaving(true);
    try {
      await addTransaction(
        type,
        val,
        merchant.trim(),
        selectedCat ?? categories[0]?.id ?? 1,
        date,
        note.trim(),
        null,
        selectedAcc,
      );
      await checkAndAwardAchievements();
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not save transaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Handle */}
        <View style={s.handle}><View style={s.handleBar} /></View>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>New entry</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.closeBtn}>
            <Ionicons name="close" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Type toggle */}
        <View style={s.padH}>
          <View style={s.typeToggle}>
            {([
              { v: 'expense' as TransactionType, l: 'Expense', icon: 'arrow-up-outline' },
              { v: 'income'  as TransactionType, l: 'Income',  icon: 'arrow-down-outline' },
              { v: 'transfer' as TransactionType, l: 'Transfer', icon: 'repeat-outline' },
            ] as { v: TransactionType; l: string; icon: string }[]).map(o => {
              const active = type === o.v;
              const activeBg = o.v === 'income' ? Colors.accent : o.v === 'expense' ? Colors.bgHero : Colors.info;
              const activeColor = o.v === 'income' ? Colors.onAccent : Colors.onHero;
              return (
                <TouchableOpacity key={o.v} onPress={() => setType(o.v)}
                  style={[s.typeBtn, active && { backgroundColor: activeBg }]}>
                  <Ionicons name={o.icon as any} size={14}
                    color={active ? activeColor : Colors.textSecondary} />
                  <Text style={[s.typeBtnText, active && { color: activeColor }]}>{o.l}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Amount */}
        <View style={s.amountSection}>
          <Text style={s.amountLabel}>Amount</Text>
          <View style={s.amountRow}>
            <Text style={[s.amountSymbol, { color: amountColor }]}>$</Text>
            <TextInput
              style={[s.amountInput, { color: amountColor }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={amountColor + '40'}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>
          <Text style={s.currencyCode}>{currency}</Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Fields */}
          <Card style={{ padding: 0 }}>
            <View style={s.fieldRow}>
              <View style={s.fieldIcon}><Ionicons name="pricetag-outline" size={15} color={Colors.textSecondary} /></View>
              <TextInput style={s.fieldInput} value={merchant} onChangeText={setMerchant}
                placeholder="Merchant / description" placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={s.divider} />
            <View style={s.fieldRow}>
              <View style={s.fieldIcon}><Ionicons name="calendar-outline" size={15} color={Colors.textSecondary} /></View>
              <Text style={s.fieldValue}>{new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.fieldRow}>
              <View style={s.fieldIcon}><Ionicons name="pencil-outline" size={15} color={Colors.textSecondary} /></View>
              <TextInput style={s.fieldInput} value={note} onChangeText={setNote}
                placeholder="Note (optional)" placeholderTextColor={Colors.textMuted} />
            </View>
          </Card>

          {/* Category */}
          <SectionHeader label="Category" style={{ paddingTop: Spacing.lg, paddingBottom: Spacing.sm, paddingHorizontal: 0 }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.xl }}>
            <View style={s.chipScroll}>
              {categories.map(c => {
                const sel = selectedCat === c.id;
                return (
                  <TouchableOpacity key={c.id} onPress={() => setSelectedCat(c.id)}
                    style={[s.catChip, { backgroundColor: sel ? c.color + '18' : Colors.bgCard, borderColor: sel ? c.color : Colors.border }]}>
                    <View style={[s.catChipIcon, { backgroundColor: sel ? c.color : c.color + '22' }]}>
                      <Ionicons name={(c.icon ?? 'pricetag-outline') as any} size={17} color={sel ? '#fff' : c.color} />
                    </View>
                    <Text style={[s.catChipText, { color: sel ? c.color : Colors.textSecondary }]}>{c.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Account */}
          <SectionHeader label="Account" style={{ paddingTop: Spacing.lg, paddingBottom: Spacing.sm, paddingHorizontal: 0 }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.xl }}>
            <View style={s.chipScroll}>
              {accounts.map(a => {
                const sel = selectedAcc === a.id;
                return (
                  <TouchableOpacity key={a.id} onPress={() => setSelectedAcc(a.id)}
                    style={[s.accChip, sel && s.accChipActive]}>
                    <View style={[s.accChipIcon, { backgroundColor: a.color + '22' }]}>
                      <Ionicons name={(a.icon ?? 'card-outline') as any} size={14} color={a.color} />
                    </View>
                    <View style={{ minWidth: 0 }}>
                      <Text style={[s.accChipName, sel && { color: Colors.onHero }]} numberOfLines={1}>{a.name}</Text>
                      <Text style={s.accChipBal}>${Math.abs(a.balance).toLocaleString()}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Save */}
        <View style={s.footer}>
          <SumariButton onPress={handleSave} variant="primary" size="lg" fullWidth disabled={saving}
            icon={<Ionicons name="checkmark" size={18} color={Colors.onAccent} />}>
            Save transaction
          </SumariButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  padH: { paddingHorizontal: Spacing.xl },
  handle: { alignItems: 'center', paddingTop: Spacing.md },
  handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderStrong },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  headerTitle: { fontFamily: FontFamily.display, fontSize: 24, color: Colors.textPrimary, letterSpacing: -0.5 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCardAlt,
    alignItems: 'center', justifyContent: 'center' },
  typeToggle: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 999,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  typeBtn: { flex: 1, height: 38, borderRadius: 999, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6 },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  amountSection: { paddingTop: Spacing.xl, paddingBottom: Spacing.xl, alignItems: 'center' },
  amountLabel: { fontSize: 11, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1.6, marginBottom: 12 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  amountSymbol: { fontFamily: FontFamily.display, fontSize: 28, fontWeight: '400', opacity: 0.6 },
  amountInput: { fontSize: 64, fontWeight: '500', letterSpacing: -2, minWidth: 80 },
  currencyCode: { fontSize: 12, color: Colors.textTertiary, marginTop: 8 },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: 20 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  fieldIcon: { width: 34, height: 34, borderRadius: BorderRadius.xs, backgroundColor: Colors.bgCardAlt,
    alignItems: 'center', justifyContent: 'center' },
  fieldInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  fieldValue: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  chipScroll: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  catChip: { minWidth: 72, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, alignItems: 'center', gap: 6 },
  catChipIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  catChipText: { fontSize: 11, fontWeight: '500' },
  accChip: { minWidth: 140, flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border },
  accChipActive: { backgroundColor: Colors.bgHero, borderColor: Colors.borderStrong },
  accChipIcon: { width: 30, height: 30, borderRadius: BorderRadius.xs, alignItems: 'center', justifyContent: 'center' },
  accChipName: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  accChipBal: { fontSize: 10, color: Colors.textTertiary },
  footer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xxl },
});
