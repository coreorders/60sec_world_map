import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "sixty-sec-world-map",
  brand: {
    displayName: "60초 세계지도",
    primaryColor: "#20C997",
    icon: "https://coreorders.github.io/60sec_world_map/icon.png"
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build"
    }
  },
  permissions: [
    {
      name: "clipboard",
      access: "write"
    }
  ],
  outdir: "dist"
});
