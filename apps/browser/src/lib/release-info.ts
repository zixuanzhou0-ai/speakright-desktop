export const BROWSER_RELEASE_VERSION = "1.0.1";

const repositoryUrl = "https://github.com/zixuanzhou0-ai/speakright-desktop";
const releaseTag = `v${BROWSER_RELEASE_VERSION}`;
const releaseUrl = `${repositoryUrl}/releases/tag/${releaseTag}`;

export const BROWSER_RELEASE_INFO = {
  productName: "SpeakRight Browser Edition",
  currentVersion: BROWSER_RELEASE_VERSION,
  channel: "browser-preview",
  channelLabel: "浏览器预览",
  lastValidatedAt: "待本轮验证",
  repositoryUrl,
  releaseUrl,
  build: {
    framework: "Next.js 16 browser/static export",
    target: "Windows / macOS / Linux browser",
    signed: false,
    signatureStatus: "NotApplicable",
    signatureLabel: "无安装包签名",
    releaseReportFileName: `SpeakRight_Browser_${BROWSER_RELEASE_VERSION}_validation-report.json`,
  },
  notes: {
    artifacts:
      "浏览器版以源码和静态导出为主，不提供 Windows 安装包；请通过 localhost 或 HTTPS 打开。",
    releasePage:
      "GitHub Release 页面需要分别阅读 Windows Desktop 与 Browser Edition 小节，避免把两个版本混淆。",
    unsigned:
      "浏览器版不需要 EXE/MSI/NSIS 签名；麦克风权限通常需要 localhost 或 HTTPS，不能依赖 file:// 直接打开。",
    checksum:
      "最终发布前会记录 Browser Edition 的 lint、typecheck、test、build、smoke 和真实 Azure 评分验证结果。",
  },
} as const;
