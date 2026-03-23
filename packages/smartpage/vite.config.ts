import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

/** Inject `import './smartpage.css'` at the top of the built JS so CSS auto-loads */
function injectCssImport() {
  return {
    name: 'inject-css-import',
    generateBundle(_: unknown, bundle: Record<string, { type: string; code?: string }>) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk' && file.code) {
          file.code = `import './smartpage.css';\n${file.code}`;
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), injectCssImport()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "SmartPage",
      fileName: "smartpage",
      formats: ["es"],
    },
    rollupOptions: {
      // Only externalize peer dependencies — bundle everything else.
      // This way consumers only need react + react-dom installed.
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react-dom/client",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    sourcemap: true,
  },
});
