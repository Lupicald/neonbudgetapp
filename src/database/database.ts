import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, DEFAULT_CATEGORIES, DEFAULT_SETTINGS, DEFAULT_ACHIEVEMENTS, DEFAULT_ACCOUNTS } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
    if (!db) {
        db = await SQLite.openDatabaseAsync('neonbudget.db');
        await db.execAsync('PRAGMA journal_mode = WAL;');
        await db.execAsync('PRAGMA foreign_keys = ON;');
    }
    return db;
};

// Alias for convenience
export const getDb = getDatabase;

export const initDatabase = async (): Promise<void> => {
    const database = await getDatabase();

    // Create tables
    for (const sql of CREATE_TABLES_SQL) {
        await database.execAsync(sql);
    }

    // --- MIGRATIONS --- //
    // If the transactions table already existed from before phase 1 upgrades, add missing columns
    try {
        const tableInfo = await database.getAllAsync<any>("PRAGMA table_info(transactions);");

        const hasAccountId = tableInfo.some(col => col.name === 'account_id');
        const hasMerchantId = tableInfo.some(col => col.name === 'merchant_id');

        if (!hasAccountId) {
            await database.execAsync("ALTER TABLE transactions ADD COLUMN account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL;");
        }
        if (!hasMerchantId) {
            await database.execAsync("ALTER TABLE transactions ADD COLUMN merchant_id INTEGER REFERENCES merchants(id) ON DELETE SET NULL;");
        }
    } catch (e) { console.log('Migration error transactions:', e); }

    // Planned budget tables migration
    try {
        await database.execAsync(`CREATE TABLE IF NOT EXISTS planned_incomes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            expected_date TEXT NOT NULL,
            note TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );`);
        await database.execAsync(`CREATE TABLE IF NOT EXISTS planned_expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            planned_income_id INTEGER,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            category_id INTEGER,
            planned_date TEXT NOT NULL,
            is_completed INTEGER NOT NULL DEFAULT 0,
            note TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (planned_income_id) REFERENCES planned_incomes(id) ON DELETE SET NULL,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        );`);
    } catch (e) { console.log('Migration error planned tables:', e); }

    // Transfers table might not have been created if the user had an old DB
    try {
        await database.execAsync(`CREATE TABLE IF NOT EXISTS transfers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            from_account_id INTEGER NOT NULL,
            to_account_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            note TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE CASCADE,
            FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE CASCADE
        );`);
    } catch (e) { console.log('Migration error transfers:', e); }
    // ------------------ //

    // Seed default accounts if empty
    const accCount = await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM accounts'
    );
    if (accCount && accCount.count === 0) {
        for (const acc of DEFAULT_ACCOUNTS) {
            await database.runAsync(
                'INSERT INTO accounts (name, type, icon, color, is_default) VALUES (?, ?, ?, ?, 1)',
                [acc.name, acc.type, acc.icon, acc.color]
            );
        }
    }

    // Seed default categories if empty
    const catCount = await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM categories'
    );
    if (catCount && catCount.count === 0) {
        for (const cat of DEFAULT_CATEGORIES) {
            await database.runAsync(
                'INSERT INTO categories (name, icon, color, is_default) VALUES (?, ?, ?, 1)',
                [cat.name, cat.icon, cat.color]
            );
        }
    }

    // Seed default settings if empty
    const settingsCount = await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM settings'
    );
    if (settingsCount && settingsCount.count === 0) {
        for (const setting of DEFAULT_SETTINGS) {
            await database.runAsync(
                'INSERT INTO settings (key, value) VALUES (?, ?)',
                [setting.key, setting.value]
            );
        }
    }

    // Seed default achievements if empty
    const achCount = await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM achievements'
    );
    if (achCount && achCount.count === 0) {
        for (const ach of DEFAULT_ACHIEVEMENTS) {
            await database.runAsync(
                'INSERT INTO achievements (type, title, description, icon) VALUES (?, ?, ?, ?)',
                [ach.type, ach.title, ach.description, ach.icon]
            );
        }
    }
};

export const resetDatabase = async (): Promise<void> => {
    const database = await getDatabase();
    await database.execAsync('PRAGMA foreign_keys = OFF;');
    await database.execAsync('DELETE FROM transactions;');
    await database.execAsync('DELETE FROM transfers;');
    await database.execAsync('DELETE FROM recurring_items;');
    await database.execAsync('DELETE FROM budgets;');
    await database.execAsync('DELETE FROM goals;');
    await database.execAsync('DELETE FROM accounts;');
    await database.execAsync('DELETE FROM categories;');
    await database.execAsync('DELETE FROM achievements;');
    await database.execAsync('DELETE FROM settings;');
    await database.execAsync('DELETE FROM merchants;');
    await database.execAsync('PRAGMA foreign_keys = ON;');

    // re-init defaults
    await initDatabase();
};
