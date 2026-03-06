import { getDatabase } from './database';
import { Merchant } from '../types';

export const getMerchants = async (): Promise<Merchant[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<Merchant>(
        `SELECT m.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM merchants m
     LEFT JOIN categories c ON m.default_category_id = c.id
     ORDER BY m.name ASC`
    );
};

export const searchMerchants = async (query: string): Promise<Merchant[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<Merchant>(
        `SELECT m.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM merchants m
     LEFT JOIN categories c ON m.default_category_id = c.id
     WHERE m.name LIKE ?
     ORDER BY m.name ASC LIMIT 10`,
        [`%${query}%`]
    );
};

export const getMerchantCategory = async (merchantName: string): Promise<number | null> => {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ default_category_id: number }>(
        'SELECT default_category_id FROM merchants WHERE name = ? COLLATE NOCASE',
        [merchantName]
    );
    return result?.default_category_id || null;
};

export const updateMerchantCategory = async (id: number, categoryId: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync(
        'UPDATE merchants SET default_category_id = ? WHERE id = ?',
        [categoryId, id]
    );
};

export const deleteMerchant = async (id: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM merchants WHERE id = ?', [id]);
};
