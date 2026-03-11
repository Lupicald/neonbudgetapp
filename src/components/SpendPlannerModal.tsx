import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Modal,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Dimensions,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NeonText } from './NeonText';
import { GlassCard } from './GlassCard';
import { Colors, Spacing, BorderRadius, FontSize } from '../theme';
import { getCategories, deleteCategory } from '../database/categoryService';
import { getAccounts } from '../database/accountService';
import { getBudgets } from '../database/budgetService';
import { formatCurrency, getMonthKey } from '../utils';
import { Category, Account } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Importance = 'yes' | 'no' | 'maybe' | null;

interface SpendPlannerData {
    importance: Importance;
    category: Category | null;
    account: Account | null;
    vendor: string;
    amount: string;
}

interface Recommendation {
    status: 'go' | 'caution' | 'stop';
    title: string;
    subtitle: string;
    reasons: string[];
    color: string;
    glowColor: string;
    icon: string;
}

interface Props {
    visible: boolean;
    onClose: () => void;
}

export const SpendPlannerModal: React.FC<Props> = ({ visible, onClose }) => {
    const navigation = useNavigation<any>();
    const [step, setStep] = useState(0);
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(false);
    const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
    const slideAnim = useRef(new Animated.Value(0)).current;

    const [data, setData] = useState<SpendPlannerData>({
        importance: null,
        category: null,
        account: null,
        vendor: '',
        amount: '',
    });

    useEffect(() => {
        if (visible) {
            loadData();
            resetState();
        }
    }, [visible]);

    const loadData = async () => {
        try {
            const [cats, accs] = await Promise.all([getCategories(), getAccounts()]);
            setCategories(cats);
            setAccounts(accs);
        } catch (e) {
            console.log('Planner load error:', e);
        }
    };

    const handleDeleteCategory = (cat: Category) => {
        if (cat.is_default === 1) return;
        Alert.alert(
            'Eliminar categoría',
            `¿Eliminar "${cat.name}"? Las transacciones existentes no se borrarán.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCategory(cat.id);
                            if (data.category?.id === cat.id) {
                                setData(d => ({ ...d, category: null }));
                            }
                            await loadData();
                        } catch (e) {
                            console.log('Delete category error:', e);
                        }
                    },
                },
            ]
        );
    };

    const resetState = () => {
        setStep(0);
        setData({ importance: null, category: null, account: null, vendor: '', amount: '' });
        setRecommendation(null);
        slideAnim.setValue(0);
    };

    const animateToStep = (nextStep: number) => {
        Animated.sequence([
            Animated.timing(slideAnim, { toValue: -30, duration: 120, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]).start();
        setStep(nextStep);
    };

    const goNext = () => animateToStep(step + 1);
    const goBack = () => animateToStep(step - 1);

    const computeRecommendation = async () => {
        setLoading(true);
        try {
            const amount = parseFloat(data.amount) || 0;
            const accountBalance = data.account?.balance ?? 0;
            const month = getMonthKey();

            // Get budget for this category
            let categoryBudgetRatio = 0;
            if (data.category) {
                const budgets = await getBudgets(month);
                const catBudget = budgets.find(b => b.category_id === data.category!.id);
                const allBudget = budgets.find(b => b.category_id === -1);
                const budget = catBudget || allBudget;
                if (budget && budget.monthly_limit > 0) {
                    const remaining = budget.monthly_limit - (budget.spent || 0);
                    categoryBudgetRatio = ((budget.spent || 0) + amount) / budget.monthly_limit;
                }
            }

            const isImportant = data.importance === 'yes';
            const isMaybe = data.importance === 'maybe';
            const hasEnoughFunds = accountBalance >= amount && amount > 0;
            const overBudget = categoryBudgetRatio > 1;
            const nearBudget = categoryBudgetRatio > 0.8 && categoryBudgetRatio <= 1;

            const reasons: string[] = [];
            let status: 'go' | 'caution' | 'stop' = 'go';

            // Evaluate importance
            if (isImportant) {
                reasons.push('✅ Lo marcaste como importante');
            } else if (isMaybe) {
                reasons.push('🤔 No estás seguro si es necesario');
                status = 'caution';
            } else {
                reasons.push('❌ No lo consideras importante');
                status = 'stop';
            }

            // Evaluate funds
            if (amount > 0) {
                if (hasEnoughFunds) {
                    reasons.push(`✅ Tu cuenta "${data.account?.name}" tiene saldo suficiente`);
                } else if (data.account) {
                    reasons.push(`❌ Tu cuenta "${data.account?.name}" no tiene fondos suficientes (${formatCurrency(accountBalance)} disponible)`);
                    status = 'stop';
                }
            }

            // Evaluate budget
            if (categoryBudgetRatio > 0) {
                if (overBudget) {
                    reasons.push(`❌ Esto sobrepasaría tu presupuesto de "${data.category?.name}" (${Math.round(categoryBudgetRatio * 100)}%)`);
                    if (status === 'go') status = 'caution';
                    if (status === 'caution' && !isImportant) status = 'stop';
                } else if (nearBudget) {
                    reasons.push(`⚠️ Llegarías al ${Math.round(categoryBudgetRatio * 100)}% de tu presupuesto de "${data.category?.name}"`);
                    if (status === 'go') status = 'caution';
                } else {
                    reasons.push(`✅ Estás dentro del presupuesto de "${data.category?.name}"`);
                }
            }

            // Add vendor context
            if (data.vendor.trim()) {
                reasons.push(`🏪 Vendor: ${data.vendor}`);
            }

            let rec: Recommendation;
            if (status === 'go') {
                rec = {
                    status: 'go',
                    title: '¡Adelante!',
                    subtitle: 'Todo indica que puedes hacer este gasto.',
                    reasons,
                    color: Colors.cyberGreen,
                    glowColor: Colors.glowGreen,
                    icon: 'checkmark-circle',
                };
            } else if (status === 'caution') {
                rec = {
                    status: 'caution',
                    title: 'Con precaución',
                    subtitle: 'Puedes hacerlo, pero ten en cuenta esto:',
                    reasons,
                    color: Colors.neonOrange,
                    glowColor: Colors.glowOrange,
                    icon: 'warning',
                };
            } else {
                rec = {
                    status: 'stop',
                    title: 'Mejor no',
                    subtitle: 'Hay razones por las que este gasto no conviene:',
                    reasons,
                    color: Colors.neonPink,
                    glowColor: Colors.glowPink,
                    icon: 'close-circle',
                };
            }

            setRecommendation(rec);
            animateToStep(5);
        } catch (e) {
            console.log('Recommendation error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = () => {
        onClose();
        const params: any = {};
        if (data.category) params.prefillCategoryId = data.category.id;
        if (data.account) params.prefillAccountId = data.account.id;
        if (data.amount) params.prefillAmount = data.amount;
        if (data.vendor) params.prefillMerchant = data.vendor;
        navigation.navigate('AddTransaction', params);
    };

    const handleAddCategory = () => {
        onClose();
        navigation.navigate('Settings', { screen: 'CategoriesManage' });
    };

    const STEPS = ['¿Es importante?', 'Categoría', 'Cuenta', 'Vendor', 'Monto', 'Resultado'];
    const totalSteps = 5; // steps 0-4 before result

    const renderStep = () => {
        switch (step) {
            // ── STEP 0: Importance ──────────────────────────────
            case 0:
                return (
                    <View style={styles.stepContent}>
                        <Ionicons name="help-circle-outline" size={52} color={Colors.neonPurple} style={styles.stepIcon} />
                        <NeonText variant="subtitle" align="center" style={styles.stepQuestion}>
                            ¿Este gasto es importante o necesario?
                        </NeonText>
                        <NeonText variant="caption" color={Colors.textTertiary} align="center" style={{ marginBottom: Spacing.xl }}>
                            Piensa si el impacto sería notable si no lo haces
                        </NeonText>
                        {[
                            { id: 'yes', label: 'Sí, es necesario', icon: 'checkmark-circle', color: Colors.cyberGreen },
                            { id: 'maybe', label: 'Tal vez...', icon: 'help-circle', color: Colors.neonOrange },
                            { id: 'no', label: 'No realmente', icon: 'close-circle', color: Colors.neonPink },
                        ].map(opt => (
                            <TouchableOpacity
                                key={opt.id}
                                style={[styles.optionBtn, data.importance === opt.id && { borderColor: opt.color, backgroundColor: `${opt.color}15` }]}
                                onPress={() => setData(d => ({ ...d, importance: opt.id as Importance }))}
                                activeOpacity={0.8}
                            >
                                <Ionicons name={opt.icon as any} size={22} color={opt.color} />
                                <NeonText variant="body" color={data.importance === opt.id ? opt.color : Colors.textSecondary}>
                                    {opt.label}
                                </NeonText>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={[styles.nextBtn, !data.importance && styles.nextBtnDisabled]}
                            onPress={goNext}
                            disabled={!data.importance}
                        >
                            <LinearGradient
                                colors={[Colors.neonPurple, Colors.electricBlue] as [string, string]}
                                style={styles.nextBtnGrad}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            >
                                <NeonText variant="body" color="#fff" style={{ fontWeight: '700' }}>Siguiente</NeonText>
                                <Ionicons name="arrow-forward" size={18} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                );

            // ── STEP 1: Category ────────────────────────────────
            case 1:
                return (
                    <View style={styles.stepContent}>
                        <Ionicons name="grid-outline" size={52} color={Colors.electricBlue} style={styles.stepIcon} />
                        <NeonText variant="subtitle" align="center" style={styles.stepQuestion}>
                            ¿Qué categoría es el gasto?
                        </NeonText>
                        <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
                            {categories.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.listItem, data.category?.id === cat.id && { borderColor: cat.color, backgroundColor: `${cat.color}15` }]}
                                    onPress={() => setData(d => ({ ...d, category: cat }))}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                                    <NeonText variant="body" color={data.category?.id === cat.id ? cat.color : Colors.textSecondary} style={{ flex: 1 }}>
                                        {cat.name}
                                    </NeonText>
                                    {data.category?.id === cat.id && (
                                        <Ionicons name="checkmark" size={18} color={cat.color} />
                                    )}
                                    {cat.is_default === 0 && (
                                        <TouchableOpacity
                                            onPress={(e) => { e.stopPropagation?.(); handleDeleteCategory(cat); }}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            style={{ marginLeft: 4 }}
                                        >
                                            <Ionicons name="trash-outline" size={16} color={Colors.neonPink} />
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity style={styles.addNewBtn} onPress={handleAddCategory} activeOpacity={0.8}>
                                <Ionicons name="add-circle-outline" size={20} color={Colors.electricBlue} />
                                <NeonText variant="body" color={Colors.electricBlue}>Nueva categoría</NeonText>
                            </TouchableOpacity>
                        </ScrollView>
                        <View style={styles.stepNavRow}>
                            <TouchableOpacity style={styles.backBtn} onPress={goBack}>
                                <Ionicons name="arrow-back" size={18} color={Colors.textTertiary} />
                                <NeonText variant="caption" color={Colors.textTertiary}>Atrás</NeonText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.nextBtn, !data.category && styles.nextBtnDisabled]}
                                onPress={goNext}
                                disabled={!data.category}
                            >
                                <LinearGradient
                                    colors={[Colors.neonPurple, Colors.electricBlue] as [string, string]}
                                    style={styles.nextBtnGrad}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                >
                                    <NeonText variant="body" color="#fff" style={{ fontWeight: '700' }}>Siguiente</NeonText>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            // ── STEP 2: Account ─────────────────────────────────
            case 2:
                return (
                    <View style={styles.stepContent}>
                        <Ionicons name="wallet-outline" size={52} color={Colors.cyberGreen} style={styles.stepIcon} />
                        <NeonText variant="subtitle" align="center" style={styles.stepQuestion}>
                            ¿De qué cuenta sale el dinero?
                        </NeonText>
                        <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
                            {accounts.map(acc => (
                                <TouchableOpacity
                                    key={acc.id}
                                    style={[styles.listItem, data.account?.id === acc.id && { borderColor: acc.color, backgroundColor: `${acc.color}15` }]}
                                    onPress={() => setData(d => ({ ...d, account: acc }))}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.categoryDot, { backgroundColor: acc.color, shadowColor: acc.color, shadowOpacity: 0.8, shadowRadius: 6 }]} />
                                    <View style={{ flex: 1 }}>
                                        <NeonText variant="body" color={data.account?.id === acc.id ? acc.color : Colors.textSecondary}>
                                            {acc.name}
                                        </NeonText>
                                        <NeonText variant="caption" color={acc.balance >= 0 ? Colors.cyberGreen : Colors.neonPink}>
                                            {formatCurrency(acc.balance)}
                                        </NeonText>
                                    </View>
                                    {data.account?.id === acc.id && (
                                        <Ionicons name="checkmark" size={18} color={acc.color} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <View style={styles.stepNavRow}>
                            <TouchableOpacity style={styles.backBtn} onPress={goBack}>
                                <Ionicons name="arrow-back" size={18} color={Colors.textTertiary} />
                                <NeonText variant="caption" color={Colors.textTertiary}>Atrás</NeonText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.nextBtn, !data.account && styles.nextBtnDisabled]}
                                onPress={goNext}
                                disabled={!data.account}
                            >
                                <LinearGradient
                                    colors={[Colors.neonPurple, Colors.electricBlue] as [string, string]}
                                    style={styles.nextBtnGrad}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                >
                                    <NeonText variant="body" color="#fff" style={{ fontWeight: '700' }}>Siguiente</NeonText>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            // ── STEP 3: Vendor ──────────────────────────────────
            case 3:
                return (
                    <View style={styles.stepContent}>
                        <Ionicons name="storefront-outline" size={52} color={Colors.neonOrange} style={styles.stepIcon} />
                        <NeonText variant="subtitle" align="center" style={styles.stepQuestion}>
                            ¿De qué comercio o vendor es?
                        </NeonText>
                        <NeonText variant="caption" color={Colors.textTertiary} align="center" style={{ marginBottom: Spacing.lg }}>
                            Opcional — puede ayudar a identificar el gasto después
                        </NeonText>
                        <TextInput
                            style={styles.textInput}
                            value={data.vendor}
                            onChangeText={v => setData(d => ({ ...d, vendor: v }))}
                            placeholder="Ej: Walmart, Amazon, Netflix..."
                            placeholderTextColor={Colors.textMuted}
                            autoCapitalize="words"
                        />
                        <View style={styles.stepNavRow}>
                            <TouchableOpacity style={styles.backBtn} onPress={goBack}>
                                <Ionicons name="arrow-back" size={18} color={Colors.textTertiary} />
                                <NeonText variant="caption" color={Colors.textTertiary}>Atrás</NeonText>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
                                <LinearGradient
                                    colors={[Colors.neonPurple, Colors.electricBlue] as [string, string]}
                                    style={styles.nextBtnGrad}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                >
                                    <NeonText variant="body" color="#fff" style={{ fontWeight: '700' }}>
                                        {data.vendor.trim() ? 'Siguiente' : 'Omitir'}
                                    </NeonText>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            // ── STEP 4: Amount ──────────────────────────────────
            case 4:
                return (
                    <View style={styles.stepContent}>
                        <Ionicons name="cash-outline" size={52} color={Colors.neonPink} style={styles.stepIcon} />
                        <NeonText variant="subtitle" align="center" style={styles.stepQuestion}>
                            ¿Cuánto costará?
                        </NeonText>
                        <NeonText variant="caption" color={Colors.textTertiary} align="center" style={{ marginBottom: Spacing.lg }}>
                            Ingresa el monto aproximado del gasto
                        </NeonText>
                        <View style={styles.amountInputWrapper}>
                            <NeonText variant="subtitle" color={Colors.textTertiary} style={{ marginRight: Spacing.sm }}>$</NeonText>
                            <TextInput
                                style={[styles.textInput, { flex: 1, fontSize: 28, fontWeight: '700', color: Colors.textPrimary }]}
                                value={data.amount}
                                onChangeText={v => setData(d => ({ ...d, amount: v.replace(/[^0-9.]/g, '') }))}
                                placeholder="0.00"
                                placeholderTextColor={Colors.textMuted}
                                keyboardType="decimal-pad"
                                autoFocus
                            />
                        </View>
                        {data.account && data.amount && parseFloat(data.amount) > 0 && (
                            <View style={[styles.balanceHint, { borderColor: parseFloat(data.amount) <= data.account.balance ? `${Colors.cyberGreen}44` : `${Colors.neonPink}44` }]}>
                                <Ionicons
                                    name={parseFloat(data.amount) <= data.account.balance ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                                    size={16}
                                    color={parseFloat(data.amount) <= data.account.balance ? Colors.cyberGreen : Colors.neonPink}
                                />
                                <NeonText
                                    variant="caption"
                                    color={parseFloat(data.amount) <= data.account.balance ? Colors.cyberGreen : Colors.neonPink}
                                >
                                    {data.account.name}: {formatCurrency(data.account.balance)} disponible
                                </NeonText>
                            </View>
                        )}
                        <View style={styles.stepNavRow}>
                            <TouchableOpacity style={styles.backBtn} onPress={goBack}>
                                <Ionicons name="arrow-back" size={18} color={Colors.textTertiary} />
                                <NeonText variant="caption" color={Colors.textTertiary}>Atrás</NeonText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.nextBtn, loading && styles.nextBtnDisabled]}
                                onPress={computeRecommendation}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={[Colors.neonPurple, Colors.electricBlue] as [string, string]}
                                    style={styles.nextBtnGrad}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <>
                                            <NeonText variant="body" color="#fff" style={{ fontWeight: '700' }}>Analizar</NeonText>
                                            <Ionicons name="sparkles" size={18} color="#fff" />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            // ── STEP 5: Result ──────────────────────────────────
            case 5:
                if (!recommendation) return null;
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.resultIconWrapper}>
                            <LinearGradient
                                colors={[`${recommendation.color}30`, `${recommendation.color}08`] as [string, string]}
                                style={styles.resultIconBg}
                            >
                                <Ionicons name={recommendation.icon as any} size={56} color={recommendation.color} />
                            </LinearGradient>
                        </View>
                        <NeonText
                            variant="title"
                            color={recommendation.color}
                            align="center"
                            glow
                            glowColor={recommendation.glowColor}
                            style={{ marginBottom: Spacing.xs }}
                        >
                            {recommendation.title}
                        </NeonText>
                        <NeonText variant="body" color={Colors.textSecondary} align="center" style={{ marginBottom: Spacing.lg }}>
                            {recommendation.subtitle}
                        </NeonText>

                        <GlassCard style={styles.reasonsCard} glowColor={recommendation.glowColor}>
                            {recommendation.reasons.map((r, i) => (
                                <NeonText key={i} variant="body" color={Colors.textSecondary} style={styles.reasonRow}>
                                    {r}
                                </NeonText>
                            ))}
                        </GlassCard>

                        {/* Summary of selections */}
                        <View style={styles.summaryRow}>
                            {data.category && (
                                <View style={[styles.summaryChip, { borderColor: `${data.category.color}44` }]}>
                                    <View style={[styles.categoryDot, { backgroundColor: data.category.color, width: 8, height: 8 }]} />
                                    <NeonText variant="caption" color={Colors.textTertiary}>{data.category.name}</NeonText>
                                </View>
                            )}
                            {data.account && (
                                <View style={[styles.summaryChip, { borderColor: `${data.account.color}44` }]}>
                                    <Ionicons name="wallet-outline" size={12} color={Colors.textTertiary} />
                                    <NeonText variant="caption" color={Colors.textTertiary}>{data.account.name}</NeonText>
                                </View>
                            )}
                            {data.amount ? (
                                <View style={styles.summaryChip}>
                                    <NeonText variant="caption" color={Colors.neonPink} style={{ fontWeight: '700' }}>
                                        ${parseFloat(data.amount).toFixed(2)}
                                    </NeonText>
                                </View>
                            ) : null}
                        </View>

                        <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} activeOpacity={0.85}>
                            <LinearGradient
                                colors={[Colors.neonPurple, Colors.electricBlue] as [string, string]}
                                style={styles.nextBtnGrad}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                                <NeonText variant="body" color="#fff" style={{ fontWeight: '700' }}>Registrar gasto de todos modos</NeonText>
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.75}>
                            <NeonText variant="body" color={Colors.textTertiary}>Cancelar</NeonText>
                        </TouchableOpacity>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Background glows */}
                <View style={styles.bgGlow1} pointerEvents="none" />
                <View style={styles.bgGlow2} pointerEvents="none" />

                {/* Header */}
                <View style={styles.modalHeader}>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Ionicons name="close" size={22} color={Colors.textTertiary} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <NeonText variant="subtitle" color={Colors.textPrimary} style={{ fontWeight: '700' }}>
                            💡 Spend Planner
                        </NeonText>
                    </View>
                    <View style={{ width: 36 }} />
                </View>

                {/* Step progress dots */}
                {step < 5 && (
                    <View style={styles.progressDots}>
                        {[0, 1, 2, 3, 4].map(i => (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    i < step && styles.dotDone,
                                    i === step && styles.dotActive,
                                ]}
                            />
                        ))}
                    </View>
                )}

                {/* Step label */}
                {step < 5 && (
                    <NeonText
                        variant="caption"
                        color={Colors.textMuted}
                        align="center"
                        style={{ marginBottom: Spacing.md }}
                    >
                        Paso {step + 1} de 5 — {STEPS[step]}
                    </NeonText>
                )}

                <Animated.View style={[{ flex: 1 }, { transform: [{ translateX: slideAnim }] }]}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {renderStep()}
                    </ScrollView>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    bgGlow1: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(191, 90, 242, 0.08)',
        top: -80,
        left: -60,
    },
    bgGlow2: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(10, 132, 255, 0.06)',
        bottom: 100,
        right: -50,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: Platform.OS === 'ios' ? Spacing.lg : Spacing.xxxl,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    progressDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    dotDone: {
        backgroundColor: Colors.electricBlue,
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    dotActive: {
        backgroundColor: Colors.neonPurple,
        width: 14,
        height: 8,
        borderRadius: 4,
        shadowColor: Colors.glowPurple,
        shadowOpacity: 0.8,
        shadowRadius: 6,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xxxl + 20,
    },
    stepContent: {
        paddingTop: Spacing.md,
    },
    stepIcon: {
        alignSelf: 'center',
        marginBottom: Spacing.md,
    },
    stepQuestion: {
        marginBottom: Spacing.sm,
        fontWeight: '700',
    },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.lg,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        marginBottom: Spacing.sm,
    },
    listScroll: {
        maxHeight: 280,
        marginBottom: Spacing.md,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        marginBottom: Spacing.xs,
    },
    categoryDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    addNewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: `${Colors.electricBlue}44`,
        borderStyle: 'dashed',
        justifyContent: 'center',
        marginTop: Spacing.xs,
    },
    textInput: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        borderRadius: 14,
        padding: Spacing.lg,
        color: Colors.textPrimary,
        fontSize: FontSize.md,
        marginBottom: Spacing.lg,
    },
    amountInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    balanceHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: 10,
        borderWidth: 1,
        backgroundColor: 'rgba(255,255,255,0.04)',
        marginBottom: Spacing.lg,
    },
    stepNavRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.md,
        gap: Spacing.md,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        padding: Spacing.md,
    },
    nextBtn: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
    },
    nextBtnDisabled: {
        opacity: 0.4,
    },
    nextBtnGrad: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: 14,
    },
    resultIconWrapper: {
        alignSelf: 'center',
        marginBottom: Spacing.lg,
    },
    resultIconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reasonsCard: {
        marginBottom: Spacing.lg,
        gap: Spacing.sm,
    },
    reasonRow: {
        paddingVertical: Spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        lineHeight: 22,
    },
    summaryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
        justifyContent: 'center',
    },
    summaryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    registerBtn: {
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: Spacing.md,
    },
    cancelBtn: {
        alignItems: 'center',
        padding: Spacing.md,
    },
});
