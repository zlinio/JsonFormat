import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isProjectPage = process.env.GITHUB_ACTIONS === 'true'
  && repository && !repository.toLowerCase().endsWith('.github.io');

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  base: process.env.PAGES_BASE_PATH ?? (isProjectPage ? `/${repository}/` : '/'),
});
