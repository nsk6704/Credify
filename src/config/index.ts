// API Configuration
// Update this with your backend URL

// For development with Expo Go:
// - On physical device: Use your computer's local IP (e.g., 192.168.1.100)
// - On emulator: Use 10.0.2.2 (Android) or localhost (iOS)
// - For remote testing: Use ngrok or similar tunnel

// For production:
// - Use your deployed backend URL

export const API_CONFIG = {
    // Development - Replace with your local IP
    // Find your IP: Windows: ipconfig, Mac/Linux: ifconfig
    DEV_URL: 'http://192.168.1.100:8000',

    // Production - Replace with your deployed URL
    PROD_URL: 'https://your-backend.com',

    // Use this to toggle between dev and prod
    get BASE_URL() {
        return __DEV__ ? this.DEV_URL : this.PROD_URL;
    },

    // Request timeout in milliseconds
    TIMEOUT: 30000,

    // API version (for future versioning)
    VERSION: 'v1',
};

// Feature flags
export const FEATURES = {
    // Set to true to skip authentication (offline mode)
    OFFLINE_MODE: true,

    // Set to true to show onboarding every time (for testing)
    ALWAYS_SHOW_ONBOARDING: false,

    // Enable cloud sync (requires backend)
    CLOUD_SYNC_ENABLED: false,

    // Enable premium features for testing
    PREMIUM_UNLOCKED: false,
};

// Debug settings
export const DEBUG = {
    // Log API requests/responses
    LOG_API: __DEV__,

    // Log navigation events
    LOG_NAVIGATION: __DEV__,

    // Show developer menu
    SHOW_DEV_MENU: __DEV__,
};
