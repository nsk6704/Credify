import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Spacing, FontSize, FontWeight } from '../../constants/theme';
import { useApp, calculateLevel } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';

interface XPBarProps {
    compact?: boolean;
    showLevel?: boolean;
}

export function XPBar({ compact = false, showLevel = true }: XPBarProps) {
    const { state } = useApp();
    const { colors, styleConfig } = useTheme();
    const { totalXP = 0 } = state.user || {};
    const levelInfo = calculateLevel(totalXP);

    if (compact) {
        return (
            <View style={styles.compactContainer}>
                <View style={[styles.compactProgressBg, { backgroundColor: colors.surfaceLighter, borderRadius: styleConfig.borderRadius.full }]}>
                    <View
                        style={[styles.compactProgressFill, { width: `${levelInfo.progress * 100}%`, backgroundColor: colors.xp, borderRadius: styleConfig.borderRadius.full }]}
                    />
                </View>
                <Text style={[styles.compactText, { color: colors.textSecondary }]}>Lvl {levelInfo.level}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: styleConfig.borderRadius.lg }]}>
            {showLevel && (
                <View style={styles.levelBadgeContainer}>
                    <View style={[styles.levelBadge, { backgroundColor: colors.primary, borderRadius: styleConfig.borderRadius.md }]}>
                        <Text style={[styles.levelNumber, { color: '#FFFFFF' }]}>{levelInfo.level}</Text>
                    </View>
                    <Text style={[styles.levelTitle, { color: colors.textPrimary }]}>{levelInfo.title}</Text>
                </View>
            )}

            <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                    <Text style={[styles.xpText, { color: colors.xp }]}>{totalXP.toLocaleString()} XP</Text>
                    <Text style={[styles.toNextText, { color: colors.textMuted }]}>
                        {levelInfo.xpToNext > 0 ? `${levelInfo.xpToNext} to next level` : 'Max Level!'}
                    </Text>
                </View>

                <View style={[styles.progressBg, { backgroundColor: colors.surfaceLighter }]}>
                    <View
                        style={[styles.progressFill, { width: `${levelInfo.progress * 100}%`, backgroundColor: colors.xp }]}
                    />
                </View>
            </View>
        </View>
    );
}

interface StreakBadgeProps {
    count: number;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function StreakBadge({ count, label, size = 'md' }: StreakBadgeProps) {
    const { colors, styleConfig } = useTheme();
    const sizes = {
        sm: { padding: 6, icon: 12, text: FontSize.xs, gap: 4 },
        md: { padding: 8, icon: 16, text: FontSize.sm, gap: 6 },
        lg: { padding: 10, icon: 20, text: FontSize.md, gap: 8 },
    };

    const s = sizes[size];

    return (
        <View style={styles.streakContainer}>
            <View style={[
                styles.streakBadge, 
                { 
                    backgroundColor: colors.streak + '15', 
                    borderRadius: styleConfig.borderRadius.full,
                    borderWidth: 1,
                    borderColor: colors.streak + '30',
                    paddingHorizontal: s.padding + 4,
                    paddingVertical: s.padding,
                    gap: s.gap,
                }
            ]}>
                <Text style={[styles.streakIcon, { fontSize: s.icon }]}>🔥</Text>
                <Text style={[styles.streakCount, { fontSize: s.text, color: colors.streak }]}>{count}</Text>
            </View>
            {label && <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>{label}</Text>}
        </View>
    );
}

interface AchievementBadgeProps {
    icon: string;
    title: string;
    unlocked?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function AchievementBadge({ icon, title, unlocked = true, size = 'md' }: AchievementBadgeProps) {
    const { colors, styleConfig } = useTheme();
    const sizes = {
        sm: { badge: 40, icon: 20 },
        md: { badge: 56, icon: 28 },
        lg: { badge: 72, icon: 36 },
    };

    const s = sizes[size];

    return (
        <View style={styles.achievementContainer}>
            <View
                style={[
                    styles.achievementBadge,
                    { width: s.badge, height: s.badge, backgroundColor: colors.surfaceLight, borderRadius: styleConfig.borderRadius.md },
                    !unlocked && { opacity: 0.4 },
                ]}
            >
                <Text style={[styles.achievementIcon, { fontSize: s.icon }, !unlocked && { opacity: 0.3 }]}>
                    {unlocked ? icon : '🔒'}
                </Text>
            </View>
            <Text style={[styles.achievementTitle, { color: colors.textSecondary }, !unlocked && { opacity: 0.5 }]} numberOfLines={2}>
                {title}
            </Text>
        </View>
    );
}

interface LevelUpModalProps {
    level: number;
    title: string;
    onClose: () => void;
}

export function LevelUpBanner({ level, title }: { level: number; title: string }) {
    const { colors, styleConfig } = useTheme();
    
    return (
        <View style={[styles.levelUpBanner, { backgroundColor: colors.levelUp, borderRadius: styleConfig.borderRadius.md }]}>
            <Text style={styles.levelUpEmoji}>+</Text>
            <View style={styles.levelUpContent}>
                <Text style={[styles.levelUpText, { color: colors.textPrimary }]}>Level Up!</Text>
                <Text style={[styles.levelUpTitle, { color: colors.textPrimary }]}>
                    Level {level} - {title}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.md,
        borderWidth: 1,
    },
    levelBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    levelBadge: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelNumber: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
    },
    levelTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        marginLeft: Spacing.md,
    },
    progressSection: {
        flex: 1,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    xpText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    toNextText: {
        fontSize: FontSize.sm,
    },
    progressBg: {
        height: 12,
        borderRadius: 999,
        overflow: 'hidden',
        position: 'relative',
    },
    progressFill: {
        height: '100%',
        borderRadius: 999,
    },
    // Compact styles
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    compactProgressBg: {
        flex: 1,
        height: 6,
        overflow: 'hidden',
    },
    compactProgressFill: {
        height: '100%',
    },
    compactText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        marginLeft: Spacing.sm,
    },
    // Streak styles
    streakContainer: {
        alignItems: 'center',
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    streakIcon: {
    },
    streakCount: {
        fontWeight: FontWeight.bold,
    },
    streakLabel: {
        fontSize: FontSize.xs,
        marginTop: Spacing.xs,
    },
    // Achievement styles
    achievementContainer: {
        alignItems: 'center',
        width: 80,
    },
    achievementBadge: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    achievementLocked: {
        opacity: 0.6,
    },
    achievementIcon: {},
    achievementTitle: {
        fontSize: FontSize.xs,
        marginTop: Spacing.xs,
        textAlign: 'center',
    },
    // Level up banner
    levelUpBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
    },
    levelUpEmoji: {
        fontSize: 24,
        fontWeight: FontWeight.bold,
    },
    levelUpContent: {
        marginLeft: Spacing.md,
    },
    levelUpText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    levelUpTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
});
