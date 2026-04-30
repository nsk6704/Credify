# UpWell Agent Notes

## Key Commands
- Dev server: `npm run start` (Expo)
- Platform runs: `npm run android`, `npm run ios`, `npm run web`

## Build/Release
- EAS profiles in `eas.json`: `development` (dev client, internal), `preview` (internal), `production` (autoIncrement)
- Expo config in `app.json` has `newArchEnabled: true` and `userInterfaceStyle: "dark"`

## Project Shape
- Single Expo app; entrypoint is `index.ts` via `package.json` `main`
- Core screens live under `src/screens/*` and navigation in `src/navigation/MainNavigator.tsx`

## Notes
- No test/lint/typecheck scripts are defined in `package.json`
- Branch naming: `feat/*`, `fix/*`, `chore/*`, `hotfix/*`, `docs/*`
- Commit messages: small, descriptive, and prefixed with `feat:`, `fix:`, `chore:`, `hotfix:`, `docs:`
- PRs: title states the problem being solved; description includes code-diff detail for small changes and English-only explanation for larger diffs
- PRs: include screenshots for UI changes
- Design: maintain a premium design language across the app
- Testing: add tests for every newly implemented feature going forward
