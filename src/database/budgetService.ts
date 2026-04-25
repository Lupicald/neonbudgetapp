import { getDatabase } from './database';
import { Budget } from '../types';
import { getMonthKey } from '../utils';

export const getBudgets = async (month?: string): Promise<Budget[]> => {
    const db = await getDatabase();
    const m = month || getMonthKey();
    return await db.getAllAsync<Budget>(
        `SELECT b.*, 
            COALESCE(c.name, 'All Expenses') as category_name, 
            COALESCE(c.icon, 'apps-outline') as category_icon, 
            COALESCE(c.color, '#1FCC58') as category_color,
            COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE (b.category_id = -1 OR t.category_id = b.category_id) AND t.type = 'expense' AND t.date LIKE ?), 0) as spent
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
    // category_id = -1 means "All Expenses" (wildcard). It has no real category row,
    // so we must bypass the FK constraint for this special case.
    if (categoryId === -1) {
        await db.execAsync('PRAGMA foreign_keys = OFF;');
    }
    let lastInsertRowId = 0;
    try {
        const result = await db.runAsync(
            'INSERT OR REPLACE INTO budgets (category_id, monthly_limit, month) VALUES (?, ?, ?)',
            [categoryId, monthlyLimit, m]
        );
        lastInsertRowId = result.lastInsertRowId;
    } finally {
        if (categoryId === -1) {
            await db.execAsync('PRAGMA foreign_keys = ON;');
        }
    }
    return lastInsertRowId;
};

export const updateBudget = async (id: number, monthlyLimit: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('UPDATE budgets SET monthly_limit = ? WHERE id = ?', [monthlyLimit, id]);
};

export const deleteBudget = async (id: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
};
