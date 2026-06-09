# SpeakRight Desktop

SpeakRight Desktop is a Tauri desktop pronunciation-training app for Chinese
learners. American English (`en-US`) is the stable baseline. Spanish (`es-ES`),
French (`fr-FR`), and Russian (`ru-RU`) are experimental modules. Japanese is
not included in this release track.

## Current Product Boundary

- Desktop-only release track. Do not mix this repository with older browser-app workspaces.
- The installed app loads the static Tauri bundle, not a localhost dev server.
- API keys are stored through the desktop secure/local credential layer where
  supported; they are never committed and are excluded from learning-data
  exports.
- Spanish, French, and Russian word/phrase audio is bundled under
  `public/audio/language-packs/`; users do not install these packs separately.
- Local articulation assets live under `public/videos/language-assets/`.

## Development

```bat
cd /d E:\SpeakRightDesktopRepo
npm run tauri:dev
```

The dev build uses the Tauri `devUrl` configured in `src-tauri/tauri.conf.json`.
Release builds must use the static export in `out/`.

For the daily desktop startup checklist, see
`docs/operations/DESKTOP_STARTUP_RUNBOOK.md`.

## Validation

```bat
npm run test
npm run typecheck
npm run lint
npm run validate:desktop
```

Use `npm run desktop:build` when you need fresh Windows artifacts.

## Release Notes

- The current Windows artifacts are for controlled testing unless code signing
  is complete.
- Non-English pronunciation scoring remains experimental; `evidenceMastery`
  stays disabled for `es-ES`, `fr-FR`, and `ru-RU` until provider probes and
  language-specific evidence gates are finished.
