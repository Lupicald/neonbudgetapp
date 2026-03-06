import { getDatabase } from './database';
import { RecurringItem, RecurringFrequency, TransactionType } from '../types';
import { addTransaction } from './transactionService';
import { addDays, addWeeks, addMonths, addYears, format, nextDay, setDate, parseISO } from 'date-fns';

export const getRecurringItems = async (type?: TransactionType): Promise<RecurringItem[]> => {
    const db = await getDatabase();
    let query = `
    SELECT r.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM recurring_items r
    LEFT JOIN categories c ON r.category_id = c.id
  `;
    const params: any[] = [];
    if (type) {
        query += ' WHERE r.type = ?';
        params.push(type);
    }
    query += ' ORDER BY r.next_date ASC';
    return await db.getAllAsync<RecurringItem>(query, params);
};

export const addRecurringItem = async (
    type: TransactionType,
    name: string,
    amount: number,
    categoryId: number,
    frequency: RecurringFrequency,
    intervalDays: number,
    dayOfWeek: number | null,
    dayOfMonth: number | null,
    startDate: string
): Promise<number> => {
    const db = await getDatabase();
    const nextDate = calculateNextDate(frequency, intervalDays, dayOfWeek, dayOfMonth, startDate);
    const result = await db.runAsync(
        `INSERT INTO recurring_items (type, name, amount, category_id, frequency, interval_days, day_of_week, day_of_month, start_date, next_date, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [type, name, amount, categoryId, frequency, intervalDays, dayOfWeek, dayOfMonth, startDate, nextDate]
    );
    return result.lastInsertRowId;
};

export const updateRecurringItem = async (
    id: number,
    name: string,
    amount: number,
    categoryId: number,
    frequency: RecurringFrequency,
    intervalDays: number,
    dayOfWeek: number | null,
    dayOfMonth: number | null,
    startDate: string
): Promise<void> => {
    const db = await getDatabase();
    const nextDate = calculateNextDate(frequency, intervalDays, dayOfWeek, dayOfMonth, startDate);
    await db.runAsync(
        `UPDATE recurring_items SET name = ?, amount = ?, category_id = ?, frequency = ?, interval_days = ?,
     day_of_week = ?, day_of_month = ?, start_date = ?, next_date = ? WHERE id = ?`,
        [name, amount, categoryId, frequency, intervalDays, dayOfWeek, dayOfMonth, startDate, nextDate, id]
    );
};

export const deleteRecurringItem = async (id: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM recurring_items WHERE id = ?', [id]);
};

export const toggleRecurringItem = async (id: number, isActive: boolean): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync('UPDATE recurring_items SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
};

export const recordRecurringPayment = async (
    id: number,
    accountId: number | null = null
): Promise<void> => {
    const db = await getDatabase();

    // Get the current recurring item details
    const item = await db.getFirstAsync<RecurringItem>('SELECT * FROM recurring_items WHERE id = ?', [id]);
    if (!item) throw new Error('Recurring item not found');

    // Create the actual transaction
    await addTransaction(
        item.type,
        item.amount,
        item.name, // using the recurring name as the merchant/title
        item.category_id,
        format(new Date(), 'yyyy-MM-dd'),
        'Auto-recorded from recurring schedule',
        null,
        accountId
    );

    // Calculate the next date and update the recurring item
    const nextDate = calculateNextDate(
        item.frequency,
        item.interval_days,
        item.day_of_week,
        item.day_of_month,
        item.next_date // advance from the current next_date
    );

    await db.runAsync('UPDATE recurring_items SET next_date = ? WHERE id = ?', [nextDate, id]);
};

export const calculateNextDate = (
    frequency: RecurringFrequency,
    intervalDays: number,
    dayOfWeek: number | null,
    dayOfMonth: number | null,
    fromDate: string
): string => {
    const today = new Date();
    let date = parseISO(fromDate);

    // Find the next occurrence that is >= today
    const maxIterations = 400; // Safety limit
    let i = 0;
    while (date < today && i < maxIterations) {
        date = getNextOccurrence(date, frequency, intervalDays, dayOfWeek, dayOfMonth);
        i++;
    }

    return format(date, 'yyyy-MM-dd');
};

export const generateFutureOccurrences = (
    item: RecurringItem,
    days: number = 90
): { date: string; label: string; amount: number; type: TransactionType }[] => {
    const events: { date: string; label: string; amount: number; type: TransactionType }[] = [];
    const endDate = addDays(new Date(), days);
    let currentDate = parseISO(item.next_date);

    const maxIterations = 200;
    let i = 0;
    while (currentDate <= endDate && i < maxIterations) {
        events.push({
            date: format(currentDate, 'yyyy-MM-dd'),
            label: item.name,
            amount: item.amount,
            type: item.type,
        });
        currentDate = getNextOccurrence(
            currentDate,
            item.frequency,
            item.interval_days,
            item.day_of_week,
            item.day_of_month
        );
        i++;
    }

    return events;
};

const getNextOccurrence = (
    current: Date,
    frequency: RecurringFrequency,
    intervalDays: number,
    dayOfWeek: number | null,
    dayOfMonth: number | null
): Date => {
    switch (frequency) {
        case 'weekly':
            return addWeeks(current, 1);
        case 'biweekly':
            return addWeeks(current, 2);
        case 'monthly':
            if (dayOfMonth !== null) {
                let next = addMonths(current, 1);
                try {
                    next = setDate(next, Math.min(dayOfMonth, 28));
                } catch { }
                return next;
            }
            return addMonths(current, 1);
        case 'yearly':
            return addYears(current, 1);
        case 'custom':
            return addDays(current, Math.max(1, intervalDays));
        default:
            return addMonths(current, 1);
    }
};
