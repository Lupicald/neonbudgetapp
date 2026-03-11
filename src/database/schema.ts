export const CREATE_TABLES_SQL = [
  `CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('bank', 'cash', 'credit', 'savings', 'investment', 'other')),
    balance REAL NOT NULL DEFAULT 0,
    icon TEXT NOT NULL DEFAULT 'wallet-outline',
    color TEXT NOT NULL DEFAULT '#00d4ff',
    is_default INTEGER NOT NULL DEFAULT 0
  );`,

  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'ellipse-outline',
    color TEXT NOT NULL DEFAULT '#00d4ff',
    is_default INTEGER NOT NULL DEFAULT 0
  );`,

  `CREATE TABLE IF NOT EXISTS merchants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    default_category_id INTEGER,
    FOREIGN KEY (default_category_id) REFERENCES categories(id) ON DELETE SET NULL
  );`,

  `CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    amount REAL NOT NULL,
    merchant_name TEXT NOT NULL DEFAULT '',
    merchant_id INTEGER,
    category_id INTEGER NOT NULL,
    account_id INTEGER,
    date TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    receipt_uri TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
  );`,

  `CREATE TABLE IF NOT EXISTS recurring_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    category_id INTEGER NOT NULL,
    frequency TEXT NOT NULL CHECK(frequency IN ('weekly', 'biweekly', 'monthly', 'yearly', 'custom')),
    interval_days INTEGER NOT NULL DEFAULT 0,
    day_of_week INTEGER,
    day_of_month INTEGER,
    start_date TEXT NOT NULL,
    next_date TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    monthly_limit REAL NOT NULL,
    month TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(category_id, month)
  );`,

  `CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    saved_amount REAL NOT NULL DEFAULT 0,
    icon TEXT NOT NULL DEFAULT 'trophy-outline',
    color TEXT NOT NULL DEFAULT '#b026ff'
  );`,

  `CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'medal-outline',
    unlocked_at TEXT
  );`,

  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS planned_incomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    expected_date TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`,

  `CREATE TABLE IF NOT EXISTS planned_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    planned_income_id INTEGER,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    category_id INTEGER,
    planned_date TEXT NOT NULL,
    is_completed INTEGER NOT NULL DEFAULT 0,
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (planned_income_id) REFERENCES planned_incomes(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );`,
];

export const DEFAULT_ACCOUNTS = [
  { name: 'Cash', type: 'cash', icon: 'cash-outline', color: '#39ff14' },
  { name: 'Bank', type: 'bank', icon: 'card-outline', color: '#00d4ff' },
];

export const DEFAULT_CATEGORIES = [
  { name: 'Food & Drinks', icon: 'restaurant-outline', color: '#ff6b35' },
  { name: 'Transport', icon: 'car-outline', color: '#00d4ff' },
  { name: 'Entertainment', icon: 'game-controller-outline', color: '#b026ff' },
  { name: 'Shopping', icon: 'bag-outline', color: '#ff2d7b' },
  { name: 'Health', icon: 'fitness-outline', color: '#39ff14' },
  { name: 'Subscriptions', icon: 'repeat-outline', color: '#ffe66d' },
  { name: 'Rent', icon: 'home-outline', color: '#44aaff' },
  { name: 'Utilities', icon: 'flash-outline', color: '#ffaa44' },
  { name: 'Education', icon: 'school-outline', color: '#aa44ff' },
  { name: 'Salary', icon: 'cash-outline', color: '#39ff14' },
  { name: 'Freelance', icon: 'code-slash-outline', color: '#00d4ff' },
  { name: 'Other', icon: 'ellipse-outline', color: '#888888' },
];

export const DEFAULT_SETTINGS = [
  { key: 'current_balance', value: '0' },
  { key: 'debt_limit', value: '-30000' },
  { key: 'currency', value: 'MXN' },
];

export const DEFAULT_ACHIEVEMENTS = [
  { type: 'streak_3', title: '3-Day Streak', description: 'Log expenses for 3 days in a row', icon: 'flame-outline' },
  { type: 'streak_7', title: 'Week Warrior', description: 'Log expenses for 7 days in a row', icon: 'flame-outline' },
  { type: 'streak_30', title: 'Monthly Master', description: 'Log expenses for 30 days in a row', icon: 'trophy-outline' },
  { type: 'budget_first', title: 'Budget Beginner', description: 'Create your first budget', icon: 'ribbon-outline' },
  { type: 'budget_month', title: 'Budget Boss', description: 'Stay under all budgets for a month', icon: 'medal-outline' },
  { type: 'goal_first', title: 'Goal Setter', description: 'Create your first savings goal', icon: 'flag-outline' },
  { type: 'goal_complete', title: 'Goal Crusher', description: 'Complete a savings goal', icon: 'trophy-outline' },
  { type: 'transactions_10', title: 'Tracker', description: 'Log 10 transactions', icon: 'checkmark-circle-outline' },
  { type: 'transactions_100', title: 'Diligent Tracker', description: 'Log 100 transactions', icon: 'star-outline' },
  { type: 'savings_positive', title: 'In The Green', description: 'Maintain a positive balance', icon: 'trending-up-outline' },
];
