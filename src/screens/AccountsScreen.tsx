import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput, Modal,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, HeroCard, Amount, SumariButton, SectionHeader, TopBar } from '../components/SumariPrimitives';
import { Colors, Spacing, BorderRadius, CategoryColors } from '../theme';
import { getAccounts, addAccount, updateAccount, updateAccountBalance, deleteAccount, getTotalBalance } from '../database/accountService';
import { Account, AccountType } from '../types';

const ACCOUNT_TYPES: { label: string; value: AccountType; icon: string }[] = [
  { label: 'Bank', value: 'bank', icon: 'card-outline' },
  { label: 'Cash', value: 'cash', icon: 'cash-outline' },
  { label: 'Credit', value: 'credit', icon: 'card-outline' },
  { label: 'Savings', value: 'savings', icon: 'wallet-outline' },
  { label: 'Investment', value: 'investment', icon: 'trending-up-outline' },
  { label: 'Other', value: 'other', icon: 'ellipse-outline' },
];

const ACCOUNT_ICONS = [
  'card-outline', 'cash-outline', 'wallet-outline', 'trending-up-outline',
  'business-outline', 'globe-outline', 'shield-outline', 'diamond-outline',
];

const BLANK = { name: '', type: 'bank' as AccountType, balance: '', icon: 'card-outline', color: Colors.accent };

