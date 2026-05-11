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
    Share,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Spacing, FontSize, FontWeight, Currency, BorderRadius, PremiumDarkTheme, DarkTheme } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Button, Card } from '../components';
import { AppStyle, ColorScheme } from '../types';
import * as Database from '../lib/database';

interface SettingsScreenProps {
    onClose: () => void;
}

export function SettingsScreen({ onClose }: SettingsScreenProps) {
    const { state, dispatch, resetData, updateSettings } = useApp();
    const { colors, styleConfig, isDark, colorScheme } = useTheme();
    const { financial, health, mindfulness, settings } = state;

    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [budgetAmount, setBudgetAmount] = useState(financial.monthlyBudget.toString());
    const [showWaterModal, setShowWaterModal] = useState(false);
    const [waterGoal, setWaterGoal] = useState(health.dailyWaterGoal.toString());
    const [showMeditationModal, setShowMeditationModal] = useState(false);
    const [meditationGoal, setMeditationGoal] = useState(mindfulness.meditationGoal.toString());
    const [showWeightGoalModal, setShowWeightGoalModal] = useState(false);
    const toDisplayWeight = (weightKg: number) =>
        settings.weightUnit === 'kg' ? weightKg : weightKg * 2.20462;

    const toStorageWeight = (value: number) =>
        settings.weightUnit === 'kg' ? value : value / 2.20462;

    const [weightGoal, setWeightGoal] = useState(
        health.weightGoal ? toDisplayWeight(health.weightGoal).toFixed(1) : ''
    );
    const [showStreakInfoModal, setShowStreakInfoModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

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

    const handleSaveWaterGoal = () => {
        const goal = parseInt(waterGoal);
        if (isNaN(goal) || goal < 1) return;

        dispatch({
            type: 'LOAD_STATE',
            payload: {
                health: { ...health, dailyWaterGoal: goal },
            },
        });
        setShowWaterModal(false);
    };

    const handleSaveMeditationGoal = () => {
        const goal = parseInt(meditationGoal);
        if (isNaN(goal) || goal < 1) return;

        dispatch({
            type: 'LOAD_STATE',
            payload: {
                mindfulness: { ...mindfulness, meditationGoal: goal },
            },
        });
        setShowMeditationModal(false);
    };

    const handleSaveWeightGoal = () => {
        if (!weightGoal) {
            dispatch({
                type: 'LOAD_STATE',
                payload: {
                    health: { ...health, weightGoal: 0 },
                },
            });
            setShowWeightGoalModal(false);
            return;
        }

        const goal = parseFloat(weightGoal);
        if (isNaN(goal) || goal <= 0) return;

        const goalKg = toStorageWeight(goal);

        dispatch({
            type: 'LOAD_STATE',
            payload: {
                health: { ...health, weightGoal: goalKg },
            },
        });
        setShowWeightGoalModal(false);
    };

    const handleWeightUnitChange = async (unit: 'kg' | 'lb') => {
        if (unit === settings.weightUnit) return;

        await updateSettings({ weightUnit: unit });
        setWeightGoal((prev) => {
            if (!prev) return prev;
            const value = parseFloat(prev);
            if (Number.isNaN(value)) return prev;
            const converted = unit === 'kg' ? value / 2.20462 : value * 2.20462;
            return converted.toFixed(1);
        });
    };

    const handleStreakModeChange = async (mode: 'all' | 'any') => {
        await updateSettings({ streakMode: mode });
    };

    const handleThemeChange = async (theme: 'dark' | 'light') => {
        await updateSettings({ theme });
    };

    const handleStyleChange = async (style: AppStyle) => {
        await updateSettings({ style });
    };

    const handleColorSchemeChange = async (cs: ColorScheme) => {
        await updateSettings({ colorScheme: cs });
    };

    const handleResetData = () => {
        Alert.alert(
            'Reset All Data',
            'This will delete all your progress, including XP and logged activities. This cannot be undone.',
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

    const handleExportData = async () => {
        try {
            setIsExporting(true);
            const jsonData = await Database.exportAllData();
            const fileName = `upwell-backup-${new Date().toISOString().split('T')[0]}.csv`;
            // Use documentDirectory if available, otherwise fallback to cacheDirectory

                        let documentDir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory;
                        // On Android 10+ (API 29+), use StorageAccessFramework for user-selected export location
                        if (!documentDir && Platform.OS === 'android' && StorageAccessFramework) {
                            try {
                                const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
                                if (!permissions.granted) {
                                    setIsExporting(false);
                                    Alert.alert('Export Failed', 'Storage permission denied. Please allow access to export your backup.');
                                    return;
                                }
                                documentDir = permissions.directoryUri;
                                const fileUri = await StorageAccessFramework.createFileAsync(
                                    documentDir,
                                    fileName,
                                    'text/csv'
                                );
                                await StorageAccessFramework.writeAsStringAsync(fileUri, jsonData);
                                setIsExporting(false);
                                Alert.alert('Export Complete', 'Backup exported to your selected folder.');
                                return;
                            } catch (err) {
                                setIsExporting(false);
                                Alert.alert('Export Failed', 'Could not export backup. Please try again.');
                                return;
                            }
                        }
                        if (!documentDir) {
                            setIsExporting(false);
                            Alert.alert(
                              'Export Failed',
                              'No writable directory is available on this device. Please check your storage settings or try again on a different device.'
                            );
                            return;
                        }
                        const filePath = `${documentDir}${fileName}`;
                        await FileSystem.writeAsStringAsync(filePath, jsonData);
            
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(filePath, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Export UpWell Backup',
                });
            } else {
                Alert.alert('Export Complete', `Backup saved to ${fileName}`);
            }
        } catch (error) {
            console.error('Export failed:', error);
            Alert.alert('Export Failed', 'Could not export your data. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportData = async () => {
        Alert.alert(
            'Import Data',
            'This will replace ALL your current data with the backup. Your existing data will be lost. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Import',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsImporting(true);
                            const result = await DocumentPicker.getDocumentAsync({
                                type: 'application/json',
                                copyToCacheDirectory: true,
                            });

                            if (result.canceled || !result.assets?.[0]) {
                                return;
                            }

                            const fileUri = result.assets[0].uri;
                            const jsonData = await FileSystem.readAsStringAsync(fileUri);
                            
                            await Database.importData(jsonData);
                            Alert.alert(
                                'Import Successful',
                                'Your data has been restored. Please restart the app to see all changes.',
                                [{ text: 'OK', onPress: onClose }]
                            );
                        } catch (error) {
                            console.error('Import failed:', error);
                            Alert.alert('Import Failed', 'Could not import the backup file. Make sure it\'s a valid UpWell backup.');
                        } finally {
                            setIsImporting(false);
                        }
                    },
                },
            ]
        );
    };

    const streakModeDescription = settings?.streakMode === 'all'
        ? 'You must log activity in ALL categories (Finance, Health, Mindfulness) to maintain your streak.'
        : 'Log activity in ANY category to maintain your streak.';

    const colorSchemeOptions: Record<ColorScheme, { name: string; desc: string }> = {
        premium: { name: 'Premium', desc: 'Black, white, single accent' },
        colorful: { name: 'Colorful', desc: 'Category-colored accents' },
    };

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

                    {/* Color Scheme Selection */}
                    <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>Color Scheme</Text>
                    <View style={styles.colorSchemeRow}>
                        {(Object.keys(colorSchemeOptions) as ColorScheme[]).map((option) => {
                            const active = settings?.colorScheme === option;
                            return (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.colorSchemeCard,
                                        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md },
                                        active && { borderColor: colors.primary, borderWidth: 2 },
                                    ]}
                                    onPress={() => handleColorSchemeChange(option)}
                                >
                                    <View style={[styles.colorSchemePreview, { backgroundColor: colors.surfaceLighter, borderRadius: styleConfig.borderRadius.sm }]}>
                                        {option === 'premium' ? (
                                            <>
                                                <View style={[styles.colorSchemeDot, { backgroundColor: colors.primary }]} />
                                                <View style={[styles.colorSchemeDot, { backgroundColor: colors.textMuted }]} />
                                                <View style={[styles.colorSchemeDot, { backgroundColor: colors.primary }]} />
                                                <View style={[styles.colorSchemeDot, { backgroundColor: colors.textMuted }]} />
                                            </>
                                        ) : (
                                            <>
                                                <View style={[styles.colorSchemeDot, { backgroundColor: DarkTheme.primary }]} />
                                                <View style={[styles.colorSchemeDot, { backgroundColor: DarkTheme.financial }]} />
                                                <View style={[styles.colorSchemeDot, { backgroundColor: DarkTheme.health }]} />
                                                <View style={[styles.colorSchemeDot, { backgroundColor: DarkTheme.mindfulness }]} />
                                            </>
                                        )}
                                    </View>
                                    <Text style={[styles.styleName, { color: active ? colors.primary : colors.textPrimary }]}>
                                        {colorSchemeOptions[option].name}
                                    </Text>
                                    <Text style={[styles.styleDesc, { color: colors.textMuted }]}>
                                        {colorSchemeOptions[option].desc}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
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

                    <TouchableOpacity
                        style={[styles.goalItem, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}
                        onPress={() => setShowWaterModal(true)}
                    >
                        <View style={[styles.goalIcon, { backgroundColor: colors.info + '20' }]}>
                            <Ionicons name="water" size={20} color={colors.info} />
                        </View>
                        <View style={styles.goalInfo}>
                            <Text style={[styles.goalLabel, { color: colors.textPrimary }]}>Daily Water</Text>
                            <Text style={[styles.goalValue, { color: colors.info }]}>{health.dailyWaterGoal} glasses</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.goalItem, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}
                        onPress={() => setShowMeditationModal(true)}
                    >
                        <View style={[styles.goalIcon, { backgroundColor: colors.mindfulness + '20' }]}>
                            <Ionicons name="leaf" size={20} color={colors.mindfulness} />
                        </View>
                        <View style={styles.goalInfo}>
                            <Text style={[styles.goalLabel, { color: colors.textPrimary }]}>Meditation Goal</Text>
                            <Text style={[styles.goalValue, { color: colors.mindfulness }]}>{mindfulness.meditationGoal} min/day</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.goalItem, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}
                        onPress={() => setShowWeightGoalModal(true)}
                    >
                        <View style={[styles.goalIcon, { backgroundColor: colors.health + '20' }]}
                            >
                            <Ionicons name="fitness" size={20} color={colors.health} />
                        </View>
                        <View style={styles.goalInfo}>
                            <Text style={[styles.goalLabel, { color: colors.textPrimary }]}>Weight Goal</Text>
                            <Text style={[styles.goalValue, { color: colors.health }]}
                                >
                                {health.weightGoal > 0
                                    ? `${toDisplayWeight(health.weightGoal).toFixed(1)} ${settings.weightUnit}`
                                    : 'Not set'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Units */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Units</Text>
                    <View style={styles.unitRow}>
                        <TouchableOpacity
                            style={[
                                styles.unitButton,
                                { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md },
                                settings.weightUnit === 'kg' && { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primary + '12' },
                            ]}
                            onPress={() => handleWeightUnitChange('kg')}
                        >
                            <Text style={[styles.unitLabel, { color: settings.weightUnit === 'kg' ? colors.primary : colors.textSecondary }]}>Kilograms</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.unitButton,
                                styles.unitButtonLast,
                                { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md },
                                settings.weightUnit === 'lb' && { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primary + '12' },
                            ]}
                            onPress={() => handleWeightUnitChange('lb')}
                        >
                            <Text style={[styles.unitLabel, { color: settings.weightUnit === 'lb' ? colors.primary : colors.textSecondary }]}>Pounds</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Data Management */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Data Management</Text>
                    
                    <TouchableOpacity
                        style={[styles.goalItem, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}
                        onPress={handleExportData}
                        disabled={isExporting}
                    >
                        <View style={[styles.goalIcon, { backgroundColor: colors.success + '20' }]}>
                            <Ionicons name="download-outline" size={20} color={colors.success} />
                        </View>
                        <View style={styles.goalInfo}>
                            <Text style={[styles.goalLabel, { color: colors.textPrimary }]}>
                                {isExporting ? 'Exporting...' : 'Export Data'}
                            </Text>
                            <Text style={[styles.goalValue, { color: colors.textSecondary }]}>
                                Create a backup of all your data
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.goalItem, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.md }]}
                        onPress={handleImportData}
                        disabled={isImporting}
                    >
                        <View style={[styles.goalIcon, { backgroundColor: colors.info + '20' }]}>
                            <Ionicons name="cloud-upload-outline" size={20} color={colors.info} />
                        </View>
                        <View style={styles.goalInfo}>
                            <Text style={[styles.goalLabel, { color: colors.textPrimary }]}>
                                {isImporting ? 'Importing...' : 'Import Data'}
                            </Text>
                            <Text style={[styles.goalValue, { color: colors.textSecondary }]}>
                                Restore from a backup file
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
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
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: styleConfig.borderRadius.lg }]}>
                        <TouchableOpacity 
                            style={styles.modalCloseButton} 
                            onPress={() => setShowBudgetModal(false)}
                        >
                            <Ionicons name="close" size={24} color={colors.textMuted} />
                        </TouchableOpacity>

                        <View style={[styles.modalIconContainer, { backgroundColor: colors.financial + '20' }]}>
                            <Ionicons name="wallet" size={32} color={colors.financial} />
                        </View>

                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Monthly Budget</Text>
                        <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                            Set your monthly spending limit to track your finances
                        </Text>

                        <View style={[styles.inputContainer, { backgroundColor: colors.surfaceLight, borderRadius: styleConfig.borderRadius.md }]}>
                            <Text style={[styles.inputPrefix, { color: colors.financial }]}>₹</Text>
                            <TextInput
                                style={[styles.inputField, { color: colors.textPrimary }]}
                                value={budgetAmount}
                                onChangeText={setBudgetAmount}
                                keyboardType="decimal-pad"
                                placeholder="5000"
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

            {/* Water Goal Modal */}
            <Modal
                visible={showWaterModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowWaterModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: styleConfig.borderRadius.lg }]}>
                        <TouchableOpacity 
                            style={styles.modalCloseButton} 
                            onPress={() => setShowWaterModal(false)}
                        >
                            <Ionicons name="close" size={24} color={colors.textMuted} />
                        </TouchableOpacity>

                        <View style={[styles.modalIconContainer, { backgroundColor: colors.info + '20' }]}>
                            <Ionicons name="water" size={32} color={colors.info} />
                        </View>

                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Daily Water Goal</Text>
                        <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                            How many glasses of water do you want to drink daily?
                        </Text>

                        <View style={[styles.inputContainer, { backgroundColor: colors.surfaceLight, borderRadius: styleConfig.borderRadius.md }]}>
                            <TextInput
                                style={[styles.inputField, styles.inputFieldCentered, { color: colors.textPrimary }]}
                                value={waterGoal}
                                onChangeText={setWaterGoal}
                                keyboardType="number-pad"
                                placeholder="8"
                                placeholderTextColor={colors.textMuted}
                            />
                            <Text style={[styles.inputSuffix, { color: colors.textSecondary }]}>glasses</Text>
                        </View>

                        <Button
                            title="Save Goal"
                            onPress={handleSaveWaterGoal}
                            color={colors.info}
                        />
                    </View>
                </View>
            </Modal>

            {/* Meditation Goal Modal */}
            <Modal
                visible={showMeditationModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowMeditationModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: styleConfig.borderRadius.lg }]}>
                        <TouchableOpacity 
                            style={styles.modalCloseButton} 
                            onPress={() => setShowMeditationModal(false)}
                        >
                            <Ionicons name="close" size={24} color={colors.textMuted} />
                        </TouchableOpacity>

                        <View style={[styles.modalIconContainer, { backgroundColor: colors.mindfulness + '20' }]}>
                            <Ionicons name="leaf" size={32} color={colors.mindfulness} />
                        </View>

                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Daily Meditation</Text>
                        <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                            Set your daily meditation target in minutes
                        </Text>

                        <View style={[styles.inputContainer, { backgroundColor: colors.surfaceLight, borderRadius: styleConfig.borderRadius.md }]}>
                            <TextInput
                                style={[styles.inputField, styles.inputFieldCentered, { color: colors.textPrimary }]}
                                value={meditationGoal}
                                onChangeText={setMeditationGoal}
                                keyboardType="number-pad"
                                placeholder="10"
                                placeholderTextColor={colors.textMuted}
                            />
                            <Text style={[styles.inputSuffix, { color: colors.textSecondary }]}>min/day</Text>
                        </View>

                        <Button
                            title="Save Goal"
                            onPress={handleSaveMeditationGoal}
                            color={colors.mindfulness}
                        />
                    </View>
                </View>
            </Modal>

            {/* Weight Goal Modal */}
            <Modal
                visible={showWeightGoalModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowWeightGoalModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: styleConfig.borderRadius.lg }]}
                    >
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setShowWeightGoalModal(false)}
                        >
                            <Ionicons name="close" size={24} color={colors.textMuted} />
                        </TouchableOpacity>

                        <View style={[styles.modalIconContainer, { backgroundColor: colors.health + '20' }]}
                            >
                            <Ionicons name="fitness" size={32} color={colors.health} />
                        </View>

                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Weight Goal</Text>
                        <Text style={[styles.modalDescription, { color: colors.textSecondary }]}
                            >
                            Set your target weight to track progress
                        </Text>

                        <View style={[styles.inputContainer, { backgroundColor: colors.surfaceLight, borderRadius: styleConfig.borderRadius.md }]}
                        >
                            <TextInput
                                style={[styles.inputField, styles.inputFieldCentered, { color: colors.textPrimary }]}
                                value={weightGoal}
                                onChangeText={setWeightGoal}
                                keyboardType="decimal-pad"
                                placeholder={settings.weightUnit === 'kg' ? '70' : '154'}
                                placeholderTextColor={colors.textMuted}
                            />
                            <Text style={[styles.inputSuffix, { color: colors.textSecondary }]}
                                >
                                {settings.weightUnit}
                            </Text>
                        </View>

                        <Button
                            title="Save Goal"
                            onPress={handleSaveWeightGoal}
                            color={colors.health}
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
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: styleConfig.borderRadius.lg }]}>
                        <TouchableOpacity 
                            style={styles.modalCloseButton} 
                            onPress={() => setShowStreakInfoModal(false)}
                        >
                            <Ionicons name="close" size={24} color={colors.textMuted} />
                        </TouchableOpacity>

                        <View style={[styles.modalIconContainer, { backgroundColor: colors.streak + '20' }]}>
                            <Ionicons name="flame" size={32} color={colors.streak} />
                        </View>

                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>How Streaks Work</Text>
                        <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                            {settings?.streakMode === 'all' ? 'Challenge Mode' : 'Easy Mode'} is active
                        </Text>

                        <View style={[styles.infoCard, { backgroundColor: colors.surfaceLight, borderRadius: styleConfig.borderRadius.md }]}>
                            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{streakModeDescription}</Text>
                        </View>

                        <View style={styles.categoryList}>
                            <View style={styles.categoryItem}>
                                <View style={[styles.categoryIcon, { backgroundColor: colors.financial + '20' }]}>
                                    <Ionicons name="wallet" size={16} color={colors.financial} />
                                </View>
                                <Text style={[styles.categoryText, { color: colors.textSecondary }]}>Finance: Log any expense</Text>
                            </View>
                            <View style={styles.categoryItem}>
                                <View style={[styles.categoryIcon, { backgroundColor: colors.health + '20' }]}>
                                    <Ionicons name="fitness" size={16} color={colors.health} />
                                </View>
                                <Text style={[styles.categoryText, { color: colors.textSecondary }]}>Health: Log workout or water</Text>
                            </View>
                            <View style={styles.categoryItem}>
                                <View style={[styles.categoryIcon, { backgroundColor: colors.mindfulness + '20' }]}>
                                    <Ionicons name="leaf" size={16} color={colors.mindfulness} />
                                </View>
                                <Text style={[styles.categoryText, { color: colors.textSecondary }]}>Mind: Meditate, journal, or mood</Text>
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
    colorSchemeRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    colorSchemeCard: {
        flex: 1,
        padding: Spacing.md,
        borderWidth: 1,
        alignItems: 'center',
    },
    colorSchemePreview: {
        width: '100%',
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    colorSchemeDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    styleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -Spacing.xs,
    },
    unitRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Spacing.sm,
    },
    unitButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        borderWidth: 1,
        marginRight: Spacing.sm,
        alignItems: 'center',
    },
    unitButtonLast: {
        marginRight: 0,
    },
    unitLabel: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
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
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        padding: Spacing.xl,
        paddingTop: Spacing.lg,
        alignItems: 'center',
    },
    modalCloseButton: {
        position: 'absolute',
        top: Spacing.md,
        right: Spacing.md,
        padding: Spacing.xs,
        zIndex: 1,
    },
    modalIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
        marginTop: Spacing.sm,
    },
    modalTitle: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.xs,
        textAlign: 'center',
    },
    modalDescription: {
        fontSize: FontSize.sm,
        textAlign: 'center',
        marginBottom: Spacing.lg,
        lineHeight: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        marginBottom: Spacing.lg,
        width: '100%',
    },
    inputPrefix: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        marginRight: Spacing.sm,
    },
    inputField: {
        flex: 1,
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
    },
    inputFieldCentered: {
        textAlign: 'center',
    },
    inputSuffix: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
        marginLeft: Spacing.sm,
    },
    infoCard: {
        padding: Spacing.md,
        marginBottom: Spacing.lg,
        width: '100%',
    },
    infoText: {
        fontSize: FontSize.sm,
        lineHeight: 20,
        textAlign: 'center',
    },
    categoryList: {
        width: '100%',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    categoryText: {
        fontSize: FontSize.sm,
        flex: 1,
    },
});
