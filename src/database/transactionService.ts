import { getDatabase } from './database';
import { Transaction, TransactionType } from '../types';
import { adjustAccountBalance } from './accountService';

export const addTransaction = async (
    type: TransactionType,
    amount: number,
    merchantName: string,
    categoryId: number,
    date: string,
    note: string = '',
    receiptUri: string | null = null,
    accountId: number | null = null
): Promise<number> => {
    const db = await getDatabase();

    // Find or create merchant
    let merchantId: number | null = null;
    if (merchantName.trim()) {
        const existing = await db.getFirstAsync<{ id: number }>(
            'SELECT id FROM merchants WHERE name = ? COLLATE NOCASE',
            [merchantName.trim()]
        );
        if (existing) {
            merchantId = existing.id;
        } else {
            const result = await db.runAsync(
                'INSERT INTO merchants (name, default_category_id) VALUES (?, ?)',
                [merchantName.trim(), categoryId]
            );
            merchantId = result.lastInsertRowId;
        }
    }

    const result = await db.runAsync(
        `INSERT INTO transactions (type, amount, merchant_name, merchant_id, category_id, account_id, date, note, receipt_uri)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [type, amount, merchantName.trim(), merchantId, categoryId, accountId, date, note, receiptUri]
    );

    // Adjust account balance if linked
    if (accountId) {
        const balanceChange = type === 'income' ? amount : -amount;
        await adjustAccountBalance(accountId, balanceChange);
    }

    return result.lastInsertRowId;
};

export const updateTransaction = async (
    id: number,
    type: TransactionType,
    amount: number,
    merchantName: string,
    categoryId: number,
    date: string,
    note: string = '',
    accountId: number | null = null
): Promise<void> => {
    const db = await getDatabase();

    // Reverse the old account balance effect before updating
    const old = await db.getFirstAsync<{ type: string; amount: number; account_id: number | null }>(
        'SELECT type, amount, account_id FROM transactions WHERE id = ?',
        [id]
    );
    if (old && old.account_id) {
        const reversal = old.type === 'income' ? -old.amount : old.amount;
        await adjustAccountBalance(old.account_id, reversal);
    }

    await db.runAsync(
        `UPDATE transactions SET type = ?, amount = ?, merchant_name = ?, category_id = ?, account_id = ?, date = ?, note = ? WHERE id = ?`,
        [type, amount, merchantName, categoryId, accountId, date, note, id]
    );

    // Apply the new account balance effect
    if (accountId) {
        const balanceChange = type === 'income' ? amount : -amount;
        await adjustAccountBalance(accountId, balanceChange);
    }
};

export const getTransactions = async (
    limit: number = 50,
    offset: number = 0,
    type?: TransactionType,
    categoryId?: number,
    startDate?: string,
    endDate?: string,
    accountId?: number,
    search?: string
): Promise<Transaction[]> => {
    const db = await getDatabase();
    let query = `
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
    a.name as account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts a ON t.account_id = a.id
    WHERE 1=1
  `;
    const params: any[] = [];

    if (type) {
        query += ' AND t.type = ?';
        params.push(type);
    }
    if (categoryId) {
        query += ' AND t.category_id = ?';
        params.push(categoryId);
    }
    if (accountId) {
        query += ' AND t.account_id = ?';
        params.push(accountId);
    }
    if (startDate) {
        query += ' AND t.date >= ?';
        params.push(startDate);
    }
    if (endDate) {
        query += ' AND t.date <= ?';
        params.push(endDate);
    }
    if (search) {
        query += ' AND (t.merchant_name LIKE ? OR t.note LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return await db.getAllAsync<Transaction>(query, params);
};

export const getTransactionsByMonth = async (month: string): Promise<Transaction[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<Transaction>(
        `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.date LIKE ?
     ORDER BY t.date DESC, t.created_at DESC`,
        [`${month}%`]
    );
};

export const deleteTransaction = async (id: number): Promise<void> => {
    const db = await getDatabase();
    const tx = await db.getFirstAsync<{ type: string; amount: number; account_id: number | null }>(
        'SELECT type, amount, account_id FROM transactions WHERE id = ?',
        [id]
    );
    if (tx && tx.account_id) {
        const balanceChange = tx.type === 'income' ? -tx.amount : tx.amount;
        await adjustAccountBalance(tx.account_id, balanceChange);
    }
    await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
};

export const getSpendingByCategory = async (month: string): Promise<{ category_name: string; category_color: string; total: number }[]> => {
    const db = await getDatabase();
    return await db.getAllAsync(
        `SELECT c.name as category_name, c.color as category_color, SUM(t.amount) as total
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE t.type = 'expense' AND t.date LIKE ?
     GROUP BY t.category_id
     ORDER BY total DESC`,
        [`${month}%`]
    );
};

export const getMonthlyTotal = async (month: string, type: TransactionType): Promise<number> => {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = ? AND date LIKE ?`,
        [type, `${month}%`]
    );
    return result?.total || 0;
};

// Returns income and expense totals for each of the supplied YYYY-MM month keys
export const getMonthlyTotalsRange = async (
    months: string[]
): Promise<{ month: string; income: number; expense: number }[]> => {
    const db = await getDatabase();
    const results: { month: string; income: number; expense: number }[] = [];
    for (const m of months) {
        const inc = await db.getFirstAsync<{ total: number }>(
            `SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='income' AND date LIKE ?`,
            [`${m}%`]
        );
        const exp = await db.getFirstAsync<{ total: number }>(
            `SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='expense' AND date LIKE ?`,
            [`${m}%`]
        );
        results.push({ month: m, income: inc?.total || 0, expense: exp?.total || 0 });
    }
    return results;
};

export const getDailySpending = async (month: string): Promise<{ date: string; total: number }[]> => {
    const db = await getDatabase();
    return await db.getAllAsync(
        `SELECT date, SUM(amount) as total
     FROM transactions
     WHERE type = 'expense' AND date LIKE ?
     GROUP BY date
     ORDER BY date ASC`,
        [`${month}%`]
    );
};