export const AccountsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(BLANK);

  const load = useCallback(async () => {
    try {
      const [accs, total] = await Promise.all([getAccounts(), getTotalBalance()]);
      setAccounts(accs);
      setTotalBalance(total);
    } catch (e) { console.log(e); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openAdd = () => { setEditId(null); setForm(BLANK); setShowForm(true); };
  const openEdit = (a: Account) => {
    setEditId(a.id);
    setForm({ name: a.name, type: a.type, balance: String(a.balance), icon: a.icon, color: a.color });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return Alert.alert('Name required');
    const bal = parseFloat(form.balance) || 0;
    if (editId) {
      await updateAccount(editId, form.name, form.type, form.icon, form.color);
      if (form.balance !== '') await updateAccountBalance(editId, bal);
    } else {
      await addAccount(form.name, form.type, bal, form.icon, form.color);
    }
    setShowForm(false);
    load();
  };

  const handleDelete = (a: Account) => {
    Alert.alert('Delete Account', `Delete "${a.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteAccount(a.id); load(); } },
    ]);
  };

  const liquid = accounts.filter(a => a.type !== 'credit').reduce((s, a) => s + a.balance, 0);
  const debt = Math.abs(accounts.filter(a => a.type === 'credit').reduce((s, a) => s + a.balance, 0));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <TopBar title="Accounts" large
          right={
            <TouchableOpacity onPress={openAdd} style={s.addBtn}>
              <Ionicons name="add" size={18} color={Colors.onHero} />
            </TouchableOpacity>
          }
        />

        {/* Net worth hero */}
        <View style={s.padH}>
          <HeroCard>
            <Text style={s.heroLabel}>Net worth</Text>
            <Amount value={totalBalance} size="xl" color={Colors.onHero} />
            <View style={s.heroRow}>
              <View>
                <Text style={s.heroMiniLabel}>Liquid</Text>
                <Amount value={liquid} size="sm" color={Colors.onHero} />
              </View>
              <View>
                <Text style={s.heroMiniLabel}>Debt</Text>
                <Amount value={debt} size="sm" color={Colors.negative} />
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('TransferMoney')} style={s.transferBtn}>
                <Ionicons name="repeat-outline" size={14} color={Colors.onAccent} />
                <Text style={s.transferBtnText}>Transfer</Text>
              </TouchableOpacity>
            </View>
          </HeroCard>
        </View>

        {/* Accounts list */}
        <SectionHeader label="Your accounts" action="Merchants"
          onAction={() => navigation.navigate('Merchants')}
          style={{ paddingTop: Spacing.xl, paddingBottom: Spacing.sm }} />
        <View style={[s.padH, { gap: Spacing.sm }]}>
          {accounts.map((acc) => (
            <TouchableOpacity key={acc.id} onPress={() => openEdit(acc)} onLongPress={() => handleDelete(acc)} activeOpacity={0.75}>
              <Card style={s.accCard}>
                <View style={[s.accIcon, { backgroundColor: acc.color + '18' }]}>
                  <Ionicons name={(acc.icon ?? 'card-outline') as any} size={20} color={acc.color} />
                </View>
                <View style={s.accInfo}>
                  <Text style={s.accName}>{acc.name}</Text>
                  <Text style={s.accType}>{acc.type}</Text>
                </View>
                <View style={s.accBalance}>
                  <Amount value={acc.balance} size="sm" color={acc.balance < 0 ? Colors.negative : Colors.textPrimary} />
                  <Text style={s.accCurrency}>MXN</Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={openAdd} style={s.addCard}>
            <Ionicons name="add-outline" size={16} color={Colors.textSecondary} />
            <Text style={s.addCardText}>Add account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add/Edit modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editId ? 'Edit account' : 'New account'}</Text>
            <TouchableOpacity onPress={() => setShowForm(false)} style={s.modalClose}>
              <Ionicons name="close" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={s.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={s.fieldLabel}>Name</Text>
            <View style={s.field}>
              <TextInput style={s.fieldInput} value={form.name}
                onChangeText={v => setForm(f => ({ ...f, name: v }))}
                placeholder="Account name" placeholderTextColor={Colors.textMuted} />
            </View>

            <Text style={s.fieldLabel}>{editId ? 'Balance' : 'Initial balance'}</Text>
            <View style={s.field}>
              <TextInput style={s.fieldInput} value={form.balance}
                onChangeText={v => setForm(f => ({ ...f, balance: v }))}
                placeholder="0.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />
            </View>

            <Text style={s.fieldLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {ACCOUNT_TYPES.map(t => (
                  <TouchableOpacity key={t.value} onPress={() => setForm(f => ({ ...f, type: t.value }))}
                    style={[s.typeChip, form.type === t.value && s.typeChipActive]}>
                    <Ionicons name={t.icon as any} size={16} color={form.type === t.value ? Colors.onAccent : Colors.textSecondary} />
                    <Text style={[s.typeChipText, form.type === t.value && { color: Colors.onAccent }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={s.fieldLabel}>Icon</Text>
            <View style={s.iconGrid}>
              {ACCOUNT_ICONS.map(ic => (
                <TouchableOpacity key={ic} onPress={() => setForm(f => ({ ...f, icon: ic }))}
                  style={[s.iconOption, form.icon === ic && s.iconOptionActive]}>
                  <Ionicons name={ic as any} size={20} color={form.icon === ic ? Colors.accent : Colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.fieldLabel}>Color</Text>
            <View style={s.colorRow}>
              {CategoryColors.slice(0, 8).map(c => (
                <TouchableOpacity key={c} onPress={() => setForm(f => ({ ...f, color: c }))}
                  style={[s.colorDot, { backgroundColor: c }, form.color === c && s.colorDotActive]} />
              ))}
            </View>

            <View style={{ marginTop: Spacing.xxl }}>
              <SumariButton onPress={handleSave} variant="primary" size="lg" fullWidth>
                {editId ? 'Save changes' : 'Add account'}
              </SumariButton>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingBottom: 20 },
  padH: { paddingHorizontal: Spacing.xl },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgHero,
    alignItems: 'center', justifyContent: 'center' },
  heroLabel: { fontSize: 12, color: 'rgba(244,245,240,0.55)', textTransform: 'uppercase', letterSpacing: 1.6, marginBottom: 8 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl,
    marginTop: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  heroMiniLabel: { fontSize: 10, color: 'rgba(244,245,240,0.5)', textTransform: 'uppercase', letterSpacing: 1 },
  transferBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.accent,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, marginLeft: 'auto' },
  transferBtnText: { fontSize: 13, fontWeight: '600', color: Colors.onAccent },
  accCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  accIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  accInfo: { flex: 1, minWidth: 0 },
  accName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  accType: { fontSize: 11, color: Colors.textTertiary, textTransform: 'capitalize', marginTop: 1 },
  accBalance: { alignItems: 'flex-end' },
  accCurrency: { fontSize: 10, color: Colors.textTertiary, marginTop: 2 },
  addCard: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.borderStrong,
    borderRadius: BorderRadius.lg, padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addCardText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  modal: { flex: 1, backgroundColor: Colors.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  modalTitle: { fontSize: 22, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.4 },
  modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgCardAlt,
    alignItems: 'center', justifyContent: 'center' },
  modalContent: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  fieldLabel: { fontSize: 11, fontWeight: '500', color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 8, marginTop: Spacing.lg },
  field: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.lg, paddingVertical: 14 },
  fieldInput: { fontSize: 15, color: Colors.textPrimary },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  typeChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  typeChipText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  iconOption: { width: 44, height: 44, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  iconOptionActive: { borderColor: Colors.accent, backgroundColor: Colors.accentSoft },
  colorRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: Colors.textPrimary },
});
