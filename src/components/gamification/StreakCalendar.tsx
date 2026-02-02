import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { Spacing, FontSize, FontWeight } from '../../constants/theme';
import { format, subDays, startOfWeek, addDays, parseISO, isToday } from 'date-fns';

interface DayActivity {
    date: string;
    count: number;
    expenses: number;
    workouts: number;
    meditations: number;
    journals: number;
    water: number;
}

interface StreakCalendarProps {
    weeks?: number; // Number of weeks to display (default: 52)
}

export function StreakCalendar({ weeks = 52 }: StreakCalendarProps) {
    const { colors, styleConfig } = useTheme();
    const { state } = useApp();
    const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    // Aggregate all activities by date
    const activityByDate = useMemo(() => {
        const activities: Record<string, DayActivity> = {};

        // Helper to ensure date entry exists
        const ensureDate = (dateStr: string) => {
            if (!activities[dateStr]) {
                activities[dateStr] = {
                    date: dateStr,
                    count: 0,
                    expenses: 0,
                    workouts: 0,
                    meditations: 0,
                    journals: 0,
                    water: 0,
                };
            }
        };

        // Count expenses
        state.financial.expenses.forEach(expense => {
            ensureDate(expense.date);
            activities[expense.date].expenses += 1;
            activities[expense.date].count += 1;
        });

        // Count workouts
        state.health.workouts.forEach(workout => {
            ensureDate(workout.date);
            activities[workout.date].workouts += 1;
            activities[workout.date].count += 1;
        });

        // Count water logs
        state.health.waterLogs.forEach(waterLog => {
            ensureDate(waterLog.date);
            activities[waterLog.date].water = waterLog.glasses;
            if (waterLog.glasses > 0) {
                activities[waterLog.date].count += 1;
            }
        });

        // Count meditations
        state.mindfulness.meditations.forEach(meditation => {
            ensureDate(meditation.date);
            activities[meditation.date].meditations += 1;
            activities[meditation.date].count += 1;
        });

        // Count journals
        state.mindfulness.journals.forEach(journal => {
            ensureDate(journal.date);
            activities[journal.date].journals += 1;
            activities[journal.date].count += 1;
        });

        return activities;
    }, [state]);

    // Calculate streak statistics
    const streakStats = useMemo(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const dates = Object.keys(activityByDate).sort();
        
        let currentStreak = 0;
        let longestStreak = 0;

        // Count backwards from today for current streak
        let checkDate = new Date();
        let daysChecked = 0;
        const maxDaysToCheck = 365; // Safety limit
        
        while (daysChecked < maxDaysToCheck) {
            const dateStr = format(checkDate, 'yyyy-MM-dd');
            if (activityByDate[dateStr] && activityByDate[dateStr].count > 0) {
                currentStreak++;
                checkDate = subDays(checkDate, 1);
                daysChecked++;
            } else if (dateStr === today) {
                // Today has no activity, but continue checking
                checkDate = subDays(checkDate, 1);
                daysChecked++;
            } else {
                break;
            }
        }

        // Calculate longest streak by checking all days sequentially
        if (dates.length > 0) {
            const firstDate = parseISO(dates[0]);
            const lastDate = parseISO(dates[dates.length - 1]);
            const totalDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / 86400000) + 1;
            
            let tempStreak = 0;
            let checkStreakDate = firstDate;
            
            for (let i = 0; i < totalDays; i++) {
                const dateStr = format(checkStreakDate, 'yyyy-MM-dd');
                
                if (activityByDate[dateStr] && activityByDate[dateStr].count > 0) {
                    tempStreak++;
                    longestStreak = Math.max(longestStreak, tempStreak);
                } else {
                    tempStreak = 0;
                }
                
                checkStreakDate = addDays(checkStreakDate, 1);
            }
        }

        return {
            currentStreak,
            longestStreak,
            totalActiveDays: dates.length,
        };
    }, [activityByDate]);

    // Generate calendar data
    const calendarData = useMemo(() => {
        const endDate = new Date();
        const startDate = subDays(endDate, weeks * 7 - 1);
        const firstDay = startOfWeek(startDate, { weekStartsOn: 0 }); // Sunday

        const weekData: DayActivity[][] = [];
        let currentWeek: DayActivity[] = [];

        for (let i = 0; i < weeks * 7; i++) {
            const date = addDays(firstDay, i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const activity = activityByDate[dateStr] || {
                date: dateStr,
                count: 0,
                expenses: 0,
                workouts: 0,
                meditations: 0,
                journals: 0,
                water: 0,
            };

            currentWeek.push(activity);

            if (currentWeek.length === 7) {
                weekData.push(currentWeek);
                currentWeek = [];
            }
        }

        return weekData;
    }, [activityByDate, weeks]);

    // Get color intensity based on activity count
    const getIntensityColor = (count: number): string => {
        if (count === 0) return colors.surfaceLight;
        if (count <= 2) return colors.streak + '30'; // 30% opacity
        if (count <= 5) return colors.streak + '60'; // 60% opacity
        if (count <= 10) return colors.streak + '90'; // 90% opacity
        return colors.streak; // Full intensity
    };

    const handleDayPress = (day: DayActivity) => {
        setSelectedDay(day);
        setShowDetails(true);
    };

    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <View style={styles.container}>
            {/* Stats Header */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.streak }]}>
                        {streakStats.currentStreak}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Current Streak
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.primary }]}>
                        {streakStats.longestStreak}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Longest Streak
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                        {streakStats.totalActiveDays}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Active Days
                    </Text>
                </View>
            </View>

            {/* Calendar Grid */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View>
                    {/* Day labels */}
                    <View style={styles.dayLabelsContainer}>
                        <View style={styles.dayLabels}>
                            {dayNames.map((day) => (
                                <Text
                                    key={day}
                                    style={[styles.dayLabel, { color: colors.textMuted }]}
                                >
                                    {day}
                                </Text>
                            ))}
                        </View>
                    </View>

                    {/* Calendar weeks */}
                    <View style={styles.calendarContainer}>
                        {calendarData.map((week, weekIndex) => (
                            <View key={weekIndex} style={styles.week}>
                                {week.map((day) => {
                                    const isTodayDate = isToday(parseISO(day.date));
                                    return (
                                        <TouchableOpacity
                                            key={day.date}
                                            onPress={() => handleDayPress(day)}
                                            style={[
                                                styles.day,
                                                {
                                                    backgroundColor: getIntensityColor(day.count),
                                                    borderColor: isTodayDate ? colors.primary : 'transparent',
                                                    borderRadius: styleConfig.borderRadius.xs,
                                                },
                                            ]}
                                            accessibilityLabel={`${format(parseISO(day.date), 'EEEE, MMMM d, yyyy')}: ${day.count} ${day.count === 1 ? 'activity' : 'activities'}`}
                                            accessibilityHint="Double tap to view details"
                                        />
                                    );
                                })}
                            </View>
                        ))}
                    </View>

                    {/* Legend */}
                    <View style={styles.legend}>
                        <Text style={[styles.legendLabel, { color: colors.textMuted }]}>Less</Text>
                        <View style={styles.legendBoxes}>
                            <View style={[styles.legendBox, { backgroundColor: colors.surfaceLight, borderRadius: styleConfig.borderRadius.xs }]} />
                            <View style={[styles.legendBox, { backgroundColor: colors.streak + '30', borderRadius: styleConfig.borderRadius.xs }]} />
                            <View style={[styles.legendBox, { backgroundColor: colors.streak + '60', borderRadius: styleConfig.borderRadius.xs }]} />
                            <View style={[styles.legendBox, { backgroundColor: colors.streak + '90', borderRadius: styleConfig.borderRadius.xs }]} />
                            <View style={[styles.legendBox, { backgroundColor: colors.streak, borderRadius: styleConfig.borderRadius.xs }]} />
                        </View>
                        <Text style={[styles.legendLabel, { color: colors.textMuted }]}>More</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Details Modal */}
            <Modal
                visible={showDetails}
                animationType="fade"
                transparent
                onRequestClose={() => setShowDetails(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowDetails(false)}
                >
                    <View
                        style={[
                            styles.modalContent,
                            {
                                backgroundColor: colors.surface,
                                borderRadius: styleConfig.borderRadius.lg,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        {selectedDay && (
                            <>
                                <Text style={[styles.modalDate, { color: colors.textPrimary }]}>
                                    {format(parseISO(selectedDay.date), 'EEEE, MMMM d, yyyy')}
                                </Text>
                                <Text style={[styles.modalTotal, { color: colors.streak }]}>
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
    container: {
        paddingVertical: Spacing.md,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: Spacing.lg,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
    },
    statLabel: {
        fontSize: FontSize.xs,
        marginTop: Spacing.xs,
    },
    scrollContent: {
        paddingRight: Spacing.md,
    },
    dayLabelsContainer: {
        marginBottom: Spacing.xs,
    },
    dayLabels: {
        marginLeft: 20,
    },
    dayLabel: {
        fontSize: FontSize.xs,
        height: 12,
        lineHeight: 12,
        textAlign: 'center',
    },
    calendarContainer: {
        flexDirection: 'row',
    },
    week: {
        marginRight: 3,
    },
    day: {
        width: 12,
        height: 12,
        marginBottom: 3,
        borderWidth: 1,
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.md,
        justifyContent: 'center',
    },
    legendLabel: {
        fontSize: FontSize.xs,
        marginHorizontal: Spacing.xs,
    },
    legendBoxes: {
        flexDirection: 'row',
        gap: 3,
    },
    legendBox: {
        width: 12,
        height: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    modalContent: {
        padding: Spacing.lg,
        minWidth: 280,
        maxWidth: 340,
        borderWidth: 1,
    },
    modalDate: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        marginBottom: Spacing.sm,
    },
    modalTotal: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.md,
    },
    modalDetails: {
        gap: Spacing.sm,
    },
    modalDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalDetailDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: Spacing.sm,
    },
    modalDetailText: {
        fontSize: FontSize.sm,
    },
});
