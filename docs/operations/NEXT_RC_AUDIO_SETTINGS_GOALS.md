# Next RC Goals: Audio Honesty + Settings Userization

Use this file as the first task brief in the next Codex window. Then read
`NEXT_RC_AUDIO_SETTINGS_PROGRESS.md` and `NEXT_CHAT_HANDOFF.md`.

## Non-Negotiables

- Work only in `E:\SpeakRightDesktopRepo`.
- First command each round: `git status --short --branch`.
- Preserve all current uncommitted changes.
- Validate user-facing behavior through the Release EXE, not localhost/dev
  server.
- Do not generate ElevenLabs audio or spend TTS credits without fresh explicit
  user confirmation.
- Keep `es-ES`, `fr-FR`, and `ru-RU` experimental. Do not claim mastery or
  evidence mastery is complete for them.

## Overall Goal

Finish the current RC pass so Settings is understandable to real learners and
single-IPA audio remains honest.

Public product boundary:

- English has the full training flow.
- Spanish, French, and Russian publicly expose phoneme/sound-unit practice plus
  free practice.
- Non-English drill, diagnosis, progress/archive, and formal evidence remain
  gated.
- Single-IPA speakers play only verified local short clips. Missing, proxy,
  rule, phrase, word, TTS, or teaching-video media must not masquerade as
  single-sound audio.

## Parallel Subgoals

### A. Settings Userization

Deliverable:

- `LanguageAvailabilityCard` shows only `录音评分`, `示范音频`, `AI 教练`.
- `LanguageConfigCard` says English is full-flow and non-English is
  experimental core practice.
- Settings UI does not expose `exact`, `speaker`, `音系清单`, `待补`, `mastery`,
  or `evidenceMastery`.

Verify:

```bat
npm.cmd run test -- --run src/__tests__/language-availability-card.test.tsx src/__tests__/language-config-card.test.tsx
```

### B. Single-IPA Source Ledger

Deliverable:

- Keep `SINGLE_IPA_AUDIO_SOURCE_LEDGER.md` current.
- Record which sources are plausible for isolated IPA clips and which are only
  word/example/teaching references.
- Keep Russian soft-member gaps explicit:
  `/tʲ dʲ sʲ zʲ nʲ lʲ pʲ bʲ mʲ fʲ vʲ kʲ gʲ xʲ/`.

Verify:

```bat
npm.cmd run test -- --run src/__tests__/single-ipa-audio-source-ledger.test.ts
npm.cmd run phonology:audio-policy:check
```

### C. Zero-Generation Audio Parity

Deliverable:

- Confirm word/phrase demo audio remains `0 missing`.
- If dry-run reports missing items, stop and report language, item count,
  character estimate, and expected credits. Do not generate.

Verify:

```bat
npm.cmd run audio:parity:dry-run
```

### D. Handoff and Docs

Deliverable:

- Keep `NEXT_RC_AUDIO_SETTINGS_PROGRESS.md`, `NEXT_CHAT_HANDOFF.md`,
  `DESKTOP_STARTUP_RUNBOOK.md`, `README.md`, and `docs/INSTALLATION.md`
  aligned with current facts.
- Do not leave stale current-state claims such as old nonzero parity gaps or
  internal Settings labels.

Verify:

```bat
Select-String -Path src\components\settings\*.tsx,src\__tests__\*.tsx,docs\operations\*.md,README.md,docs\INSTALLATION.md -Pattern "exact 单音","音系/短音频待补","缺口不会冒充 speaker","mastery 证据暂不展示"
```

## Final Gate

Run before commit/push:

```bat
npm.cmd run test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build:desktop-frontend
npm.cmd run desktop:build
npm.cmd run desktop:preflight
npm.cmd run desktop:ui-smoke
npm.cmd run desktop:launch-release
```

Optional supporting checks:

```bat
npm.cmd run audio:loudness:dry-run
npm.cmd run phonology:audio-policy:check
```

## Final Report

Report changed files, user-visible fixes, command results, Release EXE launch
status, ElevenLabs usage status, GitHub `main` commit SHA, remaining limits, and
next priority.
