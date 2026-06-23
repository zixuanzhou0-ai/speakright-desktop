# Third-Party Notices

This document separates API providers, bundled local assets, and reference
sources for SpeakRight Browser Edition.

## API Providers

| Provider | Role |
| --- | --- |
| Azure Speech | Pronunciation Assessment provider for all numeric scores. |
| ElevenLabs | Optional TTS provider for generated demo/read-along audio. |
| LLM providers | Chinese coaching feedback only; not a scoring source. |
| Youdao | Online dictionary pronunciation fallback. |
| Merriam-Webster | Dictionary pronunciation fallback where configured/supported. |

Users bring their own provider keys. Keys must not be committed, logged, placed
in URLs, or included in screenshots.

## Bundled Or Mirrored Assets

| Source family | Usage boundary |
| --- | --- |
| American IPA Chart / americanipachart.com | English IPA chart audio family where mirrored assets exist in the project. |
| ElevenLabs generated audio | Local demo audio where project policy permits redistribution. |
| Microsoft Fluent Emoji-style assets | English phoneme card illustrations where bundled. |

Bundled assets must be reviewed before public release. If redistribution is not
clear, Browser Edition should link out or show an honest missing-media state.

## Teaching And Phonetics References

| Reference | Usage boundary |
| --- | --- |
| Rachel's English | English articulation teaching reference/source notes where local clips are used. |
| University of Iowa Sounds of Speech | Spanish articulation reference and local asset source where exact assets are present. |
| Seeing Speech / University of Glasgow | Phonetics reference context, especially for non-English articulation. |
| EasyPronunciation | IPA and pronunciation reference for multilingual content. |
| Wiktionary / Forvo / language-specific phonetics references | Reference-only support for IPA, example words, and source-ledger review. |

Reference use is not the same as permission to bundle media. Release docs should
avoid implying endorsement, partnership, or automatic redistribution rights.
