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
