import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addDays, parseISO, isValid, format } from 'date-fns';
import { RecurringItem } from '../types';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const requestNotificationPermission = async (): Promise<boolean> => {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
};

/**
 * Schedules a local notification for a specific date/time.
 * identifier is used to cancel/replace it later.
 */
const scheduleReminder = async (
    identifier: string,
    title: string,
    body: string,
    triggerDate: Date
): Promise<void> => {
    // Cancel any existing notification with same identifier
    try { await Notifications.cancelScheduledNotificationAsync(identifier); } catch {}

    // Don't schedule in the past
    if (triggerDate <= new Date()) return;

    await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
            title,
            body,
            sound: true,
            data: {},
        },
        trigger: Platform.OS === 'android'
            ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate }
            : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
    });
};

/**
 * Schedules "due tomorrow" reminders for all active recurring items
 * whose next_date is within the next 7 days.
 * Notifications fire at 9am the day before.
 */
export const scheduleRecurringReminders = async (items: RecurringItem[]): Promise<void> => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const item of items) {
        if (!item.is_active || !item.next_date) continue;

        const nextDate = parseISO(item.next_date);
        if (!isValid(nextDate)) continue;

        const daysUntil = Math.round((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil < 1 || daysUntil > 7) continue;

        const notifDate = addDays(nextDate, -1);
        notifDate.setHours(9, 0, 0, 0);

        const label = item.type === 'expense' ? 'payment' : 'income';
        const amount = item.amount.toFixed(2);
        const dateStr = format(nextDate, 'MMM d');

        await scheduleReminder(
            `recurring_${item.id}`,
            `Upcoming ${label}: ${item.name}`,
            `$${amount} is due on ${dateStr}. Don't forget!`,
            notifDate
        );
    }
};

/**
 * Cancels all recurring reminder notifications.
 * Call this before rescheduling to avoid stale notifications.
 */
export const cancelAllRecurringReminders = async (): Promise<void> => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
        if (n.identifier.startsWith('recurring_')) {
            await Notifications.cancelScheduledNotificationAsync(n.identifier);
        }
    }
};

/**
 * Full refresh: cancel all existing, then reschedule based on current items.
 */
export const refreshRecurringReminders = async (items: RecurringItem[]): Promise<void> => {
    try {
        await cancelAllRecurringReminders();
        await scheduleRecurringReminders(items);
    } catch (e) {
        console.warn('[notificationService] Failed to schedule reminders:', e);
    }
};
