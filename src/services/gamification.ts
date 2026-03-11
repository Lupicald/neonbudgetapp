import { Achievement } from '../types';
import { getDatabase } from '../database/database';
import { getTransactions } from '../database/transactionService';
import { getBudgets } from '../database/budgetService';
import { getGoals } from '../database/goalService';
import { getTotalBalance } from '../database/accountService';
import { format, subDays, parseISO } from 'date-fns';

export const checkAndAwardAchievements = async (): Promise<Achievement[]> => {
    const db = await getDatabase();
    const newlyUnlocked: Achievement[] = [];

    try {
        // Check streak
        const streakDays = await calculateStreak();
        if (streakDays >= 3) await tryUnlock('streak_3', newlyUnlocked);
        if (streakDays >= 7) await tryUnlock('streak_7', newlyUnlocked);
        if (streakDays >= 30) await tryUnlock('streak_30', newlyUnlocked);

        // Check transaction count
        const txCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM transactions');
        if (txCount && txCount.count >= 10) await tryUnlock('transactions_10', newlyUnlocked);
        if (txCount && txCount.count >= 100) await tryUnlock('transactions_100', newlyUnlocked);

        // Check budget
        const budgets = await getBudgets();
        if (budgets.length > 0) {
            await tryUnlock('budget_first', newlyUnlocked);
            const allUnderBudget = budgets.every(b => (b.spent || 0) <= b.monthly_limit);
            if (allUnderBudget && budgets.length > 0) await tryUnlock('budget_month', newlyUnlocked);
        }

        // Check goals
        const goals = await getGoals();
        if (goals.length > 0) {
            await tryUnlock('goal_first', newlyUnlocked);
            const completed = goals.some(g => g.saved_amount >= g.target_amount);
            if (completed) await tryUnlock('goal_complete', newlyUnlocked);
        }

        // Check positive balance
        const balance = await getTotalBalance();
        if (balance >= 0) await tryUnlock('savings_positive', newlyUnlocked);
    } catch (error) {
        console.log('Error checking achievements:', error);
    }

    return newlyUnlocked;
};

const tryUnlock = async (type: string, newlyUnlocked: Achievement[]): Promise<void> => {
    const db = await getDatabase();
    const ach = await db.getFirstAsync<Achievement>(
        'SELECT * FROM achievements WHERE type = ? AND unlocked_at IS NULL',
        [type]
    );
    if (ach) {
        const now = new Date().toISOString();
        await db.runAsync('UPDATE achievements SET unlocked_at = ? WHERE type = ?', [now, type]);
        ach.unlocked_at = now;
        newlyUnlocked.push(ach);
    }
};

export const calculateStreak = async (): Promise<number> => {
    const db = await getDatabase();
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
        const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
        const hasTx = await db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM transactions WHERE date = ?',
            [checkDate]
        );
        if (hasTx && hasTx.count > 0) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
};

export const getAchievements = async (): Promise<Achievement[]> => {
    const db = await getDatabase();
    return await db.getAllAsync<Achievement>(
        'SELECT * FROM achievements ORDER BY unlocked_at IS NULL, unlocked_at DESC'
    );
};

export const getStreak = async (): Promise<number> => {
    return await calculateStreak();
};

export interface LevelData {
    level: number;
    xp: number;           // total transactions so far
    xpForThisLevel: number; // tx count at start of current level
    xpNeeded: number;     // tx needed to reach next level
}

// Levels 1-5: 2 tx per level, Level 6+: 3 tx per level
export const getLevelData = async (): Promise<LevelData> => {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM transactions'
    );
    const totalTx = result?.count ?? 0;

    // Calculate level from total transactions
    // First 5 levels need 2 tx each = 10 tx total to reach level 6
    const PHASE1_LEVELS = 5;
    const PHASE1_TX_PER_LEVEL = 2;
    const PHASE1_TOTAL = PHASE1_LEVELS * PHASE1_TX_PER_LEVEL; // 10
    const PHASE2_TX_PER_LEVEL = 3;

    let level = 1;
    let xpForThisLevel = 0;
    let xpNeeded = PHASE1_TX_PER_LEVEL;

    if (totalTx < PHASE1_TOTAL) {
        // In phase 1
        level = 1 + Math.floor(totalTx / PHASE1_TX_PER_LEVEL);
        xpForThisLevel = (level - 1) * PHASE1_TX_PER_LEVEL;
        xpNeeded = PHASE1_TX_PER_LEVEL;
    } else {
        // In phase 2
        const phase2Tx = totalTx - PHASE1_TOTAL;
        const phase2Level = Math.floor(phase2Tx / PHASE2_TX_PER_LEVEL);
        level = PHASE1_LEVELS + 1 + phase2Level;
        xpForThisLevel = PHASE1_TOTAL + phase2Level * PHASE2_TX_PER_LEVEL;
        xpNeeded = PHASE2_TX_PER_LEVEL;
    }

    return { level, xp: totalTx, xpForThisLevel, xpNeeded };
};
