import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { GlassCard, NeonText, NeonButton, GlowInput } from '../components';
import { Colors, Spacing, BorderRadius } from '../theme';
import { getSetting, setSetting } from '../database/settingsService';
import { resetDatabase } from '../database/database';
import { shareCSV, importFromCSV } from '../services/csvService';
import { useLanguage } from '../context/LanguageContext';

const CURRENCIES = ['MXN', 'USD', 'EUR', 'GBP', 'CAD', 'COP', 'ARS', 'BRL'];

export const SettingsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [debtLimit, setDebtLimit] = useState('');
    const [currency, setCurrency] = useState('MXN');
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const { language, setLanguage, t } = useLanguage();

    const loadData = useCallback(async () => {
        const dl = await getSetting('debt_limit');
        const cur = await getSetting('currency');
        setDebtLimit(dl || '-30000');
        setCurrency(cur || 'MXN');
    }, []);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    const saveDebtLimit = async () => {
        await setSetting('debt_limit', debtLimit);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Saved', 'Debt limit updated');
    };

    const saveCurrency = async (cur: string) => {
        setCurrency(cur);
        await setSetting('currency', cur);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            await shareCSV();
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error: any) {
            Alert.alert('Export Error', error?.message || 'Failed to export');
        } finally {
            setExporting(false);
        }
    };

    const handleImport = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets?.[0]) return;

            Alert.alert(
                'Import Data',
                'This will import transactions from the CSV file. Existing data will NOT be deleted. Continue?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Import', onPress: async () => {
                            setImporting(true);
                            try {
                                const fileUri = result.assets[0].uri;
                                const content = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
                                const { imported, skipped, errorMsg } = await importFromCSV(content);
                                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                let msg = `✅ ${imported} transactions imported\n⏭️ ${skipped} skipped`;
                                if (errorMsg) msg += `\n\nError: ${errorMsg}`;
                                Alert.alert('Import Complete', msg);
                            } catch (error: any) {
                                Alert.alert('Import Error', error?.message || 'Failed to import');
                            } finally {
                                setImporting(false);
                            }
                        }
                    },
                ]
            );
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to pick file');
        }
    };

    const handleReset = () => {
        Alert.alert(
            'Reset Data',
            'Are you sure you want to permanently delete all your transactions, accounts, and settings? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete All', style: 'destructive', onPress: async () => {
                        try {
                            await resetDatabase();
                            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert('Success', 'All data has been reset to defaults.');
                        } catch (e: any) {
                            Alert.alert('Error', 'Failed to reset data: ' + e?.message);
                        }
                    }
                }
            ]
        );
    };

    const navItem = (label: string, icon: string, screen: string) => (
        <TouchableOpacity key={screen} style={styles.navItem} onPress={() => navigation.navigate(screen)}>
            <View style={styles.navLeft}>
                <Ionicons name={icon as any} size={20} color={Colors.electricBlue} />
                <NeonText variant="body">{label}</NeonText>
            </View>
            <Ionicons name="chevron-forward-outline" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <NeonText variant="title" style={{ paddingTop: Spacing.xxl + Spacing.xl }}>Settings</NeonText>

                {/* Data Import / Export */}
                <NeonText variant="subtitle" style={styles.sectionTitle}>Data</NeonText>
                <GlassCard style={styles.section} glowColor={Colors.electricBlue}>
                    <NeonButton title={importing ? 'Importing...' : '📥  Import CSV'} onPress={handleImport} variant="secondary" fullWidth loading={importing} />
                    <View style={{ height: Spacing.sm }} />
                    <NeonButton title={exporting ? 'Exporting...' : '📤  Export CSV'} onPress={handleExport} variant="secondary" fullWidth loading={exporting} />
                    <NeonText variant="caption" color={Colors.textMuted} style={{ marginTop: Spacing.sm }}>
                        Compatible with Cashew app format
                    </NeonText>
                </GlassCard>

                {/* Language */}
                <NeonText variant="subtitle" style={styles.sectionTitle}>{t('settings.language')}</NeonText>
                <GlassCard style={styles.section}>
                    <View style={styles.currencyRow}>
                        <TouchableOpacity
                            style={[styles.currencyChip, language === 'en' && styles.currencyActive]}
                            onPress={() => setLanguage('en')}>
                            <NeonText variant="caption" color={language === 'en' ? Colors.electricBlue : Colors.textTertiary}>{t('settings.english')}</NeonText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.currencyChip, language === 'es' && styles.currencyActive]}
                            onPress={() => setLanguage('es')}>
                            <NeonText variant="caption" color={language === 'es' ? Colors.electricBlue : Colors.textTertiary}>{t('settings.spanish')}</NeonText>
                        </TouchableOpacity>
                    </View>
                </GlassCard>

                {/* Currency */}
                <NeonText variant="subtitle" style={styles.sectionTitle}>Currency</NeonText>
                <GlassCard style={styles.section}>
                    <View style={styles.currencyRow}>
                        {CURRENCIES.map(c => (
                            <TouchableOpacity key={c}
                                style={[styles.currencyChip, currency === c && styles.currencyActive]}
                                onPress={() => saveCurrency(c)}>
                                <NeonText variant="caption" color={currency === c ? Colors.electricBlue : Colors.textTertiary}>{c}</NeonText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </GlassCard>

                {/* Debt Limit */}
                <NeonText variant="subtitle" style={styles.sectionTitle}>Debt Limit</NeonText>
                <GlassCard style={styles.section}>
                    <GlowInput label="Minimum Balance Alert" value={debtLimit} onChangeText={setDebtLimit} keyboardType="numeric" />
                    <NeonButton title="Save" onPress={saveDebtLimit} variant="secondary" />
                </GlassCard>

                {/* Management */}
                <NeonText variant="subtitle" style={styles.sectionTitle}>Manage</NeonText>
                <GlassCard style={styles.navSection}>
                    {navItem('Categories', 'grid-outline', 'CategoriesManage')}
                    {navItem('Merchants', 'storefront-outline', 'MerchantsManage')}
                    {navItem('Budgets', 'pie-chart-outline', 'BudgetsManage')}
                    {navItem('Goals', 'trophy-outline', 'GoalsManage')}
                    {navItem('Achievements', 'medal-outline', 'Achievements')}
                    {navItem('Calendar', 'calendar-outline', 'Calendar')}
                    {navItem('Timeline', 'time-outline', 'Timeline')}
                    {navItem('Transfers', 'swap-horizontal-outline', 'Transfers')}

                    <TouchableOpacity style={[styles.navItem, { borderBottomWidth: 0 }]} onPress={handleReset}>
                        <View style={styles.navLeft}>
                            <Ionicons name="trash-outline" size={20} color={Colors.neonPink} />
                            <NeonText variant="body" color={Colors.neonPink}>Reset All Data</NeonText>
                        </View>
                        <Ionicons name="chevron-forward-outline" size={18} color={Colors.textTertiary} />
                    </TouchableOpacity>
                </GlassCard>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { paddingHorizontal: Spacing.lg },
    sectionTitle: { marginTop: Spacing.xl, marginBottom: Spacing.md },
    section: { marginBottom: Spacing.md },
    currencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    currencyChip: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border },
    currencyActive: { backgroundColor: `${Colors.electricBlue}20`, borderColor: Colors.electricBlue },
    navSection: { padding: 0 },
    navItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
    navLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
});
