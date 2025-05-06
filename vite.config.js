import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: ".",
  publicDir: "public",
  base: "/ar-band/", // wichtig für GitHub Pages
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
});
