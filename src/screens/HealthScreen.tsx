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
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Path, Circle } from 'react-native-svg';
import { Spacing, FontSize, FontWeight, BorderRadius } from '../constants/theme';
import { WORKOUT_TYPES, XP_CONFIG } from '../constants/gamification';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Button, Card } from '../components';
import { Workout, WaterLog, WeightLog } from '../types';
import { format, parseISO } from 'date-fns';
import * as Database from '../lib/database';

export function HealthScreen() {
    const { state, dispatch, addXP } = useApp();
    const { colors, styleConfig } = useTheme();
    const { health } = state;
    const isDark = state.settings.theme === 'dark';
    const chartLimit = 14;
    const recentWeightLimit = 5;
    const weightUnit = state.settings.weightUnit;
    const minWeightKg = 20;
    const maxWeightKg = 300;
    const [showWorkoutModal, setShowWorkoutModal] = useState(false);
    const [workoutDuration, setWorkoutDuration] = useState('30');
    const [workoutNotes, setWorkoutNotes] = useState('');
    const [selectedWorkout, setSelectedWorkout] = useState(WORKOUT_TYPES[0]);
    const [weightInput, setWeightInput] = useState('');
    const [weightDate, setWeightDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [chartWidth, setChartWidth] = useState(0);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editLog, setEditLog] = useState<WeightLog | null>(null);
    const [editWeightInput, setEditWeightInput] = useState('');
    const [editWeightDate, setEditWeightDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [showEditDatePicker, setShowEditDatePicker] = useState(false);

    const today = format(new Date(), 'yyyy-MM-dd');
    const todayWater = health.waterLogs.find(w => w.date === today)?.glasses || 0;
    const todayWorkouts = health.workouts.filter(w => w.date === today);
    const totalWorkoutMins = todayWorkouts.reduce((sum, w) => sum + w.duration, 0);

    const waterProgress = todayWater / health.dailyWaterGoal;
    const remainingWater = Math.max(0, health.dailyWaterGoal - todayWater);

    const normalizeWeightInput = (value: string) => {
        const cleaned = value.replace(/[^0-9.]/g, '');
        const parts = cleaned.split('.');
        if (parts.length <= 1) return cleaned;
        return `${parts[0]}.${parts.slice(1).join('')}`;
    };

    const toDisplayWeight = (weightKg: number) =>
        weightUnit === 'kg' ? weightKg : weightKg * 2.20462;

    const toStorageWeight = (value: number) =>
        weightUnit === 'kg' ? value : value / 2.20462;

    const formatWeight = (value: number) => (Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1));

    const parsedWeight = Number.parseFloat(weightInput);
    const parsedDate = parseISO(weightDate);
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(weightDate) && !Number.isNaN(parsedDate.getTime());
    const isValidWeight = Number.isFinite(parsedWeight) && parsedWeight > 0;
    const weightKg = isValidWeight ? toStorageWeight(parsedWeight) : NaN;
    const isWeightInRange = Number.isFinite(weightKg) && weightKg >= minWeightKg && weightKg <= maxWeightKg;
    const canSubmitWeight = isValidDate && isValidWeight && isWeightInRange;
    const weightRangeHint = weightUnit === 'kg'
        ? `${minWeightKg}-${maxWeightKg} kg`
        : `${formatWeight(toDisplayWeight(minWeightKg))}-${formatWeight(toDisplayWeight(maxWeightKg))} lb`;
    const weightError = !weightInput
        ? ''
        : !isValidWeight
            ? 'Enter a valid weight'
            : !isWeightInRange
                ? `Keep it within ${weightRangeHint}`
                : '';

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

    const addWeightLog = async (weight: number, date: string) => {
        const weightLog: WeightLog = {
            id: Date.now().toString(),
            weight,
            date,
            createdAt: new Date().toISOString(),
        };

        await Database.addWeightLog(weightLog);
        dispatch({ type: 'ADD_WEIGHT_LOG', payload: weightLog });
    };

    const handleAddWeight = async () => {
        if (!canSubmitWeight) return;

        const existingForDate = health.weightLogs.find(log => log.date === weightDate);
        if (existingForDate) {
            Alert.alert(
                'Replace existing entry?',
                'A weight entry already exists for this date. Replace it with the new value?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Replace',
                        style: 'destructive',
                        onPress: async () => {
                            await Database.deleteWeightLogsByDate(weightDate);
                            dispatch({ type: 'DELETE_WEIGHT_LOGS_BY_DATE', payload: weightDate });
                            await addWeightLog(weightKg, weightDate);
                            setWeightInput('');
                        },
                    },
                ]
            );
            return;
        }

        await addWeightLog(weightKg, weightDate);
        setWeightInput('');
    };

    const handleDateChange = (_event: unknown, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setWeightDate(format(selectedDate, 'yyyy-MM-dd'));
        }
    };

    const handleEditDateChange = (_event: unknown, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowEditDatePicker(false);
        }
        if (selectedDate) {
            setEditWeightDate(format(selectedDate, 'yyyy-MM-dd'));
        }
    };

    const openEditModal = (log: WeightLog) => {
        setEditLog(log);
        setEditWeightInput(formatWeight(toDisplayWeight(log.weight)));
        setEditWeightDate(log.date);
        setShowEditModal(true);
    };

    const handleDeleteWeight = (log: WeightLog) => {
        Alert.alert(
            'Delete entry?',
            'This will remove the selected weight entry.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await Database.deleteWeightLog(log.id);
                        dispatch({ type: 'DELETE_WEIGHT_LOG', payload: log.id });
                    },
                },
            ]
        );
    };

    const handleEditWeightSave = async () => {
        if (!editLog) return;
        const editValue = Number.parseFloat(editWeightInput);
        const isValidEditValue = Number.isFinite(editValue) && editValue > 0;
        if (!isValidEditValue) return;
        const editWeightKg = toStorageWeight(editValue);
        if (editWeightKg < minWeightKg || editWeightKg > maxWeightKg) return;

        const updatedLog: WeightLog = {
            ...editLog,
            weight: editWeightKg,
            date: editWeightDate,
            createdAt: editLog.createdAt || new Date().toISOString(),
        };

        const hasDateConflict = health.weightLogs.some(log => log.date === editWeightDate && log.id !== editLog.id);
        if (hasDateConflict) {
            Alert.alert(
                'Replace existing entry?',
                'Another entry exists for this date. Replace it?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Replace',
                        style: 'destructive',
                        onPress: async () => {
                            await Database.deleteWeightLogsByDate(editWeightDate);
                            dispatch({ type: 'DELETE_WEIGHT_LOGS_BY_DATE', payload: editWeightDate });
                            await Database.deleteWeightLog(editLog.id);
                            dispatch({ type: 'DELETE_WEIGHT_LOG', payload: editLog.id });
                            await Database.addWeightLog(updatedLog);
                            dispatch({ type: 'ADD_WEIGHT_LOG', payload: updatedLog });
                            setShowEditModal(false);
                        },
                    },
                ]
            );
            return;
        }

        await Database.updateWeightLog(updatedLog);
        dispatch({ type: 'UPDATE_WEIGHT_LOG', payload: updatedLog });
        setShowEditModal(false);
    };

    const recentWorkouts = health.workouts.slice(0, 5);
    const sortedWeightLogs = [...health.weightLogs].sort((a, b) => {
        if (a.date === b.date) return a.createdAt.localeCompare(b.createdAt);
        return a.date.localeCompare(b.date);
    });
    const recentWeights = sortedWeightLogs.slice(-recentWeightLimit).reverse();
    const chartLogs = sortedWeightLogs.slice(-chartLimit);
    const displayChartValues = chartLogs.map(log => toDisplayWeight(log.weight));
    const minWeight = displayChartValues.reduce((min, value) => Math.min(min, value), Infinity);
    const maxWeight = displayChartValues.reduce((max, value) => Math.max(max, value), -Infinity);
    const weightRange = maxWeight - minWeight || 1;
    const chartHeight = 140;
    const chartPadding = 12;
    const plotWidth = Math.max(0, chartWidth - chartPadding * 2);
    const plotHeight = Math.max(0, chartHeight - chartPadding * 2);
    const chartPoints = chartLogs.map((log, index) => {
        const displayWeight = toDisplayWeight(log.weight);
        const x = chartLogs.length > 1
            ? chartPadding + (index / (chartLogs.length - 1)) * plotWidth
            : chartPadding + plotWidth / 2;
        const y = chartPadding + (1 - (displayWeight - minWeight) / weightRange) * plotHeight;
        return { x, y, weight: displayWeight };
    });
    const chartPath = chartPoints.length > 0
        ? chartPoints.reduce((path, point, index) => (
            index === 0 ? `M ${point.x} ${point.y}` : `${path} L ${point.x} ${point.y}`
        ), '')
        : '';
    const latestWeight = sortedWeightLogs.length > 0 ? sortedWeightLogs[sortedWeightLogs.length - 1] : null;
    const earliestWeight = sortedWeightLogs.length > 0 ? sortedWeightLogs[0] : null;
    const displayLatest = latestWeight ? toDisplayWeight(latestWeight.weight) : null;
    const displayGoal = health.weightGoal ? toDisplayWeight(health.weightGoal) : null;

    const getLogsWithinDays = (days: number) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days + 1);
        cutoff.setHours(0, 0, 0, 0);
        return sortedWeightLogs.filter(log => parseISO(log.date) >= cutoff);
    };

    const recent7 = getLogsWithinDays(7);
    const recent30 = getLogsWithinDays(30);
    const averageWeight = (logs: WeightLog[]) => {
        if (logs.length === 0) return null;
        const total = logs.reduce((sum, log) => sum + toDisplayWeight(log.weight), 0);
        return total / logs.length;
    };
    const avg7 = averageWeight(recent7);
    const avg30 = averageWeight(recent30);

    const delta7 = (() => {
        if (recent7.length < 2) return null;
        const first = recent7[0];
        const last = recent7[recent7.length - 1];
        return toDisplayWeight(last.weight) - toDisplayWeight(first.weight);
    })();

    const goalProgress = (() => {
        if (!health.weightGoal || !latestWeight || !earliestWeight) return null;
        const start = earliestWeight.weight;
        const current = latestWeight.weight;
        const goal = health.weightGoal;
        if (start === goal) return 1;
        const totalDelta = goal - start;
        const currentDelta = current - start;
        const progress = totalDelta !== 0 ? currentDelta / totalDelta : 0;
        return Math.min(1, Math.max(0, progress));
    })();

    const goalDelta = displayGoal !== null && displayLatest !== null
        ? displayLatest - displayGoal
        : null;

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

                {/* Weight Tracker */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Weight Tracker</Text>
                        <Text style={[styles.sectionBadge, { color: colors.health }]}>{weightUnit}</Text>
                    </View>

                    <Card style={styles.weightCard}>
                        <View style={styles.weightInputs}>
                            <View style={[styles.weightField, styles.weightFieldSpacing]}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Weight ({weightUnit})</Text>
                                <TextInput
                                    style={[styles.weightInput, { backgroundColor: colors.surfaceLight, borderColor: colors.border, color: colors.textPrimary, borderRadius: styleConfig.borderRadius.md }]}
                                    value={weightInput}
                                    onChangeText={(value) => setWeightInput(normalizeWeightInput(value))}
                                    placeholder={weightUnit === 'kg' ? 'e.g. 72.5' : 'e.g. 160'}
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="decimal-pad"
                                    maxLength={7}
                                />
                            </View>
                            <View style={styles.weightField}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Date</Text>
                                <TouchableOpacity
                                    style={[styles.dateField, { backgroundColor: colors.surfaceLight, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}
                                    onPress={() => setShowDatePicker(true)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.dateValue, { color: colors.textPrimary }]}>{weightDate}</Text>
                                    <Text style={[styles.dateHint, { color: colors.textMuted }]}>Pick</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        {showDatePicker && (
                            <DateTimePicker
                                value={parseISO(weightDate)}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleDateChange}
                            />
                        )}
                        {weightError ? (
                            <Text style={[styles.weightError, { color: colors.error }]}>{weightError}</Text>
                        ) : (
                            <Text style={[styles.weightHelper, { color: colors.textSecondary }]}>Range: {weightRangeHint}</Text>
                        )}
                        <Button
                            title="Log Weight"
                            onPress={handleAddWeight}
                            color={colors.health}
                            disabled={!canSubmitWeight}
                        />
                    </Card>

                    <Card style={styles.weightChartCard}>
                        <View style={styles.chartHeader}>
                            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Progress</Text>
                            {chartLogs.length > 0 && (
                                <Text
                                    style={[styles.chartRange, { color: colors.textSecondary }]}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {formatWeight(minWeight)} - {formatWeight(maxWeight)} {weightUnit}
                                </Text>
                            )}
                        </View>
                        {health.weightGoal > 0 && displayLatest !== null && (
                            <View style={[styles.goalRow, { backgroundColor: colors.surfaceLight, borderRadius: styleConfig.borderRadius.md }]}>
                                <View style={styles.goalInfo}>
                                    <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>Goal</Text>
                                    <Text style={[styles.goalValue, { color: colors.textPrimary }]}>
                                        {formatWeight(displayGoal || 0)} {weightUnit}
                                    </Text>
                                </View>
                                {goalDelta !== null && (
                                    <View style={styles.goalDelta}>
                                        <Text style={[styles.goalDeltaValue, { color: goalDelta <= 0 ? colors.success : colors.warning }]}>
                                            {goalDelta > 0 ? '+' : ''}{formatWeight(goalDelta)} {weightUnit}
                                        </Text>
                                        <Text style={[styles.goalDeltaLabel, { color: colors.textSecondary }]}>to goal</Text>
                                    </View>
                                )}
                                {goalProgress !== null && (
                                    <View style={styles.goalProgress}>
                                        <View style={[styles.goalProgressTrack, { backgroundColor: colors.surfaceLighter }]}>
                                            <View style={[styles.goalProgressFill, { width: `${goalProgress * 100}%`, backgroundColor: colors.health }]} />
                                        </View>
                                        <Text style={[styles.goalProgressText, { color: colors.textSecondary }]}>Progress {Math.round(goalProgress * 100)}%</Text>
                                    </View>
                                )}
                            </View>
                        )}
                        <View style={styles.weightStatsRow}>
                            <View style={[styles.weightStatCard, { backgroundColor: colors.surfaceLight, borderRadius: styleConfig.borderRadius.md }]}>
                                <Text style={[styles.weightStatLabel, { color: colors.textSecondary }]}>7d avg</Text>
                                <Text style={[styles.weightStatValue, { color: colors.textPrimary }]}>
                                    {avg7 !== null ? `${formatWeight(avg7)} ${weightUnit}` : '--'}
                                </Text>
                            </View>
                            <View style={[styles.weightStatCard, { backgroundColor: colors.surfaceLight, borderRadius: styleConfig.borderRadius.md }]}>
                                <Text style={[styles.weightStatLabel, { color: colors.textSecondary }]}>30d avg</Text>
                                <Text style={[styles.weightStatValue, { color: colors.textPrimary }]}>
                                    {avg30 !== null ? `${formatWeight(avg30)} ${weightUnit}` : '--'}
                                </Text>
                            </View>
                            <View style={[styles.weightStatCard, styles.weightStatCardLast, { backgroundColor: colors.surfaceLight, borderRadius: styleConfig.borderRadius.md }]}>
                                <Text style={[styles.weightStatLabel, { color: colors.textSecondary }]}>7d delta</Text>
                            <Text style={[styles.weightStatValue, { color: delta7 === null ? colors.textSecondary : (delta7 <= 0 ? colors.success : colors.warning) }]}>
                                    {delta7 !== null ? `${delta7 > 0 ? '+' : ''}${formatWeight(delta7)} ${weightUnit}` : '--'}
                                </Text>
                            </View>
                        </View>
                        {chartLogs.length > 0 ? (
                            <View
                                style={styles.chartContainer}
                                onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}
                            >
                                {chartWidth > 0 && (
                                    <Svg width={chartWidth} height={chartHeight}>
                                        <Path
                                            d={chartPath}
                                            stroke={colors.health}
                                            strokeWidth={2.5}
                                            fill="none"
                                        />
                                        {chartPoints.map((point, index) => (
                                            <Circle
                                                key={`${point.x}-${index}`}
                                                cx={point.x}
                                                cy={point.y}
                                                r={3.5}
                                                fill={colors.healthLight}
                                            />
                                        ))}
                                    </Svg>
                                )}
                            </View>
                        ) : (
                            <View style={styles.emptyWeight}>
                                <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No weight entries yet</Text>
                                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Log your first weight to see progress</Text>
                            </View>
                        )}
                    </Card>

                    {recentWeights.length > 0 && (
                        <View style={styles.recentWeightList}>
                            {recentWeights.map(log => (
                                <View key={log.id} style={[styles.weightRow, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}
                                >
                                    <Text
                                        style={[styles.weightRowValue, { color: colors.textPrimary }]}
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                    >
                                        {formatWeight(toDisplayWeight(log.weight))} {weightUnit}
                                    </Text>
                                    <View style={styles.weightRowActions}>
                                        <Text style={[styles.weightRowDate, { color: colors.textSecondary }]}>{format(parseISO(log.date), 'MMM d')}</Text>
                                        <TouchableOpacity onPress={() => openEditModal(log)}>
                                            <Text style={[styles.weightRowAction, { color: colors.primary }]}>Edit</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDeleteWeight(log)}>
                                            <Text style={[styles.weightRowAction, { color: colors.error }]}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
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

            {/* Edit Weight Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: styleConfig.borderRadius.md }]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Weight</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Weight ({weightUnit})</Text>
                            <TextInput
                                style={[styles.weightInput, { backgroundColor: colors.surfaceLight, borderColor: colors.border, color: colors.textPrimary, borderRadius: styleConfig.borderRadius.md }]}
                                value={editWeightInput}
                                onChangeText={(value) => setEditWeightInput(normalizeWeightInput(value))}
                                placeholder={weightUnit === 'kg' ? 'e.g. 72.5' : 'e.g. 160'}
                                placeholderTextColor={colors.textMuted}
                                keyboardType="decimal-pad"
                                maxLength={7}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Date</Text>
                            <TouchableOpacity
                                style={[styles.dateField, { backgroundColor: colors.surfaceLight, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}
                                onPress={() => setShowEditDatePicker(true)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.dateValue, { color: colors.textPrimary }]}>{editWeightDate}</Text>
                                <Text style={[styles.dateHint, { color: colors.textMuted }]}>Pick</Text>
                            </TouchableOpacity>
                        </View>
                        {showEditDatePicker && (
                            <DateTimePicker
                                value={parseISO(editWeightDate)}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleEditDateChange}
                            />
                        )}
                        <Button
                            title="Save Changes"
                            onPress={handleEditWeightSave}
                            color={colors.health}
                        />
                    </View>
                </View>
            </Modal>

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
    weightCard: {
        padding: Spacing.lg,
    },
    weightInputs: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: Spacing.md,
    },
    weightField: {
        flexGrow: 1,
        flexBasis: '48%',
        minWidth: 140,
        marginBottom: Spacing.sm,
    },
    weightFieldSpacing: {
        marginRight: Spacing.sm,
    },
    weightInput: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderWidth: 1,
        fontSize: FontSize.md,
    },
    dateField: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderWidth: 1,
    },
    dateValue: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    dateHint: {
        fontSize: FontSize.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    weightHelper: {
        fontSize: FontSize.sm,
        marginBottom: Spacing.sm,
    },
    weightError: {
        fontSize: FontSize.sm,
        marginBottom: Spacing.sm,
    },
    weightChartCard: {
        padding: Spacing.lg,
        marginTop: Spacing.md,
    },
    weightStatsRow: {
        flexDirection: 'row',
        marginBottom: Spacing.md,
    },
    weightStatCard: {
        flex: 1,
        padding: Spacing.sm,
        marginRight: Spacing.sm,
    },
    weightStatCardLast: {
        marginRight: 0,
    },
    weightStatLabel: {
        fontSize: FontSize.xs,
        marginBottom: 2,
    },
    weightStatValue: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    goalRow: {
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    goalInfo: {
        marginBottom: Spacing.sm,
    },
    goalLabel: {
        fontSize: FontSize.xs,
        marginBottom: 2,
    },
    goalValue: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    goalDelta: {
        marginBottom: Spacing.sm,
    },
    goalDeltaValue: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    goalDeltaLabel: {
        fontSize: FontSize.xs,
    },
    goalProgress: {
        marginTop: Spacing.xs,
    },
    goalProgressTrack: {
        height: 8,
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
    },
    goalProgressFill: {
        height: '100%',
        borderRadius: BorderRadius.full,
    },
    goalProgressText: {
        fontSize: FontSize.xs,
        marginTop: Spacing.xs,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    chartTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    chartRange: {
        fontSize: FontSize.sm,
    },
    chartContainer: {
        width: '100%',
        height: 140,
        overflow: 'hidden',
    },
    emptyWeight: {
        alignItems: 'center',
        paddingVertical: Spacing.lg,
    },
    recentWeightList: {
        marginTop: Spacing.md,
    },
    weightRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    weightRowValue: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    weightRowDate: {
        fontSize: FontSize.sm,
    },
    weightRowActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    weightRowAction: {
        fontSize: FontSize.sm,
        marginLeft: Spacing.sm,
        fontWeight: FontWeight.semibold,
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
