import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { MainNavigator } from './navigation/MainNavigator';
import { ErrorBoundary } from './components';
import { Splash } from './components';
import { FontSize, FontWeight } from './constants/theme';

function AppContent() {
    const { state } = useApp();
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        if (!state.isLoading) {
            const timer = setTimeout(() => setShowSplash(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [state.isLoading]);

    // Loading screen
    if (state.isLoading || showSplash) {
        return <Splash loadingText="Loading your experience..."  />;
    }

    // Main app
    return (
        <NavigationContainer>
            <MainNavigator />
        </NavigationContainer>
    );
}

function ThemedApp() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}

export default function App() {
    return (
        <ErrorBoundary>
            <SafeAreaProvider>
                <AppProvider>
                    <ThemedApp />
                </AppProvider>
            </SafeAreaProvider>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoWrapper: {
        marginBottom: 20,
    },
    logoBg: {
        width: 80,
        height: 80,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingLogo: {
        fontSize: 36,
        fontWeight: FontWeight.bold,
    },
    loadingTitle: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        letterSpacing: 0.5,
    },
    spinner: {
        marginTop: 32,
    },
});
