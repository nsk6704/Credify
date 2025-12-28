import * as SQLite from 'expo-sqlite';
import { AppState, User, Streaks, FinancialState, HealthState, MindfulnessState, DailyChallenge } from '../types';

const DATABASE_NAME = 'credify.db';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// Initialize database connection with singleton pattern
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (db) return db;
    
    // Prevent multiple simultaneous initialization attempts
    if (initPromise) return initPromise;
    
    initPromise = (async () => {
        try {
            db = await SQLite.openDatabaseAsync(DATABASE_NAME);
            await createTables();
            return db;
        } catch (error) {
            initPromise = null; // Reset on error to allow retry
            throw error;
        }
    })();
    
    return initPromise;
}

// Helper to ensure db is initialized before any operation
async function getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!db) {
        await initDatabase();
    }
    if (!db) {
        throw new Error('Database failed to initialize');
    }
    return db;
}

// Create all tables
async function createTables(): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    // User table
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS user (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            totalXP INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            streaks TEXT NOT NULL,
            achievements TEXT NOT NULL
        );
    `);

    // Expenses table
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS expenses (
            id TEXT PRIMARY KEY,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL,
            createdAt TEXT NOT NULL
        );
    `);

    // Budgets table
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS budgets (
            id TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            spent REAL DEFAULT 0,
            period TEXT NOT NULL
        );
    `);

    // Financial goals table
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS financial_goals (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            targetAmount REAL NOT NULL,
            currentAmount REAL DEFAULT 0,
            deadline TEXT,
            createdAt TEXT NOT NULL,
            completedAt TEXT
        );
    `);

    // Workouts table
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS workouts (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            duration INTEGER NOT NULL,
            calories INTEGER,
            notes TEXT,
            date TEXT NOT NULL,
            createdAt TEXT NOT NULL
        );
    `);

    // Water logs table
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS water_logs (
            id TEXT PRIMARY KEY,
            glasses INTEGER NOT NULL,
            date TEXT NOT NULL UNIQUE
        );
    `);

    // Meals table
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS meals (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            description TEXT NOT NULL,
            calories INTEGER,
            date TEXT NOT NULL,
            createdAt TEXT NOT NULL
        );
    `);

    // Meditations table
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS meditations (
            id TEXT PRIMARY KEY,
            duration INTEGER NOT NULL,
            type TEXT NOT NULL,
            notes TEXT,
            date TEXT NOT NULL,
            createdAt TEXT NOT NULL
        );
    `);

    // Journals table
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS journals (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            mood TEXT,
            date TEXT NOT NULL,
            createdAt TEXT NOT NULL
        );
    `);

    // Gratitude logs table
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS gratitude_logs (
            id TEXT PRIMARY KEY,
            items TEXT NOT NULL,
            date TEXT NOT NULL,
            createdAt TEXT NOT NULL
        );
    `);

    // Moods table
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS moods (
            id TEXT PRIMARY KEY,
            mood TEXT NOT NULL,
            notes TEXT,
            date TEXT NOT NULL,
            createdAt TEXT NOT NULL
        );
    `);

    // Settings table for app preferences
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    `);

    // Daily challenges table
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS daily_challenges (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            xpReward INTEGER NOT NULL,
            category TEXT NOT NULL,
            completed INTEGER DEFAULT 0,
            date TEXT NOT NULL
        );
    `);
}

// User operations
export async function getUser(): Promise<User | null> {
    const database = await getDb();
    
    const result = await database.getFirstAsync<{
        id: string;
        name: string;
        createdAt: string;
        totalXP: number;
        level: number;
        streaks: string;
        achievements: string;
    }>('SELECT * FROM user LIMIT 1');

    if (!result) return null;

    return {
        id: result.id,
        name: result.name,
        createdAt: result.createdAt,
        totalXP: result.totalXP,
        level: result.level,
        streaks: JSON.parse(result.streaks),
        achievements: JSON.parse(result.achievements),
    };
}

export async function saveUser(user: User): Promise<void> {
    const database = await getDb();

    await database.runAsync(
        `INSERT OR REPLACE INTO user (id, name, createdAt, totalXP, level, streaks, achievements)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        user.id,
        user.name,
        user.createdAt,
        user.totalXP,
        user.level,
        JSON.stringify(user.streaks),
        JSON.stringify(user.achievements)
    );
}

// Settings operations
export async function getSetting(key: string): Promise<string | null> {
    const database = await getDb();
    
    const result = await database.getFirstAsync<{ value: string }>(
        'SELECT value FROM settings WHERE key = ?',
        key
    );
    return result?.value || null;
}

export async function saveSetting(key: string, value: string): Promise<void> {
    const database = await getDb();
    
    await database.runAsync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        key,
        value
    );
}

