# Security Policy

## Supported Scope

The public repository tracks the current SpeakRight Desktop release-candidate
line. Security fixes should target `main` unless a maintainer has created a
dedicated release branch.

## Reporting A Vulnerability

Please do not open a public issue for vulnerabilities, leaked credentials, or
private user data.

Use GitHub private vulnerability reporting or contact the repository owner
through GitHub with:

- a short description of the issue
- affected files or versions
- reproduction steps
- likely impact
- any suggested mitigation

We will acknowledge valid reports as soon as possible and prioritize issues
that could expose API keys, microphone recordings, local learning data, desktop
permissions, or arbitrary network access.

## Secrets And User Data

Do not commit API keys, tokens, private keys, real user recordings, or exported
learning data. The desktop app stores user-provided service credentials through
the desktop credential layer where supported. `.env.example` is documentation
only and must not contain real credentials.

## Release Security Boundary

Windows artifacts are currently unsigned. Controlled internal testing may use
the unsigned warning documented in the installation guide, but public release
requires code signing.

The Tauri allowlist and CSP should remain narrow. Pull requests that add new
network origins, file access, shell access, or plugin permissions must include
a short justification and tests when possible.
