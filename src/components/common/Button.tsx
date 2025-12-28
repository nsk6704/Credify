import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
    ActivityIndicator,
} from 'react-native';
import { FontSize, Spacing, FontWeight } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
    color?: string;
}

export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon,
    style,
    textStyle,
    color,
}: ButtonProps) {
    const { colors, styleConfig } = useTheme();
    
    const sizeStyles = {
        sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
        md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
        lg: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl },
    };

    const textSizes = {
        sm: FontSize.sm,
        md: FontSize.md,
        lg: FontSize.lg,
    };

    const getButtonStyle = (): ViewStyle => {
        const base: ViewStyle = {
            borderRadius: styleConfig.borderRadius.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            ...sizeStyles[size],
        };

        switch (variant) {
            case 'secondary':
                return { ...base, backgroundColor: colors.surfaceLight };
            case 'outline':
                return { ...base, backgroundColor: 'transparent', borderWidth: 1, borderColor: color || colors.primary };
            case 'ghost':
                return { ...base, backgroundColor: 'transparent' };
            default:
                return { ...base, backgroundColor: color || colors.primary };
        }
    };

    const getTextStyle = (): TextStyle => {
        const base: TextStyle = {
            fontSize: textSizes[size],
            fontWeight: FontWeight.semibold,
        };

        switch (variant) {
            case 'secondary':
                return { ...base, color: colors.textPrimary };
            case 'outline':
            case 'ghost':
                return { ...base, color: color || colors.primary };
            default:
                // For primary buttons with custom color, use white text for better contrast
                return { ...base, color: color ? '#FFFFFF' : colors.textPrimary };
        }
    };

    const content = (
        <>
            {loading ? (
                <ActivityIndicator color={color ? '#FFFFFF' : colors.textPrimary} size="small" />
            ) : (
                <>
                    {icon && <Text style={{ marginRight: Spacing.sm }}>{icon}</Text>}
                    <Text style={[getTextStyle(), textStyle]}>{title}</Text>
                </>
            )}
        </>
    );

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[getButtonStyle(), { opacity: disabled ? 0.5 : 1 }, style]}
            activeOpacity={0.7}
        >
            {content}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({});
