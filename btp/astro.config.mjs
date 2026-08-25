// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://btp.saoconsultingroup.com',
  output: 'static',
  build: { inlineStylesheets: 'auto' },
  compressHTML: true,
});
