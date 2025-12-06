import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import Vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { VueRouterAutoImports } from "unplugin-vue-router";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vitejs.dev/config/
const viteConfig = defineConfig((mode) => {
  const env = loadEnv(mode.mode, process.cwd());
  return {
    build: {
      chunkSizeWarningLimit: 1000,
    },
    plugins: [
      Vue({
        features: { propsDestructure: true },
      }),

      Components({ dts: "./src/components.d.ts", types: [] }),
      AutoImport({
        imports: ["vue", "pinia", VueRouterAutoImports],
        dts: "src/auto-imports.d.ts",
        dirs: ["src/stores"],
      }),
      // vueDevTools(),
    ],
    css: {
      devSourcemap: true,
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      host: "0.0.0.0",
      port: env.VITE_PORT as unknown as number,
      open: false,
      hmr: true,
      proxy: {
        // "/api": {
        //   target: env.VITE_API_URL,
        //   ws: true,
        //   changeOrigin: true,
        //   rewrite: (path) => path.replace(/^\/api/, ""),
        // },
        // "/uploads": {
        //   target: `${env.VITE_API_URL}/uploads`,
        //   changeOrigin: true,
        //   rewrite: (path: string) => path.replace(/^\/uploads/, ""),
        // },
      },
      allowedHosts: true,
    },
  };
});
export default viteConfig;
