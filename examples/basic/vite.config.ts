import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.GITHUB_PAGES ? '/doccraft/' : '/',
  server: { port: 5174 },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // In dev, resolve the library to its source for HMR and proper React context
      "smartpage/styles": path.resolve(__dirname, "../../packages/smartpage/src/editor.css"),
      "smartpage": path.resolve(__dirname, "../../packages/smartpage/src/index.ts"),
    },
  },
})
