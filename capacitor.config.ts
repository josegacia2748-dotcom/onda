import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.jgarapps.onda",
  appName: "Onda",
  webDir: "dist",
  android: {
    backgroundColor: "#08090b",
    allowMixedContent: false,
  },
  server: {
    androidScheme: "https",
  },
};

export default config;
