import { getDatabase } from '../database/database';
import { getAccounts, addAccount } from '../database/accountService';
import { getCategories } from '../database/categoryService';
import { Account, Category } from '../types';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// ========================
// CSV EXPORT
// ========================

export const exportToCSV = async (): Promise<string> => {
    const db = await getDatabase();

    const transactions = await db.getAllAsync<any>(
        `SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon,
     a.name as account_name
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN accounts a ON t.account_id = a.id
     ORDER BY t.date DESC`
    );

    const transfers = await db.getAllAsync<any>(
        `SELECT tr.*, fa.name as from_name, ta.name as to_name
     FROM transfers tr
     LEFT JOIN accounts fa ON tr.from_account_id = fa.id
     LEFT JOIN accounts ta ON tr.to_account_id = ta.id
     ORDER BY tr.date DESC`
    );

    const header = 'account,amount,currency,title,note,date,income,type,category name,subcategory name,color,icon,emoji,budget,objective\n';

    let rows = '';

    // Export regular transactions
    for (const tx of transactions) {
        const isIncome = tx.type === 'income';
        const amount = isIncome ? Math.abs(tx.amount) : -Math.abs(tx.amount);
        const accountName = tx.account_name || 'Cash';
        const title = escapeCSV(tx.merchant_name || tx.note || '');
        const note = escapeCSV(tx.note || '');
        const date = tx.date + ' 00:00:00.000';
        const catName = escapeCSV(tx.category_name || 'Other');
        const color = tx.category_color ? '0xff' + tx.category_color.replace('#', '') : '0xff607d8b';
        const icon = tx.category_icon || 'ellipse-outline';

        rows += `${escapeCSV(accountName)},${amount},MXN,${title},${note},${date},${isIncome},null,${catName},,${color},${icon}.png,,,\n`;
    }

    // Export transfers as paired rows (Cashew format)
    for (const tr of transfers) {
        const date = tr.date + ' 00:00:00.000';
        const fromName = tr.from_name || 'Unknown';
        const toName = tr.to_name || 'Unknown';
        const note = escapeCSV(`Transferred Balance\n${fromName} → ${toName}`);

        // Transfer In (positive amount to destination)
        rows += `${escapeCSV(toName)},${Math.abs(tr.amount)},MXN,${escapeCSV(toName + ' Transfer In')},${note},${date},true,null,Corrección de equilibrio,,0xff607d8b,charts.png,,,\n`;
        // Transfer Out (negative amount from source)
        rows += `${escapeCSV(fromName)},-${Math.abs(tr.amount)},MXN,${escapeCSV(fromName + ' Transfer Out')},${note},${date},false,null,Corrección de equilibrio,,0xff607d8b,charts.png,,,\n`;
    }

    // ── Recurring items section ──────────────────────────────────────────────
    const recurringItems = await db.getAllAsync<any>(
        `SELECT r.*, c.name as category_name FROM recurring_items r LEFT JOIN categories c ON r.category_id = c.id ORDER BY r.type, r.name`
    );

    let recurringSection = '\n#RECURRING_ITEMS\n';
    recurringSection += 'type,name,amount,frequency,interval_days,day_of_week,day_of_month,start_date,next_date,is_active,category_name\n';
    for (const r of recurringItems) {
        recurringSection += [
            r.type, escapeCSV(r.name), r.amount, r.frequency,
            r.interval_days, r.day_of_week ?? '', r.day_of_month ?? '',
            r.start_date, r.next_date, r.is_active,
            escapeCSV(r.category_name || 'Other'),
        ].join(',') + '\n';
    }

    const csv = header + rows + recurringSection;

    // Save to file
    const filename = `neonbudget-${new Date().toISOString().split('T')[0]}.csv`;
    const filePath = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(filePath, csv, { encoding: FileSystem.EncodingType.UTF8 });

    return filePath;
};

export const shareCSV = async (): Promise<void> => {
    const filePath = await exportToCSV();

    if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
            mimeType: 'text/csv',
            dialogTitle: 'Export Budget Data',
        });
    }
};

// ========================
// CSV IMPORT (Cashew format)
// ========================

