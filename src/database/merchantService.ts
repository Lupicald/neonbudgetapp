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

export const addMerchant = async (name: string, categoryId?: number | null): Promise<number> => {
    const db = await getDatabase();
    const result = await db.runAsync(
        'INSERT OR IGNORE INTO merchants (name, default_category_id) VALUES (?, ?)',
        [name.trim(), categoryId ?? null]
    );
    if (result.changes === 0) {
        const existing = await db.getFirstAsync<{ id: number }>('SELECT id FROM merchants WHERE name = ? COLLATE NOCASE', [name.trim()]);
        return existing?.id ?? 0;
    }
    return result.lastInsertRowId;
};

export const updateMerchant = async (id: number, name: string, categoryId?: number | null): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('UPDATE merchants SET name = ?, default_category_id = ? WHERE id = ?', [name.trim(), categoryId ?? null, id]);
};

export const getMerchantSpending = async (): Promise<(Merchant & { total_spent: number })[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<Merchant & { total_spent: number }>(
        `SELECT m.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
         COALESCE(SUM(t.amount), 0) as total_spent
         FROM merchants m
         LEFT JOIN categories c ON m.default_category_id = c.id
         LEFT JOIN transactions t ON t.merchant_name = m.name AND t.type = 'expense'
         GROUP BY m.id
         ORDER BY total_spent DESC`
    );
};

export const deleteMerchant = async (id: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM merchants WHERE id = ?', [id]);
};
