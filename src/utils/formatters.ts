import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';

export const formatCurrency = (amount: number): string => {
    const isNegative = amount < 0;
    const formatted = Math.abs(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return isNegative ? `-$${formatted}` : `$${formatted}`;
};

export const formatDate = (dateStr: string): string => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
};

export const formatDateShort = (dateStr: string): string => {
    return format(parseISO(dateStr), 'MMM d');
};

export const formatDateFull = (dateStr: string): string => {
    return format(parseISO(dateStr), 'EEEE, MMMM d, yyyy');
};

export const formatRelative = (dateStr: string): string => {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
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
