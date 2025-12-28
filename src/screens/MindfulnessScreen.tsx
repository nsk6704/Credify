import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    TextInput,
    Modal,
    Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, FontSize, FontWeight, BorderRadius } from '../constants/theme';
import { MOOD_OPTIONS, XP_CONFIG } from '../constants/gamification';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Button, Card } from '../components';
import { MeditationSession, JournalEntry, MoodEntry, GratitudeLog } from '../types';
import { format } from 'date-fns';

export function MindfulnessScreen() {
    const { state, dispatch, addXP } = useApp();
    const { colors, styleConfig } = useTheme();
    const { mindfulness } = state;

    const [showMeditationModal, setShowMeditationModal] = useState(false);
    const [showJournalModal, setShowJournalModal] = useState(false);
    const [showMoodModal, setShowMoodModal] = useState(false);
    const [showGratitudeModal, setShowGratitudeModal] = useState(false);

    // Meditation timer
    const [meditationTime, setMeditationTime] = useState(5); // minutes
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Journal
    const [journalContent, setJournalContent] = useState('');

    // Mood
    const [selectedMood, setSelectedMood] = useState(MOOD_OPTIONS[1]);
    const [moodNotes, setMoodNotes] = useState('');

    // Gratitude
    const [gratitudeItems, setGratitudeItems] = useState(['', '', '']);

    const today = format(new Date(), 'yyyy-MM-dd');
    const todayMeditations = mindfulness.meditations.filter(m => m.date === today);
    const todayMeditationMins = todayMeditations.reduce((sum, m) => sum + m.duration, 0);
    const todayMood = mindfulness.moods.find(m => m.date === today);

    // Timer logic
    useEffect(() => {
        if (isTimerRunning && remainingSeconds > 0) {
            timerRef.current = setInterval(() => {
                setRemainingSeconds(prev => {
                    if (prev <= 1) {
                        handleTimerComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isTimerRunning]);

    const handleStartMeditation = () => {
        setRemainingSeconds(meditationTime * 60);
        setIsTimerRunning(true);
    };

    const handleTimerComplete = () => {
        setIsTimerRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);
        Vibration.vibrate([500, 200, 500]);

        // Save meditation
        const meditation: MeditationSession = {
            id: Date.now().toString(),
            duration: meditationTime,
            type: 'timer',
            date: today,
            createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_MEDITATION', payload: meditation });
        addXP(XP_CONFIG.rewards.completeMeditation);
        setShowMeditationModal(false);
    };

    const handleSaveJournal = () => {
        if (!journalContent.trim()) return;

        const journal: JournalEntry = {
            id: Date.now().toString(),
            content: journalContent,
            mood: todayMood?.mood,
            date: today,
            createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_JOURNAL', payload: journal });
        addXP(XP_CONFIG.rewards.journalEntry);
        setJournalContent('');
        setShowJournalModal(false);
    };

    const handleSaveMood = () => {
        const mood: MoodEntry = {
            id: Date.now().toString(),
            mood: selectedMood.id,
            notes: moodNotes,
            date: today,
            createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_MOOD', payload: mood });
        addXP(XP_CONFIG.rewards.moodCheckIn);
        setMoodNotes('');
        setShowMoodModal(false);
    };

    const handleSaveGratitude = () => {
        const items = gratitudeItems.filter(i => i.trim());
        if (items.length === 0) return;

        const gratitude: GratitudeLog = {
            id: Date.now().toString(),
            items,
            date: today,
            createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_GRATITUDE', payload: gratitude });
        addXP(XP_CONFIG.rewards.gratitudeLog);
        setGratitudeItems(['', '', '']);
        setShowGratitudeModal(false);
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const moodLabel = todayMood
        ? MOOD_OPTIONS.find(m => m.id === todayMood.mood)?.name || 'Okay'
        : '--';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>Mindfulness</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Find your inner peace</Text>
                </View>

                {/* Today's Summary */}
                <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: colors.mindfulness }]}>{todayMeditationMins}</Text>
                            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Mindful mins</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: colors.primary }]}>{moodLabel}</Text>
                            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Today's Mood</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryValue, { color: colors.streak }]}>{state.user?.streaks.mindfulness || 0}</Text>
                            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Day Streak</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today's Practice</Text>
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}
                            onPress={() => setShowMeditationModal(true)}
                        >
                            <View style={[styles.actionIconBg, { backgroundColor: colors.mindfulness + '20' }]}>
                                <Ionicons name="flower-outline" size={24} color={colors.mindfulness} />
                            </View>
                            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Meditate</Text>
                            <Text style={[styles.actionXP, { color: colors.xp }]}>+10 XP</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}
                            onPress={() => setShowMoodModal(true)}
                        >
                            <View style={[styles.actionIconBg, { backgroundColor: '#EC4899' + '20' }]}>
                                <Ionicons name="happy-outline" size={24} color="#EC4899" />
                            </View>
                            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Mood Check</Text>
                            <Text style={[styles.actionXP, { color: colors.xp }]}>+5 XP</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}
                            onPress={() => setShowJournalModal(true)}
                        >
                            <View style={[styles.actionIconBg, { backgroundColor: '#8B5CF6' + '20' }]}>
                                <Ionicons name="journal-outline" size={24} color="#8B5CF6" />
                            </View>
                            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Journal</Text>
                            <Text style={[styles.actionXP, { color: colors.xp }]}>+10 XP</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}
                            onPress={() => setShowGratitudeModal(true)}
                        >
                            <View style={[styles.actionIconBg, { backgroundColor: '#F59E0B' + '20' }]}>
                                <Ionicons name="heart-outline" size={24} color="#F59E0B" />
                            </View>
                            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Gratitude</Text>
                            <Text style={[styles.actionXP, { color: colors.xp }]}>+5 XP</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Journal Entries */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Reflections</Text>
                    {mindfulness.journals.length > 0 ? (
                        mindfulness.journals.slice(0, 3).map(journal => (
                            <Card key={journal.id} style={styles.journalCard}>
                                <View style={styles.journalHeader}>
                                    <Text style={[styles.journalDate, { color: colors.textSecondary }]}>
                                        {format(new Date(journal.date), 'MMM d, yyyy')}
                                    </Text>
                                    {journal.mood && (
                                        <Text style={styles.journalMood}>
                                            {MOOD_OPTIONS.find(m => m.id === journal.mood)?.icon}
                                        </Text>
                                    )}
                                </View>
                                <Text style={[styles.journalContent, { color: colors.textPrimary }]} numberOfLines={3}>
                                    {journal.content}
                                </Text>
                            </Card>
                        ))
                    ) : (
                        <Card style={styles.emptyCard}>
                            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No journal entries yet</Text>
                            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Start reflecting on your day!</Text>
                        </Card>
                    )}
                </View>

                {/* Stats */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Journey</Text>
                    <View style={styles.statsRow}>
                        <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}>
                            <Text style={[styles.statBoxValue, { color: colors.primary }]}>{mindfulness.meditations.length}</Text>
                            <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>Sessions</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}>
                            <Text style={[styles.statBoxValue, { color: colors.primary }]}>
                                {mindfulness.meditations.reduce((sum, m) => sum + m.duration, 0)}
                            </Text>
                            <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>Total Minutes</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}>
                            <Text style={[styles.statBoxValue, { color: colors.primary }]}>{mindfulness.journals.length}</Text>
                            <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>Journal Entries</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Meditation Modal */}
            <Modal
                visible={showMeditationModal}
                animationType="slide"
                transparent
                onRequestClose={() => {
                    if (!isTimerRunning) setShowMeditationModal(false);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.meditationModal, { backgroundColor: colors.surface, borderRadius: styleConfig.borderRadius.md }]}>
                        {!isTimerRunning ? (
                            <>
                                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Meditation Timer</Text>
                                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Set your session duration</Text>

                                <View style={styles.timerSelector}>
                                    {[5, 10, 15, 20, 30].map(mins => (
                                        <TouchableOpacity
                                            key={mins}
                                            style={[
                                                styles.timerOption,
                                                { backgroundColor: colors.surfaceLight, borderRadius: styleConfig.borderRadius.md },
                                                meditationTime === mins && { backgroundColor: colors.mindfulness },
                                            ]}
                                            onPress={() => setMeditationTime(mins)}
                                        >
                                            <Text
                                                style={[
                                                    styles.timerOptionText,
                                                    { color: colors.textSecondary },
                                                    meditationTime === mins && { color: '#FFFFFF' },
                                                ]}
                                            >
                                                {mins}m
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Button
                                    title="Start Session"
                                    onPress={handleStartMeditation}
                                    color={colors.mindfulness}
                                    style={styles.startButton}
                                />

                                <TouchableOpacity
                                    style={styles.cancelLink}
                                    onPress={() => setShowMeditationModal(false)}
                                >
                                    <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={[styles.timerTitle, { color: colors.textPrimary }]}>Breathe...</Text>
                                <View style={[styles.timerDisplay, { backgroundColor: colors.mindfulness + '20' }]}>
                                    <Text style={[styles.timerText, { color: colors.mindfulness }]}>{formatTime(remainingSeconds)}</Text>
                                </View>
                                <Text style={[styles.timerHint, { color: colors.textSecondary }]}>Find your center</Text>

                                <TouchableOpacity
                                    style={[styles.endButton, { backgroundColor: colors.surfaceLight }]}
                                    onPress={() => {
                                        setIsTimerRunning(false);
                                        if (timerRef.current) clearInterval(timerRef.current);
                                        setShowMeditationModal(false);
                                    }}
                                >
                                    <Text style={[styles.endButtonText, { color: colors.textSecondary }]}>End Early</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Mood Modal */}
            <Modal
                visible={showMoodModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowMoodModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: styleConfig.borderRadius.md }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>How are you feeling?</Text>
                            <TouchableOpacity onPress={() => setShowMoodModal(false)}>
                                <Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.moodOptions}>
                            {MOOD_OPTIONS.map(mood => (
                                <TouchableOpacity
                                    key={mood.id}
                                    style={[
                                        styles.moodOption,
                                        { backgroundColor: colors.surfaceLight, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md },
                                        selectedMood.id === mood.id && { borderColor: mood.color, backgroundColor: mood.color + '20' },
                                    ]}
                                    onPress={() => setSelectedMood(mood)}
                                >
                                    <Text style={styles.moodEmoji}>{mood.icon}</Text>
                                    <Text style={[styles.moodName, { color: colors.textPrimary }]}>{mood.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Notes (optional)</Text>
                            <TextInput
                                style={[styles.textInput, { backgroundColor: colors.surfaceLight, borderColor: colors.border, color: colors.textPrimary, borderRadius: styleConfig.borderRadius.md }]}
                                value={moodNotes}
                                onChangeText={setMoodNotes}
                                placeholder="What's on your mind?"
                                placeholderTextColor={colors.textMuted}
                                multiline
                            />
                        </View>

                        <Button
                            title="Save Mood (+5 XP)"
                            onPress={handleSaveMood}
                            color={selectedMood.color}
                        />
                    </View>
                </View>
            </Modal>

            {/* Journal Modal */}
            <Modal
                visible={showJournalModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowJournalModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: styleConfig.borderRadius.md }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Journal Entry</Text>
                            <TouchableOpacity onPress={() => setShowJournalModal(false)}>
                                <Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[styles.journalInput, { backgroundColor: colors.surfaceLight, borderColor: colors.border, color: colors.textPrimary, borderRadius: styleConfig.borderRadius.md }]}
                            value={journalContent}
                            onChangeText={setJournalContent}
                            placeholder="Write your thoughts..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            textAlignVertical="top"
                        />

                        <Button
                            title="Save Entry (+10 XP)"
                            onPress={handleSaveJournal}
                            color="#8B5CF6"
                            disabled={!journalContent.trim()}
                        />
                    </View>
                </View>
            </Modal>

            {/* Gratitude Modal */}
            <Modal
                visible={showGratitudeModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowGratitudeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: styleConfig.borderRadius.md }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Gratitude Log</Text>
                            <TouchableOpacity onPress={() => setShowGratitudeModal(false)}>
                                <Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.gratitudeHint, { color: colors.textSecondary }]}>What are you grateful for today?</Text>

                        {gratitudeItems.map((item, index) => (
                            <View key={index} style={styles.gratitudeItem}>
                                <Text style={[styles.gratitudeNumber, { color: colors.textMuted }]}>{index + 1}.</Text>
                                <TextInput
                                    style={[styles.gratitudeInput, { backgroundColor: colors.surfaceLight, borderColor: colors.border, color: colors.textPrimary, borderRadius: styleConfig.borderRadius.md }]}
                                    value={item}
                                    onChangeText={(text) => {
                                        const newItems = [...gratitudeItems];
                                        newItems[index] = text;
                                        setGratitudeItems(newItems);
                                    }}
                                    placeholder={`I'm grateful for...`}
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                        ))}

                        <Button
                            title="Save (+5 XP)"
                            onPress={handleSaveGratitude}
                            color="#F59E0B"
                            disabled={!gratitudeItems.some(i => i.trim())}
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
    summaryCard: {
        padding: Spacing.lg,
        borderWidth: 1,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
    },
    summaryLabel: {
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    section: {
        marginTop: Spacing.xl,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        marginBottom: Spacing.md,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -Spacing.xs,
    },
    actionCard: {
        width: '50%',
        padding: Spacing.xs,
    },
    actionIconBg: {
        height: 64,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionIcon: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
    },
    actionTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
    actionXP: {
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    journalCard: {
        marginBottom: Spacing.sm,
    },
    journalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    journalDate: {
        fontSize: FontSize.sm,
    },
    journalMood: {
        fontSize: 20,
    },
    journalContent: {
        fontSize: FontSize.sm,
        lineHeight: 20,
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
    statsRow: {
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
    meditationModal: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
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
    modalSubtitle: {
        fontSize: FontSize.md,
        marginTop: Spacing.xs,
        marginBottom: Spacing.lg,
    },
    modalClose: {
        fontSize: FontSize.xl,
        padding: Spacing.sm,
    },
    timerSelector: {
        flexDirection: 'row',
        marginBottom: Spacing.xl,
    },
    timerOption: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: Spacing.xs,
    },
    timerOptionActive: {},
    timerOptionText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    timerOptionTextActive: {},
    startButton: {
        width: '100%',
    },
    cancelLink: {
        marginTop: Spacing.lg,
        padding: Spacing.sm,
    },
    cancelText: {
        fontSize: FontSize.md,
    },
    timerTitle: {
        fontSize: FontSize.xl,
        marginBottom: Spacing.xl,
    },
    timerDisplay: {
        marginBottom: Spacing.xl,
        padding: Spacing.xl,
        borderRadius: BorderRadius.full,
    },
    timerText: {
        fontSize: 72,
        fontWeight: FontWeight.bold,
    },
    timerHint: {
        fontSize: FontSize.lg,
        marginBottom: Spacing.xl,
    },
    endButton: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    endButtonText: {
        fontSize: FontSize.md,
    },
    moodOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    moodOption: {
        alignItems: 'center',
        padding: Spacing.md,
        borderWidth: 1,
        minWidth: 60,
    },
    moodEmoji: {
        fontSize: 28,
        marginBottom: Spacing.xs,
    },
    moodName: {
        fontSize: FontSize.xs,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    inputLabel: {
        fontSize: FontSize.sm,
        marginBottom: Spacing.sm,
    },
    textInput: {
        padding: Spacing.md,
        fontSize: FontSize.md,
        minHeight: 80,
        textAlignVertical: 'top',
        borderWidth: 1,
    },
    journalInput: {
        padding: Spacing.md,
        fontSize: FontSize.md,
        minHeight: 200,
        textAlignVertical: 'top',
        marginBottom: Spacing.lg,
        borderWidth: 1,
    },
    gratitudeHint: {
        fontSize: FontSize.md,
        marginBottom: Spacing.lg,
        textAlign: 'center',
    },
    gratitudeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    gratitudeNumber: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        marginRight: Spacing.sm,
        width: 24,
    },
    gratitudeInput: {
        flex: 1,
        padding: Spacing.md,
        fontSize: FontSize.md,
        borderWidth: 1,
    },
});
