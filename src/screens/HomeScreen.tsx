import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, FontSize, FontWeight, Currency } from '../constants/theme';
import { useApp, calculateLevel } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { XPBar, StreakBadge, Card, SectionCard } from '../components';
import { RootTabParamList } from '../types';
import { format } from 'date-fns';

type NavigationProp = BottomTabNavigationProp<RootTabParamList>;

export function HomeScreen() {
    const { state } = useApp();
    const { colors, styleConfig, isDark } = useTheme();
    const navigation = useNavigation<NavigationProp>();
    const { user, financial, health, mindfulness, dailyChallenges } = state;

    const levelInfo = calculateLevel(user?.totalXP || 0);
    const today = format(new Date(), 'EEEE, MMMM d');

    // Calculate today's stats
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayExpenses = financial.expenses.filter(e => e.date === todayStr);
    const todaySpent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Calculate this month's stats for budget tracking
    const currentMonth = format(new Date(), 'yyyy-MM');
    const monthExpenses = financial.expenses.filter(e => e.date.startsWith(currentMonth));
    const monthSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const todayWorkouts = health.workouts.filter(w => w.date === todayStr);
    const todayWorkoutMins = todayWorkouts.reduce((sum, w) => sum + w.duration, 0);
    const todayWater = health.waterLogs.find(w => w.date === todayStr)?.glasses || 0;

    const todayMeditations = mindfulness.meditations.filter(m => m.date === todayStr);
    const todayMeditationMins = todayMeditations.reduce((sum, m) => sum + m.duration, 0);

    const completedChallenges = dailyChallenges.filter(c => c.completed).length;

    // Calculate progress: shows how much spent of budget (0% = nothing spent, 100% = budget fully used)
    const financialProgress = financial.monthlyBudget > 0 
        ? Math.min(1, monthSpent / financial.monthlyBudget)
        : -1; // -1 indicates no budget set
    
    // Water progress
    const waterProgress = health.dailyWaterGoal > 0
        ? Math.min(1, todayWater / health.dailyWaterGoal)
        : -1;
    
    // Meditation progress
    const meditationProgress = mindfulness.meditationGoal > 0
        ? Math.min(1, todayMeditationMins / mindfulness.meditationGoal)
        : -1;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome back,</Text>
                        <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.name || 'User'}</Text>
                        <Text style={[styles.date, { color: colors.textMuted }]}>{today}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <StreakBadge count={user?.streaks.overall || 0} size="md" />
                    </View>
                </View>

                {/* XP Progress */}
                <View style={styles.section}>
                    <XPBar />
                </View>

                {/* Quick Stats */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today's Progress</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.financial, borderRadius: styleConfig.borderRadius.md }]}>
                                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{Currency.format(todaySpent)}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Spent</Text>
                            </View>
                        </View>
                        <View style={styles.statItem}>
                            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.health, borderRadius: styleConfig.borderRadius.md }]}>
                                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{todayWorkouts.length}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Workouts</Text>
                            </View>
                        </View>
                        <View style={styles.statItem}>
                            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.mindfulness, borderRadius: styleConfig.borderRadius.md }]}>
                                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{todayMeditationMins}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Mindful mins</Text>
                            </View>
                        </View>
                        <View style={styles.statItem}>
                            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.info, borderRadius: styleConfig.borderRadius.md }]}>
                                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{todayWater}/{health.dailyWaterGoal}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Water</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Daily Challenges */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Daily Challenges</Text>
                        <Text style={[styles.sectionBadge, { color: colors.textSecondary }]}>{completedChallenges}/{dailyChallenges.length}</Text>
                    </View>
                    {dailyChallenges.length > 0 ? (
                        dailyChallenges.slice(0, 3).map(challenge => {
                            const categoryColors: Record<string, string> = {
                                financial: colors.financial,
                                health: colors.health,
                                mindfulness: colors.mindfulness,
                            };
                            const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
                                financial: 'wallet-outline',
                                health: 'fitness-outline',
                                mindfulness: 'leaf-outline',
                            };
                            const categoryColor = categoryColors[challenge.category] || colors.primary;
                            const categoryIcon = categoryIcons[challenge.category] || 'star-outline';
                            
                            return (
                                <View 
                                    key={challenge.id} 
                                    style={[
                                        styles.challengeItem, 
                                        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md },
                                        challenge.completed && { opacity: 0.7 }
                                    ]}
                                >
                                    <View style={[
                                        styles.challengeCheck, 
                                        { backgroundColor: categoryColor + '20', borderColor: categoryColor },
                                        challenge.completed && { backgroundColor: colors.success, borderColor: colors.success }
                                    ]}>
                                        {challenge.completed ? (
                                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                        ) : (
                                            <Ionicons name={categoryIcon} size={16} color={categoryColor} />
                                        )}
                                    </View>
                                    <View style={styles.challengeInfo}>
                                        <Text style={[
                                            styles.challengeTitle, 
                                            { color: colors.textPrimary }, 
                                            challenge.completed && { color: colors.textMuted, textDecorationLine: 'line-through' }
                                        ]}>
                                            {challenge.title}
                                        </Text>
                                        <Text style={[styles.challengeDesc, { color: colors.textMuted }]}>{challenge.description}</Text>
                                    </View>
                                    <View style={[styles.challengeXPBadge, { backgroundColor: challenge.completed ? colors.success + '20' : colors.xp + '20' }]}>
                                        <Text style={[styles.challengeXP, { color: challenge.completed ? colors.success : colors.xp }]}>
                                            {challenge.completed ? '✓' : '+'}{challenge.xpReward}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <Card style={styles.emptyCard}>
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Loading daily challenges...</Text>
                        </Card>
                    )}
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.quickAction}
                            onPress={() => navigation.navigate('Financial')}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: colors.financial, borderRadius: styleConfig.borderRadius.md }]}>
                                <Ionicons name="card-outline" size={22} color="#FFFFFF" />
                            </View>
                            <Text style={[styles.quickActionLabel, { color: colors.textSecondary }]}>Expense</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickAction}
                            onPress={() => navigation.navigate('Health')}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: colors.health, borderRadius: styleConfig.borderRadius.md }]}>
                                <Ionicons name="barbell-outline" size={22} color="#FFFFFF" />
                            </View>
                            <Text style={[styles.quickActionLabel, { color: colors.textSecondary }]}>Workout</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickAction}
                            onPress={() => navigation.navigate('Mindfulness')}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: colors.mindfulness, borderRadius: styleConfig.borderRadius.md }]}>
                                <Ionicons name="flower-outline" size={22} color="#FFFFFF" />
                            </View>
                            <Text style={[styles.quickActionLabel, { color: colors.textSecondary }]}>Meditate</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.quickAction}
                            onPress={() => navigation.navigate('Health')}
                        >
                            <View style={[styles.quickActionIcon, { backgroundColor: colors.info, borderRadius: styleConfig.borderRadius.md }]}>
                                <Ionicons name="water-outline" size={22} color="#FFFFFF" />
                            </View>
                            <Text style={[styles.quickActionLabel, { color: colors.textSecondary }]}>Water</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Section Cards */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Journey</Text>

                    <SectionCard
                        title="Financial Health"
                        subtitle={financial.monthlyBudget > 0 
                            ? `${Currency.format(monthSpent)} of ${Currency.format(financial.monthlyBudget)} spent`
                            : 'Set budget in Settings'}
                        iconName="wallet-outline"
                        color={colors.financial}
                        progress={financialProgress}
                        disabled={financialProgress < 0}
                        onPress={() => navigation.navigate('Financial')}
                    />

                    <SectionCard
                        title="Water Intake"
                        subtitle={health.dailyWaterGoal > 0
                            ? `${todayWater} of ${health.dailyWaterGoal} glasses today`
                            : 'Set water goal in Settings'}
                        iconName="water-outline"
                        color={colors.info}
                        progress={waterProgress}
                        disabled={waterProgress < 0}
                        onPress={() => navigation.navigate('Health')}
                    />

                    <SectionCard
                        title="Workouts"
                        subtitle={todayWorkouts.length > 0
                            ? `${todayWorkoutMins} mins today (${todayWorkouts.length} session${todayWorkouts.length > 1 ? 's' : ''})`
                            : `${health.workouts.length} total workouts logged`}
                        iconName="fitness-outline"
                        color={colors.health}
                        progress={todayWorkouts.length > 0 ? 1 : 0}
                        onPress={() => navigation.navigate('Health')}
                    />

                    <SectionCard
                        title="Mental Clarity"
                        subtitle={mindfulness.meditationGoal > 0
                            ? `${todayMeditationMins} of ${mindfulness.meditationGoal} mins today`
                            : 'Set meditation goal in Settings'}
                        iconName="leaf-outline"
                        color={colors.mindfulness}
                        progress={meditationProgress}
                        disabled={meditationProgress < 0}
                        onPress={() => navigation.navigate('Mindfulness')}
                    />
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    headerLeft: {
        flex: 1,
    },
    greeting: {
        fontSize: FontSize.sm,
    },
    userName: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        marginTop: 2,
    },
    date: {
        fontSize: FontSize.xs,
        marginTop: Spacing.xs,
    },
    headerRight: {
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.md,
    },
    section: {
        marginTop: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        marginBottom: Spacing.md,
    },
    sectionBadge: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: 999,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -Spacing.xs,
    },
    statItem: {
        width: '50%',
        padding: Spacing.xs,
    },
    statCard: {
        padding: Spacing.md,
        borderLeftWidth: 3,
        borderWidth: 1,
    },
    statValue: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    statLabel: {
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    challengeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
    },
    challengeCheck: {
        width: 20,
        height: 20,
        borderRadius: 999,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmark: {
        color: '#FFF',
        fontWeight: FontWeight.bold,
        fontSize: 12,
    },
    challengeInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    challengeTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    challengeDesc: {
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    challengeXPBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: 12,
    },
    challengeXP: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
    },
    emptyCard: {
        alignItems: 'center',
        padding: Spacing.lg,
    },
    emptyText: {
        fontSize: FontSize.sm,
        textAlign: 'center',
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quickAction: {
        alignItems: 'center',
    },
    quickActionIcon: {
        width: 52,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActionIconText: {
        fontSize: 22,
        fontWeight: FontWeight.bold,
        color: '#FFF',
    },
    quickActionLabel: {
        fontSize: FontSize.xs,
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
    bottomPadding: {
        height: 100,
    },
});
