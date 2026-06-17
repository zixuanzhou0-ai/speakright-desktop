# Spanish Phonology Optimization Plan

Status: draft implementation plan
Language profile: `es-ES`
Product status: experimental
Last updated: 2026-06-17

This plan defines how SpeakRight should tighten Spanish pronunciation content so
it follows Spanish phonology instead of copying the English IPA-card model. It is
an implementation guide for an experimental module.

## Source Basis

Primary model:

- RAE/ASALE, `Nueva gramatica de la lengua espanola: Fonetica y fonologia`
  (2011), pan-Hispanic reference for Spanish phonetics and phonology:
  <https://www.rae.es/obras-academicas/gramatica/nueva-gramatica-de-la-lengua-espanola>
- Martinez-Celdran, Fernandez-Planas, and Carrera-Sabate, "Castilian Spanish",
  `Journal of the International Phonetic Association`, 33(2), 255-259:
  <https://doi.org/10.1017/S0025100303001373>
- Current app implementation:
  `src/lib/language-sound-units/spanish.ts`,
  `src/lib/local-language-assets.ts`,
  `src/lib/assessment-segment-audio.ts`,
  `src/lib/language-source-alignment.ts`.

Pedagogical stance:

- Teach the Spanish phoneme inventory first.
- Teach conditioned realizations separately, especially `/b d g/` as stops vs
  approximants.
- Treat stress, rhythm, diphthongs, and nasal place assimilation as word,
  phrase, or prosody training, not as fake single-phoneme audio.
- Keep `es-ES` explicit. Do not describe Latin American `seseo`, regional
  `yeismo`, or `/ʎ/` retention as errors.

## Correct Spanish Model

Spanish has a mature phonological model. The product should use these layers:

| Layer | Spanish target | Product meaning |
| --- | --- | --- |
| Phoneme inventory | `/a e i o u/`, core consonants, `/ɾ/` vs `/r/` | Main sound-unit list and scoring labels |
| Allophone layer | `/b d g/` as `[b d g]` after pause/nasal and `[β̞ ð̞ ɣ˕]` elsewhere | Teaching and feedback explain context; do not score `[β]` as if it were English `/v/` |
| Dialect layer | Castilian `/θ/`; Latin American and many Andalusian/Canarian varieties use `seseo`; `ll` may be `/ʝ/` or `/ʎ/` | Profile or dialect switch, not global correctness |
| Prosody layer | lexical stress, syllable-timed rhythm, stable unstressed vowels | Phrase/sentence drills, not single-symbol speakers |
| Connected speech | diphthongs `/j w/`, nasal place assimilation, linking across words | Training implementation layer |

Core content requirements:

- Vowels: `/a e i o u/` must stay short, pure, and stable. Do not teach English
  diphthongized `/eɪ/` or `/oʊ/` targets.
- Stops: `/p t k/` are not English-style aspirated stops. Spanish `/t d/` are
  dental or denti-alveolar compared with English alveolar targets.
- Voiced obstruents: `/b d g/` need a two-state lesson: stop realization after
  pause/nasal, approximant realization between vowels and in most continuous
  speech.
- Rhotics: `/ɾ/` and `/r/` are contrastive. The app must preserve tap/trill as
  separate targets.
- Regional sounds: `/θ/` belongs to Castilian `es-ES`; `seseo` must be marked as
  a variant target, not a learner failure.
- Stress: lexical stress changes meaning. `papa/papa`, `hablo/hablo`, and
  similar pairs must be stress-first training.

## Current SpeakRight State

Current `SPANISH_PHONEMES` contains 31 course sound units:

- Five vowels: `es-a`, `es-e`, `es-i`, `es-o`, `es-u`.
- Plain Spanish consonant units now include `es-p`, `es-t`, `es-k`, `es-f`,
  `es-m`, `es-n`, and stop-position `/b d g/` anchors `es-b-stop`,
  `es-d-stop`, `es-g-stop`.
- Spanish-specific consonant, allophone, or contrast units: `es-bv`, `es-d`,
  `es-g` for `[β ð ɣ]` realization teaching, plus `es-theta`, `es-x`,
  `es-ny`, `es-tap-r`, `es-trill-r`, `es-s`, `es-ch`, `es-y-ll`, `es-l`.
- Implementation/prosody units: `es-nasal-place`, `es-diphthongs-j`,
  `es-diphthongs-w`, `es-lexical-stress`, `es-syllable-rhythm`.

Current exact scoring-tile audio is intentionally narrower than the course list:

- Playable exact header clips include the five vowels, `[β ð ɣ]`, `/θ x ɲ ɾ r s tʃ ʝ l j w/`.
- `es-nasal-place` is marked `isProxyForAssessment`.
- `es-lexical-stress` and `es-syllable-rhythm` do not expose single-phoneme
  header audio.
- Plain `/p t k f m n b d g/` are now standalone Spanish course/scoring
  anchors, but they still have no verified short local header clips.

This is acceptable only as an experimental course-anchor layer. It is not a full
Spanish phoneme inventory yet.

