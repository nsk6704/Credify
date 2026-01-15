import * as SQLite from 'expo-sqlite';
import { AppState, User, Streaks, FinancialState, HealthState, MindfulnessState } from '../types';

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
            await migrateDatabase();
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

// Migrate existing database to remove achievements column
async function migrateDatabase(): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    try {
        // Check if achievements column exists in user table
        const tableInfo = await db.getAllAsync<{ name: string }>('PRAGMA table_info(user)');
        const hasAchievements = tableInfo.some(col => col.name === 'achievements');

        if (hasAchievements) {
            console.log('Migrating database: removing achievements column...');
            
            // Create new user table without achievements
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS user_new (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    createdAt TEXT NOT NULL,
                    totalXP INTEGER DEFAULT 0,
                    level INTEGER DEFAULT 1,
                    streaks TEXT NOT NULL
                );
            `);

            // Copy data from old table to new table
            await db.execAsync(`
                INSERT INTO user_new (id, name, createdAt, totalXP, level, streaks)
                SELECT id, name, createdAt, totalXP, level, streaks FROM user;
            `);

            // Drop old table and rename new table
            await db.execAsync(`
                DROP TABLE user;
                ALTER TABLE user_new RENAME TO user;
            `);

            console.log('Database migration completed successfully');
        }

        // Check if daily_challenges table exists and drop it
        const tables = await db.getAllAsync<{ name: string }>('SELECT name FROM sqlite_master WHERE type="table" AND name="daily_challenges"');
        if (tables.length > 0) {
            console.log('Removing daily_challenges table...');
            await db.execAsync('DROP TABLE IF EXISTS daily_challenges;');
        }
    } catch (error) {
        console.error('Database migration error:', error);
        throw error;
    }
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
            streaks TEXT NOT NULL
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
    }>('SELECT * FROM user LIMIT 1');

    if (!result) return null;

    return {
        id: result.id,
        name: result.name,
        createdAt: result.createdAt,
        totalXP: result.totalXP,
        level: result.level,
        streaks: JSON.parse(result.streaks),
    };
}

export async function saveUser(user: User): Promise<void> {
    const database = await getDb();

    await database.runAsync(
        `INSERT OR REPLACE INTO user (id, name, createdAt, totalXP, level, streaks)
         VALUES (?, ?, ?, ?, ?, ?)`,
        user.id,
        user.name,
        user.createdAt,
        user.totalXP,
        user.level,
        JSON.stringify(user.streaks)
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
        const theme = await getSetting('theme');
        const style = await getSetting('style');
        const streakMode = await getSetting('streakMode');
    
        // Normalize streak mode to the expected type ('all' | 'any')
        const normalizedStreakMode = (streakMode === 'all' || streakMode === 'any') ? (streakMode as 'all' | 'any') : 'all';
    
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
            settings: {
                theme: (theme as 'light' | 'dark') || 'dark',
                style: (style as 'modern' | 'classic') || 'modern',
                streakMode: normalizedStreakMode,
            },
        };
}

// Reset all data
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
    `);
}

// Export all data as JSON string for backup
export async function exportAllData(): Promise<string> {
    const state = await loadAppState();
    const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        data: state,
    };
    return JSON.stringify(exportData, null, 2);
}

// Import data from JSON backup
export async function importData(jsonString: string): Promise<boolean> {
    try {
        const importDataObj = JSON.parse(jsonString);
        
        // Validate structure
        if (!importDataObj.data || !importDataObj.version) {
            throw new Error('Invalid backup file format');
        }

        const { data } = importDataObj;
        
        // Clear existing data first
        await resetAllData();
        
        // Import user
        if (data.user) {
            await saveUser(data.user);
        }
        
        // Import expenses
        if (data.financial?.expenses) {
            for (const expense of data.financial.expenses) {
                await addExpense(expense);
            }
        }
        
        // Import budgets
        if (data.financial?.budgets) {
            for (const budget of data.financial.budgets) {
                await saveBudget(budget);
            }
        }
        
        // Import financial goals
        if (data.financial?.goals) {
            for (const goal of data.financial.goals) {
                await saveFinancialGoal(goal);
            }
        }
        
        // Import workouts
        if (data.health?.workouts) {
            for (const workout of data.health.workouts) {
                await addWorkout(workout);
            }
        }
        
        // Import water logs
        if (data.health?.waterLogs) {
            for (const log of data.health.waterLogs) {
                await logWater(log);
            }
        }
        
        // Import meals
        if (data.health?.meals) {
            for (const meal of data.health.meals) {
                await addMeal(meal);
            }
        }
        
        // Import meditations
        if (data.mindfulness?.meditations) {
            for (const meditation of data.mindfulness.meditations) {
                await addMeditation(meditation);
            }
        }
        
        // Import journals
        if (data.mindfulness?.journals) {
            for (const journal of data.mindfulness.journals) {
                await addJournal(journal);
            }
        }
        
        // Import gratitude logs
        if (data.mindfulness?.gratitudeLogs) {
            for (const log of data.mindfulness.gratitudeLogs) {
                await addGratitude(log);
            }
        }
        
        // Import moods
        if (data.mindfulness?.moods) {
            for (const mood of data.mindfulness.moods) {
                await addMood(mood);
            }
        }
        
        // Import settings
        if (data.settings) {
            for (const [key, value] of Object.entries(data.settings)) {
                await saveSetting(key, String(value));
            }
        }
        
        return true;
    } catch (error) {
        console.error('Import failed:', error);
        throw error;
    }
}

export { db };
