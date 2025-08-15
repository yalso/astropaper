import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwind from '@astrojs/tailwind';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  integrations: [vue(), tailwind()],
  vite: {
    resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
    // 如需按需调试，可在这里加 alias 或 define
  }
});
