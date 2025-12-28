import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { MainNavigator } from './navigation/MainNavigator';
import { FontSize, FontWeight } from './constants/theme';

function AppContent() {
    const { state } = useApp();
    const { colors, isDark } = useTheme();

    // Loading screen
    if (state.isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
                <View style={styles.logoWrapper}>
                    <View style={[styles.logoBg, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.loadingLogo, { color: colors.textPrimary }]}>C</Text>
                    </View>
                </View>
                <Text style={[styles.loadingTitle, { color: colors.textPrimary }]}>Credify</Text>
                <ActivityIndicator color={colors.primary} size="large" style={styles.spinner} />
            </View>
        );
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
        <SafeAreaProvider>
            <AppProvider>
                <ThemedApp />
            </AppProvider>
        </SafeAreaProvider>
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
