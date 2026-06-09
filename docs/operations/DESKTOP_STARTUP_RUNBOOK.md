# Desktop Startup Runbook

Last verified: 2026-06-09

This repository is the current SpeakRight Desktop workspace:

```bat
E:\SpeakRightDesktopRepo
```

Do not use the older browser workspace or an `apps\desktop` path when testing the
current desktop app. If Microsoft Edge shows `localhost refused`, that is not the
desktop app by itself; it usually means a browser tab is pointed at a dev URL
while the dev server is not running.

## Start Tomorrow

Use this command from a fresh terminal:

```bat
cd /d E:\SpeakRightDesktopRepo
npm run desktop:dev
```

Expected processes after startup:

- `tauri dev`
- `next dev --turbopack --port 3002`
- `speakright.exe`

The desktop window should open through Tauri. The browser tab at
`http://localhost:3002` is only a dev frontend view and should not be treated as
the installed desktop app.

## If The Window Shows Localhost Refused

1. Confirm the command was run from `E:\SpeakRightDesktopRepo`.
2. Confirm the process list contains `next dev --port 3002` and `speakright.exe`.
3. Close stale browser tabs that show `localhost refused`.
4. Start the desktop dev command again:

```bat
cd /d E:\SpeakRightDesktopRepo
npm run desktop:dev
```

## Current Resource Boundary

- Spanish, French, and Russian word/phrase audio is bundled in
  `public/audio/language-packs/`.
- Multilingual audio packs are not installed from Settings anymore.
- Local articulation/video assets live under `public/videos/language-assets/`.
- API keys are not stored in Git and are excluded from learning-data export.

## Validation Before Ending A Session

Use this short validation set after UI/content work:

```bat
npm run test
npm run typecheck
npm run lint
npm run build:desktop-frontend
```

Use this full desktop release gate before publishing installers:

```bat
npm run validate:desktop
```

## 2026-06-09 Handoff Notes

- English remains the stable baseline.
- `es-ES`, `fr-FR`, and `ru-RU` remain experimental; `evidenceMastery` is still
  disabled for these languages.
- The Settings language-pack installer UI has been removed because multilingual
  audio is bundled.
- The phoneme sidebar uses compact rows for English and two-line wrapping rows
  for non-English sound units to avoid overlapping long rule labels.
- Spanish Sounds of Speech videos use original-ratio sizing with small side
  previous/next controls.
- No real API key was found in the repository during the final secret scan.
