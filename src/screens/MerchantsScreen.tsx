import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, NeonText, CategoryIcon } from '../components';
import { Colors, Spacing } from '../theme';
import { getMerchantSpending, deleteMerchant } from '../database/merchantService';
import { Merchant } from '../types';
import { formatCurrency } from '../utils';

type MerchantWithSpend = Merchant & { total_spent: number };

export const MerchantsScreen: React.FC = () => {
    const [merchants, setMerchants] = useState<MerchantWithSpend[]>([]);

    const loadData = useCallback(async () => {
        setMerchants(await getMerchantSpending() as MerchantWithSpend[]);
    }, []);

    useFocusEffect(useCallback(() => {
        loadData();
    }, [loadData]));

    const handleDelete = (m: Merchant) => {
        Alert.alert('Delete Merchant', `Delete "${m.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await deleteMerchant(m.id); loadData(); } },
        ]);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <NeonText variant="title" style={{ paddingTop: Spacing.xxl }}>Vendors</NeonText>
                <NeonText variant="caption" color={Colors.textMuted} style={{ marginTop: 2 }}>Sorted by total spending · hold to delete</NeonText>
            </View>

            {merchants.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="storefront-outline" size={64} color={Colors.textMuted} />
                    <NeonText variant="subtitle" color={Colors.textMuted}>No merchants yet</NeonText>
                    <NeonText variant="caption" color={Colors.textMuted}>Merchants are learned automatically from your transactions</NeonText>
                </View>
            ) : (
                <FlatList
                    data={merchants}
                    keyExtractor={m => String(m.id)}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity onLongPress={() => handleDelete(item)} activeOpacity={0.8}>
                            <GlassCard style={styles.merchantCard}>
                                <View style={[styles.merchantIcon, { backgroundColor: (item.category_color || Colors.info) + '20' }]}>
                                    <Ionicons name={(item.category_icon || 'storefront') as any} size={22} color={item.category_color || Colors.info} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <NeonText variant="body">{item.name}</NeonText>
                                    {item.category_name && (
                                        <NeonText variant="caption" color={Colors.textTertiary}>{item.category_name}</NeonText>
                                    )}
                                </View>
                                {(item as MerchantWithSpend).total_spent > 0 && (
                                    <View style={styles.spentBadge}>
                                        <NeonText variant="caption" color={Colors.rust} style={{ fontWeight: '700' }}>
                                            {formatCurrency((item as MerchantWithSpend).total_spent)}
                                        </NeonText>
                                        <NeonText variant="caption" color={Colors.textMuted}>spent</NeonText>
                                    </View>
                                )}
                            </GlassCard>
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xxxl },
    list: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
    merchantCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm, paddingVertical: Spacing.md },
    merchantIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    spentBadge: { alignItems: 'flex-end' },
});
