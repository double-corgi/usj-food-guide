import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: "jp.unibafood.conquest",
  appName: "ユニバフード制覇",
  webDir: "public/capacitor-web",
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: false
        }
      }
    : {})
};

export default config;
