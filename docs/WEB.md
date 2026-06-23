# SpeakRight Browser And Legacy Web

## Recommended Browser Edition

Use `apps/browser`.

```bat
cd /d E:\SpeakRight
npm --prefix apps/browser install
npm run dev:browser
```

Browser Edition is the cross-platform local browser app. It must not import
Tauri, depend on the desktop port, or use Windows installer scripts.

Validation:

```bat
npm run lint:browser
npm run typecheck:browser
npm run test:browser
npm run build:browser
npm run browser:smoke
```

## Legacy Web Scaffold

`apps/web` is retained only as a legacy scaffold / historical seed during the
migration. It is not the recommended production Browser Edition entry.

Do not add new Browser Edition work to `apps/web` unless the migration plan
explicitly says to archive or remove it afterward.

## Browser Rules

- Serve from localhost or HTTPS for microphone permissions.
- API keys are BYOK and session-first. Users may enable local persistence on a
  trusted personal browser; release validation must not clear storage unless the
  test explicitly covers reset/export behavior.
- Free practice includes a microphone selector. On Chrome machines with several
  inputs, choose the intended USB microphone such as
  `系统默认 - Microphone (NEOM USB)` instead of a Bluetooth speaker endpoint.
- Azure Speech provides numeric pronunciation scores.
- LLM providers provide Chinese coaching only.
- Youdao online pronunciation fallback can be affected by network or CORS
  behavior. Bundled local practice audio remains available when the online
  fallback is unavailable.
- English is stable; Spanish, French, and Russian are experimental.
