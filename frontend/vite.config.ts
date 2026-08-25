/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // コンテナの外（ホストのブラウザ）からアクセスできるようにする。
    // これがないと localhost:5173 で繋がらない。
    host: true,
    port: 5173,
    watch: {
      // Mac/Windows ではバインドマウント上のファイル変更を検知できないことがあるため、
      // ポーリングで監視する。HMR が効かないときはここが原因のことが多い。
      usePolling: true,
    },
    proxy: {
      // フロントから /api/... を叩くと backend コンテナに転送される。
      // 同一オリジンに見えるので CORS の設定が不要になる。
      '/api': {
        target: 'http://backend:5000',
        changeOrigin: true,
      },
    },
  },
  test: {
    // ドメイン層は React に依存しない純粋関数なので、ブラウザ環境は不要。
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
