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
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, FontSize, FontWeight, Currency, BorderRadius } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Button, Card } from '../components';
import { AppStyle } from '../types';

interface SettingsScreenProps {
    onClose: () => void;
}

export function SettingsScreen({ onClose }: SettingsScreenProps) {
    const { state, dispatch, resetData } = useApp();
    const { colors, styleConfig, isDark } = useTheme();
    const { financial, health, mindfulness, settings } = state;

    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [budgetAmount, setBudgetAmount] = useState(financial.monthlyBudget.toString());
    const [showStreakInfoModal, setShowStreakInfoModal] = useState(false);

    const handleSaveBudget = () => {
        const budget = parseFloat(budgetAmount);
        if (isNaN(budget) || budget < 0) return;

        dispatch({
            type: 'LOAD_STATE',
            payload: {
                financial: { ...financial, monthlyBudget: budget },
            },
        });
        setShowBudgetModal(false);
    };

    const handleStreakModeChange = (mode: 'all' | 'any') => {
        dispatch({
            type: 'UPDATE_SETTINGS',
            payload: { streakMode: mode },
        });
    };

    const handleThemeChange = (theme: 'dark' | 'light') => {
        dispatch({
            type: 'UPDATE_SETTINGS',
            payload: { theme },
        });
    };

    const handleStyleChange = (style: AppStyle) => {
        dispatch({
            type: 'UPDATE_SETTINGS',
            payload: { style },
        });
    };

    const handleResetData = () => {
        Alert.alert(
            'Reset All Data',
            'This will delete all your progress, including XP, achievements, and logged activities. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        await resetData();
                        onClose();
                    },
                },
            ]
        );
    };

    const streakModeDescription = settings?.streakMode === 'all'
        ? 'You must log activity in ALL categories (Finance, Health, Mindfulness) to maintain your streak.'
        : 'Log activity in ANY category to maintain your streak.';

    const styleDescriptions: Record<AppStyle, { name: string; desc: string }> = {
        modern: { name: 'Modern', desc: 'Smooth curves, subtle shadows' },
        minimal: { name: 'Minimal', desc: 'Clean lines, no borders' },
        classic: { name: 'Classic', desc: 'Sharp edges, bold borders' },
        vibrant: { name: 'Vibrant', desc: 'Extra rounded, more spacing' },
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Appearance Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Appearance</Text>

                    {/* Theme Toggle - Two Buttons */}
                    {/* <View style={[styles.settingRow, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Theme</Text>
                            <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                                Choose your preferred theme
                            </Text>
                        </View>
                    </View> */}

                    <View style={styles.sectionSpacer} />
                    <View style={styles.themeButtonRow}>
                        <TouchableOpacity
                            style={[
                                styles.themeButton,
                                { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md },
                                !isDark && { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primary + '15' },
                            ]}
                            onPress={() => handleThemeChange('light')}
                        >
                            <Ionicons name="sunny" size={24} color={!isDark ? colors.primary : colors.textSecondary} />
                            <Text style={[styles.themeButtonText, { color: !isDark ? colors.primary : colors.textSecondary }]}>
                                Light Mode
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.themeButton,
                                { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md },
                                isDark && { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primary + '15' },
                            ]}
                            onPress={() => handleThemeChange('dark')}
                        >
                            <Ionicons name="moon" size={24} color={isDark ? colors.primary : colors.textSecondary} />
                            <Text style={[styles.themeButtonText, { color: isDark ? colors.primary : colors.textSecondary }]}>
                                Dark Mode
                            </Text>
                        </TouchableOpacity>
                    </View>

                    

                    {/* Style Selection */}
                    <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>Visual Style</Text>
                    <View style={styles.styleGrid}>
                        {(['modern', 'minimal', 'classic', 'vibrant'] as AppStyle[]).map((styleOption) => (
                            <TouchableOpacity
                                key={styleOption}
                                style={[
                                    styles.styleCard,
                                    { backgroundColor: colors.surface, borderColor: colors.border },
                                    settings?.style === styleOption && { borderColor: colors.primary, borderWidth: 2 },
                                ]}
                                onPress={() => handleStyleChange(styleOption)}
                            >
                                <View style={[styles.stylePreviewContainer, { backgroundColor: colors.surfaceLighter }]}>
                                    {styleOption === 'modern' && (
                                        <View style={styles.previewModern}>
                                            <View style={[styles.previewModernCard, { backgroundColor: colors.surface, borderRadius: 12 }]} />
                                            <View style={[styles.previewModernBar, { backgroundColor: colors.primary, borderRadius: 6 }]} />
                                        </View>
                                    )}
                                    {styleOption === 'minimal' && (
                                        <View style={styles.previewMinimal}>
                                            <View style={[styles.previewMinimalLine, { backgroundColor: colors.textMuted }]} />
                                            <View style={[styles.previewMinimalLine, { backgroundColor: colors.textMuted, width: '60%' }]} />
                                            <View style={[styles.previewMinimalLine, { backgroundColor: colors.primary, width: '40%' }]} />
                                        </View>
                                    )}
                                    {styleOption === 'classic' && (
                                        <View style={styles.previewClassic}>
                                            <View style={[styles.previewClassicBox, { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 2 }]} />
                                            <View style={[styles.previewClassicBox, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 2 }]} />
                                        </View>
                                    )}
                                    {styleOption === 'vibrant' && (
                                        <View style={styles.previewVibrant}>
                                            <View style={[styles.previewVibrantDot, { backgroundColor: colors.financial }]} />
                                            <View style={[styles.previewVibrantDot, { backgroundColor: colors.health }]} />
                                            <View style={[styles.previewVibrantDot, { backgroundColor: colors.mindfulness }]} />
                                        </View>
                                    )}
                                </View>
                                <Text style={[
                                    styles.styleName,
                                    { color: settings?.style === styleOption ? colors.primary : colors.textPrimary }
                                ]}>
                                    {styleDescriptions[styleOption].name}
                                </Text>
                                <Text style={[styles.styleDesc, { color: colors.textMuted }]}>
                                    {styleDescriptions[styleOption].desc}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Streak Settings */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Streak Mode</Text>
                        <TouchableOpacity onPress={() => setShowStreakInfoModal(true)}>
                            <Text style={[styles.infoButton, { color: colors.primary }]}>Info</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.streakOptions}>
                        <TouchableOpacity
                            style={[
                                styles.streakOption,
                                { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md },
                                settings?.streakMode === 'any' && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                            ]}
                            onPress={() => handleStreakModeChange('any')}
                        >
                            <View style={[
                                styles.radioOuter,
                                { borderColor: settings?.streakMode === 'any' ? colors.primary : colors.textMuted }
                            ]}>
                                {settings?.streakMode === 'any' && (
                                    <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                                )}
                            </View>
                            <View style={styles.streakOptionInfo}>
                                <Text style={[styles.streakOptionTitle, { color: colors.textPrimary }]}>Easy Mode</Text>
                                <Text style={[styles.streakOptionDesc, { color: colors.textSecondary }]}>Log any one category daily</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.streakOption,
                                { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md },
                                settings?.streakMode === 'all' && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                            ]}
                            onPress={() => handleStreakModeChange('all')}
                        >
                            <View style={[
                                styles.radioOuter,
                                { borderColor: settings?.streakMode === 'all' ? colors.primary : colors.textMuted }
                            ]}>
                                {settings?.streakMode === 'all' && (
                                    <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                                )}
                            </View>
                            <View style={styles.streakOptionInfo}>
                                <Text style={[styles.streakOptionTitle, { color: colors.textPrimary }]}>Challenge Mode</Text>
                                <Text style={[styles.streakOptionDesc, { color: colors.textSecondary }]}>Log all 3 categories daily</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Goals */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Goals</Text>

                    <TouchableOpacity
                        style={[styles.goalItem, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}
                        onPress={() => setShowBudgetModal(true)}
                    >
                        <View style={[styles.goalIcon, { backgroundColor: colors.financial + '20' }]}>
                            <Ionicons name="wallet" size={20} color={colors.financial} />
                        </View>
                        <View style={styles.goalInfo}>
                            <Text style={[styles.goalLabel, { color: colors.textPrimary }]}>Monthly Budget</Text>
                            <Text style={[styles.goalValue, { color: colors.financial }]}>
                                {financial.monthlyBudget > 0 ? Currency.format(financial.monthlyBudget) : 'Not set'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    <View style={[styles.goalItem, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}>
                        <View style={[styles.goalIcon, { backgroundColor: colors.info + '20' }]}>
                            <Ionicons name="water" size={20} color={colors.info} />
                        </View>
                        <View style={styles.goalInfo}>
                            <Text style={[styles.goalLabel, { color: colors.textPrimary }]}>Daily Water</Text>
                            <Text style={[styles.goalValue, { color: colors.info }]}>{health.dailyWaterGoal} glasses</Text>
                        </View>
                    </View>

                    <View style={[styles.goalItem, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}>
                        <View style={[styles.goalIcon, { backgroundColor: colors.mindfulness + '20' }]}>
                            <Ionicons name="leaf" size={20} color={colors.mindfulness} />
                        </View>
                        <View style={styles.goalInfo}>
                            <Text style={[styles.goalLabel, { color: colors.textPrimary }]}>Meditation Goal</Text>
                            <Text style={[styles.goalValue, { color: colors.mindfulness }]}>{mindfulness.meditationGoal} min/day</Text>
                        </View>
                    </View>
                </View>

                {/* Danger Zone */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
                    <TouchableOpacity
                        style={[styles.dangerButton, { borderColor: colors.error, borderRadius: styleConfig.borderRadius.md }]}
                        onPress={handleResetData}
                    >
                        <Text style={[styles.dangerButtonText, { color: colors.error }]}>Reset All Data</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Budget Modal */}
            <Modal
                visible={showBudgetModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowBudgetModal(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: styleConfig.borderRadius.lg }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Set Monthly Budget</Text>
                            <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
                                <Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.budgetInput, { backgroundColor: colors.surfaceLight, borderRadius: styleConfig.borderRadius.md }]}>
                            <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>₹</Text>
                            <TextInput
                                style={[styles.budgetField, { color: colors.textPrimary }]}
                                value={budgetAmount}
                                onChangeText={setBudgetAmount}
                                keyboardType="decimal-pad"
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        <Button
                            title="Save Budget"
                            onPress={handleSaveBudget}
                            color={colors.financial}
                        />
                    </View>
                </View>
            </Modal>

            {/* Streak Info Modal */}
            <Modal
                visible={showStreakInfoModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowStreakInfoModal(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: styleConfig.borderRadius.lg }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>How Streaks Work</Text>
                            <TouchableOpacity onPress={() => setShowStreakInfoModal(false)}>
                                <Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.infoSection}>
                            <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
                                Current: {settings?.streakMode === 'all' ? 'Challenge Mode' : 'Easy Mode'}
                            </Text>
                            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{streakModeDescription}</Text>
                        </View>

                        <View style={styles.infoSection}>
                            <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>Categories</Text>
                            <View style={styles.categoryList}>
                                <View style={styles.categoryItem}>
                                    <View style={[styles.categoryDot, { backgroundColor: colors.financial }]} />
                                    <Text style={[styles.categoryText, { color: colors.textSecondary }]}>Finance: Log any expense</Text>
                                </View>
                                <View style={styles.categoryItem}>
                                    <View style={[styles.categoryDot, { backgroundColor: colors.health }]} />
                                    <Text style={[styles.categoryText, { color: colors.textSecondary }]}>Health: Log workout or water</Text>
                                </View>
                                <View style={styles.categoryItem}>
                                    <View style={[styles.categoryDot, { backgroundColor: colors.mindfulness }]} />
                                    <Text style={[styles.categoryText, { color: colors.textSecondary }]}>Mind: Meditate, journal, or mood</Text>
                                </View>
                            </View>
                        </View>

                        <Button
                            title="Got it"
                            onPress={() => setShowStreakInfoModal(false)}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: Spacing.sm,
        marginLeft: -Spacing.sm,
    },
    backIcon: {
        fontSize: 24,
        fontWeight: FontWeight.bold,
    },
    headerTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    headerRight: {
        width: 40,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: Spacing.md,
    },
    section: {
        marginTop: Spacing.xl + Spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        marginBottom: Spacing.md,
    },
    subsectionTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    infoButton: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        marginBottom: Spacing.md,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderWidth: 1,
    },
    settingInfo: {
        flex: 1,
    },
    settingLabel: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    settingDesc: {
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    styleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -Spacing.xs,
    },
    styleCard: {
        width: '48%',
        margin: '1%',
        padding: Spacing.md,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    stylePreviewContainer: {
        width: '100%',
        height: 60,
        borderRadius: BorderRadius.sm,
        marginBottom: Spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.sm,
    },
    previewModern: {
        width: '100%',
        alignItems: 'center',
        gap: 6,
    },
    previewModernCard: {
        width: '80%',
        height: 20,
    },
    previewModernBar: {
        width: '50%',
        height: 10,
    },
    previewMinimal: {
        width: '100%',
        alignItems: 'flex-start',
        paddingHorizontal: Spacing.sm,
        gap: 6,
    },
    previewMinimalLine: {
        width: '80%',
        height: 3,
        borderRadius: 1,
    },
    previewClassic: {
        flexDirection: 'row',
        gap: 8,
    },
    previewClassicBox: {
        width: 28,
        height: 28,
        borderRadius: 2,
    },
    previewVibrant: {
        flexDirection: 'row',
        gap: 12,
    },
    previewVibrantDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
    },
    styleName: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        marginTop: Spacing.xs,
    },
    styleDesc: {
        fontSize: FontSize.xs,
        textAlign: 'center',
        marginTop: 2,
    },
    themeButtonRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    themeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.md,
        borderWidth: 1,
        gap: Spacing.sm,
    },
    themeButtonText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    sectionSpacer: {
        height: Spacing.md,
    },
    streakOptions: {
        gap: Spacing.sm,
    },
    streakOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderWidth: 1,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    streakOptionInfo: {
        flex: 1,
    },
    streakOptionTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    streakOptionDesc: {
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    goalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    goalIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    goalIconText: {
        fontSize: FontSize.lg,
    },
    goalInfo: {
        flex: 1,
    },
    goalLabel: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    goalValue: {
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    goalArrow: {
        fontSize: FontSize.xl,
    },
    dangerButton: {
        padding: Spacing.md,
        borderWidth: 1,
        alignItems: 'center',
    },
    dangerButtonText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    bottomPadding: {
        height: 40,
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
    budgetInput: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.lg,
    },
    currencySymbol: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
    },
    budgetField: {
        flex: 1,
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        paddingVertical: Spacing.md,
        marginLeft: Spacing.sm,
    },
    infoSection: {
        marginBottom: Spacing.lg,
    },
    infoTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        marginBottom: Spacing.sm,
    },
    infoText: {
        fontSize: FontSize.sm,
        lineHeight: 20,
    },
    categoryList: {
        gap: Spacing.sm,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: Spacing.sm,
    },
    categoryText: {
        fontSize: FontSize.sm,
    },
});
