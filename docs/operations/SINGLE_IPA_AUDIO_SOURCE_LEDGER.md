# Single IPA Audio Source Ledger

This ledger records source checks for single IPA / sound-unit clips. It is the
gate for registering header clips or clickable assessment tiles in SpeakRight.

## Policy

- A clip may become a single-sound header clip only when the source, target IPA,
  language, license/authorization, and audio shape are all verified.
- Whole words, phrases, sentence audio, rule explanations, teaching-video tracks,
  and ElevenLabs output must not masquerade as single IPA audio.
- If a unit is not verified, the UI may show a score but must keep the tile
  unclickable.
- `es-ES`, `fr-FR`, and `ru-RU` remain experimental. This ledger does not mark
  mastery or evidence mastery as complete.

## Source Classes

| Source | URL | Current Use | Decision |
| --- | --- | --- | --- |
| Seeing Speech IPA Charts | https://www.seeingspeech.ac.uk/ipa-charts/ | Academic articulatory videos/audio for IPA symbols. | Plausible source for verified isolated IPA clips when the exact language target and clean audio can be confirmed. |
| University of Iowa Sounds of Speech Spanish | https://soundsofspeech.uiowa.edu/spanish | Spanish articulatory materials for individual sounds. | Preferred Spanish source for exact local header clips already used by the app. |
| EasyPronunciation French IPA Chart | https://easypronunciation.com/en/french-letters-pronunciation-ipa-chart | French IPA chart with example-word media. | Useful as teaching/reference evidence; do not register word media as single IPA clips unless a clean isolated sound is separately verified. |
| EasyPronunciation Russian IPA Chart | https://easypronunciation.com/en/russian-letters-pronunciation-ipa-chart | Russian IPA chart with example-word media. | Useful for Russian chart/reference evidence; no direct soft-consonant single clips were verified in this pass. |
| EasyPronunciation Spanish IPA Chart | https://easypronunciation.com/en/phonetic-symbols-chart/spanish/ipa | Spanish IPA chart/reference page. | Reference only for this pass because Spanish exact local clips already prefer Iowa. |

## Current Language Conclusions

### Spanish

- Current result: no new downloads needed.
- Existing exact local header clips remain the source of truth for visible
  Spanish sound units.
- Dialect and rule units stay outside single-click audio unless an exact local
  short clip is verified.

### French

- Current result: no new downloads needed for the visible single-sound inventory.
- French phrase rules such as liaison, enchainement, elision, final consonant
  silence, and phrase-final prominence remain rule-level teaching content.
- EasyPronunciation examples may support future teaching media, but they are not
  accepted as single IPA clips in this pass.

### Russian

- Current result: no new downloads registered.
- The following soft-pair units still need exact short soft-member clips before
  becoming clickable assessment tiles:

| Slug | Target |
| --- | --- |
| `ru-t-tj` | `/tʲ/` |
| `ru-d-dj` | `/dʲ/` |
| `ru-s-sj` | `/sʲ/` |
| `ru-z-zj` | `/zʲ/` |
| `ru-n-nj` | `/nʲ/` |
| `ru-l-lj` | `/lʲ/` |
| `ru-p-pj` | `/pʲ/` |
| `ru-b-bj` | `/bʲ/` |
| `ru-m-mj` | `/mʲ/` |
| `ru-f-fj` | `/fʲ/` |
| `ru-v-vj` | `/vʲ/` |
| `ru-k-kj` | `/kʲ/` |
| `ru-g-gj` | `/gʲ/` |
| `ru-x-xj` | `/xʲ/` |

`ru-r-rj` already has standalone hard and soft exact clips, so it is not part of
this soft-member gap list. Aggregate rule cards such as hard/soft overview,
stress reduction, final devoicing, voicing assimilation, and clusters remain
unclickable rule guidance unless phrase-level evidence is added separately.

## Next Verification Checklist

For every future candidate, record:

- target language and IPA;
- source URL and authorization or license basis;
- whether the source is native-speaker, academic, or institutionally curated;
- whether the clip is isolated or can be cropped to one short sound without
  obvious lead-in, trailing word audio, or coarticulated residue;
- final local file path and matching test update.
