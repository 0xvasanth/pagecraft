import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174 },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // In dev, resolve the library to its source for HMR and proper React context
      "@pagecraft/editor/styles": path.resolve(__dirname, "../../packages/pagecraft/src/editor.css"),
      "@pagecraft/editor": path.resolve(__dirname, "../../packages/pagecraft/src/index.ts"),
    },
  },
})
