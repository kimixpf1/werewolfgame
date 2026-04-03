import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: './',
  publicDir: false,
  plugins: mode === 'production' ? [react()] : [inspectAttr(), react()],
  build: {
    // Emit images as separate static files in production instead of embedding them
    // into the main bundle. This keeps the online entry script small and faster to parse.
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => assetInfo.name === 'style.css' ? 'assets/app.css' : 'assets/[name][extname]',
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
