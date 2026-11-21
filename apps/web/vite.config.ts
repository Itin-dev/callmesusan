/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { defineConfig } from 'vite'

// Build info for the footer. Vercel sets VERCEL_GIT_COMMIT_SHA / VERCEL_ENV; locally fall back to git.
function gitCommit(): string {
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return ''
  }
}
process.env.VITE_COMMIT_SHA ??= process.env.VERCEL_GIT_COMMIT_SHA || gitCommit()
process.env.VITE_DEPLOY_ENV ??= process.env.VERCEL_ENV ?? ''

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  server: {
    // Dev: forward API calls to FastAPI (uv run uvicorn app.main:app --reload).
    proxy: { '/api': 'http://localhost:8000' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
