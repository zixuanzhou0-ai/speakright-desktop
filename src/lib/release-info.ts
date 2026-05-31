export const DESKTOP_RELEASE_VERSION = "1.0.1";

const repositoryUrl = "https://github.com/zixuanzhou0-ai/speakright-desktop";
const releaseTag = `v${DESKTOP_RELEASE_VERSION}`;
const releaseUrl = `${repositoryUrl}/releases/tag/${releaseTag}`;
const releaseAssetUrl = `${repositoryUrl}/releases/download/${releaseTag}`;

export const DESKTOP_RELEASE_INFO = {
  productName: "SpeakRight",
  currentVersion: DESKTOP_RELEASE_VERSION,
  channel: "internal",
  releasedAt: "2026-05-13",
  repositoryUrl,
  releaseUrl,
  latestReleasesUrl: `${repositoryUrl}/releases`,
  build: {
    framework: "Tauri 2 + Next.js 16 static export",
    target: "Windows x64",
    signed: false,
    signatureStatus: "NotSigned",
    releaseReportFileName: `SpeakRight_${DESKTOP_RELEASE_VERSION}_release-report.json`,
  },
  installers: [
    {
      id: "nsis",
      label: "推荐安装",
      name: "Windows 安装程序",
      kind: "NSIS",
      fileName: `SpeakRight_${DESKTOP_RELEASE_VERSION}_x64-setup.exe`,
      sizeLabel: "约 213 MB",
      description: "适合大多数 Windows 用户，双击后按安装向导完成。",
      downloadUrl: `${releaseAssetUrl}/SpeakRight_${DESKTOP_RELEASE_VERSION}_x64-setup.exe`,
    },
    {
      id: "msi",
      label: "企业部署",
      name: "Windows MSI",
      kind: "MSI",
      fileName: `SpeakRight_${DESKTOP_RELEASE_VERSION}_x64_en-US.msi`,
      sizeLabel: "约 212 MB",
      description: "适合需要 MSI 安装包或集中分发的环境。",
      downloadUrl: `${releaseAssetUrl}/SpeakRight_${DESKTOP_RELEASE_VERSION}_x64_en-US.msi`,
    },
  ],
  notes: {
    privateRepository: "当前发布仓库是私有仓库，需要 GitHub 访问权限。",
    unsigned:
      "当前安装包暂未做代码签名，Windows 可能显示未知发布者提示；仅建议用于可控内测，公开发布前必须完成代码签名。",
    checksum:
      "每次桌面构建都会生成 release report，记录 EXE/MSI/NSIS 的 SHA-256 digest 与签名状态。",
  },
} as const;
