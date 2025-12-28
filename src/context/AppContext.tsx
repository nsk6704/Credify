import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, AppAction, User, Streaks, AppSettings } from '../types';
import { XP_CONFIG } from '../constants/gamification';
import * as Database from '../lib/database';

// Initial state
const initialStreaks: Streaks = {
    financial: 0,
    health: 0,
    mindfulness: 0,
    overall: 0,
    lastActivityDate: '',
};

const initialSettings: AppSettings = {
    streakMode: 'all',
    theme: 'dark',
    style: 'modern',
};

const initialState: AppState = {
    user: null,
    financial: {
        expenses: [],
        budgets: [],
        goals: [],
        monthlyBudget: 0,
        currency: '$',
    },
    health: {
        workouts: [],
        waterLogs: [],
        meals: [],
        dailyWaterGoal: 8,
        dailyCalorieGoal: 2000,
        dailyStepGoal: 10000,
    },
    mindfulness: {
        meditations: [],
        journals: [],
        gratitudeLogs: [],
        moods: [],
        meditationGoal: 10,
    },
    dailyChallenges: [],
    settings: initialSettings,
    isLoading: true,
};

// Helper to calculate level from XP
export const calculateLevel = (xp: number): { level: number; title: string; progress: number; xpToNext: number } => {
    const levels = XP_CONFIG.levels;
    let currentLevel = levels[0];
    let nextLevel = levels[1];

    for (let i = 0; i < levels.length; i++) {
        if (xp >= levels[i].minXP) {
            currentLevel = levels[i];
            nextLevel = levels[i + 1] || levels[i];
        } else {
            break;
        }
    }

    const xpInCurrentLevel = xp - currentLevel.minXP;
    const xpNeededForNext = nextLevel.minXP - currentLevel.minXP;
    const progress = xpNeededForNext > 0 ? xpInCurrentLevel / xpNeededForNext : 1;

    return {
        level: currentLevel.level,
        title: currentLevel.title,
        progress,
        xpToNext: nextLevel.minXP - xp,
    };
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, user: action.payload };

        case 'ADD_XP':
            if (!state.user) return state;
            const newTotalXP = state.user.totalXP + action.payload;
            const levelInfo = calculateLevel(newTotalXP);
            return {
                ...state,
                user: {
                    ...state.user,
                    totalXP: newTotalXP,
                    level: levelInfo.level,
                },
            };

        case 'UNLOCK_ACHIEVEMENT':
            if (!state.user) return state;
            if (state.user.achievements.includes(action.payload)) return state;
            return {
                ...state,
                user: {
                    ...state.user,
                    achievements: [...state.user.achievements, action.payload],
                },
            };

        case 'UPDATE_STREAK':
            if (!state.user) return state;
            return {
                ...state,
                user: {
                    ...state.user,
                    streaks: {
                        ...state.user.streaks,
                        [action.payload.category]: action.payload.value,
                    },
                },
            };

        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };

        // Financial actions
        case 'ADD_EXPENSE':
            return {
                ...state,
                financial: {
                    ...state.financial,
                    expenses: [action.payload, ...state.financial.expenses],
                },
            };

        case 'DELETE_EXPENSE':
            return {
                ...state,
                financial: {
                    ...state.financial,
                    expenses: state.financial.expenses.filter(e => e.id !== action.payload),
                },
            };

        case 'SET_BUDGET':
            const existingBudgetIndex = state.financial.budgets.findIndex(
                b => b.category === action.payload.category
            );
            const newBudgets = [...state.financial.budgets];
            if (existingBudgetIndex >= 0) {
                newBudgets[existingBudgetIndex] = action.payload;
            } else {
                newBudgets.push(action.payload);
            }
            return {
                ...state,
                financial: { ...state.financial, budgets: newBudgets },
            };

        case 'ADD_FINANCIAL_GOAL':
            return {
                ...state,
                financial: {
                    ...state.financial,
                    goals: [...state.financial.goals, action.payload],
                },
            };

        case 'UPDATE_FINANCIAL_GOAL':
            return {
                ...state,
                financial: {
                    ...state.financial,
                    goals: state.financial.goals.map(g =>
                        g.id === action.payload.id ? action.payload : g
                    ),
                },
            };

        // Health actions
        case 'ADD_WORKOUT':
            return {
                ...state,
                health: {
                    ...state.health,
                    workouts: [action.payload, ...state.health.workouts],
                },
            };

        case 'LOG_WATER':
            const existingWaterLog = state.health.waterLogs.find(
                w => w.date === action.payload.date
            );
            if (existingWaterLog) {
                return {
                    ...state,
                    health: {
                        ...state.health,
                        waterLogs: state.health.waterLogs.map(w =>
                            w.date === action.payload.date
                                ? { ...w, glasses: w.glasses + action.payload.glasses }
                                : w
                        ),
                    },
                };
            }
            return {
                ...state,
                health: {
                    ...state.health,
                    waterLogs: [action.payload, ...state.health.waterLogs],
                },
            };

        case 'ADD_MEAL':
            return {
                ...state,
                health: {
                    ...state.health,
                    meals: [action.payload, ...state.health.meals],
                },
            };

        // Mindfulness actions
        case 'ADD_MEDITATION':
            return {
                ...state,
                mindfulness: {
                    ...state.mindfulness,
                    meditations: [action.payload, ...state.mindfulness.meditations],
                },
            };

        case 'ADD_JOURNAL':
            return {
                ...state,
                mindfulness: {
                    ...state.mindfulness,
                    journals: [action.payload, ...state.mindfulness.journals],
                },
            };

        case 'ADD_GRATITUDE':
            return {
                ...state,
                mindfulness: {
                    ...state.mindfulness,
                    gratitudeLogs: [action.payload, ...state.mindfulness.gratitudeLogs],
                },
            };

        case 'ADD_MOOD':
            return {
                ...state,
                mindfulness: {
                    ...state.mindfulness,
                    moods: [action.payload, ...state.mindfulness.moods],
                },
            };

        // Challenge actions
        case 'SET_DAILY_CHALLENGES':
            return { ...state, dailyChallenges: action.payload };

        case 'COMPLETE_CHALLENGE':
            return {
                ...state,
                dailyChallenges: state.dailyChallenges.map(c =>
                    c.id === action.payload ? { ...c, completed: true } : c
                ),
            };

        case 'UPDATE_SETTINGS':
            return {
                ...state,
                settings: { ...state.settings, ...action.payload },
            };

        case 'LOAD_STATE':
            return { ...state, ...action.payload, isLoading: false };

        default:
            return state;
    }
}

