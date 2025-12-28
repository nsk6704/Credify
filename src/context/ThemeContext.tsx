import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useApp } from './AppContext';
import { DarkTheme, LightTheme, ThemeColors, BorderRadius as BR, Spacing as SP } from '../constants/theme';
import { AppStyle } from '../types';

// Style configurations for different visual styles
interface StyleConfig {
    borderRadius: {
        sm: number;
        md: number;
        lg: number;
        xl: number;
        full: number;
    };
    cardPadding: number;
    borderWidth: number;
    shadowOpacity: number;
    spacing: number; // multiplier for extra spacing
    fontScale: number; // multiplier for font sizes
}

const StyleConfigs: Record<AppStyle, StyleConfig> = {
    modern: {
        borderRadius: { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 },
        cardPadding: 16,
        borderWidth: 1,
        shadowOpacity: 0.1,
        spacing: 1,
        fontScale: 1,
    },
    minimal: {
        borderRadius: { sm: 0, md: 0, lg: 0, xl: 0, full: 9999 },
        cardPadding: 14,
        borderWidth: 0,
        shadowOpacity: 0,
        spacing: 0.9,
        fontScale: 0.95,
    },
    classic: {
        borderRadius: { sm: 0, md: 2, lg: 4, xl: 4, full: 9999 },
        cardPadding: 18,
        borderWidth: 2,
        shadowOpacity: 0,
        spacing: 1.1,
        fontScale: 1.05,
    },
    vibrant: {
        borderRadius: { sm: 16, md: 20, lg: 24, xl: 32, full: 9999 },
        cardPadding: 22,
        borderWidth: 0,
        shadowOpacity: 0.2,
        spacing: 1.15,
        fontScale: 1,
    },
};

interface ThemeContextValue {
    colors: ThemeColors;
    styleConfig: StyleConfig;
    isDark: boolean;
    style: AppStyle;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const { state } = useApp();
    const { settings } = state;

    const value = useMemo<ThemeContextValue>(() => {
        const isDark = settings?.theme !== 'light';
        const colors = isDark ? DarkTheme : LightTheme;
        const style = settings?.style || 'modern';
        const styleConfig = StyleConfigs[style];

        return {
            colors,
            styleConfig,
            isDark,
            style,
        };
    }, [settings?.theme, settings?.style]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);
    if (!context) {
        // Return default values if used outside provider
        return {
            colors: DarkTheme,
            styleConfig: StyleConfigs.modern,
            isDark: true,
            style: 'modern',
        };
    }
    return context;
}

// Export for convenience
export { DarkTheme, LightTheme, StyleConfigs };
