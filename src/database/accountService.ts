import { getDatabase } from './database';
import { Account, AccountType } from '../types';

export const getAccounts = async (): Promise<Account[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<Account>('SELECT * FROM accounts ORDER BY is_default DESC, name ASC');
};

export const getAccount = async (id: number): Promise<Account | null> => {
    const db = await getDatabase();
    return await db.getFirstAsync<Account>('SELECT * FROM accounts WHERE id = ?', [id]);
};

export const addAccount = async (
    name: string, type: AccountType, balance: number, icon: string, color: string
): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync(
        'INSERT INTO accounts (name, type, balance, icon, color) VALUES (?, ?, ?, ?, ?)',
        [name, type, balance, icon, color]
    );
};

export const updateAccount = async (
    id: number, name: string, type: AccountType, icon: string, color: string
): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync(
        'UPDATE accounts SET name = ?, type = ?, icon = ?, color = ? WHERE id = ?',
        [name, type, icon, color, id]
    );
};

export const updateAccountBalance = async (id: number, balance: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('UPDATE accounts SET balance = ? WHERE id = ?', [balance, id]);
};

export const adjustAccountBalance = async (id: number, delta: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [delta, id]);
};

export const deleteAccount = async (id: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM accounts WHERE id = ?', [id]);
};

export const getTotalBalance = async (): Promise<number> => {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ total: number }>(
        'SELECT COALESCE(SUM(balance), 0) as total FROM accounts'
    );
    return result?.total || 0;
};
