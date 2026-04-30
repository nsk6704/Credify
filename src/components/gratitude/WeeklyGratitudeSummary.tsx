import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, FontSize, FontWeight } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../common/Card';
import { GratitudeLog } from '../../types';
import { getWeeklySummary, WeeklySummary } from '../../lib/gratitudeUtils';

interface WeeklyGratitudeSummaryProps {
    gratitudeLogs: GratitudeLog[];
    weekOffset?: number; // 0 = current week, 1 = last week, etc.
    onWeekChange?: (offset: number) => void;
    defaultExpanded?: boolean; // Control initial expanded state
}

export function WeeklyGratitudeSummary({ 
    gratitudeLogs, 
    weekOffset = 0,
    onWeekChange,
    defaultExpanded = true,
}: WeeklyGratitudeSummaryProps) {
    const { colors, styleConfig } = useTheme();
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    
    // Calculate the date for the desired week
    const weekDate = new Date();
    weekDate.setDate(weekDate.getDate() - (weekOffset * 7));
    
    const summary: WeeklySummary = getWeeklySummary(gratitudeLogs, weekDate);
    
    const handlePreviousWeek = () => {
        if (onWeekChange) {
            onWeekChange(weekOffset + 1);
        }
    };
    
    const handleNextWeek = () => {
        if (onWeekChange && weekOffset > 0) {
            onWeekChange(weekOffset - 1);
        }
    };
    
    // Check if there are more weeks with data before this one
    const hasMorePastWeeks = () => {
        const olderWeekDate = new Date(weekDate);
        olderWeekDate.setDate(olderWeekDate.getDate() - 7);
        const olderSummary = getWeeklySummary(gratitudeLogs, olderWeekDate);
        return olderSummary.totalItems > 0;
    };
    
    if (summary.totalItems === 0) {
        return (
            <Card style={styles.container}>
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: '#F59E0B20', borderRadius: styleConfig.borderRadius.sm }]}>
                        <Ionicons name="heart" size={20} color="#F59E0B" />
                    </View>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>Weekly Gratitude</Text>
                </View>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No gratitude entries this week. Start logging what you're grateful for!
                </Text>
            </Card>
        );
    }
    
    return (
        <Card style={styles.container}>
            {/* Header with expand/collapse */}
            <TouchableOpacity 
                style={styles.header}
                onPress={() => setIsExpanded(!isExpanded)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: '#F59E0B20', borderRadius: styleConfig.borderRadius.sm }]}>
                    <Ionicons name="heart" size={20} color="#F59E0B" />
                </View>
                <View style={styles.headerText}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>Weekly Gratitude</Text>
                    <Text style={[styles.weekLabel, { color: colors.textSecondary }]}>{summary.weekLabel}</Text>
                </View>
                <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.textSecondary} 
                />
            </TouchableOpacity>
            
            {/* Week Navigation */}
            {isExpanded && (
                <>
                    <View style={styles.navigation}>
                        <TouchableOpacity 
                            style={[styles.navButton, { borderColor: colors.border, borderRadius: styleConfig.borderRadius.sm }]}
                            onPress={handlePreviousWeek}
                            disabled={!hasMorePastWeeks()}
                        >
                            <Ionicons 
                                name="chevron-back" 
                                size={18} 
                                color={hasMorePastWeeks() ? colors.textPrimary : colors.textMuted} 
                            />
                            <Text style={[styles.navText, { color: hasMorePastWeeks() ? colors.textPrimary : colors.textMuted }]}>
                                Previous
                            </Text>
                        </TouchableOpacity>
                        
                        <Text style={[styles.itemCount, { color: '#F59E0B' }]}>
                            {summary.totalItems} {summary.totalItems === 1 ? 'item' : 'items'}
                        </Text>
                        
                        <TouchableOpacity 
                            style={[styles.navButton, { borderColor: colors.border, borderRadius: styleConfig.borderRadius.sm }]}
                            onPress={handleNextWeek}
                            disabled={weekOffset === 0}
                        >
                            <Text style={[styles.navText, { color: weekOffset === 0 ? colors.textMuted : colors.textPrimary }]}>
                                Next
                            </Text>
                            <Ionicons 
                                name="chevron-forward" 
                                size={18} 
                                color={weekOffset === 0 ? colors.textMuted : colors.textPrimary} 
                            />
                        </TouchableOpacity>
                    </View>
                    
                    {/* Daily Groups */}
                    <View style={styles.content}>
                        {summary.dailyGroups.map((group, groupIndex) => (
                            <View key={group.date} style={styles.dayGroup}>
                                <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>
                                    {group.displayDate}
                                </Text>
                                {group.items.map((item, itemIndex) => (
                                    <View key={`${group.date}-${itemIndex}-${item.substring(0, 20)}`} style={styles.gratitudeItem}>
                                        <View style={[styles.bullet, { backgroundColor: '#F59E0B' }]} />
                                        <Text style={[styles.itemText, { color: colors.textPrimary }]}>
                                            {item}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                </>
            )}
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    title: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },
    weekLabel: {
        fontSize: FontSize.sm,
        marginTop: 2,
    },
    navigation: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacing.md,
        marginBottom: Spacing.sm,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        borderWidth: 1,
    },
    navText: {
        fontSize: FontSize.sm,
        marginHorizontal: Spacing.xs,
    },
    itemCount: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    content: {
        marginTop: Spacing.sm,
    },
    dayGroup: {
        marginBottom: Spacing.md,
    },
    dayLabel: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        marginBottom: Spacing.xs,
    },
    gratitudeItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Spacing.xs,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 7,
        marginRight: Spacing.sm,
    },
    itemText: {
        flex: 1,
        fontSize: FontSize.md,
        lineHeight: 20,
    },
    emptyText: {
        fontSize: FontSize.md,
        textAlign: 'center',
        marginTop: Spacing.md,
    },
});
