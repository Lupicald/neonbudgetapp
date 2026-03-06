import { getDatabase } from './database';
import { adjustAccountBalance } from './accountService';

export interface Transfer {
    id: number;
    from_account_id: number;
    to_account_id: number;
    amount: number;
    note: string;
    date: string;
    created_at: string;
    from_account_name?: string;
    to_account_name?: string;
}

// Create the transfers table if it doesn't exist
export const ensureTransfersTable = async (): Promise<void> => {
    const db = await getDatabase();
    await db.execAsync(`CREATE TABLE IF NOT EXISTS transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_account_id INTEGER NOT NULL,
    to_account_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE CASCADE
  );`);
};

export const createTransfer = async (
    fromAccountId: number, toAccountId: number, amount: number, note: string = '', date?: string
): Promise<void> => {
    const db = await getDatabase();
    const transferDate = date || new Date().toISOString().split('T')[0];

    await db.runAsync(
        'INSERT INTO transfers (from_account_id, to_account_id, amount, note, date) VALUES (?, ?, ?, ?, ?)',
        [fromAccountId, toAccountId, amount, note, transferDate]
    );

    // Adjust both account balances
    await adjustAccountBalance(fromAccountId, -amount);
    await adjustAccountBalance(toAccountId, amount);
};

export const getTransfers = async (limit: number = 50): Promise<Transfer[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<Transfer>(
        `SELECT t.*, 
     fa.name as from_account_name, 
     ta.name as to_account_name
     FROM transfers t
     LEFT JOIN accounts fa ON t.from_account_id = fa.id
     LEFT JOIN accounts ta ON t.to_account_id = ta.id
     ORDER BY t.date DESC, t.created_at DESC
     LIMIT ?`,
        [limit]
    );
};

export const deleteTransfer = async (id: number, fromAccountId: number, toAccountId: number, amount: number): Promise<void> => {
    const db = await getDatabase();
    // Reverse the balance changes
    await adjustAccountBalance(fromAccountId, amount);
    await adjustAccountBalance(toAccountId, -amount);
    await db.runAsync('DELETE FROM transfers WHERE id = ?', [id]);
};
