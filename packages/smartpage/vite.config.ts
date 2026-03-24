import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import pkg from "./package.json" with { type: "json" };

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

// Externalize all dependencies + peerDependencies.
// npm installs dependencies for consumers automatically.
// The consumer's bundler resolves and tree-shakes them.
// This ensures zero CJS require() calls in our ESM output.
const externalDeps = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

// CJS-only packages that must be bundled into our ESM output
// to avoid `Dynamic require of "react" is not supported` errors
// in consumer environments (Vite dev server, SSR).
const bundledDeps = new Set([
  'use-sync-external-store',
]);

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
      external: (id) => {
        // Bundle CJS-only transitive deps to avoid require() in ESM output
        if (bundledDeps.has(id) || [...bundledDeps].some(dep => id.startsWith(dep + '/'))) {
          return false;
        }
        // Externalize all declared dependencies and peer dependencies
        return externalDeps.some(dep => id === dep || id.startsWith(dep + '/'));
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