// Financial operations
export async function getExpenses() {
    const database = await getDb();
    return await database.getAllAsync('SELECT * FROM expenses ORDER BY createdAt DESC');
}

export async function addExpense(expense: { id: string; amount: number; category: string; description: string; date: string; createdAt: string }) {
    const database = await getDb();
    await database.runAsync(
        'INSERT INTO expenses (id, amount, category, description, date, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        expense.id, expense.amount, expense.category, expense.description, expense.date, expense.createdAt
    );
}

export async function deleteExpense(id: string) {
    const database = await getDb();
    await database.runAsync('DELETE FROM expenses WHERE id = ?', id);
}

export async function getBudgets() {
    const database = await getDb();
    return await database.getAllAsync('SELECT * FROM budgets');
}

export async function saveBudget(budget: { id: string; category: string; amount: number; spent: number; period: string }) {
    const database = await getDb();
    await database.runAsync(
        'INSERT OR REPLACE INTO budgets (id, category, amount, spent, period) VALUES (?, ?, ?, ?, ?)',
        budget.id, budget.category, budget.amount, budget.spent, budget.period
    );
}

export async function getFinancialGoals() {
    const database = await getDb();
    return await database.getAllAsync('SELECT * FROM financial_goals ORDER BY createdAt DESC');
}

export async function saveFinancialGoal(goal: { id: string; title: string; targetAmount: number; currentAmount: number; deadline?: string; createdAt: string; completedAt?: string }) {
    const database = await getDb();
    await database.runAsync(
        'INSERT OR REPLACE INTO financial_goals (id, title, targetAmount, currentAmount, deadline, createdAt, completedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        goal.id, goal.title, goal.targetAmount, goal.currentAmount, goal.deadline || null, goal.createdAt, goal.completedAt || null
    );
}

// Health operations
export async function getWorkouts() {
    const database = await getDb();
    return await database.getAllAsync('SELECT * FROM workouts ORDER BY createdAt DESC');
}

export async function addWorkout(workout: { id: string; type: string; duration: number; calories?: number; notes?: string; date: string; createdAt: string }) {
    const database = await getDb();
    await database.runAsync(
        'INSERT INTO workouts (id, type, duration, calories, notes, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        workout.id, workout.type, workout.duration, workout.calories || null, workout.notes || null, workout.date, workout.createdAt
    );
}

export async function getWaterLogs() {
    const database = await getDb();
    return await database.getAllAsync('SELECT * FROM water_logs ORDER BY date DESC');
}

export async function logWater(log: { id: string; glasses: number; date: string }) {
    const database = await getDb();
    
    // Check if entry exists for this date
    const existing = await database.getFirstAsync<{ id: string; glasses: number }>(
        'SELECT id, glasses FROM water_logs WHERE date = ?',
        log.date
    );
    
    if (existing) {
        await database.runAsync(
            'UPDATE water_logs SET glasses = glasses + ? WHERE date = ?',
            log.glasses, log.date
        );
    } else {
        await database.runAsync(
            'INSERT INTO water_logs (id, glasses, date) VALUES (?, ?, ?)',
            log.id, log.glasses, log.date
        );
    }
}

export async function getMeals() {
    const database = await getDb();
    return await database.getAllAsync('SELECT * FROM meals ORDER BY createdAt DESC');
}

export async function addMeal(meal: { id: string; type: string; description: string; calories?: number; date: string; createdAt: string }) {
    const database = await getDb();
    await database.runAsync(
        'INSERT INTO meals (id, type, description, calories, date, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        meal.id, meal.type, meal.description, meal.calories || null, meal.date, meal.createdAt
    );
}

// Mindfulness operations
export async function getMeditations() {
    const database = await getDb();
    return await database.getAllAsync('SELECT * FROM meditations ORDER BY createdAt DESC');
}

export async function addMeditation(meditation: { id: string; duration: number; type: string; notes?: string; date: string; createdAt: string }) {
    const database = await getDb();
    await database.runAsync(
        'INSERT INTO meditations (id, duration, type, notes, date, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        meditation.id, meditation.duration, meditation.type, meditation.notes || null, meditation.date, meditation.createdAt
    );
}

export async function getJournals() {
    const database = await getDb();
    return await database.getAllAsync('SELECT * FROM journals ORDER BY createdAt DESC');
}

export async function addJournal(journal: { id: string; content: string; mood?: string; date: string; createdAt: string }) {
    const database = await getDb();
    await database.runAsync(
        'INSERT INTO journals (id, content, mood, date, createdAt) VALUES (?, ?, ?, ?, ?)',
        journal.id, journal.content, journal.mood || null, journal.date, journal.createdAt
    );
}