interface CashewRow {
    account: string;
    amount: number;
    currency: string;
    title: string;
    note: string;
    date: string;
    income: boolean;
    type: string;
    categoryName: string;
    subcategory: string;
    color: string;
    icon: string;
}

export const parseCSV = (csvContent: string): CashewRow[] => {
    const lines = csvContent.split('\n');
    if (lines.length < 2) return [];

    const rows: CashewRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Handle multi-line notes (wrapped in quotes)
        let fullLine = line;
        while (countQuotes(fullLine) % 2 !== 0 && i + 1 < lines.length) {
            i++;
            fullLine += '\n' + lines[i];
        }

        const fields = parseCSVLine(fullLine);
        if (fields.length < 10) continue;

        rows.push({
            account: fields[0] || 'Cash',
            amount: parseFloat(fields[1]) || 0,
            currency: fields[2] || 'MXN',
            title: fields[3] || '',
            note: fields[4] || '',
            date: fields[5] || '',
            income: fields[6]?.toLowerCase() === 'true',
            type: fields[7] || 'null',
            categoryName: fields[8] || 'Other',
            subcategory: fields[9] || '',
            color: fields[10] || '',
            icon: fields[11] || '',
        });
    }

    return rows;
};

export const importFromCSV = async (csvContent: string): Promise<{ imported: number; skipped: number; errorMsg?: string }> => {
    const db = await getDatabase();
    const rows = parseCSV(csvContent);

    let imported = 0;
    let skipped = 0;
    let firstError: string | undefined;

    // Cache existing accounts and categories
    const accountCache = new Map<string, number>();
    const categoryCache = new Map<string, number>();

    // Load existing accounts
    const existingAccounts = await getAccounts();
    for (const acc of existingAccounts) {
        accountCache.set(acc.name.toLowerCase(), acc.id);
    }

    // Load existing categories
    const existingCategories = await getCategories();
    for (const cat of existingCategories) {
        categoryCache.set(cat.name.toLowerCase(), cat.id);
    }

    // Category color mapping from Cashew hex to our colors
    const colorMap: Record<string, string> = {
        '0xffff9800': '#ff9800', '0xff607d8b': '#607d8b', '0xff4caf50': '#4caf50',
        '0xffe91e63': '#e91e63', '0xffab47bc': '#ab47bc', '0xfff44336': '#f44336',
        '0xffff7043': '#ff7043', '0xff2196f3': '#2196f3', '0xff26a69a': '#26a69a',
        '0xff9575cd': '#9575cd', '0xffffeb3b': '#ffeb3b',
    };

    // Icon mapping from Cashew .png to Ionicons
    const iconMap: Record<string, string> = {
        'plane.png': 'airplane-outline', 'weight.png': 'barbell-outline',
        'cutlery.png': 'restaurant-outline', 'groceries.png': 'cart-outline',
        'charts.png': 'stats-chart-outline', 'heart.png': 'heart-outline',
        'shopping.png': 'bag-outline', 'gift.png': 'gift-outline',
        'graduation.png': 'school-outline', 'image.png': 'cash-outline',
        'popcorn.png': 'game-controller-outline', 'coin.png': 'cash-outline',
        'bills.png': 'receipt-outline', 'tram.png': 'car-outline',
    };

    for (const row of rows) {
        try {
            // Map "Corrección" to a proper Category name for display
            if (row.categoryName === 'Corrección de equilibrio') {
                row.categoryName = 'Adjustment / Transfer';
            }

            // Ensure account exists
            const accountKey = row.account.toLowerCase();
            if (!accountCache.has(accountKey)) {
                await addAccount(row.account, 'bank', 0, 'card-outline', '#00d4ff');
                const newAccounts = await getAccounts();
                const newAcc = newAccounts.find((a: Account) => a.name.toLowerCase() === accountKey);
                if (newAcc) accountCache.set(accountKey, newAcc.id);
            }

            // Ensure category exists
            const catKey = row.categoryName.toLowerCase();
            if (!categoryCache.has(catKey)) {
                const color = colorMap[row.color] || '#888888';
                const icon = iconMap[row.icon] || 'ellipse-outline';
                await db.runAsync(
                    'INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)',
                    [row.categoryName, icon, color]
                );
                const newCat = await db.getFirstAsync<{ id: number }>('SELECT id FROM categories WHERE name = ?', [row.categoryName]);
                if (newCat) categoryCache.set(catKey, newCat.id);
            }

            const accountId = accountCache.get(accountKey) || null;
            const categoryId = categoryCache.get(catKey) || 1;

            // Determine type
            const txType = row.income ? 'income' : 'expense';
            const amount = Math.abs(row.amount);

            // Parse date
            const dateStr = row.date.split(' ')[0]; // Just the date part

            await db.runAsync(
                'INSERT INTO transactions (type, amount, merchant_name, category_id, account_id, date, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [txType, amount, row.title, categoryId, accountId, dateStr, row.note]
            );

            imported++;
        } catch (error: any) {
            console.log('Import row error:', error);
            if (!firstError) firstError = error?.message || String(error);
            skipped++;
        }
    }

    // Recalculate balances for all accounts based on history
    try {
        const accounts = await getAccounts();
        for (const acc of accounts) {
            const expenses = await db.getFirstAsync<{ sum: number }>(`SELECT SUM(amount) as sum FROM transactions WHERE account_id = ? AND type = 'expense'`, [acc.id]);
            const incomes = await db.getFirstAsync<{ sum: number }>(`SELECT SUM(amount) as sum FROM transactions WHERE account_id = ? AND type = 'income'`, [acc.id]);
            const transfersOut = await db.getFirstAsync<{ sum: number }>(`SELECT SUM(amount) as sum FROM transfers WHERE from_account_id = ?`, [acc.id]);
            const transfersIn = await db.getFirstAsync<{ sum: number }>(`SELECT SUM(amount) as sum FROM transfers WHERE to_account_id = ?`, [acc.id]);

            const total = (incomes?.sum || 0) + (transfersIn?.sum || 0) - (expenses?.sum || 0) - (transfersOut?.sum || 0);
            await db.runAsync(`UPDATE accounts SET balance = ? WHERE id = ?`, [total, acc.id]);
        }
    } catch (e) { console.log('Error recalculating balances:', e); }

    // ── Import recurring items if section present ────────────────────────────
    try {
        const recurringMarker = csvContent.indexOf('#RECURRING_ITEMS');
        if (recurringMarker !== -1) {
            const recurringSection = csvContent.slice(recurringMarker).split('\n').slice(2); // skip marker + header
            for (const line of recurringSection) {
                const t = line.trim();
                if (!t || t.startsWith('#')) continue;
                const fields = parseCSVLine(t);
                if (fields.length < 11) continue;
                const [rType, rName, rAmount, rFreq, rInterval, rDow, rDom, rStart, rNext, rActive, rCatName] = fields;
                if (!rName || !rAmount) continue;

                // Find or create category
                let catId = 1;
                const catKey = (rCatName || 'Other').toLowerCase();
                if (categoryCache.has(catKey)) {
                    catId = categoryCache.get(catKey)!;
                } else {
                    const newCat = await db.getFirstAsync<{ id: number }>('SELECT id FROM categories WHERE name = ? COLLATE NOCASE', [rCatName]);
                    catId = newCat?.id || 1;
                }

                await db.runAsync(
                    `INSERT OR IGNORE INTO recurring_items (type, name, amount, category_id, frequency, interval_days, day_of_week, day_of_month, start_date, next_date, is_active)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        rType || 'expense', rName.trim(), parseFloat(rAmount) || 0, catId,
                        rFreq || 'monthly', parseInt(rInterval) || 0,
                        rDow ? parseInt(rDow) : null, rDom ? parseInt(rDom) : null,
                        rStart || new Date().toISOString().split('T')[0],
                        rNext || new Date().toISOString().split('T')[0],
                        parseInt(rActive) || 1,
                    ]
                );
            }
        }
    } catch (e) { console.log('Recurring import error:', e); }

    return { imported, skipped, errorMsg: firstError };
};

// ========================
// CSV Helpers
// ========================

const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
};

const countQuotes = (str: string): number => {
    return (str.match(/"/g) || []).length;
};

const parseCSVLine = (line: string): string[] => {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            fields.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    fields.push(current.trim());
    return fields;
};
