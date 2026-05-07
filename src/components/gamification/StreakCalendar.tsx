import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { Spacing, FontSize, FontWeight } from '../../constants/theme';
import { format, startOfMonth, startOfWeek, addDays, parseISO, isToday, getMonth, getDate, getYear, subMonths, addMonths, subDays } from 'date-fns';

interface DayActivity {
    date: string;
    count: number;
    expenses: number;
    workouts: number;
    meditations: number;
    journals: number;
    water: number;
}

interface CalendarCell {
    date: Date;
    dateStr: string;
    day: number;
    isCurrentMonth: boolean;
    isFuture: boolean;
    isToday: boolean;
    activity: DayActivity | null;
}


export function StreakCalendar() {
    const { colors, styleConfig } = useTheme();
    const { state } = useApp();
    const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [today, setToday] = useState(() => new Date());
    const [currentMonth, setCurrentMonth] = useState(() => new Date());

    useEffect(() => {
        const id = setInterval(() => setToday(new Date()), 60000);
        return () => clearInterval(id);
    }, []);

    const activityByDate = useMemo(() => {
        const activities: Record<string, DayActivity> = {};

        const ensureDate = (dateStr: string) => {
            if (!activities[dateStr]) {
                activities[dateStr] = { date: dateStr, count: 0, expenses: 0, workouts: 0, meditations: 0, journals: 0, water: 0 };
            }
        };

        state.financial.expenses.forEach(e => { ensureDate(e.date); activities[e.date].expenses += 1; activities[e.date].count += 1; });
        state.health.workouts.forEach(w => { ensureDate(w.date); activities[w.date].workouts += 1; activities[w.date].count += 1; });
        state.health.waterLogs.forEach(wl => { ensureDate(wl.date); activities[wl.date].water = wl.glasses; if (wl.glasses > 0) activities[wl.date].count += 1; });
        state.mindfulness.meditations.forEach(m => { ensureDate(m.date); activities[m.date].meditations += 1; activities[m.date].count += 1; });
        state.mindfulness.journals.forEach(j => { ensureDate(j.date); activities[j.date].journals += 1; activities[j.date].count += 1; });

        return activities;
    }, [state]);

    const currentStreak = useMemo(() => {
        const todayStr = format(today, 'yyyy-MM-dd');
        let streak = 0, checkDate = today, daysChecked = 0;
        while (daysChecked < 365) {
            const ds = format(checkDate, 'yyyy-MM-dd');
            if (activityByDate[ds] && activityByDate[ds].count > 0) { streak++; checkDate = subDays(checkDate, 1); daysChecked++; }
            else if (ds === todayStr) { checkDate = subDays(checkDate, 1); daysChecked++; }
            else break;
        }
        return streak;
    }, [activityByDate, today]);

    const longestStreak = useMemo(() => {
        const dates = Object.keys(activityByDate).sort();
        if (dates.length === 0) return 0;
        const firstDate = parseISO(dates[0]);
        const lastDate = parseISO(dates[dates.length - 1]);
        const totalDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / 86400000) + 1;
        let temp = 0, best = 0, cd = firstDate;
        for (let i = 0; i < totalDays; i++) {
            const ds = format(cd, 'yyyy-MM-dd');
            if (activityByDate[ds] && activityByDate[ds].count > 0) { temp++; best = Math.max(best, temp); } else temp = 0;
            cd = addDays(cd, 1);
        }
        return best;
    }, [activityByDate]);

    const calendarWeeks = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
        const month = getMonth(currentMonth);
        const cells: CalendarCell[] = [];
        for (let i = 0; i < 42; i++) {
            const date = addDays(calStart, i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const act = activityByDate[dateStr];
            cells.push({
                date, dateStr, day: getDate(date),
                isCurrentMonth: getMonth(date) === month,
                isFuture: date > today,
                isToday: isToday(date),
                activity: act && act.count > 0 ? act : null,
            });
        }
        const weeks: CalendarCell[][] = [];
        for (let i = 0; i < 42; i += 7) weeks.push(cells.slice(i, i + 7));
        return weeks;
    }, [currentMonth, activityByDate, today]);

    const activeDaysInMonth = useMemo(() => {
        return calendarWeeks.reduce((s, w) => s + w.filter(c => c.isCurrentMonth && c.activity && !c.isFuture).length, 0);
    }, [calendarWeeks]);

    const totalDaysInMonth = calendarWeeks.reduce((s, w) => s + w.filter(c => c.isCurrentMonth).length, 0);
    const atCurrentMonth = getMonth(currentMonth) === getMonth(today) && getYear(currentMonth) === getYear(today);

    const handleDayPress = (cell: CalendarCell) => {
        if (cell.isFuture) return;
        const da = cell.activity || { date: cell.dateStr, count: 0, expenses: 0, workouts: 0, meditations: 0, journals: 0, water: 0 };
        setSelectedDay(da);
        setShowDetails(true);
    };

    const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <View style={styles.container}>
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.success }]}>{currentStreak}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Current Streak</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.primary }]}>{longestStreak}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Best Streak</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                        {activeDaysInMonth}<Text style={[styles.statValueSub, { color: colors.textMuted }]}>/{totalDaysInMonth}</Text>
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This Month</Text>
                </View>
            </View>

            <View style={styles.monthNav}>
                <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))} style={styles.navButton}>
                    <Text style={[styles.navArrow, { color: colors.textSecondary }]}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>{format(currentMonth, 'MMMM yyyy')}</Text>
                <TouchableOpacity
                    onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    style={styles.navButton}
                    disabled={atCurrentMonth}
                >
                    <Text style={[styles.navArrow, { color: atCurrentMonth ? colors.textMuted : colors.textSecondary }]}>{'>'}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.calendarWrap}>
                <View style={styles.dayHeadersRow}>
                    {dayHeaders.map((d, i) => (
                        <View key={i} style={styles.dayHeaderCell}>
                            <Text style={[styles.dayHeaderText, { color: colors.textMuted }]}>{d}</Text>
                        </View>
                    ))}
                </View>

                {calendarWeeks.map((week, wi) => (
                    <View key={wi} style={styles.weekRow}>
                        {week.map((cell) => {
                            const isDim = !cell.isCurrentMonth || cell.isFuture;
                            return (
                                <TouchableOpacity
                                    key={cell.dateStr}
                                    onPress={() => handleDayPress(cell)}
                                    activeOpacity={isDim ? 1 : 0.2}
                                    style={[
                                        styles.dayCell,
                                        {
                                            backgroundColor: cell.isToday ? colors.primary + '15' : 'transparent',
                                            borderColor: cell.isToday ? colors.primary : 'transparent',
                                            borderRadius: styleConfig.borderRadius.sm,
                                            opacity: isDim ? 0.3 : 1,
                                        },
                                    ]}
                                >
                                    <Text style={[styles.dayNum, { color: cell.isToday ? colors.primary : colors.textPrimary }]}>
                                        {cell.day}
                                    </Text>
                                    {cell.activity && !cell.isFuture && (
                                        <View style={[styles.dot, { backgroundColor: colors.success }]} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>

            <Modal visible={showDetails} animationType="fade" transparent onRequestClose={() => setShowDetails(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDetails(false)}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: styleConfig.borderRadius.lg, borderColor: colors.border }]}>
                        {selectedDay && (
                            <>
                                <Text style={[styles.modalDate, { color: colors.textPrimary }]}>
                                    {format(parseISO(selectedDay.date), 'EEEE, MMMM d, yyyy')}
                                </Text>
<Text style={[styles.modalTotal, { color: colors.success }]}>
                                    {selectedDay.count} {selectedDay.count === 1 ? 'activity' : 'activities'}
                                </Text>
                                {selectedDay.count > 0 && (
                                    <View style={styles.modalDetails}>
                                        {selectedDay.expenses > 0 && (
                                            <View style={styles.modalDetailRow}>
                                                <View style={[styles.modalDetailDot, { backgroundColor: colors.financial }]} />
                                                <Text style={[styles.modalDetailText, { color: colors.textSecondary }]}>
                                                    {selectedDay.expenses} expense{selectedDay.expenses > 1 ? 's' : ''}
                                                </Text>
                                            </View>
                                        )}
                                        {selectedDay.workouts > 0 && (
                                            <View style={styles.modalDetailRow}>
                                                <View style={[styles.modalDetailDot, { backgroundColor: colors.health }]} />
                                                <Text style={[styles.modalDetailText, { color: colors.textSecondary }]}>
                                                    {selectedDay.workouts} workout{selectedDay.workouts > 1 ? 's' : ''}
                                                </Text>
                                            </View>
                                        )}
                                        {selectedDay.water > 0 && (
                                            <View style={styles.modalDetailRow}>
                                                <View style={[styles.modalDetailDot, { backgroundColor: colors.info }]} />
                                                <Text style={[styles.modalDetailText, { color: colors.textSecondary }]}>
                                                    {selectedDay.water} glass{selectedDay.water > 1 ? 'es' : ''} of water
                                                </Text>
                                            </View>
                                        )}
                                        {selectedDay.meditations > 0 && (
                                            <View style={styles.modalDetailRow}>
                                                <View style={[styles.modalDetailDot, { backgroundColor: colors.mindfulness }]} />
                                                <Text style={[styles.modalDetailText, { color: colors.textSecondary }]}>
                                                    {selectedDay.meditations} meditation{selectedDay.meditations > 1 ? 's' : ''}
                                                </Text>
                                            </View>
                                        )}
                                        {selectedDay.journals > 0 && (
                                            <View style={styles.modalDetailRow}>
                                                <View style={[styles.modalDetailDot, { backgroundColor: colors.primary }]} />
                                                <Text style={[styles.modalDetailText, { color: colors.textSecondary }]}>
                                                    {selectedDay.journals} journal entr{selectedDay.journals > 1 ? 'ies' : 'y'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingVertical: Spacing.md },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.md },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
    statValueSub: { fontSize: FontSize.sm, fontWeight: FontWeight.regular },
    statLabel: { fontSize: FontSize.xs, marginTop: Spacing.xs },
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md, paddingHorizontal: Spacing.xs },
    navButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    navArrow: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
    monthTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
    calendarWrap: {},
    dayHeadersRow: { flexDirection: 'row', marginBottom: 4, paddingHorizontal: 2 },
    dayHeaderCell: { flex: 1, alignItems: 'center' },
    dayHeaderText: { fontSize: FontSize.xs },
    weekRow: { flexDirection: 'row', marginBottom: 2, paddingHorizontal: 2 },
    dayCell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, marginHorizontal: 1 },
    dayNum: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
    dot: { width: 5, height: 5, borderRadius: 3, position: 'absolute', bottom: 3 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
    modalContent: { padding: Spacing.lg, minWidth: 280, maxWidth: 340, borderWidth: 1 },
    modalDate: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginBottom: Spacing.sm },
    modalTotal: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.md },
    modalDetails: { gap: Spacing.sm },
    modalDetailRow: { flexDirection: 'row', alignItems: 'center' },
    modalDetailDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.sm },
    modalDetailText: { fontSize: FontSize.sm },
});
