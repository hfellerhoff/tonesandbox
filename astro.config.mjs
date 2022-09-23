import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import solidJs from '@astrojs/solid-js';
import preact from '@astrojs/preact';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), solidJs(), preact(), svelte()],
  vite: {
    ssr: {
      external: ['svgo'],
    },
  },
});
