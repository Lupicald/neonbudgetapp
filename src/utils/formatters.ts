import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, parseISO, isValid } from 'date-fns';

export const formatCurrency = (amount: number): string => {
    const isNegative = amount < 0;
    const absStr = Math.abs(amount).toFixed(2);
    const parts = absStr.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formatted = parts.join('.');
    return isNegative ? `-$${formatted}` : `$${formatted}`;
};

const safeParseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const p = parseISO(dateStr);
    if (isValid(p)) return p;
    const d = new Date(dateStr);
    if (isValid(d)) return d;
    return null;
};

export const formatDate = (dateStr: string): string => {
    const date = safeParseDate(dateStr);
    if (!date) return dateStr || '';
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
};

export const formatDateShort = (dateStr: string): string => {
    const date = safeParseDate(dateStr);
    if (!date) return dateStr || '';
    return format(date, 'MMM d');
};

export const formatDateFull = (dateStr: string): string => {
    const date = safeParseDate(dateStr);
    if (!date) return dateStr || '';
    return format(date, 'EEEE, MMMM d, yyyy');
};

export const formatRelative = (dateStr: string): string => {
    const date = safeParseDate(dateStr);
    if (!date) return dateStr || '';
    return formatDistanceToNow(date, { addSuffix: true });
};

export const getMonthKey = (date: Date = new Date()): string => {
    return format(date, 'yyyy-MM');
};

export const getDayOfWeekName = (day: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day] || '';
};

export const toISODateString = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
};
