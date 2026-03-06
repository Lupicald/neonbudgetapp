import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, NeonText, CategoryIcon } from '../components';
import { Colors, Spacing } from '../theme';
import { getMerchants, deleteMerchant } from '../database/merchantService';
import { Merchant } from '../types';

export const MerchantsScreen: React.FC = () => {
    const [merchants, setMerchants] = useState<Merchant[]>([]);

    const loadData = useCallback(async () => {
        setMerchants(await getMerchants());
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
        <View style={styles.container}>
            <View style={styles.header}>
                <NeonText variant="title" style={{ paddingTop: Spacing.xxl }}>Merchants</NeonText>
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
                        <TouchableOpacity onLongPress={() => handleDelete(item)}>
                            <GlassCard style={styles.merchantCard}>
                                <Ionicons name="storefront" size={24} color={Colors.electricBlue} />
                                <View style={{ flex: 1 }}>
                                    <NeonText variant="body">{item.name}</NeonText>
                                    {item.category_name && (
                                        <View style={styles.catRow}>
                                            <CategoryIcon icon={item.category_icon || 'ellipse'} color={item.category_color || Colors.electricBlue} size={20} />
                                            <NeonText variant="caption" color={Colors.textTertiary}>{item.category_name}</NeonText>
                                        </View>
                                    )}
                                </View>
                            </GlassCard>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xxxl },
    list: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
    merchantCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm, paddingVertical: Spacing.md },
    catRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
});
