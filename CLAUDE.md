# SpeakRight Desktop

This repository is the current SpeakRight desktop app. Do not treat it as the
older browser-only English web app.

## Scope

- `en-US`: stable American English baseline.
- `es-ES`, `fr-FR`, `ru-RU`: experimental multilingual modules.
- `ja-JP`: intentionally not included in this release track.

## Runtime Boundary

- Tauri desktop app with a static exported frontend in release builds.
- Dev mode uses the Tauri `devUrl` on port `3002`.
- Installed releases must not depend on a localhost dev server.
- API keys stay in the desktop secure/local credential layer where supported and
  must never be committed or exported with learning data.

## Audio Boundary

- Spanish, French, and Russian word/phrase audio is bundled in
  `public/audio/language-packs/`.
- Users do not install multilingual language audio packs in Settings.
- `public/videos/language-assets/` contains local articulation/video assets.
- ElevenLabs is only a fallback for uncovered TTS/read-along content when the
  user has configured a key.

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run validate:desktop
```

Use `npm run desktop:build` when fresh Windows artifacts are needed.

## Release Rule

Before release-facing changes are considered done, run focused tests plus
`npm run typecheck` and `npm run lint`. Run `npm run validate:desktop` for a full
desktop release check.
