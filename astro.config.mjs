import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import solidJs from '@astrojs/solid-js';
import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), solidJs(), preact()],
  vite: {
    ssr: {
      external: ['svgo'],
    },
  },
});
