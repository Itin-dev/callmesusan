/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Git commit SHA of this build (set in vite.config.ts). */
  readonly VITE_COMMIT_SHA?: string
  /** Vercel environment: production | preview | development (set in vite.config.ts). */
  readonly VITE_DEPLOY_ENV?: string
}
