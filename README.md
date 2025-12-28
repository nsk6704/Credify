# Credify

<div align="center">
  <img src="./assets/main-icon.png" alt="Credify Logo" width="120" height="120" />
  <h2>Personal Wellness & Finance Tracker</h2>
  <p>Track your habits, finances, and well-being—all in one beautiful, gamified app.</p>
  <p>
    <img src="https://img.shields.io/badge/React%20Native-0.81.5-blue.svg" alt="React Native" />
    <img src="https://img.shields.io/badge/Expo-54.0.30-black.svg" alt="Expo" />
    <img src="https://img.shields.io/badge/TypeScript-5.9.2-blue.svg" alt="TypeScript" />
  </p>
</div>

---

## Why Credify?

Credify empowers you to build healthy routines and financial discipline through:
- **Unified tracking** for expenses, workouts, mindfulness, and more
- **Gamification**: XP, levels, streaks, and unlockable achievements
- **Modern, customizable UI** with light/dark mode
- **Data privacy**: All data is stored locally on your device

---

## Features

### Financial
- Log expenses by category
- Set and monitor monthly budgets
- Create and track savings goals

### Health
- Track workouts and calories
- Log daily water intake
- Record meals and nutrition

### Mindfulness
- Log meditation sessions
- Journal entries with mood tracking
- Daily gratitude practice

### Gamification
- Earn XP for healthy actions
- Level up and unlock achievement badges
- Complete daily challenges and maintain streaks

### Customization & Data
- Light/dark mode (auto/manual)
- Data export/import (local backup)
- All data stored securely with SQLite

---

## Screenshots

<div align="center">
  <img src="./assets/main-icon.png" alt="App Main Icon" width="120" height="120" />
  <img src="./assets/screenshots/dashboard.png" alt="Dashboard" width="200" />
  <img src="./assets/screenshots/profile.png" alt="Profile" width="200" />
  <img src="./assets/screenshots/achievements.png" alt="Achievements" width="200" />
</div>

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI

### Quick Start
```bash
# Clone and install
$ git clone https://github.com/yourusername/credify.git
$ cd credify
$ npm install

# Start the app
$ npm start
```

- Run on iOS: `npm run ios`
- Run on Android: `npm run android`
- Run on Web: `npm run web`

---

## Usage Tips
- Complete onboarding and set your profile
- Configure your goals (water, meditation, budget)
- Log activities throughout the day
- Tap locked achievements to see how to unlock them
- Export your data for backup anytime

---

## Tech Stack
- **React Native** (Expo)
- **TypeScript**
- **SQLite** (local data)
- **React Navigation**
- **date-fns** (date handling)
- **Expo Vector Icons**

---

## Project Structure
```
credify/
├── src/
│   ├── components/      # UI components
│   ├── constants/       # App constants
│   ├── context/         # State management
│   ├── lib/             # Utilities & database
│   ├── navigation/      # Navigation config
│   ├── screens/         # App screens
│   └── types/           # TypeScript types
├── assets/              # Images & icons
├── app.json             # Expo config
├── package.json         # Scripts & dependencies
└── tsconfig.json        # TypeScript config
```

---

## Contributing

We welcome contributions! To get started:
1. Fork this repo and create a feature branch
2. Make your changes and test thoroughly
3. Open a pull request with a clear description

**Development tips:**
- Use TypeScript best practices
- Test on both iOS and Android
- Keep UI consistent in both light and dark modes

---

## Acknowledgments
- Built with [Expo](https://expo.dev/)
- Icons from [Expo Vector Icons](https://docs.expo.dev/guides/icons/)
- Date handling by [date-fns](https://date-fns.org/)

---

<div align="center">
  <em>Made with ❤️ for your personal growth and financial wellness</em>
</div>