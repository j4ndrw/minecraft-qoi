/// <reference types="vite-env" />
interface ImportMetaEnv {
  readonly OLLAMA_API_URL: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