export async function getGratitudeLogs() {
    const database = await getDb();
    const results = await database.getAllAsync<{ id: string; items: string; date: string; createdAt: string }>(
        'SELECT * FROM gratitude_logs ORDER BY createdAt DESC'
    );
    return results.map(r => ({ ...r, items: JSON.parse(r.items) }));
}

export async function addGratitude(gratitude: { id: string; items: string[]; date: string; createdAt: string }) {
    const database = await getDb();
    await database.runAsync(
        'INSERT INTO gratitude_logs (id, items, date, createdAt) VALUES (?, ?, ?, ?)',
        gratitude.id, JSON.stringify(gratitude.items), gratitude.date, gratitude.createdAt
    );
}

export async function getMoods() {
    const database = await getDb();
    return await database.getAllAsync('SELECT * FROM moods ORDER BY createdAt DESC');
}

export async function addMood(mood: { id: string; mood: string; notes?: string; date: string; createdAt: string }) {
    const database = await getDb();
    await database.runAsync(
        'INSERT INTO moods (id, mood, notes, date, createdAt) VALUES (?, ?, ?, ?, ?)',
        mood.id, mood.mood, mood.notes || null, mood.date, mood.createdAt
    );
}

// Daily challenges operations
export async function getDailyChallenges(date: string) {
    const database = await getDb();
    return await database.getAllAsync<DailyChallenge & { completed: number }>(
        'SELECT * FROM daily_challenges WHERE date = ?',
        date
    );
}

export async function saveDailyChallenges(challenges: DailyChallenge[]) {
    const database = await getDb();
    
    for (const challenge of challenges) {
        await database.runAsync(
            'INSERT OR REPLACE INTO daily_challenges (id, title, description, xpReward, category, completed, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            challenge.id, challenge.title, challenge.description, challenge.xpReward, challenge.category, challenge.completed ? 1 : 0, challenge.date
        );
    }
}

export async function completeChallenge(id: string) {
    const database = await getDb();
    await database.runAsync('UPDATE daily_challenges SET completed = 1 WHERE id = ?', id);
}

// Load full app state from database
export async function loadAppState(): Promise<Partial<AppState>> {
    await getDb();

    const user = await getUser();
    const expenses = await getExpenses() as any[];
    const budgets = await getBudgets() as any[];
    const goals = await getFinancialGoals() as any[];
    const workouts = await getWorkouts() as any[];
    const waterLogs = await getWaterLogs() as any[];
    const meals = await getMeals() as any[];
    const meditations = await getMeditations() as any[];
    const journals = await getJournals() as any[];
    const gratitudeLogs = await getGratitudeLogs();
    const moods = await getMoods() as any[];

    // Get settings
    const monthlyBudget = await getSetting('monthlyBudget');
    const currency = await getSetting('currency');
    const dailyWaterGoal = await getSetting('dailyWaterGoal');
    const dailyCalorieGoal = await getSetting('dailyCalorieGoal');
    const dailyStepGoal = await getSetting('dailyStepGoal');
    const meditationGoal = await getSetting('meditationGoal');

    return {
        user,
        financial: {
            expenses,
            budgets,
            goals,
            monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : 0,
            currency: currency || '$',
        },
        health: {
            workouts,
            waterLogs,
            meals,
            dailyWaterGoal: dailyWaterGoal ? parseInt(dailyWaterGoal) : 8,
            dailyCalorieGoal: dailyCalorieGoal ? parseInt(dailyCalorieGoal) : 2000,
            dailyStepGoal: dailyStepGoal ? parseInt(dailyStepGoal) : 10000,
        },
        mindfulness: {
            meditations,
            journals,
            gratitudeLogs,
            moods,
            meditationGoal: meditationGoal ? parseInt(meditationGoal) : 10,
        },
    };
}

// Reset all data
// Cleanup old daily challenges to prevent database bloat
export async function cleanupOldChallenges(daysToKeep: number = 30): Promise<number> {
    const database = await getDb();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0]; // yyyy-MM-dd format
    
    const result = await database.runAsync(
        'DELETE FROM daily_challenges WHERE date < ?',
        cutoffDateStr
    );
    
    return result.changes; // Returns number of deleted rows
}

export async function resetAllData(): Promise<void> {
    const database = await getDb();

    await database.execAsync(`
        DELETE FROM user;
        DELETE FROM expenses;
        DELETE FROM budgets;
        DELETE FROM financial_goals;
        DELETE FROM workouts;
        DELETE FROM water_logs;
        DELETE FROM meals;
        DELETE FROM meditations;
        DELETE FROM journals;
        DELETE FROM gratitude_logs;
        DELETE FROM moods;
        DELETE FROM settings;
        DELETE FROM daily_challenges;
    `);
}

export { db };
