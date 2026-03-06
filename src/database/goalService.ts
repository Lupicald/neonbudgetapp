import { getDatabase } from './database';
import { Goal } from '../types';

export const getGoals = async (): Promise<Goal[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<Goal>('SELECT * FROM goals ORDER BY name ASC');
};

export const addGoal = async (name: string, targetAmount: number, icon: string, color: string): Promise<number> => {
    const db = await getDatabase();
    const result = await db.runAsync(
        'INSERT INTO goals (name, target_amount, saved_amount, icon, color) VALUES (?, ?, 0, ?, ?)',
        [name, targetAmount, icon, color]
    );
    return result.lastInsertRowId;
};

export const addToGoal = async (id: number, amount: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync(
        'UPDATE goals SET saved_amount = MIN(saved_amount + ?, target_amount) WHERE id = ?',
        [amount, id]
    );
};

export const updateGoal = async (id: number, name: string, targetAmount: number, icon: string, color: string): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync(
        'UPDATE goals SET name = ?, target_amount = ?, icon = ?, color = ? WHERE id = ?',
        [name, targetAmount, icon, color, id]
    );
};

export const deleteGoal = async (id: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM goals WHERE id = ?', [id]);
};
