import { getDatabase } from './database';
import { PlannedIncome, PlannedExpense } from '../types';

// ── Planned Incomes ──────────────────────────────────────────────────────────

export const getPlannedIncomes = async (): Promise<PlannedIncome[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<PlannedIncome>(
        'SELECT * FROM planned_incomes ORDER BY expected_date ASC'
    );
};

export const addPlannedIncome = async (
    name: string,
    amount: number,
    expectedDate: string,
    note: string = ''
): Promise<number> => {
    const db = await getDatabase();
    const result = await db.runAsync(
        'INSERT INTO planned_incomes (name, amount, expected_date, note) VALUES (?, ?, ?, ?)',
        [name, amount, expectedDate, note]
    );
    return result.lastInsertRowId;
};

export const updatePlannedIncome = async (
    id: number,
    name: string,
    amount: number,
    expectedDate: string,
    note: string = ''
): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync(
        'UPDATE planned_incomes SET name = ?, amount = ?, expected_date = ?, note = ? WHERE id = ?',
        [name, amount, expectedDate, note, id]
    );
};

export const deletePlannedIncome = async (id: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM planned_incomes WHERE id = ?', [id]);
};

// ── Planned Expenses ─────────────────────────────────────────────────────────

export const getPlannedExpenses = async (plannedIncomeId?: number): Promise<PlannedExpense[]> => {
    const db = await getDatabase();
    let query = `
        SELECT pe.*, c.name as category_name, c.icon as category_icon, c.color as category_color
        FROM planned_expenses pe
        LEFT JOIN categories c ON pe.category_id = c.id
        WHERE 1=1
    `;
    const params: any[] = [];
    if (plannedIncomeId !== undefined) {
        query += ' AND pe.planned_income_id = ?';
        params.push(plannedIncomeId);
    }
    query += ' ORDER BY pe.planned_date ASC';
    return await db.getAllAsync<PlannedExpense>(query, params);
};

export const getAllPlannedExpenses = async (): Promise<PlannedExpense[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<PlannedExpense>(`
        SELECT pe.*, c.name as category_name, c.icon as category_icon, c.color as category_color
        FROM planned_expenses pe
        LEFT JOIN categories c ON pe.category_id = c.id
        ORDER BY pe.planned_date ASC
    `);
};

export const addPlannedExpense = async (
    name: string,
    amount: number,
    plannedDate: string,
    categoryId: number | null,
    plannedIncomeId: number | null,
    note: string = ''
): Promise<number> => {
    const db = await getDatabase();
    const result = await db.runAsync(
        'INSERT INTO planned_expenses (name, amount, planned_date, category_id, planned_income_id, note) VALUES (?, ?, ?, ?, ?, ?)',
        [name, amount, plannedDate, categoryId, plannedIncomeId, note]
    );
    return result.lastInsertRowId;
};

export const updatePlannedExpense = async (
    id: number,
    name: string,
    amount: number,
    plannedDate: string,
    categoryId: number | null,
    plannedIncomeId: number | null,
    note: string = ''
): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync(
        'UPDATE planned_expenses SET name = ?, amount = ?, planned_date = ?, category_id = ?, planned_income_id = ?, note = ? WHERE id = ?',
        [name, amount, plannedDate, categoryId, plannedIncomeId, note, id]
    );
};

export const togglePlannedExpenseComplete = async (id: number, isCompleted: boolean): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync(
        'UPDATE planned_expenses SET is_completed = ? WHERE id = ?',
        [isCompleted ? 1 : 0, id]
    );
};

export const deletePlannedExpense = async (id: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM planned_expenses WHERE id = ?', [id]);
};
