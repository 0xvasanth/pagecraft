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
      // Externalize ALL dependencies — the consumer's bundler resolves them.
      // This prevents CJS modules (like use-sync-external-store) from being
      // bundled into our ESM output with require() calls that break Vite SSR.
      external: (id) => {
        // Externalize everything that isn't a relative import or absolute path
        if (id.startsWith(".") || id.startsWith("/") || id.startsWith("\0")) {
          return false;
        }
        return true;
      },
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
