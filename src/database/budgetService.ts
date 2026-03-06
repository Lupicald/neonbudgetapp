import { getDatabase } from './database';
import { Budget } from '../types';
import { getMonthKey } from '../utils';

export const getBudgets = async (month?: string): Promise<Budget[]> => {
    const db = await getDatabase();
    const m = month || getMonthKey();
    return await db.getAllAsync<Budget>(
        `SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
     COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.category_id = b.category_id AND t.type = 'expense' AND t.date LIKE ?), 0) as spent
     FROM budgets b
     LEFT JOIN categories c ON b.category_id = c.id
     WHERE b.month = ?
     ORDER BY c.name ASC`,
        [`${m}%`, m]
    );
};

export const addBudget = async (categoryId: number, monthlyLimit: number, month?: string): Promise<number> => {
    const db = await getDatabase();
    const m = month || getMonthKey();
    const result = await db.runAsync(
        'INSERT OR REPLACE INTO budgets (category_id, monthly_limit, month) VALUES (?, ?, ?)',
        [categoryId, monthlyLimit, m]
    );
    return result.lastInsertRowId;
};

export const updateBudget = async (id: number, monthlyLimit: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('UPDATE budgets SET monthly_limit = ? WHERE id = ?', [monthlyLimit, id]);
};

export const deleteBudget = async (id: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
};
