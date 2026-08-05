export type NativePlatform = "web" | "ios" | "android";

type CapacitorBridge = {
  getPlatform?: () => string;
  isNativePlatform?: () => boolean;
};

type WindowWithCapacitor = Window & {
  Capacitor?: CapacitorBridge;
};

export function getCapacitorBridge(): CapacitorBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as WindowWithCapacitor).Capacitor;
}

export function getNativePlatform(): NativePlatform {
  const capacitor = getCapacitorBridge();
  if (!capacitor?.isNativePlatform?.()) return "web";
  const platform = capacitor.getPlatform?.();
  return platform === "ios" || platform === "android" ? platform : "web";
}

export function isNativeIosApp() {
  return getNativePlatform() === "ios";
}

export async function impactLight() {
  if (!isNativeIosApp()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Haptics are optional and must never break the web fallback.
  }
}

export async function selectionChanged() {
  if (!isNativeIosApp()) return;
  try {
    const { Haptics } = await import("@capacitor/haptics");
    await Haptics.selectionChanged();
  } catch {
    // Haptics are optional.
  }
}

export async function notifySuccess() {
  if (!isNativeIosApp()) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // Haptics are optional.
  }
}

export async function notifyWarning() {
  if (!isNativeIosApp()) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Warning });
  } catch {
    // Haptics are optional.
  }
}
