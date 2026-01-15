import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    TextInput,
    Modal,
    BackHandler,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, FontSize, FontWeight, BorderRadius } from '../constants/theme';
import { useApp, calculateLevel } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components';
import { format } from 'date-fns';
import { SettingsScreen } from './SettingsScreen';

export function ProfileScreen() {
    const { state, dispatch } = useApp();
    const { colors, styleConfig, isDark } = useTheme();
    const { user, financial, health, mindfulness } = state;

    const [showSettings, setShowSettings] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newName, setNewName] = useState(user?.name || '');

    // Handle hardware back button
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (showSettings) {
                setShowSettings(false);
                return true; // Prevent default behavior
            }
            return false; // Let default behavior happen
        });

        return () => backHandler.remove();
    }, [showSettings]);

    const levelInfo = calculateLevel(user?.totalXP || 0);
    const memberSince = user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'Today';

    // Stats
    const totalExpenses = financial.expenses.length;
    const totalWorkouts = health.workouts.length;
    const totalMeditations = mindfulness.meditations.length;
    const totalJournals = mindfulness.journals.length;

    const handleSaveName = () => {
        if (!newName.trim()) return;
        if (user) {
            dispatch({
                type: 'SET_USER',
                payload: { ...user, name: newName.trim() },
            });
        }
        setShowEditModal(false);
    };

    // Show settings screen as a modal-like overlay
    if (showSettings) {
        return <SettingsScreen onClose={() => setShowSettings(false)} />;
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            
            {/* Header with Settings Icon */}
            <View style={styles.header}>
                <View style={styles.headerLeft} />
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile</Text>
                <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsButton}>
                    <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <Card style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <View style={[styles.avatarContainer, { backgroundColor: colors.primary, borderRadius: styleConfig.borderRadius.xl }]}>
                            <Text style={[styles.avatarText, { color: '#FFFFFF' }]}>
                                {(user?.name || 'U').charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <TouchableOpacity onPress={() => setShowEditModal(true)} style={styles.nameRow}>
                                <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.name || 'User'}</Text>
                                <Text style={[styles.editHint, { color: colors.primary }]}>Edit</Text>
                            </TouchableOpacity>
                            <Text style={[styles.memberSince, { color: colors.textSecondary }]}>Since {memberSince}</Text>
                        </View>
                    </View>

                    {/* Level Progress */}
                    <View style={[styles.levelSection, { borderTopColor: colors.border }]}>
                        <View style={styles.levelRow}>
                            <View style={[styles.levelBadge, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.levelNumber, { color: '#FFFFFF' }]}>{levelInfo.level}</Text>
                            </View>
                            <View style={styles.levelInfo}>
                                <Text style={[styles.levelTitle, { color: colors.textPrimary }]}>{levelInfo.title}</Text>
                                <Text style={[styles.xpText, { color: colors.xp }]}>{user?.totalXP?.toLocaleString() || 0} XP</Text>
                            </View>
                        </View>
                        <View style={[styles.progressBar, { backgroundColor: colors.surfaceLighter }]}>
                            <View
                                style={[styles.progressFill, { width: `${levelInfo.progress * 100}%`, backgroundColor: colors.xp }]}
                            />
                        </View>
                        <Text style={[styles.progressText, { color: colors.textMuted }]}>
                            {levelInfo.xpToNext > 0 ? `${levelInfo.xpToNext} XP to Level ${levelInfo.level + 1}` : 'Max Level!'}
                        </Text>
                    </View>
                </Card>

                {/* Streak Card */}
                <Card style={styles.streakCard}>
                    <View style={styles.streakRow}>
                        <View style={[styles.streakIcon, { backgroundColor: colors.streak + '20' }]}>
                            <Text style={styles.streakEmoji}>🔥</Text>
                        </View>
                        <View style={styles.streakInfo}>
                            <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>Current Streak</Text>
                            <Text style={[styles.streakValue, { color: colors.streak }]}>{user?.streaks.overall || 0} days</Text>
                        </View>
                    </View>
                </Card>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <Card style={styles.statCard}>
                        <Text style={[styles.statValue, { color: colors.financial }]}>{totalExpenses}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Expenses</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={[styles.statValue, { color: colors.health }]}>{totalWorkouts}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Workouts</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={[styles.statValue, { color: colors.mindfulness }]}>{totalMeditations}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sessions</Text>
                    </Card>
                    <Card style={styles.statCard}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>{totalJournals}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Journals</Text>
                    </Card>
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Edit Name Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: styleConfig.borderRadius.lg }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Name</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[
                                styles.textInput,
                                { backgroundColor: colors.surfaceLight, borderColor: colors.border, color: colors.textPrimary, borderRadius: styleConfig.borderRadius.md }
                            ]}
                            value={newName}
                            onChangeText={setNewName}
                            placeholder="Enter your name"
                            placeholderTextColor={colors.textMuted}
                            autoFocus
                        />

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: colors.primary, borderRadius: styleConfig.borderRadius.md }]}
                            onPress={handleSaveName}
                            disabled={!newName.trim()}
                        >
                            <Text style={[styles.saveButtonText, { color: colors.textPrimary }]}>Save</Text>
                        </TouchableOpacity>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    headerLeft: {
        width: 40,
    },
    headerTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    settingsButton: {
        padding: Spacing.sm,
    },
    settingsIcon: {
        fontSize: 24,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: Spacing.md,
    },
    profileCard: {
        marginTop: Spacing.sm,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 64,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 26,
        fontWeight: FontWeight.bold,
    },
    profileInfo: {
        marginLeft: Spacing.md,
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userName: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
    },
    editHint: {
        fontSize: FontSize.xs,
        marginLeft: Spacing.sm,
        fontWeight: FontWeight.medium,
    },
    memberSince: {
        fontSize: FontSize.sm,
        marginTop: 2,
    },
    levelSection: {
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
    },
    levelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    levelBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelNumber: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
    },
    levelInfo: {
        marginLeft: Spacing.sm,
        flex: 1,
    },
    levelTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    xpText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: FontSize.xs,
        marginTop: Spacing.xs,
        textAlign: 'center',
    },
    streakCard: {
        marginTop: Spacing.md,
    },
    streakRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    streakIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    streakEmoji: {
        fontSize: 24,
    },
    streakInfo: {
        marginLeft: Spacing.md,
    },
    streakLabel: {
        fontSize: FontSize.sm,
    },
    streakValue: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: Spacing.md,
        marginHorizontal: -Spacing.xs,
    },
    statCard: {
        width: '48%',
        margin: '1%',
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    statValue: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
    },
    statLabel: {
        fontSize: FontSize.xs,
        marginTop: Spacing.xs,
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
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    bottomPadding: {
        height: 100,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        padding: Spacing.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    modalTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    modalClose: {
        fontSize: FontSize.xl,
        padding: Spacing.sm,
    },
    textInput: {
        padding: Spacing.md,
        fontSize: FontSize.md,
        marginBottom: Spacing.lg,
        borderWidth: 1,
    },
    saveButton: {
        padding: Spacing.md,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
});
