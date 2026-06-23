# Browser Edition Completion Audit

Date: 2026-06-23

This audit maps the Browser Edition goal to current proof. It is intentionally
stricter than a progress summary: an item is complete only when current evidence
proves it.

## Evidence Sources

- Goal text: `C:\Users\Administrator\.codex\attachments\58ee9776-cbf3-4cce-9319-256d19720c4e\pasted-text-1.txt`
- Local validation log: `docs/browser-edition/VALIDATION_LOG.md`
- Release checklist: `docs/browser-edition/VALIDATION_AND_RELEASE.md`
- Browser app source: `apps/browser`
- Current Git state: `git status --short --branch`, `git remote -v`

## Requirement Audit

| Requirement | Current evidence | Status |
| --- | --- | --- |
| Browser Edition is separated from Windows Desktop. | Browser app is under `apps/browser`; local isolation scan found no Tauri imports, desktop secure-store dependency, desktop port dependency, or desktop release-script dependency in Browser Edition source. | Proven locally |
| Browser Edition is not SaaS and uses BYOK. | Browser docs and Settings copy describe local/browser key storage; API-key persistence is session-first with explicit local persistence. | Proven locally |
| Core routes build and open from a browser/static server. | `npm run validate:browser` passed; Next produced 197 static/SSG routes; static smoke covered settings, English sound practice, Spanish/French/Russian sound-unit pages, free practice, assessment, drill, and 2 media assets. | Proven locally |
| User-facing numeric pronunciation scores come from Azure Speech, not LLM. | Browser adapter uses Microsoft Speech SDK pronunciation assessment; tests cover scoring boundary and smoke-only fixture guards; docs state LLM is feedback-only. | Proven by source/tests, pending live service proof |
| Browser Azure implementation follows official SDK path. | Microsoft Learn/API check recorded in `VALIDATION_LOG.md`: `PronunciationAssessmentConfig.applyTo(recognizer)`, `PronunciationAssessmentResult.fromResult`, and JS SDK audio streams are official surfaces. | Proven locally |
| English, Spanish, French, and Russian use the right Azure locales. | Source/tests route language-specific practice through the active language profile and locale; multilingual static smoke passes. | Proven by source/tests, pending live service proof |
| Screenshots are current and separated from desktop screenshots. | Browser screenshots are stored under `docs/assets/screenshots/browser/`; old unreferenced English screenshot was removed. | Proven locally |
| README/docs/release notes explain Desktop vs Browser Edition. | README, `docs/DESKTOP.md`, `docs/WEB.md`, and `docs/browser-edition/*` document the split, commands, limitations, providers, and credits. `npm run docs:check-links` passes. | Proven locally |
| Stale docs/assets are cleaned or ignored after reference checks. | Obsolete root docs/assets were removed or labeled; local agent/runtime artifacts are ignored; public docs link check passes. | Proven locally |
| Secret handling is safe for public release. | Text secret scan over Browser Edition source/scripts/docs and public entry docs returns no Azure/OpenAI/ElevenLabs/Gemini-style key literals. Live-log helper rejects key-shaped input. | Proven locally |
| Real browser Azure live scoring is verified for `en-US`, `es-ES`, `fr-FR`, `ru-RU`. | No Azure/Speech/Cognitive environment variables are present; no sanitized `.runlogs/browser-azure-live-check.md` pass entries exist for all four locales. | Not proven |
| Final commit and push to GitHub `main`. | Current branch is `master`; `git remote -v` returns no configured remotes. | Not possible from current state |

## Remaining Release Blockers

1. Real Browser Azure live checks:
   - Serve Browser Edition from localhost or HTTPS.
   - Configure Azure Speech key and region in Settings.
   - Record one fresh browser microphone sample for each locale:
     `en-US`, `es-ES`, `fr-FR`, `ru-RU`.
   - Record sanitized pass/fail metadata with:
     `npm run browser:azure-live-log -- --record --locale <locale> --route <route> --status pass --score <0-100> --notes "<sanitized note>"`.

2. GitHub push target:
   - Configure the intended Git remote.
   - Confirm whether the public branch should be renamed from `master` to
     `main` or pushed to an existing `main`.
   - Stage only intentional changes, commit with a Browser Edition sync message,
     and push after live Azure evidence exists.

## Completion Decision

The Browser Edition is locally validated and substantially ready, but the goal is
not complete. The final acceptance explicitly requires real Azure browser live
checks and a GitHub `main` push; both are missing from the current machine state.
