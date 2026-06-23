export const MICROPHONE_DEVICE_STORAGE_KEY = "speakright_microphone_device_id";

export interface MicrophoneDeviceOption {
  deviceId: string;
  label: string;
  isSystemDefault: boolean;
  isCommunicationsDefault: boolean;
}

function canUseBrowserStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStoredMicrophoneDeviceId(): string | null {
  if (!canUseBrowserStorage()) return null;
  try {
    return localStorage.getItem(MICROPHONE_DEVICE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredMicrophoneDeviceId(deviceId: string | null): void {
  if (!canUseBrowserStorage()) return;
  try {
    if (deviceId) {
      localStorage.setItem(MICROPHONE_DEVICE_STORAGE_KEY, deviceId);
    } else {
      localStorage.removeItem(MICROPHONE_DEVICE_STORAGE_KEY);
    }
  } catch {
    // Preference persistence is best effort only.
  }
}

function labelForDevice(device: MediaDeviceInfo, index: number): string {
  return device.label || `\u9ea6\u514b\u98ce ${index + 1}`;
}

export function toMicrophoneDeviceOptions(
  devices: MediaDeviceInfo[],
): MicrophoneDeviceOption[] {
  return devices
    .filter((device) => device.kind === "audioinput" && device.deviceId)
    .map((device, index) => ({
      deviceId: device.deviceId,
      label: labelForDevice(device, index),
      isSystemDefault: device.label.startsWith("\u9ed8\u8ba4 - "),
      isCommunicationsDefault: device.label.startsWith("\u901a\u8baf - "),
    }));
}

export function choosePreferredMicrophoneDeviceId(
  devices: MicrophoneDeviceOption[],
  storedDeviceId: string | null = getStoredMicrophoneDeviceId(),
): string | null {
  if (storedDeviceId && devices.some((device) => device.deviceId === storedDeviceId)) {
    return storedDeviceId;
  }

  return (
    devices.find((device) => device.isSystemDefault)?.deviceId ??
    devices.find((device) => !/bluetooth|edifier/i.test(device.label))?.deviceId ??
    devices[0]?.deviceId ??
    null
  );
}

export async function resolvePreferredMicrophoneDeviceId(
  explicitDeviceId?: string | null,
): Promise<string | null> {
  if (explicitDeviceId) return explicitDeviceId;
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
    return getStoredMicrophoneDeviceId();
  }

  try {
    const devices = toMicrophoneDeviceOptions(
      await navigator.mediaDevices.enumerateDevices(),
    );
    return choosePreferredMicrophoneDeviceId(devices);
  } catch {
    return getStoredMicrophoneDeviceId();
  }
}
