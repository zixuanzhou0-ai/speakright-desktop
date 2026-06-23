# Browser Edition Validation Log

Date: 2026-06-23

## Passed Locally

From `E:\SpeakRight`:

```text
npm run validate:browser
```

Observed results:

- Lint passed: Biome checked 360 files with no fixes applied.
- TypeScript passed.
- Vitest passed: 111 files, 631 tests.
- Next static export passed: 197 static/SSG routes.
- Static browser smoke passed for 9 routes and 2 media assets at
  `http://127.0.0.1:4173`.
- Browser screenshots were captured with empty key fields and stored under
  `docs/assets/screenshots/browser/`:
  - `settings.png`
  - `phoneme-english-scored.png`
  - `free-practice.png`
  - `assessment.png`
  - `phoneme-spanish.png`
  - `phoneme-french.png`
  - `phoneme-russian.png`

Additional local release checks:

```text
npm run docs:check-links
npm run browser:azure-live-log
```

- Markdown relative links passed across the public README/docs set.
- Browser Azure live-check log helper created or verified the ignored private
  `.runlogs/browser-azure-live-check.md` template.
- Browser Azure live-check log helper rejected key-shaped input in notes before
  writing.
- Browser source isolation scan found no Tauri imports, desktop port dependency,
  desktop secure-store dependency, or desktop release-script dependency. The only
  desktop tokens in Browser Edition source are defensive/public-copy references
  such as "Browser Edition does not need EXE/MSI/NSIS" and smoke checks for
  forbidden Tauri markers.
- Text secret scan over Browser Edition source/scripts/docs plus public entry
  docs found no Azure/OpenAI/ElevenLabs/Gemini-style key literals.

Official Microsoft source check:

- Microsoft Learn/API docs confirm Browser JavaScript pronunciation assessment
  uses `PronunciationAssessmentConfig.applyTo(recognizer)`.
- Microsoft Learn/API docs confirm pronunciation scores can be extracted from a
  speech recognition result with `PronunciationAssessmentResult.fromResult`.
- Microsoft JavaScript SDK docs confirm push/pull audio input streams are part
  of the browser-compatible SDK surface.

See [Completion Audit](COMPLETION_AUDIT.md) for the requirement-by-requirement
proof map and the remaining release blockers.

## 2026-06-23 Browser Settings And Microphone Tightening

Release tightening checks were run without clearing Browser Edition
`localStorage` or `sessionStorage`.

Commands from `E:\SpeakRight\apps\browser`:

```text
npm.cmd run test -- --run src/__tests__/browser-api-keys-storage.test.ts src/__tests__/settings-api-key-save.test.tsx src/__tests__/use-recorder.test.tsx
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
PORT=4174 npm.cmd run browser:smoke:static
```

Observed results:

- Targeted regression tests passed: 3 files, 25 tests.
- TypeScript passed.
- Biome lint passed: 364 files checked.
- Next static export passed: 197 static/SSG routes.
- Static browser smoke passed for 9 routes and 2 assets at
  `http://127.0.0.1:4174`.
- Playwright light check against the existing validation profile confirmed Azure,
  ElevenLabs, and LLM keys were still present in local browser storage; no secret
  values were read or logged.
- Free practice microphone selector rendered and selected
  `系统默认 - Microphone (NEOM USB)`, not the `EDIFIER M230` endpoint.
- The page did not enter the Error Boundary and did not show React #185.
## Not Yet Complete

- Real Azure live scoring must still be recorded in browser runtime for:
  - `en-US`
  - `es-ES`
  - `fr-FR`
  - `ru-RU`
- Final GitHub release notes should mark Browser Edition as release-ready only
  after real Azure live checks are recorded without exposing keys, recordings, or
  account details.

## Privacy Notes

- Public screenshot attempts must use a fresh/redacted browser profile, or first
  verify that password inputs are empty before writing image files.
- Release validation that depends on already configured provider keys must not
  clear `localStorage` or `sessionStorage` unless reset/export behavior is the
  explicit scenario.
- Do not store Azure keys, recordings, account IDs, or private validation logs in
  the repository.
