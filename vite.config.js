import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv, transformWithEsbuild } from "vite";
import restart from "vite-plugin-restart";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const enableSourcemap = env.VITE_SOURCEMAP === "true";
  const enableMinify = env.VITE_MINIFY === "true";

  return {
    // base for built asset URLs — set to the nginx subpath where the app is hosted
    base: "./",
    root: "src/",
    publicDir: "../public/",
    resolve: {
      // 添加这个配置
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
        },
      },
    },
    plugins: [
      // Restart server on static/public file change
      restart({ restart: ["../public/**"] }),

      // React support
      react(),

      // .js file support as if it was JSX
      {
        name: "load+transform-js-files-as-jsx",
        async transform(code, id) {
          if (!id.match(/src\/.*\.js$/)) {
            return null;
          }

          return transformWithEsbuild(code, id, {
            loader: "jsx",
            jsx: "automatic",
          });
        },
      },
    ],
    server: {
      host: true, // Open to local network and display URL
      open: !(
        "SANDBOX_URL" in process.env || "CODESANDBOX_HOST" in process.env
      ), // Open if it's not a CodeSandbox
    },
    build: {
      outDir: "../dist", // Output in the dist/ folder
      emptyOutDir: true, // Empty the folder first
      sourcemap: enableSourcemap,
      minify: enableMinify,
    },
  };
});
