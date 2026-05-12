# SpeakRight Desktop v1.0.1

Release date: 2026-05-13

## Highlights

- Added a desktop version and release panel to Settings.
- Settings now shows the current app version, release channel, Windows target, build stack, installer links, and unsigned-installer note.
- Updated package, Tauri, and Rust crate versions to `1.0.1`.
- Added a focused unit test to keep release URLs aligned with the app version.

## Installers

- `SpeakRight_1.0.1_x64-setup.exe`
  - Size: 212,876,384 bytes
  - SHA-256: `2a03382464a20b7d3ff2e31eb993fe5d98faf35751213f95cc26066b731c1bd9`
- `SpeakRight_1.0.1_x64_en-US.msi`
  - Size: 212,377,600 bytes
  - SHA-256: `02e55a7fdd0797357cb2e956f1506cc0bbe9b02334711494e1ba42bfdaacac8c`

## Verification

Validated before release:

```powershell
npm exec tsc -- --noEmit
npm exec vitest run src/__tests__/release-info.test.ts
npm run build:desktop-frontend
npm run build
```

The Tauri build produced both NSIS and MSI bundles successfully.

## Known Notes

- The Windows installer is not code-signed yet.
- The GitHub repository is currently private.
- Users must configure their own Azure, ElevenLabs, and LLM API keys in Settings.
- The current product scope is American English for Chinese learners.
