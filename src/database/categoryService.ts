import { getDatabase } from './database';
import { Category } from '../types';

export const getCategories = async (): Promise<Category[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<Category>('SELECT * FROM categories ORDER BY is_default DESC, name ASC');
};

export const addCategory = async (name: string, icon: string, color: string): Promise<number> => {
    const db = await getDatabase();
    const result = await db.runAsync(
        'INSERT INTO categories (name, icon, color, is_default) VALUES (?, ?, ?, 0)',
        [name, icon, color]
    );
    return result.lastInsertRowId;
};

export const updateCategory = async (id: number, name: string, icon: string, color: string): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync(
        'UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ?',
        [name, icon, color, id]
    );
};

export const deleteCategory = async (id: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM categories WHERE id = ? AND is_default = 0', [id]);
};
