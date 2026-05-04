import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";

const staticFiles = [
  "bgm.mp3",
  "icon.png",
  "favicon.png",
  "og-image.png",
  "assets/bgm.mp3",
  "vendor/d3.min.js",
  "vendor/topojson-client.min.js",
  "src/app.js",
  "src/data/countries.js",
  "src/data/cities.js",
  "src/map/countries-110m.json"
];

function copyStaticGameFiles() {
  return {
    name: "copy-static-game-files",
    closeBundle() {
      const outDir = path.resolve("dist");
      for (const file of staticFiles) {
        const source = path.resolve(file);
        const target = path.join(outDir, file);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(source, target);
      }
    }
  };
}

export default defineConfig({
  base: "./",
  plugins: [copyStaticGameFiles()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve("index.html"),
        privacy: path.resolve("privacy.html"),
        terms: path.resolve("terms.html")
      }
    }
  }
});
