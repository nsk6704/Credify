import { GratitudeLog } from '../types';
import { startOfWeek, endOfWeek, format, parseISO, isWithinInterval } from 'date-fns';

export interface DailyGratitudeGroup {
    date: string;
    displayDate: string;
    items: string[];
}

export interface WeeklySummary {
    weekStart: string;
    weekEnd: string;
    weekLabel: string;
    dailyGroups: DailyGratitudeGroup[];
    totalItems: number;
}

/**
 * Get the start and end dates for a given week
 * @param date - The date within the week
 * @returns Object with weekStart and weekEnd as ISO strings
 */
export function getWeekBoundaries(date: Date): { weekStart: Date; weekEnd: Date } {
    const weekStart = startOfWeek(date, { weekStartsOn: 0 }); // Sunday
    const weekEnd = endOfWeek(date, { weekStartsOn: 0 }); // Saturday
    return { weekStart, weekEnd };
}

/**
 * Get gratitude logs for a specific week
 * @param gratitudeLogs - All gratitude logs
 * @param date - A date within the desired week
 * @returns Array of gratitude logs within that week
 */
export function getWeekGratitudeLogs(gratitudeLogs: GratitudeLog[], date: Date): GratitudeLog[] {
    const { weekStart, weekEnd } = getWeekBoundaries(date);
    
    return gratitudeLogs.filter(log => {
        const logDate = parseISO(log.date);
        return isWithinInterval(logDate, { start: weekStart, end: weekEnd });
    });
}

/**
 * Aggregate gratitude logs into a weekly summary
 * @param gratitudeLogs - All gratitude logs
 * @param date - A date within the desired week (defaults to today)
 * @returns WeeklySummary object with aggregated data
 */
export function getWeeklySummary(gratitudeLogs: GratitudeLog[], date: Date = new Date()): WeeklySummary {
    const { weekStart, weekEnd } = getWeekBoundaries(date);
    const weekLogs = getWeekGratitudeLogs(gratitudeLogs, date);
    
    // Group by date
    const dailyMap = new Map<string, string[]>();
    
    weekLogs.forEach(log => {
        const existing = dailyMap.get(log.date) || [];
        dailyMap.set(log.date, [...existing, ...log.items]);
    });
    
    // Convert to sorted daily groups
    const dailyGroups: DailyGratitudeGroup[] = Array.from(dailyMap.entries())
        .map(([date, items]) => ({
            date,
            displayDate: format(parseISO(date), 'EEE, MMM d'),
            items,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    
    const totalItems = dailyGroups.reduce((sum, group) => sum + group.items.length, 0);
    
    return {
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        weekLabel: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`,
        dailyGroups,
        totalItems,
    };
}

/**
 * Get summaries for the last N weeks
 * @param gratitudeLogs - All gratitude logs
 * @param weeks - Number of weeks to retrieve (defaults to 4)
 * @returns Array of WeeklySummary objects, most recent first
 */
export function getRecentWeeklySummaries(gratitudeLogs: GratitudeLog[], weeks: number = 4): WeeklySummary[] {
    const summaries: WeeklySummary[] = [];
    const now = new Date();
    
    for (let i = 0; i < weeks; i++) {
        const weekDate = new Date(now);
        weekDate.setDate(now.getDate() - (i * 7));
        
        const summary = getWeeklySummary(gratitudeLogs, weekDate);
        // Only include weeks that have gratitude entries
        if (summary.totalItems > 0) {
            summaries.push(summary);
        }
    }
    
    return summaries;
}
