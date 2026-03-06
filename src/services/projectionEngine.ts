import { RecurringItem, ProjectedEvent, TransactionType } from '../types';
import { getRecurringItems, generateFutureOccurrences } from '../database/recurringService';
import { getTotalBalance } from '../database/accountService';
import { format, addDays } from 'date-fns';

export const generateProjection = async (days: number = 30): Promise<ProjectedEvent[]> => {
    const balance = await getTotalBalance();
    const recurringItems = await getRecurringItems();
    const activeItems = recurringItems.filter(item => item.is_active);

    const allEvents: ProjectedEvent[] = [];

    for (const item of activeItems) {
        const occurrences = generateFutureOccurrences(item, days);
        for (const occ of occurrences) {
            allEvents.push({
                date: occ.date,
                label: occ.label,
                amount: occ.amount,
                type: occ.type,
                projectedBalance: 0,
                isRecurring: true,
                categoryColor: item.category_color,
            });
        }
    }

    allEvents.sort((a, b) => a.date.localeCompare(b.date));

    let runningBalance = balance;
    for (const event of allEvents) {
        if (event.type === 'income') {
            runningBalance += event.amount;
        } else {
            runningBalance -= event.amount;
        }
        event.projectedBalance = runningBalance;
    }

    return allEvents;
};

export const getNextEvent = async (type: TransactionType): Promise<ProjectedEvent | null> => {
    const projection = await generateProjection(90);
    return projection.find(e => e.type === type) || null;
};

export const getProjectionChartData = async (days: number = 30): Promise<{ labels: string[]; data: number[] }> => {
    const events = await generateProjection(days);
    const balance = await getTotalBalance();

    if (events.length === 0) {
        return {
            labels: ['Now'],
            data: [balance],
        };
    }

    const labels = ['Now'];
    const data = [balance];

    const dayMap = new Map<string, number>();
    for (const event of events) {
        dayMap.set(event.date, event.projectedBalance);
    }

    for (const [date, bal] of dayMap) {
        labels.push(format(new Date(date + 'T12:00:00'), 'MMM d'));
        data.push(bal);
    }

    return { labels, data };
};
