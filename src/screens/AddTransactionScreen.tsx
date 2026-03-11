import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, NeonText, NeonButton, GlowInput, CategoryIcon } from '../components';
import { Colors, Spacing, BorderRadius } from '../theme';
import { addTransaction } from '../database/transactionService';
import { getCategories } from '../database/categoryService';
import { searchMerchants, getMerchantCategory } from '../database/merchantService';
import { getAccounts } from '../database/accountService';
import { checkAndAwardAchievements } from '../services/gamification';
import { Account, Category, Merchant, TransactionType } from '../types';
import { toISODateString } from '../utils';
import { useLanguage } from '../context/LanguageContext';

export const AddTransactionScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [type, setType] = useState<TransactionType>('expense');
    const [amount, setAmount] = useState('');
    const [merchantName, setMerchantName] = useState('');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(toISODateString(new Date()));
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [merchantSuggestions, setMerchantSuggestions] = useState<Merchant[]>([]);
    const [showCategories, setShowCategories] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [showAccounts, setShowAccounts] = useState(false);
    const [saving, setSaving] = useState(false);
    const { t } = useLanguage();

    const route = useRoute<any>();

    useEffect(() => {
        loadCategories();
        loadAccounts();
    }, []);

    // Apply prefill params from Spend Planner after data loads
    useEffect(() => {
        const params = route.params as any;
        if (!params) return;
        if (params.prefillAmount) setAmount(String(params.prefillAmount));
        if (params.prefillMerchant) setMerchantName(String(params.prefillMerchant));
    }, [route.params]);

    // Apply category prefill once categories are loaded
    useEffect(() => {
        const params = route.params as any;
        if (!params?.prefillCategoryId || categories.length === 0) return;
        const cat = categories.find(c => c.id === params.prefillCategoryId);
        if (cat) setSelectedCategory(cat);
    }, [categories, route.params]);

    // Apply account prefill once accounts are loaded
    useEffect(() => {
        const params = route.params as any;
        if (!params?.prefillAccountId || accounts.length === 0) return;
        const acc = accounts.find(a => a.id === params.prefillAccountId);
        if (acc) setSelectedAccount(acc);
    }, [accounts, route.params]);

    const loadCategories = async () => {
        const cats = await getCategories();
        setCategories(cats);
        if (cats.length > 0) setSelectedCategory(cats[0]);
    };

    const loadAccounts = async () => {
        const accs = await getAccounts();
        setAccounts(accs);
        const def = accs.find(a => a.is_default === 1) ?? accs[0] ?? null;
        setSelectedAccount(def);
    };

    const handleMerchantChange = async (text: string) => {
        setMerchantName(text);
        if (text.length > 1) {
            const suggestions = await searchMerchants(text);
            setMerchantSuggestions(suggestions);
            // Auto-suggest category
            const catId = await getMerchantCategory(text);
            if (catId) {
                const cat = categories.find(c => c.id === catId);
                if (cat) setSelectedCategory(cat);
            }
        } else {
            setMerchantSuggestions([]);
        }
    };

    const selectMerchant = async (merchant: Merchant) => {
        setMerchantName(merchant.name);
        setMerchantSuggestions([]);
        if (merchant.default_category_id) {
            const cat = categories.find(c => c.id === merchant.default_category_id);
            if (cat) setSelectedCategory(cat);
        }
    };

    const handleSave = async () => {
        const numAmount = parseFloat(amount.replace(/,/g, ''));
        if (!numAmount || numAmount <= 0) {
            Alert.alert('Error', t('tx.error.amount'));
            return;
        }
        if (!selectedCategory) {
            Alert.alert('Error', t('tx.error.category'));
            return;
        }

        setSaving(true);
        try {
            await addTransaction(type, numAmount, merchantName, selectedCategory.id, date, note, null, selectedAccount?.id ?? null);
            await checkAndAwardAchievements();
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to save transaction');
        } finally {
            setSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={28} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <NeonText variant="title">{t('tx.new')}</NeonText>
                    <View style={{ width: 28 }} />
                </View>

                {/* Type Toggle */}
                <View style={styles.typeToggle}>
                    <TouchableOpacity
                        style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}
                        onPress={() => setType('expense')}
                    >
                        <LinearGradient
                            colors={type === 'expense' ? Colors.gradientPink as [string, string] : ['transparent', 'transparent']}
                            style={styles.typeBtnGradient}
                        >
                            <Ionicons name="arrow-up-circle" size={20} color={type === 'expense' ? Colors.textPrimary : Colors.textTertiary} />
                            <NeonText variant="body" color={type === 'expense' ? Colors.textPrimary : Colors.textTertiary}>{t('tx.type.expense')}</NeonText>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]}
                        onPress={() => setType('income')}
                    >
                        <LinearGradient
                            colors={type === 'income' ? Colors.gradientGreen as [string, string] : ['transparent', 'transparent']}
                            style={styles.typeBtnGradient}
                        >
                            <Ionicons name="arrow-down-circle" size={20} color={type === 'income' ? Colors.textPrimary : Colors.textTertiary} />
                            <NeonText variant="body" color={type === 'income' ? Colors.textPrimary : Colors.textTertiary}>{t('tx.type.income')}</NeonText>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Amount */}
                <View style={styles.amountContainer}>
                    <NeonText variant="display" color={Colors.textTertiary} style={{ marginRight: Spacing.xs }}>$</NeonText>
                    <GlowInput
                        placeholder="0.00"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        glowColor={type === 'expense' ? Colors.neonPink : Colors.cyberGreen}
                        containerStyle={{ flex: 1, marginBottom: 0 }}
                        style={styles.amountInput}
                    />
                </View>

                {/* Merchant */}
                <GlowInput
                    label={t('tx.merchant')}
                    placeholder={t('tx.merchantPlaceholder')}
                    value={merchantName}
                    onChangeText={handleMerchantChange}
                    icon={<Ionicons name="storefront-outline" size={20} color={Colors.textTertiary} />}
                />

                {/* Merchant Suggestions */}
                {merchantSuggestions.length > 0 && (
                    <View style={styles.suggestions}>
                        {merchantSuggestions.map(m => (
                            <TouchableOpacity key={m.id} style={styles.suggestionItem} onPress={() => selectMerchant(m)}>
                                <NeonText variant="body">{m.name}</NeonText>
                                {m.category_name && (
                                    <NeonText variant="caption" color={Colors.textTertiary}>{m.category_name}</NeonText>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Category */}
                <NeonText variant="label" style={styles.fieldLabel}>{t('tx.category').toUpperCase()}</NeonText>
                <TouchableOpacity onPress={() => setShowCategories(!showCategories)}>
                    <GlassCard style={styles.categoryPicker}>
                        {selectedCategory && (
                            <View style={styles.selectedCategory}>
                                <CategoryIcon icon={selectedCategory.icon} color={selectedCategory.color} size={32} />
                                <NeonText variant="body">{selectedCategory.name}</NeonText>
                            </View>
                        )}
                        <Ionicons name={showCategories ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textTertiary} />
                    </GlassCard>
                </TouchableOpacity>

                {showCategories && (
                    <GlassCard style={styles.categoryList}>
                        {categories.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryItem,
                                    selectedCategory?.id === cat.id && styles.categoryItemSelected,
                                ]}
                                onPress={() => {
                                    setSelectedCategory(cat);
                                    setShowCategories(false);
                                }}
                            >
                                <CategoryIcon icon={cat.icon} color={cat.color} size={28} />
                                <NeonText variant="body">{cat.name}</NeonText>
                            </TouchableOpacity>
                        ))}
                    </GlassCard>
                )}

                {/* Account */}
                <NeonText variant="label" style={styles.fieldLabel}>{t('tx.account').toUpperCase()}</NeonText>
                <TouchableOpacity onPress={() => setShowAccounts(!showAccounts)}>
                    <GlassCard style={styles.categoryPicker}>
                        {selectedAccount ? (
                            <View style={styles.selectedCategory}>
                                <Ionicons name={(selectedAccount.icon as any) || 'wallet-outline'} size={24} color={selectedAccount.color} />
                                <NeonText variant="body">{selectedAccount.name}</NeonText>
                            </View>
                        ) : (
                            <NeonText variant="body" color={Colors.textTertiary}>Sin cuenta</NeonText>
                        )}
                        <Ionicons name={showAccounts ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textTertiary} />
                    </GlassCard>
                </TouchableOpacity>

                {showAccounts && (
                    <GlassCard style={styles.categoryList}>
                        {accounts.map(acc => (
                            <TouchableOpacity
                                key={acc.id}
                                style={[
                                    styles.categoryItem,
                                    selectedAccount?.id === acc.id && styles.categoryItemSelected,
                                ]}
                                onPress={() => {
                                    setSelectedAccount(acc);
                                    setShowAccounts(false);
                                }}
                            >
                                <Ionicons name={(acc.icon as any) || 'wallet-outline'} size={24} color={acc.color} />
                                <View style={{ flex: 1 }}>
                                    <NeonText variant="body">{acc.name}</NeonText>
                                    <NeonText variant="caption" color={Colors.textTertiary}>{acc.type}</NeonText>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </GlassCard>
                )}

                {/* Date */}
                <GlowInput
                    label={t('tx.date')}
                    placeholder="YYYY-MM-DD"
                    value={date}
                    onChangeText={setDate}
                    icon={<Ionicons name="calendar-outline" size={20} color={Colors.textTertiary} />}
                />

                {/* Note */}
                <GlowInput
                    label={t('tx.note')}
                    placeholder="..."
                    value={note}
                    onChangeText={setNote}
                    icon={<Ionicons name="document-text-outline" size={20} color={Colors.textTertiary} />}
                />

                {/* Save Button */}
                <NeonButton
                    title={saving ? '...' : (type === 'expense' ? t('tx.saveExpense') : t('tx.saveIncome'))}
                    onPress={handleSave}
                    variant={type === 'expense' ? 'danger' : 'primary'}
                    size="lg"
                    fullWidth
                    loading={saving}
                />

                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xxl,
        paddingTop: Spacing.xl,
    },
    typeToggle: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.xxl,
    },
    typeBtn: {
        flex: 1,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    typeBtnActive: {},
    typeBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        gap: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    amountInput: {
        fontSize: 32,
        fontWeight: '700',
    },
    suggestions: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        marginTop: -Spacing.md,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    suggestionItem: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    fieldLabel: {
        marginBottom: Spacing.sm,
        color: Colors.textSecondary,
    },
    categoryPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    selectedCategory: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    categoryList: {
        marginTop: -Spacing.md,
        marginBottom: Spacing.lg,
        padding: Spacing.sm,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.sm,
    },
    categoryItemSelected: {
        backgroundColor: Colors.surfaceLight,
    },
});
