import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import solidJs from "@astrojs/solid-js";
import preact from "@astrojs/preact";
import svelte from "@astrojs/svelte";
import AstroPWA from "@vite-pwa/astro";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://www.tonesandbox.com",
  integrations: [
    AstroPWA(),
    tailwind(),
    solidJs(),
    preact(),
    svelte(),
    sitemap(),
  ],
  vite: {
    ssr: {
      external: ["svgo"],
    },
  },
});