// Context
interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
    addXP: (amount: number) => void;
    saveState: () => Promise<void>;
    resetData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Load state from SQLite on mount
    useEffect(() => {
        loadState();
    }, []);

    // Save state whenever it changes (debounced)
    useEffect(() => {
        if (!state.isLoading && state.user) {
            const timeoutId = setTimeout(() => {
                saveState();
            }, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [state]);

    const loadState = async () => {
        try {
            await Database.initDatabase();
            
            // Cleanup old daily challenges (keep last 30 days)
            await Database.cleanupOldChallenges(30);
            
            const savedState = await Database.loadAppState();
            
            if (savedState.user) {
                dispatch({ type: 'LOAD_STATE', payload: savedState });
            } else {
                // Create new user for first-time launch
                const newUser: User = {
                    id: Date.now().toString(),
                    name: 'Player',
                    createdAt: new Date().toISOString(),
                    totalXP: 0,
                    level: 1,
                    streaks: initialStreaks,
                    achievements: [],
                };
                await Database.saveUser(newUser);
                dispatch({ type: 'SET_USER', payload: newUser });
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        } catch (error) {
            console.error('Failed to load state from SQLite:', error);
            // Create new user on error
            const newUser: User = {
                id: Date.now().toString(),
                name: 'Player',
                createdAt: new Date().toISOString(),
                totalXP: 0,
                level: 1,
                streaks: initialStreaks,
                achievements: [],
            };
            dispatch({ type: 'SET_USER', payload: newUser });
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const saveState = async () => {
        try {
            if (state.user) {
                await Database.saveUser(state.user);
            }
            // Save settings
            await Database.saveSetting('monthlyBudget', state.financial.monthlyBudget.toString());
            await Database.saveSetting('currency', state.financial.currency);
            await Database.saveSetting('dailyWaterGoal', state.health.dailyWaterGoal.toString());
            await Database.saveSetting('dailyCalorieGoal', state.health.dailyCalorieGoal.toString());
            await Database.saveSetting('dailyStepGoal', state.health.dailyStepGoal.toString());
            await Database.saveSetting('meditationGoal', state.mindfulness.meditationGoal.toString());
        } catch (error) {
            console.error('Failed to save state to SQLite:', error);
        }
    };

    const resetData = async () => {
        try {
            await Database.resetAllData();
            const newUser: User = {
                id: Date.now().toString(),
                name: 'Player',
                createdAt: new Date().toISOString(),
                totalXP: 0,
                level: 1,
                streaks: initialStreaks,
                achievements: [],
            };
            await Database.saveUser(newUser);
            dispatch({
                type: 'LOAD_STATE',
                payload: {
                    user: newUser,
                    financial: {
                        expenses: [],
                        budgets: [],
                        goals: [],
                        monthlyBudget: 0,
                        currency: '$',
                    },
                    health: {
                        workouts: [],
                        waterLogs: [],
                        meals: [],
                        dailyWaterGoal: 8,
                        dailyCalorieGoal: 2000,
                        dailyStepGoal: 10000,
                    },
                    mindfulness: {
                        meditations: [],
                        journals: [],
                        gratitudeLogs: [],
                        moods: [],
                        meditationGoal: 10,
                    },
                    dailyChallenges: [],
                },
            });
        } catch (error) {
            console.error('Failed to reset data:', error);
        }
    };

    const addXP = (amount: number) => {
        dispatch({ type: 'ADD_XP', payload: amount });
    };

    return (
        <AppContext.Provider value={{ state, dispatch, addXP, saveState, resetData }}>
            {children}
        </AppContext.Provider>
    );
}

// Hook
export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}

export { AppContext };
