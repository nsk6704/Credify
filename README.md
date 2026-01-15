# Credify

<div align="center">
  <img src="./assets/main-icon.png" alt="Credify" width="120" height="120" />
  
  <p align="center">
    <strong>Personal Wellness & Finance Tracker</strong>
  </p>
  
  <p align="center">
    Your all-in-one companion for tracking habits, finances, and well-being.
  </p>

  <p align="center">
    <a href="#features">Features</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#contributing">Contributing</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/React%20Native-0.81.5-blue.svg" alt="React Native" />
    <img src="https://img.shields.io/badge/Expo-54.0.30-black.svg" alt="Expo" />
    <img src="https://img.shields.io/badge/TypeScript-5.9.2-blue.svg" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey.svg" alt="Platform" />
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
  </p>
</div>

---

## Overview

Credify is a cross-platform mobile application designed to help you build lasting healthy routines and financial discipline. With unified tracking across expenses, workouts, and mindfulness practices, Credify keeps all aspects of your personal wellness in one place.

**Key Highlights:**
- Unified tracking for finances, health, and mindfulness
- Gamification system with XP, levels, and streaks
- Modern, customizable interface with light and dark themes
- Privacy-first approach with local SQLite storage
- Complete data ownership with export/import capabilities

---

## Features

### Financial Management
Track your financial health with comprehensive expense logging and budget management.

- **Expense Tracking** — Log transactions with customizable categories
- **Budget Monitoring** — Set monthly budgets and track spending in real-time
- **Savings Goals** — Create financial goals with progress visualization
- **Spending Analytics** — Understand your spending patterns at a glance

### Health & Fitness
Monitor your physical well-being and build consistent exercise habits.

- **Workout Logging** — Record exercises with duration, calories, and notes
- **Hydration Tracking** — Track daily water intake with visual progress indicators
- **Meal Logging** — Document meals with nutritional information
- **Activity Streaks** — Build consistency with daily streak tracking

### Mindfulness & Well-being
Cultivate mental wellness through journaling and meditation practices.

- **Meditation Sessions** — Log guided meditations, timers, or breathing exercises
- **Digital Journaling** — Write unlimited entries with mood tracking
- **Gratitude Practice** — Daily gratitude logging for positive mindset cultivation
- **Mood Tracking** — Monitor emotional patterns over time

### Gamification
Stay motivated with a comprehensive progression system.

- **Experience Points** — Earn XP for every positive action across categories
- **Level Progression** — Advance through 12+ levels from Beginner to Immortal
- **Multi-Category Streaks** — Track streaks for financial, health, and mindfulness
- **Visual Progress** — See your growth across all life areas

### Customization
Personalize your experience to match your preferences.

- **Theme Options** — Choose from automatic, light, or dark mode
- **Style Variants** — Select from modern, minimal, classic, or vibrant designs
- **Flexible Goals** — Customize daily targets for water, meditation, calories, and more
- **Streak Modes** — Toggle between challenge mode and easy mode

### Data & Privacy
Your data stays yours, stored securely on your device.

- **Local Storage** — All data stored in a secure SQLite database
- **Export/Import** — JSON-based backup system for data portability
- **No Limits** — Store unlimited entries across all categories
- **Privacy First** — No cloud sync, no third-party access, complete control

---

## Screenshots

_Screenshots coming soon_

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Expo CLI (installed automatically with dependencies)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/credify.git

# Navigate to the project directory
cd credify

# Install dependencies
npm install
```

### Development

Start the development server:

```bash
npm start
```

Run on specific platforms:

```bash
npm run ios       # iOS simulator
npm run android   # Android emulator
npm run web       # Web browser
```

### Building for Production

```bash
# Android
npm run build:android

# iOS
npm run build:ios
```

---

## Usage

### Initial Setup

1. Launch the app and create your profile
2. Configure daily goals (water intake, meditation time, budget)
3. Select your preferred theme and style variant
4. Choose your streak mode preference

### Daily Workflow

1. Log activities throughout the day (expenses, workouts, meals, meditation)
2. Earn experience points for completed actions
3. Maintain streaks across different categories
4. Review progress on your home dashboard

### Data Management

- **Backup:** Settings → Export Data → Save JSON file
- **Restore:** Settings → Import Data → Select backup file
- **Reset:** Settings → Advanced → Reset All Data

---

## Tech Stack

### Core
- [React Native](https://reactnative.dev/) — Cross-platform mobile framework
- [Expo](https://expo.dev/) — Development platform and build tooling
- [TypeScript](https://www.typescriptlang.org/) — Type-safe JavaScript

### State & Storage
- React Context API — Global state management
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) — Local database
- AsyncStorage — Lightweight key-value storage

### Navigation & UI
- [React Navigation](https://reactnavigation.org/) — Routing and navigation
- [Expo Vector Icons](https://docs.expo.dev/guides/icons/) — Icon library
- React Native Safe Area Context — Safe area handling

### Utilities
- [date-fns](https://date-fns.org/) — Date manipulation and formatting
- React Hooks — Modern React patterns

---

## Project Structure

```
credify/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Buttons, cards, error boundaries
│   │   └── gamification/   # XP bars, streaks, level indicators
│   ├── constants/          # App configuration and constants
│   │   ├── gamification.ts # XP rewards, level thresholds, categories
│   │   └── theme.ts        # Colors, spacing, typography
│   ├── context/            # React Context providers
│   │   ├── AppContext.tsx  # Global application state
│   │   └── ThemeContext.tsx # Theme and style management
│   ├── lib/                # Core utilities and services
│   │   └── database.ts     # SQLite operations and migrations
│   ├── navigation/         # Navigation configuration
│   │   └── MainNavigator.tsx
│   ├── screens/            # Application screens
│   │   ├── HomeScreen.tsx
│   │   ├── FinancialScreen.tsx
│   │   ├── HealthScreen.tsx
│   │   ├── MindfulnessScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── SettingsScreen.tsx
│   └── types/              # TypeScript type definitions
│       └── index.ts
├── assets/                 # Static assets (images, icons, fonts)
├── app.json               # Expo configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md             # Documentation
```

---

## Contributing

Contributions are welcome and appreciated. To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

### Development Guidelines

- Write clean, typed TypeScript code
- Follow existing code patterns and conventions
- Test thoroughly on both iOS and Android
- Ensure UI consistency across light and dark themes
- Keep components modular and reusable
- Update documentation for new features

### Code Standards

- Use functional components with React Hooks
- Implement proper TypeScript types for all props and state
- Follow React Native and Expo best practices
- Write self-documenting code with clear naming

---


---

## Acknowledgments

Built with:
- [Expo](https://expo.dev/) — Mobile development platform
- [Expo Vector Icons](https://docs.expo.dev/guides/icons/) — Icon library
- [date-fns](https://date-fns.org/) — Date utilities
- [GitHub Copilot](https://github.com/features/copilot) — AI pair programming (Claude Sonnet 4.5, Gemini 3 Flash)

---

## Support

For bug reports and feature requests, please [open an issue](https://github.com/nsk6704/Credify/issues).

---

<div align="center">
  <strong>Made by Saketh</strong>
</div>