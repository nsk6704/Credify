import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing, FontSize, FontWeight, BorderRadius } from '../constants/theme';
import { WORKOUT_TYPES, XP_CONFIG } from '../constants/gamification';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Button, Card } from '../components';
import { Workout, WaterLog } from '../types';
import { format } from 'date-fns';
import * as Database from '../lib/database';

export function HealthScreen() {
    const { state, dispatch, addXP } = useApp();
    const { colors, styleConfig } = useTheme();
    const { health } = state;
    const isDark = state.settings.theme === 'dark';
    const [showWorkoutModal, setShowWorkoutModal] = useState(false);
    const [workoutDuration, setWorkoutDuration] = useState('30');
    const [workoutNotes, setWorkoutNotes] = useState('');
    const [selectedWorkout, setSelectedWorkout] = useState(WORKOUT_TYPES[0]);

    const today = format(new Date(), 'yyyy-MM-dd');
    const todayWater = health.waterLogs.find(w => w.date === today)?.glasses || 0;
    const todayWorkouts = health.workouts.filter(w => w.date === today);
    const totalWorkoutMins = todayWorkouts.reduce((sum, w) => sum + w.duration, 0);

    const waterProgress = todayWater / health.dailyWaterGoal;
    const remainingWater = Math.max(0, health.dailyWaterGoal - todayWater);

    const handleAddWater = async () => {
        const waterLog: WaterLog = {
            id: Date.now().toString(),
            glasses: 1,
            date: today,
        };
        
        // Add to database first
        await Database.logWater(waterLog);
        
        // Then update state
        dispatch({ type: 'LOG_WATER', payload: waterLog });
        addXP(XP_CONFIG.rewards.logWater);
    };

    const handleAddWorkout = async () => {
        if (!workoutDuration || parseInt(workoutDuration) <= 0) return;

        const workout: Workout = {
            id: Date.now().toString(),
            type: selectedWorkout.id,
            duration: parseInt(workoutDuration),
            notes: workoutNotes,
            date: today,
            createdAt: new Date().toISOString(),
        };

        // Add to database first
        await Database.addWorkout(workout);
        
        // Then update state
        dispatch({ type: 'ADD_WORKOUT', payload: workout });
        addXP(XP_CONFIG.rewards.completeWorkout);

        setWorkoutDuration('30');
        setWorkoutNotes('');
        setShowWorkoutModal(false);
    };

    const recentWorkouts = health.workouts.slice(0, 5);

    // Water glasses visualization
    const waterGlasses = Array.from({ length: health.dailyWaterGoal }, (_, i) => i < todayWater);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>Health</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Stay active, stay healthy</Text>
                </View>

                {/* Today's Stats */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.health + '30', borderRadius: styleConfig.borderRadius.md }]}>
                        <Text style={[styles.statValue, { color: colors.health }]}>{todayWorkouts.length}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Workouts</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.info + '30', borderRadius: styleConfig.borderRadius.md }]}>
                        <Text style={[styles.statValue, { color: colors.info }]}>{totalWorkoutMins}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Minutes</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.mindfulness + '30', borderRadius: styleConfig.borderRadius.md }]}>
                        <Text style={[styles.statValue, { color: colors.mindfulness }]}>{todayWater}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Glasses</Text>
                    </View>
                </View>

                {/* Water Tracker */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Hydration</Text>
                        <Text style={[styles.sectionBadge, { color: colors.info }]}>
                            {todayWater}/{health.dailyWaterGoal} glasses
                        </Text>
                    </View>

                    <Card style={styles.waterCard}>
                        <View style={styles.waterGlasses}>
                            {waterGlasses.map((filled, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.waterGlass,
                                        { backgroundColor: colors.surfaceLight, borderRadius: styleConfig.borderRadius.md },
                                        filled && { backgroundColor: colors.info + '30' },
                                    ]}
                                >
                                    <Text style={[styles.waterGlassIcon, { color: filled ? colors.info : colors.textMuted }]}>{filled ? '●' : '○'}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.waterProgress}>
                            <View style={[styles.waterProgressBg, { backgroundColor: colors.surfaceLighter }]}>
                                <View
                                    style={[styles.waterProgressFill, { width: `${waterProgress * 100}%`, backgroundColor: colors.info }]}
                                />
                            </View>
                            <Text style={[styles.waterProgressText, { color: colors.textSecondary }]}>
                                {remainingWater > 0 ? `${remainingWater} more to go!` : 'Goal reached!'}
                            </Text>
                        </View>

                        <Button
                            title="Add Glass (+5 XP)"
                            onPress={handleAddWater}
                            color={colors.info}
                            disabled={todayWater >= health.dailyWaterGoal}
                        />
                    </Card>
                </View>

                {/* Log Workout */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Workouts</Text>
                    <Button
                        title="Log Workout"
                        onPress={() => setShowWorkoutModal(true)}
                        color={colors.health}
                    />
                </View>

                {/* Recent Workouts */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
                    {recentWorkouts.length > 0 ? (
                        recentWorkouts.map(workout => {
                            const type = WORKOUT_TYPES.find(t => t.id === workout.type);
                            return (
                                <View key={workout.id} style={[styles.workoutItem, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}>
                                    <View style={[styles.workoutIcon, { backgroundColor: (type?.color || colors.health) + '20' }]}>
                                        <Text style={styles.workoutEmoji}>{type?.icon || '💪'}</Text>
                                    </View>
                                    <View style={styles.workoutInfo}>
                                        <Text style={[styles.workoutName, { color: colors.textPrimary }]}>{type?.name || 'Workout'}</Text>
                                        <Text style={[styles.workoutMeta, { color: colors.textSecondary }]}>
                                            {workout.duration} min • {format(new Date(workout.date), 'MMM d')}
                                        </Text>
                                    </View>
                                    <View style={[styles.workoutBadge, { backgroundColor: colors.xp + '20' }]}>
                                        <Text style={[styles.workoutXP, { color: colors.xp }]}>+{XP_CONFIG.rewards.completeWorkout} XP</Text>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <Card style={styles.emptyCard}>
                            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No workouts logged yet</Text>
                            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Start your fitness journey today!</Text>
                        </Card>
                    )}
                </View>

                {/* Workout Stats */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Stats</Text>
                    <View style={styles.statsGrid}>
                        <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}>
                            <Text style={[styles.statBoxValue, { color: colors.primary }]}>{health.workouts.length}</Text>
                            <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>Total Workouts</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}>
                            <Text style={[styles.statBoxValue, { color: colors.primary }]}>
                                {health.workouts.reduce((sum, w) => sum + w.duration, 0)}
                            </Text>
                            <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>Total Minutes</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}>
                            <Text style={[styles.statBoxValue, { color: colors.primary }]}>{state.user?.streaks.health || 0}</Text>
                            <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>Day Streak</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>
            </KeyboardAvoidingView>

            {/* Workout Modal */}
            <Modal
                visible={showWorkoutModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowWorkoutModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: styleConfig.borderRadius.md }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Log Workout</Text>
                            <TouchableOpacity onPress={() => setShowWorkoutModal(false)}>
                                <Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Workout Type */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Workout Type</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.workoutTypes}>
                                    {WORKOUT_TYPES.map(type => (
                                        <TouchableOpacity
                                            key={type.id}
                                            style={[
                                                styles.workoutTypeOption,
                                                { backgroundColor: colors.surfaceLight, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md },
                                                selectedWorkout.id === type.id && { borderColor: type.color, backgroundColor: type.color + '20' },
                                            ]}
                                            onPress={() => setSelectedWorkout(type)}
                                        >
                                            <Text style={styles.workoutTypeIcon}>{type.icon}</Text>
                                            <Text style={[styles.workoutTypeName, { color: colors.textPrimary }]}>{type.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        {/* Duration */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Duration (minutes)</Text>
                            <View style={[styles.durationInput, { backgroundColor: colors.surfaceLight, borderRadius: styleConfig.borderRadius.md }]}>
                                <TouchableOpacity
                                    style={[styles.durationBtn, { backgroundColor: colors.surfaceLighter }]}
                                    onPress={() => setWorkoutDuration(String(Math.max(5, parseInt(workoutDuration) - 5)))}
                                >
                                    <Text style={[styles.durationBtnText, { color: colors.textPrimary }]}>-</Text>
                                </TouchableOpacity>
                                <TextInput
                                    style={[styles.durationField, { color: colors.textPrimary }]}
                                    value={workoutDuration}
                                    onChangeText={setWorkoutDuration}
                                    keyboardType="number-pad"
                                />
                                <TouchableOpacity
                                    style={[styles.durationBtn, { backgroundColor: colors.surfaceLighter }]}
                                    onPress={() => setWorkoutDuration(String(parseInt(workoutDuration) + 5))}
                                >
                                    <Text style={[styles.durationBtnText, { color: colors.textPrimary }]}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Notes */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Notes (optional)</Text>
                            <TextInput
                                style={[styles.textInput, { backgroundColor: colors.surfaceLight, borderColor: colors.border, color: colors.textPrimary, borderRadius: styleConfig.borderRadius.md }]}
                                value={workoutNotes}
                                onChangeText={setWorkoutNotes}
                                placeholder="How was your workout?"
                                placeholderTextColor={colors.textMuted}
                                multiline
                            />
                        </View>

                        <Button
                            title="Complete Workout (+15 XP)"
                            onPress={handleAddWorkout}
                            color={colors.health}
                            disabled={!workoutDuration || parseInt(workoutDuration) <= 0}
                            style={styles.submitButton}
                        />
                    </View>
                </View>
            </Modal>
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
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
    },
    subtitle: {
        fontSize: FontSize.md,
        marginTop: Spacing.xs,
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: Spacing.md,
    },
    statCard: {
        flex: 1,
        padding: Spacing.md,
        alignItems: 'center',
        marginHorizontal: Spacing.xs,
        borderWidth: 1,
    },
    statValue: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
    },
    statLabel: {
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    section: {
        marginTop: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        marginBottom: Spacing.md,
    },
    sectionBadge: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    waterCard: {
        padding: Spacing.lg,
    },
    waterGlasses: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    waterGlass: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        margin: Spacing.xs,
    },
    waterGlassFilled: {},
    waterGlassIcon: {
        fontSize: 20,
    },
    waterProgress: {
        marginBottom: Spacing.lg,
    },
    waterProgressBg: {
        height: 12,
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
        marginBottom: Spacing.sm,
    },
    waterProgressFill: {
        height: '100%',
        borderRadius: BorderRadius.full,
    },
    waterProgressText: {
        fontSize: FontSize.sm,
        textAlign: 'center',
    },
    workoutItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
    },
    workoutIcon: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    workoutEmoji: {
        fontSize: 24,
    },
    workoutInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    workoutName: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    workoutMeta: {
        fontSize: FontSize.sm,
        marginTop: 2,
    },
    workoutBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
    },
    workoutXP: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
    emptyCard: {
        alignItems: 'center',
        padding: Spacing.xl,
    },
    emptyText: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.medium,
    },
    emptySubtext: {
        fontSize: FontSize.sm,
        marginTop: Spacing.xs,
    },
    statsGrid: {
        flexDirection: 'row',
    },
    statBox: {
        flex: 1,
        padding: Spacing.md,
        marginHorizontal: Spacing.xs,
        alignItems: 'center',
        borderWidth: 1,
    },
    statBoxValue: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
    },
    statBoxLabel: {
        fontSize: FontSize.xs,
        marginTop: Spacing.xs,
        textAlign: 'center',
    },
    bottomPadding: {
        height: 100,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        padding: Spacing.lg,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    modalTitle: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
    },
    modalClose: {
        fontSize: FontSize.xl,
        padding: Spacing.sm,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    inputLabel: {
        fontSize: FontSize.sm,
        marginBottom: Spacing.sm,
    },
    workoutTypes: {
        flexDirection: 'row',
        paddingVertical: Spacing.xs,
    },
    workoutTypeOption: {
        alignItems: 'center',
        padding: Spacing.md,
        borderWidth: 1,
        marginRight: Spacing.sm,
        minWidth: 80,
    },
    workoutTypeIcon: {
        fontSize: 28,
        marginBottom: Spacing.xs,
    },
    workoutTypeName: {
        fontSize: FontSize.xs,
    },
    durationInput: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    durationBtn: {
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    durationBtnText: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
    },
    durationField: {
        flex: 1,
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        textAlign: 'center',
    },
    textInput: {
        padding: Spacing.md,
        fontSize: FontSize.md,
        minHeight: 80,
        textAlignVertical: 'top',
        borderWidth: 1,
    },
    submitButton: {
        marginTop: Spacing.md,
    },
});
