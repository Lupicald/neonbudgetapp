import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, NeonText, NeonButton, GlowInput, CategoryIcon } from '../components';
import { Colors, Spacing, BorderRadius, CategoryColors } from '../theme';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../database/categoryService';
import { Category } from '../types';

const ICONS = [
    'restaurant', 'car', 'game-controller', 'bag-handle', 'fitness', 'repeat',
    'home', 'flash', 'school', 'cash', 'code-slash', 'ellipse', 'heart',
    'airplane', 'beer', 'bicycle', 'book', 'briefcase', 'build', 'bus',
    'cafe', 'call', 'camera', 'cart', 'cloud', 'construct', 'desktop',
    'film', 'gift', 'globe', 'headset', 'key', 'laptop', 'leaf',
    'library', 'medkit', 'mic', 'moon', 'musical-notes', 'paw', 'people',
    'pizza', 'planet', 'rocket', 'shirt', 'star', 'storefront', 'sunny',
    'tennisball', 'trophy', 'wallet', 'wine',
];

export const CategoriesScreen: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('ellipse');
    const [selectedColor, setSelectedColor] = useState(CategoryColors[0]);

    const loadData = useCallback(async () => {
        setCategories(await getCategories());
    }, []);

    useFocusEffect(useCallback(() => {
        loadData();
    }, [loadData]));

    const resetForm = () => {
        setName('');
        setSelectedIcon('ellipse');
        setSelectedColor(CategoryColors[0]);
        setEditingId(null);
        setShowForm(false);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a name');
            return;
        }
        if (editingId) {
            await updateCategory(editingId, name.trim(), selectedIcon, selectedColor);
        } else {
            await addCategory(name.trim(), selectedIcon, selectedColor);
        }
        resetForm();
        loadData();
    };

    const handleEdit = (cat: Category) => {
        setEditingId(cat.id);
        setName(cat.name);
        setSelectedIcon(cat.icon);
        setSelectedColor(cat.color);
        setShowForm(true);
    };

    const handleDelete = (cat: Category) => {
        if (cat.is_default) {
            Alert.alert('Cannot Delete', 'Default categories cannot be deleted');
            return;
        }
        Alert.alert('Delete Category', `Delete "${cat.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await deleteCategory(cat.id); loadData(); } },
        ]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <NeonText variant="title" style={{ paddingTop: Spacing.xxl }}>Categories</NeonText>
                <TouchableOpacity onPress={() => { resetForm(); setShowForm(!showForm); }} style={{ paddingTop: Spacing.xxl }}>
                    <Ionicons name={showForm ? 'close' : 'add-circle'} size={28} color={Colors.electricBlue} />
                </TouchableOpacity>
            </View>

            {showForm && (
                <GlassCard style={styles.form} glowColor={Colors.electricBlue}>
                    <GlowInput label="Category Name" placeholder="e.g. Gym" value={name} onChangeText={setName} containerStyle={{ marginBottom: Spacing.md }} />

                    <NeonText variant="label" style={styles.label}>ICON</NeonText>
                    <FlatList
                        data={ICONS}
                        keyExtractor={i => i}
                        numColumns={8}
                        style={styles.iconGrid}
                        scrollEnabled={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.iconBtn, selectedIcon === item && { backgroundColor: `${selectedColor}30`, borderColor: selectedColor }]}
                                onPress={() => setSelectedIcon(item)}
                            >
                                <Ionicons name={item as any} size={20} color={selectedIcon === item ? selectedColor : Colors.textTertiary} />
                            </TouchableOpacity>
                        )}
                    />

                    <NeonText variant="label" style={styles.label}>COLOR</NeonText>
                    <View style={styles.colorRow}>
                        {CategoryColors.map(c => (
                            <TouchableOpacity
                                key={c}
                                style={[styles.colorBtn, { backgroundColor: c }, selectedColor === c && styles.colorBtnSelected]}
                                onPress={() => setSelectedColor(c)}
                            />
                        ))}
                    </View>

                    <NeonButton title={editingId ? 'Update Category' : 'Add Category'} onPress={handleSave} variant="secondary" fullWidth />
                </GlassCard>
            )}

            <FlatList
                data={categories}
                keyExtractor={c => String(c.id)}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleEdit(item)} onLongPress={() => handleDelete(item)}>
                        <GlassCard style={styles.catCard}>
                            <CategoryIcon icon={item.icon} color={item.color} size={40} />
                            <View style={{ flex: 1 }}>
                                <NeonText variant="body">{item.name}</NeonText>
                                {item.is_default ? <NeonText variant="caption" color={Colors.textMuted}>Default</NeonText> : null}
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                        </GlassCard>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
    form: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
    label: { marginBottom: Spacing.sm, color: Colors.textSecondary },
    iconGrid: { marginBottom: Spacing.md },
    iconBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', margin: 2, borderWidth: 1, borderColor: 'transparent' },
    colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
    colorBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'transparent' },
    colorBtnSelected: { borderColor: Colors.textPrimary, transform: [{ scale: 1.2 }] },
    list: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
    catCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm, paddingVertical: Spacing.md },
});
