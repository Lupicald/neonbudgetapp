import { getDatabase } from './database';

export interface Subscription {
    id: number;
    name: string;
    amount: number;
    billing_day: number;
    color: string;
    icon: string;
    note: string;
    is_active: number;
    category_id: number | null;
    category_name?: string;
    category_icon?: string;
    category_color?: string;
}

export const getSubscriptions = async (): Promise<Subscription[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<Subscription>(
        `SELECT s.*, c.name as category_name, c.icon as category_icon, c.color as category_color
         FROM subscriptions s
         LEFT JOIN categories c ON s.category_id = c.id
         ORDER BY s.billing_day ASC, s.name ASC`
    );
};

export const addSubscription = async (
    name: string, amount: number, billingDay: number,
    color: string, icon: string, note: string, categoryId: number | null
): Promise<number> => {
    const db = await getDatabase();
    const result = await db.runAsync(
        `INSERT INTO subscriptions (name, amount, billing_day, color, icon, note, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, amount, billingDay, color, icon, note, categoryId]
    );
    return result.lastInsertRowId;
};

export const updateSubscription = async (
    id: number, name: string, amount: number, billingDay: number,
    color: string, icon: string, note: string, categoryId: number | null
): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync(
        `UPDATE subscriptions SET name = ?, amount = ?, billing_day = ?, color = ?, icon = ?, note = ?, category_id = ? WHERE id = ?`,
        [name, amount, billingDay, color, icon, note, categoryId, id]
    );
};

export const toggleSubscription = async (id: number, isActive: boolean): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('UPDATE subscriptions SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
};

export const deleteSubscription = async (id: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM subscriptions WHERE id = ?', [id]);
};
