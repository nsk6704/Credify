// Gamification configuration
export const XP_CONFIG = {
    // XP rewards for actions
    rewards: {
        // Financial actions
        logExpense: 5,
        stayUnderBudget: 20,
        reachSavingsGoal: 100,
        setFinancialGoal: 10,

        // Health actions
        completeWorkout: 15,
        logWater: 5,
        logMeal: 5,
        reachStepGoal: 20,

        // Mindfulness actions
        completeMeditation: 10,
        journalEntry: 10,
        gratitudeLog: 5,
        moodCheckIn: 5,

        // Streaks
        streak7Days: 50,
        streak30Days: 200,
        streak100Days: 500,
    },

    // Level thresholds
    levels: [
        { level: 1, minXP: 0, title: 'Beginner' },
        { level: 2, minXP: 100, title: 'Novice' },
        { level: 3, minXP: 250, title: 'Apprentice' },
        { level: 4, minXP: 500, title: 'Skilled' },
        { level: 5, minXP: 1000, title: 'Adept' },
        { level: 6, minXP: 1750, title: 'Expert' },
        { level: 7, minXP: 2750, title: 'Master' },
        { level: 8, minXP: 4000, title: 'Grandmaster' },
        { level: 9, minXP: 5500, title: 'Legend' },
        { level: 10, minXP: 7500, title: 'Mythic' },
        { level: 11, minXP: 10000, title: 'Transcendent' },
        { level: 12, minXP: 15000, title: 'Immortal' },
    ],
};

// Achievement definitions
export const ACHIEVEMENTS = {
    // Financial achievements
    firstExpense: {
        id: 'firstExpense',
        title: 'First Step',
        description: 'Log your first expense',
        icon: '💰',
        category: 'financial',
        xpReward: 25,
    },
    budgetBoss: {
        id: 'budgetBoss',
        title: 'Budget Boss',
        description: 'Stay under budget for 7 days',
        icon: '👑',
        category: 'financial',
        xpReward: 100,
    },
    savingsChamp: {
        id: 'savingsChamp',
        title: 'Savings Champion',
        description: 'Reach your first savings goal',
        icon: '🏆',
        category: 'financial',
        xpReward: 150,
    },

    // Health achievements
    firstWorkout: {
        id: 'firstWorkout',
        title: 'Iron Will',
        description: 'Complete your first workout',
        icon: '💪',
        category: 'health',
        xpReward: 25,
    },
    hydrationHero: {
        id: 'hydrationHero',
        title: 'Hydration Hero',
        description: 'Log water intake for 7 days',
        icon: '💧',
        category: 'health',
        xpReward: 75,
    },
    fitnessFreak: {
        id: 'fitnessFreak',
        title: 'Fitness Freak',
        description: '30-day workout streak',
        icon: '🏋️',
        category: 'health',
        xpReward: 300,
    },

    // Mindfulness achievements
    firstMeditation: {
        id: 'firstMeditation',
        title: 'Inner Peace',
        description: 'Complete your first meditation',
        icon: '🧘',
        category: 'mindfulness',
        xpReward: 25,
    },
    journalJourney: {
        id: 'journalJourney',
        title: 'Journal Journey',
        description: 'Write 10 journal entries',
        icon: '📔',
        category: 'mindfulness',
        xpReward: 100,
    },
    zenMaster: {
        id: 'zenMaster',
        title: 'Zen Master',
        description: 'Complete 100 meditation sessions',
        icon: '🌟',
        category: 'mindfulness',
        xpReward: 500,
    },

    // General achievements
    weekStreak: {
        id: 'weekStreak',
        title: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        category: 'general',
        xpReward: 50,
    },
    monthStreak: {
        id: 'monthStreak',
        title: 'Month Master',
        description: 'Maintain a 30-day streak',
        icon: '⚡',
        category: 'general',
        xpReward: 200,
    },
    levelUp5: {
        id: 'levelUp5',
        title: 'Rising Star',
        description: 'Reach level 5',
        icon: '⭐',
        category: 'general',
        xpReward: 100,
    },
    levelUp10: {
        id: 'levelUp10',
        title: 'Elite',
        description: 'Reach level 10',
        icon: '💎',
        category: 'general',
        xpReward: 250,
    },
};

// Daily challenges templates
export const DAILY_CHALLENGES = {
    financial: [
        { id: 'noSpend', title: 'No Spend Day', description: 'Don\'t log any expenses today', xpReward: 30 },
        { id: 'logAll', title: 'Track Everything', description: 'Log at least 3 expenses', xpReward: 20 },
        { id: 'underBudget', title: 'Budget Keeper', description: 'Stay 20% under daily budget', xpReward: 25 },
    ],
    health: [
        { id: 'workout', title: 'Get Moving', description: 'Complete any workout', xpReward: 20 },
        { id: 'hydrate', title: 'Stay Hydrated', description: 'Log 8 glasses of water', xpReward: 15 },
        { id: 'steps', title: 'Step It Up', description: 'Reach 10,000 steps', xpReward: 25 },
    ],
    mindfulness: [
        { id: 'meditate', title: 'Calm Mind', description: 'Complete a 10-min meditation', xpReward: 20 },
        { id: 'journal', title: 'Reflect', description: 'Write a journal entry', xpReward: 15 },
        { id: 'gratitude', title: 'Grateful Heart', description: 'Log 3 things you\'re grateful for', xpReward: 15 },
    ],
};

// Expense categories
export const EXPENSE_CATEGORIES = [
    { id: 'food', name: 'Food & Dining', icon: '🍔', color: '#F97316' },
    { id: 'transport', name: 'Transport', icon: '🚗', color: '#3B82F6' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#EC4899' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#8B5CF6' },
    { id: 'bills', name: 'Bills & Utilities', icon: '📄', color: '#6366F1' },
    { id: 'health', name: 'Health', icon: '💊', color: '#10B981' },
    { id: 'education', name: 'Education', icon: '📚', color: '#14B8A6' },
    { id: 'other', name: 'Other', icon: '📦', color: '#64748B' },
];

// Workout types
export const WORKOUT_TYPES = [
    { id: 'running', name: 'Running', icon: '🏃', color: '#F97316' },
    { id: 'cycling', name: 'Cycling', icon: '🚴', color: '#3B82F6' },
    { id: 'gym', name: 'Gym', icon: '🏋️', color: '#8B5CF6' },
    { id: 'yoga', name: 'Yoga', icon: '🧘', color: '#06B6D4' },
    { id: 'swimming', name: 'Swimming', icon: '🏊', color: '#0EA5E9' },
    { id: 'walking', name: 'Walking', icon: '🚶', color: '#10B981' },
    { id: 'sports', name: 'Sports', icon: '⚽', color: '#22C55E' },
    { id: 'other', name: 'Other', icon: '💪', color: '#64748B' },
];

// Mood options
export const MOOD_OPTIONS = [
    { id: 'great', name: 'Great', icon: '😄', color: '#22C55E' },
    { id: 'good', name: 'Good', icon: '🙂', color: '#84CC16' },
    { id: 'okay', name: 'Okay', icon: '😐', color: '#FBBF24' },
    { id: 'low', name: 'Low', icon: '😔', color: '#F97316' },
    { id: 'bad', name: 'Bad', icon: '😢', color: '#EF4444' },
];
