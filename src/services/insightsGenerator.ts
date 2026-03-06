import { Insight } from '../types';
import { getMonthlyTotal, getSpendingByCategory } from '../database/transactionService';
import { getRecurringItems } from '../database/recurringService';
import { getMonthKey } from '../utils';
import { format, subMonths } from 'date-fns';

export const generateInsights = async (): Promise<Insight[]> => {
    const insights: Insight[] = [];
    const currentMonth = getMonthKey();
    const prevMonth = format(subMonths(new Date(), 1), 'yyyy-MM');

    try {
        // 1. Monthly spending comparison
        const currentSpending = await getMonthlyTotal(currentMonth, 'expense');
        const prevSpending = await getMonthlyTotal(prevMonth, 'expense');

        if (prevSpending > 0 && currentSpending > 0) {
            const change = ((currentSpending - prevSpending) / prevSpending) * 100;
            if (change > 0) {
                insights.push({
                    id: 'spending_increase',
                    icon: 'trending-up',
                    title: 'Spending Up',
                    description: `You spent ${Math.abs(Math.round(change))}% more than last month`,
                    type: 'warning',
                });
            } else {
                insights.push({
                    id: 'spending_decrease',
                    icon: 'trending-down',
                    title: 'Spending Down',
                    description: `You spent ${Math.abs(Math.round(change))}% less than last month`,
                    type: 'success',
                });
            }
        }

        // 2. Savings comparison
        const currentIncome = await getMonthlyTotal(currentMonth, 'income');
        const prevIncome = await getMonthlyTotal(prevMonth, 'income');
        const currentSavings = currentIncome - currentSpending;
        const prevSavings = prevIncome - prevSpending;

        if (prevSavings !== 0 && currentSavings > prevSavings) {
            const savingsChange = ((currentSavings - prevSavings) / Math.abs(prevSavings)) * 100;
            insights.push({
                id: 'savings_up',
                icon: 'wallet',
                title: 'Savings Improved',
                description: `You saved ${Math.abs(Math.round(savingsChange))}% more than last month`,
                type: 'success',
            });
        }

        // 3. Top spending category
        const categories = await getSpendingByCategory(currentMonth);
        if (categories.length > 0) {
            insights.push({
                id: 'top_category',
                icon: 'pie-chart',
                title: 'Top Spending',
                description: `${categories[0].category_name} is your biggest expense: $${categories[0].total.toFixed(0)}`,
                type: 'info',
            });
        }

        // 4. Subscriptions total
        const recurringExpenses = await getRecurringItems('expense');
        if (recurringExpenses.length > 0) {
            const monthlyTotal = recurringExpenses
                .filter(r => r.is_active)
                .reduce((sum, r) => {
                    if (r.frequency === 'monthly') return sum + r.amount;
                    if (r.frequency === 'weekly') return sum + r.amount * 4.33;
                    if (r.frequency === 'biweekly') return sum + r.amount * 2.17;
                    if (r.frequency === 'yearly') return sum + r.amount / 12;
                    return sum + r.amount;
                }, 0);

            insights.push({
                id: 'subscriptions_total',
                icon: 'repeat',
                title: 'Recurring Expenses',
                description: `Your recurring expenses total ~$${Math.round(monthlyTotal)} per month`,
                type: 'info',
            });
        }
    } catch (error) {
        console.log('Error generating insights:', error);
    }

    return insights;
};
