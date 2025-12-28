import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { AppState as RNAppState } from 'react-native';
import { AppState, AppAction, User, Streaks, AppSettings, DailyChallenge } from '../types';
import { XP_CONFIG, ACHIEVEMENTS, DAILY_CHALLENGES } from '../constants/gamification';
import * as Database from '../lib/database';
import { format, subDays, differenceInDays, parseISO } from 'date-fns';

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
    checkAchievements: () => void;
    generateDailyChallenges: () => Promise<void>;
    completeChallenge: (challengeId: string) => void;
    updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
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
            await Database.saveSetting('theme', state.settings.theme);
            await Database.saveSetting('style', state.settings.style);
            await Database.saveSetting('streakMode', state.settings.streakMode);
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

    // Generate daily challenges
    const generateDailyChallenges = useCallback(async () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        
        // Check if we already have challenges for today
        const existingChallenges = await Database.getDailyChallenges(today);
        if (existingChallenges && existingChallenges.length > 0) {
            dispatch({ type: 'SET_DAILY_CHALLENGES', payload: existingChallenges });
            return;
        }

        // Generate 3 random challenges (1 from each category)
        const categories: ('financial' | 'health' | 'mindfulness')[] = ['financial', 'health', 'mindfulness'];
        const newChallenges: DailyChallenge[] = categories.map(category => {
            const categoryTemplates = DAILY_CHALLENGES[category];
            const randomTemplate = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
            return {
                id: `${today}-${randomTemplate.id}`,
                title: randomTemplate.title,
                description: randomTemplate.description,
                xpReward: randomTemplate.xpReward,
                category,
                completed: false,
                date: today,
            };
        });

        // Save to database and state
        await Database.saveDailyChallenges(newChallenges);
        dispatch({ type: 'SET_DAILY_CHALLENGES', payload: newChallenges });
    }, []);

    // Complete a challenge
    const completeChallenge = useCallback(async (challengeId: string) => {
        const challenge = state.dailyChallenges.find(c => c.id === challengeId);
        if (challenge && !challenge.completed) {
            dispatch({ type: 'COMPLETE_CHALLENGE', payload: challengeId });
            dispatch({ type: 'ADD_XP', payload: challenge.xpReward });
            await Database.completeChallenge(challengeId);
        }
    }, [state.dailyChallenges]);

    // Update settings and save immediately
    const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
        dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
        // Save settings immediately to database
        try {
            for (const [key, value] of Object.entries(newSettings)) {
                await Database.saveSetting(key, value.toString());
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }, []);

    // Check and auto-complete daily challenges based on user activity
    const checkDailyChallenges = useCallback(async () => {
        if (state.dailyChallenges.length === 0) return;

        const today = format(new Date(), 'yyyy-MM-dd');
        const todayExpenses = state.financial.expenses.filter(e => e.date === today);
        const todayWorkouts = state.health.workouts.filter(w => w.date === today);
        const todayWater = state.health.waterLogs.find(w => w.date === today)?.glasses || 0;
        const todayMeditations = state.mindfulness.meditations.filter(m => m.date === today);
        const todayMeditationMins = todayMeditations.reduce((sum, m) => sum + m.duration, 0);
        const todayJournals = state.mindfulness.journals.filter(j => j.date === today);
        const todayGratitude = state.mindfulness.gratitudeLogs.filter(g => g.date === today);
        
        const dailyBudget = state.financial.monthlyBudget > 0 ? state.financial.monthlyBudget / 30 : 0;
        const todaySpent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

        for (const challenge of state.dailyChallenges) {
            if (challenge.completed || challenge.date !== today) continue;

            let shouldComplete = false;
            const challengeType = challenge.id.split('-').pop(); // Get the challenge type from ID

            switch (challengeType) {
                case 'noSpend':
                    // Complete if no expenses logged today (checked at end of day)
                    shouldComplete = todayExpenses.length === 0;
                    break;
                case 'logAll':
                    shouldComplete = todayExpenses.length >= 3;
                    break;
                case 'underBudget':
                    shouldComplete = dailyBudget > 0 && todaySpent <= dailyBudget * 0.8 && todayExpenses.length > 0;
                    break;

                // Health challenges
                case 'workout':
                    shouldComplete = todayWorkouts.length >= 1;
                    break;
                case 'hydrate':
                    shouldComplete = todayWater >= 8;
                    break;
                case 'steps':
                    // Steps challenge - we don't track steps yet, so skip
                    break;

                // Mindfulness challenges
                case 'meditate':
                    shouldComplete = todayMeditationMins >= 10;
                    break;
                case 'journal':
                    shouldComplete = todayJournals.length >= 1;
                    break;
                case 'gratitude':
                    shouldComplete = todayGratitude.length >= 1 && 
                        (todayGratitude[0].items?.length >= 3 || todayGratitude.length >= 3);
                    break;
            }

            if (shouldComplete) {
                dispatch({ type: 'COMPLETE_CHALLENGE', payload: challenge.id });
                dispatch({ type: 'ADD_XP', payload: challenge.xpReward });
                await Database.completeChallenge(challenge.id);
            }
        }
    }, [state.dailyChallenges, state.financial, state.health, state.mindfulness]);

    // Check and unlock achievements
    const checkAchievements = useCallback(() => {
        if (!state.user) return;

        const unlocked = state.user.achievements;
        const unlock = (id: string) => {
            if (!unlocked.includes(id)) {
                dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: id });
                const achievement = ACHIEVEMENTS[id as keyof typeof ACHIEVEMENTS];
                if (achievement) {
                    dispatch({ type: 'ADD_XP', payload: achievement.xpReward });
                }
            }
        };

        // Financial achievements
        if (state.financial.expenses.length >= 1) {
            unlock('firstExpense');
        }

        // Health achievements
        if (state.health.workouts.length >= 1) {
            unlock('firstWorkout');
        }

        // Check water logging streak (7 days)
        const waterDates = new Set(state.health.waterLogs.map(w => w.date));
        let waterStreak = 0;
        for (let i = 0; i < 7; i++) {
            const checkDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
            if (waterDates.has(checkDate)) {
                waterStreak++;
            } else {
                break;
            }
        }
        if (waterStreak >= 7) {
            unlock('hydrationHero');
        }

        // Check workout streak (30 days)
        const workoutDates = new Set(state.health.workouts.map(w => w.date));
        let workoutStreak = 0;
        for (let i = 0; i < 30; i++) {
            const checkDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
            if (workoutDates.has(checkDate)) {
                workoutStreak++;
            } else {
                break;
            }
        }
        if (workoutStreak >= 30) {
            unlock('fitnessFreak');
        }

        // Mindfulness achievements
        if (state.mindfulness.meditations.length >= 1) {
            unlock('firstMeditation');
        }

        if (state.mindfulness.journals.length >= 10) {
            unlock('journalJourney');
        }

        if (state.mindfulness.meditations.length >= 100) {
            unlock('zenMaster');
        }

        // Streak achievements
        if (state.user.streaks.overall >= 7) {
            unlock('weekStreak');
        }

        if (state.user.streaks.overall >= 30) {
            unlock('monthStreak');
        }

        // Level achievements
        if (state.user.level >= 5) {
            unlock('levelUp5');
        }

        if (state.user.level >= 10) {
            unlock('levelUp10');
        }

        // Budget boss achievement - check if under budget for 7 days
        if (state.financial.monthlyBudget > 0) {
            const dailyBudget = state.financial.monthlyBudget / 30;
            let underBudgetDays = 0;
            for (let i = 0; i < 7; i++) {
                const checkDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
                const dayExpenses = state.financial.expenses
                    .filter(e => e.date === checkDate)
                    .reduce((sum, e) => sum + e.amount, 0);
                if (dayExpenses <= dailyBudget) {
                    underBudgetDays++;
                } else {
                    break;
                }
            }
            if (underBudgetDays >= 7) {
                unlock('budgetBoss');
            }
        }

        // Savings champ - check if any financial goal is completed
        const completedGoal = state.financial.goals.find(g => g.currentAmount >= g.targetAmount);
        if (completedGoal) {
            unlock('savingsChamp');
        }
    }, [state.user, state.financial, state.health, state.mindfulness]);

    // Check achievements when state changes
    useEffect(() => {
        if (!state.isLoading && state.user) {
            checkAchievements();
        }
    }, [state.financial.expenses.length, state.health.workouts.length, state.health.waterLogs.length, 
        state.mindfulness.meditations.length, state.mindfulness.journals.length, 
        state.user?.level, state.user?.streaks.overall]);

    // Generate daily challenges on load
    useEffect(() => {
        if (!state.isLoading && state.user) {
            generateDailyChallenges();
        }
    }, [state.isLoading, state.user]);

    // Check daily challenges when user activity changes
    useEffect(() => {
        if (!state.isLoading && state.dailyChallenges.length > 0) {
            checkDailyChallenges();
        }
    }, [state.financial.expenses.length, state.health.workouts.length, state.health.waterLogs, 
        state.mindfulness.meditations.length, state.mindfulness.journals.length,
        state.mindfulness.gratitudeLogs.length, state.dailyChallenges.length]);

    // End-of-day check for all challenges (runs at 11 PM)
    const checkEndOfDayChallenges = useCallback(async () => {
        if (state.dailyChallenges.length === 0) return;

        const now = new Date();
        const isEndOfDay = now.getHours() >= 23;
        
        if (!isEndOfDay) return; // Only run at end of day

        const today = format(new Date(), 'yyyy-MM-dd');
        const todayExpenses = state.financial.expenses.filter(e => e.date === today);
        const todayWorkouts = state.health.workouts.filter(w => w.date === today);
        const todayWater = state.health.waterLogs.find(w => w.date === today)?.glasses || 0;
        const todayMeditations = state.mindfulness.meditations.filter(m => m.date === today);
        const todayMeditationMins = todayMeditations.reduce((sum, m) => sum + m.duration, 0);
        const todayJournals = state.mindfulness.journals.filter(j => j.date === today);
        const todayGratitude = state.mindfulness.gratitudeLogs.filter(g => g.date === today);
        
        const dailyBudget = state.financial.monthlyBudget > 0 ? state.financial.monthlyBudget / 30 : 0;
        const todaySpent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

        for (const challenge of state.dailyChallenges) {
            if (challenge.completed || challenge.date !== today) continue;

            let shouldComplete = false;
            const challengeType = challenge.id.split('-').pop();

            // Use the same logic as regular checks, but this ensures end-of-day completion
            switch (challengeType) {
                case 'noSpend':
                    shouldComplete = todayExpenses.length === 0;
                    break;
                case 'logAll':
                    shouldComplete = todayExpenses.length >= 3;
                    break;
                case 'underBudget':
                    shouldComplete = dailyBudget > 0 && todaySpent <= dailyBudget * 0.8;
                    break;
                case 'workout':
                    shouldComplete = todayWorkouts.length >= 1;
                    break;
                case 'hydrate':
                    shouldComplete = todayWater >= 8;
                    break;
                case 'meditate':
                    shouldComplete = todayMeditationMins >= 10;
                    break;
                case 'journal':
                    shouldComplete = todayJournals.length >= 1;
                    break;
                case 'gratitude':
                    shouldComplete = todayGratitude.length >= 1 && 
                        (todayGratitude[0].items?.length >= 3 || todayGratitude.length >= 3);
                    break;
            }

            if (shouldComplete) {
                dispatch({ type: 'COMPLETE_CHALLENGE', payload: challenge.id });
                dispatch({ type: 'ADD_XP', payload: challenge.xpReward });
                await Database.completeChallenge(challenge.id);
            }
        }
    }, [state.dailyChallenges, state.financial, state.health, state.mindfulness]);

    // Periodic check for end-of-day challenge completions (every hour)
    useEffect(() => {
        const checkChallenges = () => {
            if (!state.isLoading && state.dailyChallenges.length > 0) {
                checkDailyChallenges();
                checkEndOfDayChallenges(); // This will only complete at end of day
            }
        };

        // Check immediately and then every hour
        checkChallenges();
        const interval = setInterval(checkChallenges, 60 * 60 * 1000); // 1 hour

        return () => clearInterval(interval);
    }, [state.isLoading, state.dailyChallenges.length, checkDailyChallenges, checkEndOfDayChallenges]);

    // Check challenges when app comes to foreground
    useEffect(() => {
        const subscription = RNAppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active' && !state.isLoading && state.dailyChallenges.length > 0) {
                checkDailyChallenges();
                checkEndOfDayChallenges();
            }
        });

        return () => subscription?.remove();
    }, [state.isLoading, state.dailyChallenges.length, checkDailyChallenges, checkEndOfDayChallenges]);

    return (
        <AppContext.Provider value={{ state, dispatch, addXP, saveState, resetData, checkAchievements, generateDailyChallenges, completeChallenge, updateSettings }}>
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
