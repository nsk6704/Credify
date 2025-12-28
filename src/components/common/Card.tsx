import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, FontSize, FontWeight } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

interface CardProps {
    children: ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
}

export function Card({
    children,
    style,
    onPress,
}: CardProps) {
    const { colors, styleConfig } = useTheme();
    
    const cardStyle = {
        backgroundColor: colors.surface,
        borderRadius: styleConfig.borderRadius.md,
        padding: styleConfig.cardPadding,
        borderWidth: styleConfig.borderWidth,
        borderColor: colors.border,
    };

    const content = (
        <View style={[cardStyle, style]}>{children}</View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
}

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: string;
    color?: string;
    onPress?: () => void;
}

export function StatCard({ title, value, subtitle, icon, color, onPress }: StatCardProps) {
    const { colors } = useTheme();
    
    return (
        <Card onPress={onPress} style={styles.statCard}>
            <View style={styles.statHeader}>
                {icon && <Text style={styles.statIcon}>{icon}</Text>}
                <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
            </View>
            <Text style={[styles.statValue, { color: color || colors.textPrimary }]}>{value}</Text>
            {subtitle && <Text style={[styles.statSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
        </Card>
    );
}

interface SectionCardProps {
    title: string;
    subtitle?: string;
    iconName?: keyof typeof Ionicons.glyphMap;
    color: string;
    onPress?: () => void;
    children?: ReactNode;
    progress?: number;
    disabled?: boolean;
}

export function SectionCard({
    title,
    subtitle,
    iconName,
    color,
    onPress,
    children,
    progress,
    disabled,
}: SectionCardProps) {
    const { colors, styleConfig } = useTheme();
    
    const displayColor = disabled ? colors.textMuted : color;
    const isDisabled = disabled || progress === undefined || progress < 0;
    const displayProgress = isDisabled ? 0 : Math.min(progress * 100, 100);
    
    return (
        <Card onPress={onPress} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
                <View style={[styles.iconContainer, { backgroundColor: displayColor + '20', borderRadius: styleConfig.borderRadius.md }]}>
                    {iconName && <Ionicons name={iconName} size={24} color={displayColor} />}
                </View>
                <View style={styles.sectionInfo}>
                    <Text style={[styles.sectionTitle, { color: disabled ? colors.textMuted : colors.textPrimary }]}>{title}</Text>
                    {subtitle && <Text style={[styles.sectionSubtitle, { color: disabled ? colors.textMuted : colors.textSecondary }]}>{subtitle}</Text>}
                </View>
            </View>
            {progress !== undefined && (
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBg, { backgroundColor: colors.surfaceLighter }]}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${displayProgress}%`, backgroundColor: displayColor },
                            ]}
                        />
                    </View>
                    <Text style={[styles.progressText, { color: disabled ? colors.textMuted : colors.textSecondary }]}>
                        {isDisabled ? '--' : `${Math.round(displayProgress)}%`}
                    </Text>
                </View>
            )}
            {children}
        </Card>
    );
}

const styles = StyleSheet.create({
    statCard: {
        flex: 1,
        minWidth: 100,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    statIcon: {
        fontSize: FontSize.md,
        marginRight: Spacing.xs,
    },
    statTitle: {
        fontSize: FontSize.sm,
    },
    statValue: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
    },
    statSubtitle: {
        fontSize: FontSize.xs,
        marginTop: Spacing.xs,
    },
    sectionCard: {
        marginBottom: Spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionIcon: {
        fontSize: 24,
    },
    sectionInfo: {
        marginLeft: Spacing.md,
        flex: 1,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },
    sectionSubtitle: {
        fontSize: FontSize.sm,
        marginTop: 2,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    progressBg: {
        flex: 1,
        height: 6,
        borderRadius: 999,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 999,
    },
    progressText: {
        fontSize: FontSize.sm,
        marginLeft: Spacing.sm,
        width: 40,
    },
});
