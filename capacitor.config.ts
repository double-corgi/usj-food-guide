import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig & { packageClassList: string[] } = {
  appId: "com.doublecorgi.unicolle",
  appName: "ユニコレ",
  webDir: "out",
  packageClassList: [
    "AdMobPlugin",
    "AppPlugin",
    "CAPCameraPlugin",
    "FilesystemPlugin",
    "HapticsPlugin",
    "CAPNetworkPlugin",
    "PreferencesPlugin",
    "SharePlugin",
    "WidgetSyncPlugin",
    "StaffSecureSessionPlugin"
  ],
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: serverUrl.startsWith("http://")
        }
      }
    : {})
};

export default config;
