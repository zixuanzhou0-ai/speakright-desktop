# Next RC Audio/Settings Progress

Last updated: 2026-06-19

## Current State

The current pass has completed the Release EXE gate. Preserve these changes as
one RC audio/settings batch when committing.

Known current modified/new files:

- `src/components/settings/language-availability-card.tsx`
- `src/components/settings/language-config-card.tsx`
- `src/__tests__/language-availability-card.test.tsx`
- `src/__tests__/language-config-card.test.tsx`
- `src/__tests__/single-ipa-audio-source-ledger.test.ts`
- `src/__tests__/desktop-preflight-ui-smoke.test.ts`
- `src/lib/tts-errors.ts`
- `src/__tests__/use-tts-aligned.test.tsx`
- `docs/operations/SINGLE_IPA_AUDIO_SOURCE_LEDGER.md`
- `docs/operations/NEXT_RC_AUDIO_SETTINGS_GOALS.md`
- `docs/operations/NEXT_RC_AUDIO_SETTINGS_PROGRESS.md`
- `docs/operations/NEXT_CHAT_HANDOFF.md`
- `docs/operations/DESKTOP_STARTUP_RUNBOOK.md`
- `docs/INSTALLATION.md`
- `README.md`

## Completed In This Pass

- Settings language availability was reduced to learner-facing blocks:
  `录音评分`, `示范音频`, and `AI 教练`.
- The separate internal `local-pack` Settings row was removed from the user UI.
- Settings copy no longer tells users about `exact`, `speaker`, `音系清单`,
  `待补`, `mastery`, or `evidenceMastery`.
- The language picker now explains the public scope:
  English full training flow; Spanish/French/Russian experimental core practice.
- Added `SINGLE_IPA_AUDIO_SOURCE_LEDGER.md` to document single-sound source
  policy.
- Added a ledger test that locks Russian soft-member gaps and blocks word,
  phrase, TTS, rule, and teaching-video media from single-sound registration.
- Updated the desktop preflight UI smoke guard so Settings stays
  learner-facing and no longer requires internal `missingCapabilities` labels.
- Reworded the standard-demo TTS unavailable message from internal "built-in
  pronunciation resources" wording to learner-facing bundled-demo wording.
- Updated the active handoff, runbook, installation guide, and README so a new
  Codex window can start from the goal/progress files instead of relying on the
  long conversation history.

## Validation Already Run

- `npm.cmd run test -- --run src/__tests__/language-availability-card.test.tsx src/__tests__/language-config-card.test.tsx src/__tests__/single-ipa-audio-source-ledger.test.ts src/__tests__/use-tts-aligned.test.tsx`
  - Passed: `4` files, `17` tests.
- `npm.cmd run test -- --run src/__tests__/desktop-preflight-ui-smoke.test.ts`
  - Passed after updating the stale Settings smoke expectation: `1` file,
    `20` tests.
- `npm.cmd run test`
  - Passed: `135` files, `791` tests.
- `npm.cmd run audio:parity:dry-run`
  - Passed: Spanish `1094` existing / `0` missing; French `1482` existing /
    `0` missing; Russian `1640` existing / `0` missing; estimated credits `0`;
    no ElevenLabs calls.
- `npm.cmd run phonology:audio-policy:check`
  - Passed: assessment audio policy tables are up to date.
- `npm.cmd run typecheck`
  - Passed.
- `npm.cmd run lint`
  - Passed. Biome reported only the existing informational note that
    `docs/operations/non-english-ipa-audit-input.json` exceeds the configured
    maximum processed file size.
- `npm.cmd run build:desktop-frontend`
  - Passed: Next.js static export generated `197` pages.
- `npm.cmd run desktop:build`
  - First attempt reached packaging but could not replace a running
    `speakright.exe` (`os error 5`). The old Release process was closed, then
    the rebuild passed and produced:
    `src-tauri/target/release/speakright.exe`,
    `src-tauri/target/release/bundle/msi/SpeakRight_1.0.1_x64_en-US.msi`, and
    `src-tauri/target/release/bundle/nsis/SpeakRight_1.0.1_x64-setup.exe`.
- `npm.cmd run desktop:preflight`
  - Passed. It reported the expected dirty git state before commit and no
    running `speakright.exe` process.
- `npm.cmd run desktop:ui-smoke`
  - Passed against the Release EXE, including Settings, multilingual core
    routes, hidden rule boundaries, narrow/low-height viewports, scoring tile
    audio policy, and `releaseServedFromDevServer=false`.
- `npm.cmd run desktop:launch-release`
  - Passed. It launched
    `src-tauri/target/release/speakright.exe` with PID `2960` and did not start
    localhost.
- Static stale-wording scan:
  - Old Settings phrases remain only inside the scan commands in this goal and
    progress file, not in user-facing Settings copy.

## Source Verification Notes

- `audio:parity:dry-run` was run before these docs and reported:
  Spanish `1094 existing, 0 missing`; French `1482 existing, 0 missing`;
  Russian `1640 existing, 0 missing`; total missing `0`.
- No ElevenLabs generation was run.
- Gemini web reads were used to classify candidate source pages. Seeing Speech
  and Iowa are plausible exact-source classes when a per-clip target can be
  verified. EasyPronunciation pages are useful as IPA/example references, but
  their example-word media must not be registered as single-IPA clips without
  separate clean single-sound verification.

## Next Steps

1. Commit this RC audio/settings batch.
2. Push `main` to GitHub.
3. If another validation pass edits these files, rerun the final gate from
   `NEXT_RC_AUDIO_SETTINGS_GOALS.md`.

## Things Not To Do

- Do not delete non-English deck, diagnosis, drill, or audio data merely because
  the public navigation hides incomplete modules.
- Do not generate ElevenLabs audio.
- Do not register Russian soft-pair tiles as clickable unless exact local soft
  clips are verified and added with tests.
- Do not replace verified single-sound audio with whole-word or phrase media.
- Do not use localhost/dev server for acceptance.

## Remaining Limitations

- Russian soft-member short clips remain incomplete for:
  `/tʲ dʲ sʲ zʲ nʲ lʲ pʲ bʲ mʲ fʲ vʲ kʲ gʲ xʲ/`.
- French connected-speech rules remain rule-level teaching content:
  liaison, enchaînement, elision, final consonant silence, and phrase-final
  prominence are not single-click IPA speakers.
- Spanish remains `es-ES`; Latin American dialect settings such as seseo or
  yeismo variants still need a separate profile or switch.
- Windows artifacts are still unsigned.
