import { FinancialHealthScore } from '../types';
import { getTotalBalance } from '../database/accountService';
import { getDebtLimit } from '../database/settingsService';
import { Colors } from '../theme';

export const calculateHealthScore = async (): Promise<FinancialHealthScore> => {
    const balance = await getTotalBalance();
    const debtLimit = await getDebtLimit();

    return getScoreFromBalance(balance, debtLimit);
};

export const getScoreFromBalance = (balance: number, debtLimit: number): FinancialHealthScore => {
    if (balance >= 0) {
        return { score: 100, label: 'Excellent', color: Colors.cyberGreen };
    }

    if (balance <= debtLimit) {
        return { score: 0, label: 'Critical', color: Colors.neonPink };
    }

    const score = Math.round(((balance - debtLimit) / (0 - debtLimit)) * 100);

    if (score >= 80) return { score, label: 'Great', color: Colors.cyberGreen };
    if (score >= 60) return { score, label: 'Good', color: Colors.electricBlue };
    if (score >= 40) return { score, label: 'Fair', color: Colors.neonYellow };
    if (score >= 20) return { score, label: 'Warning', color: Colors.neonOrange };
    return { score, label: 'Danger', color: Colors.neonPink };
};
