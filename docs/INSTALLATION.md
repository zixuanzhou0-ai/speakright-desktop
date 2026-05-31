# Installation Guide

## Download

Download the latest internal-test installer from the GitHub Releases page.

This build is not code-signed yet. Use it only for controlled testing until the
Windows EXE/MSI/NSIS artifacts are signed.

Recommended file:

```text
SpeakRight_1.0.1_x64-setup.exe
```

Alternative MSI package:

```text
SpeakRight_1.0.1_x64_en-US.msi
```

## Install on Windows

1. Run the installer.
2. If Windows SmartScreen appears, stop and confirm this is the expected
   internal-test build from the project GitHub Release before choosing
   **More info** and **Run anyway**.
3. Launch SpeakRight.
4. Open **Settings** and configure API keys.

## Required Configuration

SpeakRight can open without API keys, but scoring and AI feedback require external services.

### Azure Speech

Used for pronunciation assessment.

Required values:

- Azure Speech key
- Azure region

### ElevenLabs

Used for standard pronunciation demos and read-along audio.

Required value:

- ElevenLabs API key

### LLM Provider

Used for Chinese AI coach feedback.

Supported desktop providers are the preset providers shown in Settings:
Claude, GPT, Gemini-compatible, DeepSeek, Qwen, GLM, Kimi, and Doubao.
Custom endpoints are disabled in the desktop build until their domains are added
to the Tauri allowlist and CSP.

Required values:

- Provider
- API key
- Model
- Base URL is managed by the selected preset provider in the desktop build

## Local Data

Phase 1 stores user data locally. API keys are stored through the desktop
credential store where supported; learning data stays local to the app.

- usage tracking
- pronunciation history
- diagnosis results
- training mastery profile
- training sessions and review queue

No Supabase backend is required for this release.

## Troubleshooting

If recording does not work:

- Check Windows microphone permission.
- Restart the app after changing microphone permissions.

If pronunciation scoring fails:

- Confirm Azure key and region.
- Confirm network access.
- Try a short word first.

If TTS fails:

- Confirm ElevenLabs key.
- Check quota/usage.
- Try the default voice first.
