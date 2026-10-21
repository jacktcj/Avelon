# Avalon — Pass & Play

*The Battle of Loyalty and Deception.* A standalone, offline-capable Progressive Web App for playing a game in the style of **The Resistance: Avalon** with **5–10 players sharing one phone**. There is no backend, no accounts and no game master. The app deals characters, runs secret votes, scores missions and handles the Assassin phase.

All artwork is original SVG made for this app.

## Features

- **Setup:** choose 5–10 players, enter names in seating order (empty and duplicate names are rejected), then pick Classic or Advanced mode or a custom mix of Percival, Morgana, Mordred and Oberon. Illegal combinations can't be selected.
- **Private reveal:** a neutral "Pass the phone to …" screen appears before every private screen. Characters are shown only after an explicit tap and hidden again before the next handover.
- **Standard rules:** team sizes, Good/Evil splits, one vote per mission (the leader picks the team, then only those players secretly play Success/Fail), clockwise leader rotation, Missions 4 and 5 take one extra player and need two Fails, and the Assassin phase.
- **Secret ballots:** every team member freely chooses Success or Fail (house rule). Mission cards are tallied anonymously and shown in a random order.
- **Privacy safeguards:** private screens hide when the app goes to the background, when the page is closed and when the back button is pressed. A restored game always opens on a neutral screen. Saved data is obfuscated so it can't be read at a glance. Revealing every character at the end asks for confirmation.
- **Persistence:** progress is saved to `localStorage` after every action, so a refresh or app restart continues from the same point.
- **Languages:** English and Simplified Chinese (简体中文). Change it with the ⚙ Settings button on the home screen; the choice is remembered on the device, and the first launch follows the phone's language.
- **PWA:** installable, and fully offline once loaded; fonts are bundled locally.

## Requirements

- Node.js 18+ (tested on Node 22)

## Setup & run

```bash
npm install
npm run dev          # http://localhost:5173 (open on your phone via your LAN IP with --host)
```

To try it on a phone during development, run `npx vite --host` and open the printed network URL.

## Test

```bash
npm test             # 59 unit tests: rules engine, state machine, privacy & persistence, App
```

Optional end-to-end run (plays a full 5-player game in a mobile viewport using your installed Google Chrome):

```bash
npm run build
npx vite preview --port 4173 &
npm run e2e -- ./screenshots   # screenshot dir is optional
```

## Build & install

```bash
npm run build        # outputs static files to dist/
npm run preview      # serve the production build locally
```

`dist/` is a fully static site. Host it on any static host, such as Netlify, Vercel, GitHub Pages, S3 or nginx. It uses relative paths, so it also works from a sub-folder. Browsers only install a PWA and register its service worker over **HTTPS**, or on `localhost`.

Install it on a device:

- **Android (Chrome):** open the site, then tap ⋮ → *Install app* (or *Add to Home screen*).
- **iPhone/iPad (Safari):** tap Share → *Add to Home Screen*.
- **Desktop (Chrome/Edge):** click the install icon in the address bar.

After the first load, the service worker caches everything, so the game runs with no connection.

## Project structure

```
src/
  game/
    rules.ts        Rule tables (team splits, mission sizes), role definitions, config validation
    engine.ts       Pure state machine: reduce(state, action) with validated transitions,
                    secret-knowledge rules, restore sanitising
    random.ts       crypto.getRandomValues-based unbiased RNG and Fisher–Yates shuffle
    storage.ts      Obfuscated localStorage persistence
    engine.test.ts  Rule & transition tests
  art/RoleArt.tsx   Original SVG character portraits, crests, card back, castle
  components/ui.tsx Layout, buttons, confirm dialog, handover screen, progress
  screens/          Setup, reveal, mission/voting and end-game screens
  i18n.tsx          English / Simplified Chinese dictionaries and the language setting
  App.tsx           View routing, persistence, background/back-button privacy guards
scripts/e2e.mjs     Browser playthrough
```

### State machine stages

`playerCount → playerNames → characterConfig → distribution → reveal → ready → dashboard → teamSelection → missionVote → missionResult → (dashboard | assassin | final)`. Any action that isn't valid for the current stage is rejected with a `GameError`.

## Rules reference

| Players | Good | Evil | M1 | M2 | M3 | M4 | M5 |
|---|---|---|---|---|---|---|---|
| 5 | 3 | 2 | 2 | 3 | 3 | 4\* | 4\* |
| 6 | 4 | 2 | 2 | 3 | 3 | 4\* | 5\* |
| 7 | 4 | 3 | 2 | 3 | 3 | 5\* | 5\* |
| 8 | 5 | 3 | 3 | 4 | 4 | 6\* | 6\* |
| 9 | 6 | 3 | 3 | 4 | 4 | 6\* | 6\* |
| 10 | 6 | 4 | 3 | 4 | 4 | 6\* | 6\* |

House rules: Mission 3 has the same team size as Mission 2.
\* Missions 4 and 5 take one more player than standard Avalon and need two Fail cards to fail.

What each character knows: **Merlin** sees every Evil player except Mordred (Oberon included). **Percival** sees Merlin, or sees Merlin and Morgana in a random order without knowing which is which. **Evil players** see each other, except Oberon. **Oberon** and **Loyal Servants** see no one.

**House rule:** to keep it to one vote per mission, there is no team-approval vote and no 5-rejection rule — the leader's team goes straight to the secret mission vote.

*Avalon* and *The Resistance* are trademarks of their respective owners. This is an unofficial fan project for personal play.
