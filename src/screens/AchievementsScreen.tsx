import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, NeonText } from '../components';
import { Colors, Spacing, BorderRadius } from '../theme';
import { getAchievements } from '../services/gamification';
import { Achievement } from '../types';

export const AchievementsScreen: React.FC = () => {
    const [achievements, setAchievements] = useState<Achievement[]>([]);

    useFocusEffect(useCallback(() => {
        (async () => setAchievements(await getAchievements()))();
    }, []));

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <NeonText variant="title" style={{ paddingTop: Spacing.xxl }}>Achievements</NeonText>
                <NeonText variant="caption" color={Colors.textTertiary} style={{ paddingTop: Spacing.xxl }}>
                    {achievements.filter(a => a.unlocked_at).length}/{achievements.length} unlocked
                </NeonText>
            </View>

            <FlatList
                data={achievements}
                keyExtractor={a => String(a.id)}
                numColumns={2}
                contentContainerStyle={styles.grid}
                columnWrapperStyle={{ gap: Spacing.md }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                    const unlocked = !!item.unlocked_at;
                    return (
                        <GlassCard
                            style={[styles.badge, !unlocked && styles.badgeLocked]}
                            glowColor={unlocked ? Colors.neonYellow : undefined}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: unlocked ? `${Colors.neonYellow}20` : Colors.surface }]}>
                                <Ionicons
                                    name={item.icon as any}
                                    size={28}
                                    color={unlocked ? Colors.neonYellow : Colors.textMuted}
                                />
                            </View>
                            <NeonText variant="body" color={unlocked ? Colors.textPrimary : Colors.textMuted} align="center" numberOfLines={1}>
                                {item.title}
                            </NeonText>
                            <NeonText variant="caption" color={unlocked ? Colors.textTertiary : Colors.textMuted} align="center" numberOfLines={2}>
                                {item.description}
                            </NeonText>
                            {unlocked && (
                                <View style={styles.unlockedBadge}>
                                    <Ionicons name="checkmark-circle" size={14} color={Colors.cyberGreen} />
                                    <NeonText variant="caption" color={Colors.cyberGreen}>Unlocked</NeonText>
                                </View>
                            )}
                        </GlassCard>
                    );
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
    grid: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
    badge: { flex: 1, alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.md, paddingVertical: Spacing.lg },
    badgeLocked: { opacity: 0.5 },
    iconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
    unlockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs },
});
