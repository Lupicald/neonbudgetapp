export interface Category {
    id: number;
    name: string;
    icon: string;
    color: string;
    is_default: number; // 0 or 1
}

export type AccountType = 'bank' | 'cash' | 'credit' | 'savings' | 'investment' | 'other';

export interface Account {
    id: number;
    name: string;
    type: AccountType;
    balance: number;
    icon: string;
    color: string;
    is_default: number;
}

export interface Merchant {
    id: number;
    name: string;
    default_category_id: number | null;
    category_name?: string;
    category_icon?: string;
    category_color?: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
    id: number;
    type: TransactionType;
    amount: number;
    merchant_name: string;
    merchant_id: number | null;
    category_id: number;
    category_name?: string;
    category_icon?: string;
    category_color?: string;
    account_id: number | null;
    account_name?: string;
    date: string; // ISO date string
    note: string;
    receipt_uri: string | null;
    created_at: string;
}

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom';

export interface RecurringItem {
    id: number;
    type: TransactionType;
    name: string;
    amount: number;
    category_id: number;
    category_name?: string;
    category_icon?: string;
    category_color?: string;
    frequency: RecurringFrequency;
    interval_days: number; // e.g., every N days for custom
    day_of_week: number | null; // 0=Sun, 1=Mon, ..., 6=Sat
    day_of_month: number | null;
    start_date: string;
    next_date: string;
    is_active: number; // 0 or 1
}

export interface Budget {
    id: number;
    category_id: number;
    category_name?: string;
    category_icon?: string;
    category_color?: string;
    monthly_limit: number;
    month: string; // YYYY-MM
    spent?: number;
}

export interface Goal {
    id: number;
    name: string;
    target_amount: number;
    saved_amount: number;
    icon: string;
    color: string;
}

export interface Achievement {
    id: number;
    type: string;
    title: string;
    description: string;
    icon: string;
    unlocked_at: string | null;
}

export interface ProjectedEvent {
    date: string;
    label: string;
    amount: number;
    type: TransactionType;
    projectedBalance: number;
    isRecurring: boolean;
    categoryColor?: string;
}

export interface Insight {
    id: string;
    icon: string;
    title: string;
    description: string;
    type: 'info' | 'warning' | 'success' | 'tip';
}

export interface FinancialHealthScore {
    score: number;
    label: string;
    color: string;
}

export interface PlannedIncome {
    id: number;
    name: string;
    amount: number;
    expected_date: string; // YYYY-MM-DD
    note: string;
    created_at: string;
}

export interface PlannedExpense {
    id: number;
    planned_income_id: number | null;
    name: string;
    amount: number;
    category_id: number;
    category_name?: string;
    category_icon?: string;
    category_color?: string;
    planned_date: string; // YYYY-MM-DD
    is_completed: number; // 0 or 1
    note: string;
    created_at: string;
}
