# Non-English Phonology Alignment Goals

Status: implementation goals
Scope: `es-ES`, `fr-FR`, `ru-RU`
Product status: experimental
Last updated: 2026-06-18

## Goal

把 SpeakRight Desktop 的西语、法语、俄语从“英语发音页迁移版”收紧为各自按母语音系
建模的 experimental pronunciation modules。最终目标不是宣称 mastery 或
evidenceMastery 已完成，而是让真实用户能可靠区分：

- 这个语言有哪些稳定课程锚点；
- 哪些是上下文实现、变体、语流规则或韵律；
- 哪些评分 tile 有真实同源短音频；
- 哪些只能显示分数或规则说明，不能点击播放替代音频。

## Source-Aligned Answer

三语都有成熟 IPA/音系描述。正确做法不是放弃 IPA，也不是沿用英语拆法，而是每个语言
按自己的 phonological model 拆分：

- 西语：phoneme-first 可以保留，但训练层必须解释 `[β̞ ð̞ ɣ̞]`、tap/trill、
  Castilian `/s θ/`、鼻音位置同化、双元音、词重音和音节节奏。
- 法语：不能只做孤立音表；必须把鼻化元音、前圆唇元音、`/ʁ/`、glides、liaison、
  enchaînement、elision、schwa/e caduc、词尾静音和节奏组作为核心。
- 俄语：必须 stress-first 和 hard/soft-first；弱化 `[ɐ ə ɪ]`、词尾清化、清浊同化、
  iotated vowels、`ь` 和 clusters 都依赖上下文。

## Language Plans

- Spanish final optimization plan:
  [`SPANISH_PHONOLOGY_OPTIMIZATION_PLAN.md`](./SPANISH_PHONOLOGY_OPTIMIZATION_PLAN.md)
- French final optimization plan:
  [`FRENCH_PHONOLOGY_OPTIMIZATION_PLAN.md`](./FRENCH_PHONOLOGY_OPTIMIZATION_PLAN.md)
- Russian final optimization plan:
  [`RUSSIAN_PHONOLOGY_OPTIMIZATION_PLAN.md`](./RUSSIAN_PHONOLOGY_OPTIMIZATION_PLAN.md)

每份语言文档都必须继续和对应 inventory/audio policy 表一起维护：

- Spanish:
  [`SPANISH_PHONOLOGY_INVENTORY_TABLE.md`](./SPANISH_PHONOLOGY_INVENTORY_TABLE.md),
  [`SPANISH_ASSESSMENT_AUDIO_POLICY_TABLE.md`](./SPANISH_ASSESSMENT_AUDIO_POLICY_TABLE.md)
- French:
  [`FRENCH_PHONOLOGY_INVENTORY_TABLE.md`](./FRENCH_PHONOLOGY_INVENTORY_TABLE.md),
  [`FRENCH_ASSESSMENT_AUDIO_POLICY_TABLE.md`](./FRENCH_ASSESSMENT_AUDIO_POLICY_TABLE.md)
- Russian:
  [`RUSSIAN_PHONOLOGY_INVENTORY_TABLE.md`](./RUSSIAN_PHONOLOGY_INVENTORY_TABLE.md),
  [`RUSSIAN_ASSESSMENT_AUDIO_POLICY_TABLE.md`](./RUSSIAN_ASSESSMENT_AUDIO_POLICY_TABLE.md)

## Implementation Gates

1. Inventory gate: every unit has language, IPA/display label, layer, source refs, audio status,
   tile policy, known gaps, and experimental boundary.
2. Content gate: words, phrases, sentences, IPA, stress text, liaison/enchaînement/elision,
   schwa, reduction, palatalization, assimilation and rhythm are checked in the relevant language.
3. Audio gate: only exact same-unit local short clips are clickable. Video, whole words,
   whole sentences, dictionary fallback, generated TTS and rule narration cannot stand in for
   single-sound playback.
4. UI gate: scoring tiles visibly distinguish `可听`, `未验证`, and `规则`; no silent clickable
   fallback is allowed.
5. Test gate: add or update tests before changing `needs-review` content or audio policy.
6. Release gate: validate with Release EXE only; keep `es-ES`, `fr-FR`, `ru-RU` experimental.

## Next Priority

First implement UI-visible scoring tile policy across Spanish/French/Russian assessment results,
then continue language-by-language content audits: Spanish `/b d g/` and stress, French connected
speech, Russian stress/hard-soft/reduction. Do not generate paid-provider audio without explicit
confirmation.
