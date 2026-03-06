import { getDatabase } from './database';

export const getSetting = async (key: string): Promise<string | null> => {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM settings WHERE key = ?',
        [key]
    );
    return result?.value || null;
};

export const setSetting = async (key: string, value: string): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, value]
    );
};

export const getBalance = async (): Promise<number> => {
    const value = await getSetting('current_balance');
    return parseFloat(value || '0');
};

export const setBalance = async (balance: number): Promise<void> => {
    await setSetting('current_balance', String(balance));
};

export const getDebtLimit = async (): Promise<number> => {
    const value = await getSetting('debt_limit');
    return parseFloat(value || '-30000');
};
