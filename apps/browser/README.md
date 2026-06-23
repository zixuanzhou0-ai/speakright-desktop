# SpeakRight Browser Edition

This is the cross-platform Browser Edition. It runs in a normal browser and is
separate from the Windows Desktop/Tauri app.

## Run Locally

```bat
cd /d E:\SpeakRight
npm --prefix apps/browser install
npm run dev:browser
```

Open `http://localhost:3000`.

## Static Build

```bat
cd /d E:\SpeakRight
npm run build:browser
npm run serve:browser
```

The static export is written to `apps/browser/out`. Serve it through localhost
or HTTPS before testing microphone flows. Direct `file://` launch is not
supported.

## Validation

```bat
cd /d E:\SpeakRight
npm run lint:browser
npm run typecheck:browser
npm run test:browser
npm run build:browser
npm run browser:smoke:static
```

For route-level smoke against an already running server:

```bat
set SPEAKRIGHT_BROWSER_SMOKE_URL=http://127.0.0.1:4173
npm run browser:smoke
```

## Platform Boundary

- No `@tauri-apps/*` imports are allowed in this app.
- Browser platform adapters live under `src/platform`.
- Provider keys are BYOK. API keys default to session storage and persist to
  local browser storage only when the user enables that setting. Do not clear
  `localStorage` or `sessionStorage` during release validation unless the test is
  specifically about reset/export behavior.
- Numeric pronunciation scores must come from Azure Speech Pronunciation
  Assessment. LLM providers only generate Chinese coaching text from Azure
  evidence.

## Browser Runtime Notes

- Free practice shows a microphone selector when Chrome exposes multiple audio
  inputs. Choose the intended USB microphone, for example
  `系统默认 - Microphone (NEOM USB)`, before recording.
- If Chrome lists a Bluetooth speaker such as `EDIFIER M230` as an input, leave
  it unselected unless it is the actual microphone you want to test.
- The Youdao online pronunciation fallback can fail because of network or CORS
  behavior. Built-in local practice audio is bundled with the Browser Edition
  and is not affected by that fallback.

## Feature Scope

| Area | Browser Edition behavior |
| --- | --- |
| English | Stable sound-unit practice, free practice, assessment, and drill routes. |
| Spanish | Experimental sound-unit and free-practice support with `es-ES` Azure locale. |
| French | Experimental sound-unit and free-practice support with `fr-FR` Azure locale. |
| Russian | Experimental sound-unit and free-practice support with `ru-RU` Azure locale. |
| Storage | Browser-local settings, progress, score history, and cache data. |
| Media | Bundled local assets where redistribution is allowed; honest fallback UI otherwise. |

## Important Docs

- `docs/browser-edition/ARCHITECTURE_AND_SEPARATION.md`
- `docs/browser-edition/VALIDATION_AND_RELEASE.md`
- `docs/browser-edition/THIRD_PARTY_NOTICES.md`
- `docs/browser-edition/RELEASE_NOTES.md`
