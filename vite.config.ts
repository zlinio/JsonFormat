import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isProjectPage = process.env.GITHUB_ACTIONS === 'true'
  && repository && !repository.toLowerCase().endsWith('.github.io');

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.PAGES_BASE_PATH ?? (isProjectPage ? `/${repository}/` : '/'),
});
