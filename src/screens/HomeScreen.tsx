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

    const todayWorkouts = health.workouts.filter(w => w.date === todayStr);
    const todayWater = health.waterLogs.find(w => w.date === todayStr)?.glasses || 0;

    const todayMeditations = mindfulness.meditations.filter(m => m.date === todayStr);
    const todayMeditationMins = todayMeditations.reduce((sum, m) => sum + m.duration, 0);

    const completedChallenges = dailyChallenges.filter(c => c.completed).length;

    // Calculate actual progress for financial (0 if no budget set)
    const financialProgress = financial.monthlyBudget > 0 
        ? Math.max(0, 1 - (todaySpent / financial.monthlyBudget))
        : 0;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
                        dailyChallenges.slice(0, 3).map(challenge => (
                            <View key={challenge.id} style={[styles.challengeItem, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}>
                                <View style={[styles.challengeCheck, { borderColor: colors.border }, challenge.completed && { backgroundColor: colors.success, borderColor: colors.success }]}>
                                    {challenge.completed && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                                <View style={styles.challengeInfo}>
                                    <Text style={[styles.challengeTitle, { color: colors.textPrimary }, challenge.completed && { color: colors.textMuted }]}>
                                        {challenge.title}
                                    </Text>
                                    <Text style={[styles.challengeDesc, { color: colors.textMuted }]}>{challenge.description}</Text>
                                </View>
                                <Text style={[styles.challengeXP, { color: colors.xp }]}>+{challenge.xpReward} XP</Text>
                            </View>
                        ))
                    ) : (
                        <Card style={styles.emptyCard}>
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No challenges yet. Start using the app to unlock daily challenges.</Text>
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
                        subtitle={`${financial.expenses.length} transactions logged`}
                        iconName="wallet-outline"
                        color={colors.financial}
                        progress={financialProgress}
                        onPress={() => navigation.navigate('Financial')}
                    />

                    <SectionCard
                        title="Physical Wellness"
                        subtitle={`${health.workouts.length} workouts completed`}
                        iconName="fitness-outline"
                        color={colors.health}
                        progress={todayWater / health.dailyWaterGoal}
                        onPress={() => navigation.navigate('Health')}
                    />

                    <SectionCard
                        title="Mental Clarity"
                        subtitle={`${mindfulness.meditations.length} meditation sessions`}
                        iconName="leaf-outline"
                        color={colors.mindfulness}
                        progress={todayMeditationMins / mindfulness.meditationGoal}
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
    challengeXP: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
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
