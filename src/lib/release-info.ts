export const DESKTOP_RELEASE_VERSION = "1.0.1";

const repositoryUrl = "https://github.com/zixuanzhou0-ai/speakright-desktop";
const releaseTag = `v${DESKTOP_RELEASE_VERSION}`;
const releaseUrl = `${repositoryUrl}/releases/tag/${releaseTag}`;

export const DESKTOP_RELEASE_INFO = {
  productName: "SpeakRight",
  currentVersion: DESKTOP_RELEASE_VERSION,
  channel: "controlled-test",
  channelLabel: "可控测试",
  lastValidatedAt: "2026-06-16",
  repositoryUrl,
  releaseUrl,
  build: {
    framework: "Tauri 2 + Next.js 16 static export",
    target: "Windows x64",
    signed: false,
    signatureStatus: "NotSigned",
    signatureLabel: "未签名",
    releaseReportFileName: `SpeakRight_${DESKTOP_RELEASE_VERSION}_release-report.json`,
  },
  notes: {
    artifacts: "安装包只作为 GitHub Release/CI 产物提供，不在已安装 App 内展示或下载。",
    releasePage:
      "GitHub Release 页面可能落后于当前 main 分支；请结合 release notes 和 RC evidence audit 判断是否为最新验证状态。",
    unsigned:
      "当前 EXE/MSI/NSIS 暂未做代码签名，Windows 可能显示未知发布者提示；仅建议用于可控测试，正式公开 Windows 发布前必须完成代码签名。",
    checksum:
      "每次桌面构建都会生成 release report，记录 EXE/MSI/NSIS 的 SHA-256 digest 与签名状态。",
  },
} as const;
