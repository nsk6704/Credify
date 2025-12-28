import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { FontSize, Spacing, BorderRadius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { RootTabParamList } from '../types';
import {
    HomeScreen,
    FinancialScreen,
    HealthScreen,
    MindfulnessScreen,
    ProfileScreen,
} from '../screens';

const Tab = createBottomTabNavigator<RootTabParamList>();

type IconName = keyof typeof Ionicons.glyphMap;

const getTabIcon = (routeName: string, focused: boolean): IconName => {
    const icons: Record<string, { active: IconName; inactive: IconName }> = {
        Home: { active: 'home', inactive: 'home-outline' },
        Financial: { active: 'wallet', inactive: 'wallet-outline' },
        Health: { active: 'fitness', inactive: 'fitness-outline' },
        Mindfulness: { active: 'leaf', inactive: 'leaf-outline' },
        Profile: { active: 'person', inactive: 'person-outline' },
    };

    return focused ? icons[routeName].active : icons[routeName].inactive;
};

export function MainNavigator() {
    const { colors, styleConfig } = useTheme();

    const getTabColor = (routeName: string): string => {
        const tabColors: Record<string, string> = {
            Home: colors.primary,
            Financial: colors.financial,
            Health: colors.health,
            Mindfulness: colors.mindfulness,
            Profile: colors.textSecondary,
        };
        return tabColors[routeName] || colors.primary;
    };

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopWidth: styleConfig.borderWidth,
                    borderTopColor: colors.border,
                    height: Platform.OS === 'ios' ? 88 : 68,
                    paddingTop: Spacing.sm,
                    paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.sm,
                    paddingHorizontal: Spacing.xs,
                },
                tabBarActiveTintColor: getTabColor(route.name),
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: styles.tabLabel,
                tabBarIconStyle: styles.tabIcon,
                tabBarIcon: ({ focused, color, size }) => {
                    const iconName = getTabIcon(route.name, focused);
                    return (
                        <View style={[
                            styles.iconContainer,
                            { borderRadius: styleConfig.borderRadius.md },
                            focused && { backgroundColor: color + '20' }
                        ]}>
                            <Ionicons name={iconName} size={22} color={color} />
                        </View>
                    );
                },
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{ tabBarLabel: 'Home' }}
            />
            <Tab.Screen
                name="Financial"
                component={FinancialScreen}
                options={{ tabBarLabel: 'Finance' }}
            />
            <Tab.Screen
                name="Health"
                component={HealthScreen}
                options={{ tabBarLabel: 'Health' }}
            />
            <Tab.Screen
                name="Mindfulness"
                component={MindfulnessScreen}
                options={{ tabBarLabel: 'Mindful' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarLabel: 'Profile' }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabLabel: {
        fontSize: FontSize.xs,
        fontWeight: '600',
        marginTop: 4,
    },
    tabIcon: {
        marginTop: 2,
    },
    iconContainer: {
        width: 44,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
