// User and profile types
export interface User {
    id: string;
    name: string;
    createdAt: string;
    totalXP: number;
    level: number;
    streaks: Streaks;
    achievements: string[]; // Achievement IDs
}

export interface Streaks {
    financial: number;
    health: number;
    mindfulness: number;
    overall: number;
    lastActivityDate: string;
}

// Gamification types
export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: 'financial' | 'health' | 'mindfulness' | 'general';
    xpReward: number;
    unlockedAt?: string;
}

export interface DailyChallenge {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    category: 'financial' | 'health' | 'mindfulness';
    completed: boolean;
    date: string;
}

export interface LevelInfo {
    level: number;
    minXP: number;
    title: string;
}

// Financial types
export interface Expense {
    id: string;
    amount: number;
    category: string;
    description: string;
    date: string;
    createdAt: string;
}

export interface Budget {
    id: string;
    category: string;
    amount: number;
    spent: number;
    period: 'daily' | 'weekly' | 'monthly';
}

export interface FinancialGoal {
    id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    deadline?: string;
    createdAt: string;
    completedAt?: string;
}

export interface FinancialState {
    expenses: Expense[];
    budgets: Budget[];
    goals: FinancialGoal[];
    monthlyBudget: number;
    currency: string;
}

// Health types
export interface Workout {
    id: string;
    type: string;
    duration: number; // minutes
    calories?: number;
    notes?: string;
    date: string;
    createdAt: string;
}

export interface WaterLog {
    id: string;
    glasses: number;
    date: string;
}

export interface MealLog {
    id: string;
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    description: string;
    calories?: number;
    date: string;
    createdAt: string;
}

export interface HealthState {
    workouts: Workout[];
    waterLogs: WaterLog[];
    meals: MealLog[];
    dailyWaterGoal: number;
    dailyCalorieGoal: number;
    dailyStepGoal: number;
}

// Mindfulness types
export interface MeditationSession {
    id: string;
    duration: number; // minutes
    type: 'guided' | 'timer' | 'breathing';
    notes?: string;
    date: string;
    createdAt: string;
}

export interface JournalEntry {
    id: string;
    content: string;
    mood?: string;
    date: string;
    createdAt: string;
}

export interface GratitudeLog {
    id: string;
    items: string[];
    date: string;
    createdAt: string;
}

export interface MoodEntry {
    id: string;
    mood: string;
    notes?: string;
    date: string;
    createdAt: string;
}

export interface MindfulnessState {
    meditations: MeditationSession[];
    journals: JournalEntry[];
    gratitudeLogs: GratitudeLog[];
    moods: MoodEntry[];
    meditationGoal: number; // minutes per day
}

// Settings types
export type AppStyle = 'modern' | 'minimal' | 'classic' | 'vibrant';

export interface AppSettings {
    streakMode: 'all' | 'any'; // 'all' = all categories required, 'any' = any one category counts
    theme: 'dark' | 'light';
    style: AppStyle;
}

// App state
export interface AppState {
    user: User | null;
    financial: FinancialState;
    health: HealthState;
    mindfulness: MindfulnessState;
    dailyChallenges: DailyChallenge[];
    settings: AppSettings;
    isLoading: boolean;
}

// Action types for reducers
export type AppAction =
    | { type: 'SET_USER'; payload: User }
    | { type: 'ADD_XP'; payload: number }
    | { type: 'UNLOCK_ACHIEVEMENT'; payload: string }
    | { type: 'UPDATE_STREAK'; payload: { category: keyof Streaks; value: number } }
    | { type: 'SET_LOADING'; payload: boolean }
    // Financial actions
    | { type: 'ADD_EXPENSE'; payload: Expense }
    | { type: 'DELETE_EXPENSE'; payload: string }
    | { type: 'SET_BUDGET'; payload: Budget }
    | { type: 'ADD_FINANCIAL_GOAL'; payload: FinancialGoal }
    | { type: 'UPDATE_FINANCIAL_GOAL'; payload: FinancialGoal }
    // Health actions
    | { type: 'ADD_WORKOUT'; payload: Workout }
    | { type: 'LOG_WATER'; payload: WaterLog }
    | { type: 'ADD_MEAL'; payload: MealLog }
    // Mindfulness actions
    | { type: 'ADD_MEDITATION'; payload: MeditationSession }
    | { type: 'ADD_JOURNAL'; payload: JournalEntry }
    | { type: 'ADD_GRATITUDE'; payload: GratitudeLog }
    | { type: 'ADD_MOOD'; payload: MoodEntry }
    // Settings actions
    | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
    // Challenge actions
    | { type: 'SET_DAILY_CHALLENGES'; payload: DailyChallenge[] }
    | { type: 'COMPLETE_CHALLENGE'; payload: string }
    // Bulk actions
    | { type: 'LOAD_STATE'; payload: Partial<AppState> };

// Navigation types
export type RootTabParamList = {
    Home: undefined;
    Financial: undefined;
    Health: undefined;
    Mindfulness: undefined;
    Profile: undefined;
};

// Category type
export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
}