## Target Data Model

Each Spanish sound unit should be classified with one of these product layers:

| `soundUnitLayer` target | Examples | UI/audio rule |
| --- | --- | --- |
| `phoneme` | `/a e i o u p t k b d g f s x tʃ m n ɲ l ɾ r/` | May have a short exact speaker once locally verified |
| `allophone` | `[β̞ ð̞ ɣ˕]` | Can be playable only if labeled as realization of `/b d g/`, not as separate phonemic mastery |
| `contrast` | `/ɾ/` vs `/r/`, `/s/` vs Castilian `/θ/`, `/ʝ/` vs regional `/ʎ/` | Uses paired examples and dialect notes |
| `prosody` | stress, syllable rhythm, diphthong timing | Score and teach at word/phrase/sentence level |
| `connectedSpeech` | nasal place assimilation, word linking | Do not expose as single-symbol tile audio |

Implementation note: if adding a new field is too large for the first pass,
encode the same distinction through existing `soundUnitType`, `notes`,
`isProxyForAssessment`, and tests first. The long-term goal is a first-class
layer field.

## Required Content Changes

1. Inventory completion
   - Add standalone Spanish course units for `/p t k f m n/`. Done in source;
     exact short local header clips remain pending.
   - Add `/b/`, `/d/`, `/g/` stop-position phoneme anchors clearly separate
     from current `[β ð ɣ]` realization clips. Done in source as
     `es-b-stop`, `es-d-stop`, and `es-g-stop`; exact short local header clips
     remain pending.
   - Decide whether `/ʎ/` remains a variant note under `es-y-ll` or becomes a
     region-gated optional unit.

2. Allophone cleanup
   - Rename or clarify `es-bv`, `es-d`, and `es-g` so the UI says "phoneme plus
     realization", not "one IPA symbol equals one sound forever". Done in
     source and tests; assessment aliases now keep `/b d g/` on stop anchors
     and `[β ð ɣ]` on realization units.
   - Keep `[β̞ ð̞ ɣ˕]` in training examples.
   - Keep scoring tiles unclickable for plain `/b d g/` until exact stop clips
     exist.

3. Dialect policy
   - Keep current profile `es-ES`.
   - Add copy that Castilian `/θ/` is a target for this profile.
   - Add future profile goal for `es-LatAm` or a dialect switch. Do not merge
     `seseo` into the Castilian baseline silently.

4. Stress and rhythm
   - Keep `es-lexical-stress` and `es-syllable-rhythm` as prosody units.
   - Add stress-pair examples with visible stress marks and Chinese guidance.
   - Keep no local single-speaker icon unless the audio is a short stress demo,
     not a fake phoneme clip.

5. Example IPA audit
   - Re-check every Spanish keyword, phrase, and sentence against the selected
     `es-ES` pronunciation standard.
   - Do not rewrite `needs-review` rows unless there are two authoritative
     sources or one authoritative source plus a dictionary/source-audio match.

## Audio Policy

Spanish audio must follow the existing honest-playback rule:

- Exact phoneme/allophone clips may be clickable only when the local file is a
  short `/audio/language-assets/es-ES/header-clips/*.m4a` clip tied to the same
  sound unit.
- No video audio, whole-word audio, dictionary fallback, or rule explanation may
  pretend to be a single phoneme.
- Plain `/p t k f m n b d g/` should display score labels but stay unclickable
  until exact local clips exist.
- A future batch may add local header clips, but no ElevenLabs generation may
  run without explicit maintainer confirmation.

## Test Plan

Add or update tests in these areas:

- `src/__tests__/spanish-language-content.test.ts`
  - Spanish inventory contains required phoneme anchors.
  - `/b d g/` allophone notes remain context-aware.
  - `/θ/` is profile-scoped to `es-ES`.
- `src/__tests__/assessment-segment-audio.test.ts`
  - Plain `/p t k f m n b d g/` remain unclickable until exact clips exist.
  - `[β ð ɣ]` clips do not map to plain stop aliases.
- `src/__tests__/language-source-alignment.test.ts`
  - Stress and rhythm units are rule/prosody units and hide header speakers.
- `src/__tests__/language-content-audit.test.ts`
  - Stress-pair examples carry visible stress information.

Acceptance gate:

```bat
npm.cmd run test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build:desktop-frontend
npm.cmd run desktop:preflight
npm.cmd run desktop:ui-smoke
npm.cmd run desktop:launch-release
```

Optional audio-only gates, still dry-run:

```bat
npm.cmd run audio:parity:dry-run
npm.cmd run audio:loudness:dry-run
```

## Spanish Completion Goal

Spanish is ready to move from experimental content toward public beta only when:

- The course inventory clearly distinguishes phonemes, allophones, contrasts,
  prosody, and connected speech.
- The missing common phoneme anchors are either implemented or explicitly listed
  as known gaps in the UI and docs.
- Every clickable scoring tile maps to an exact local short clip.
- Dialect variants are visible and not treated as learner errors.
- Tests prevent future regressions back to the English one-symbol-one-speaker
  model.
