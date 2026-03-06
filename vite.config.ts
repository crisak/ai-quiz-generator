import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "VITE_");

  return {
    server: {
      port: 3002,
      host: "0.0.0.0",
      // Inject environment variables at runtime for development
      middlewareMode: false,
    },
    plugins: [
      react(),
      // Plugin to inject API key in dev mode (not in bundle)
      {
        name: "inject-dev-config",
        transformIndexHtml: {
          order: "pre",
          handler(html: string) {
            // Only inject in development mode to aid developers
            // In production, API key should be set via deployment environment
            if (mode !== "production" && env.VITE_GEMINI_API_KEY) {
              // Inject as a script before config.js loads
              const injection = `<script>window.__ENV_CONFIG__ = { VITE_GEMINI_API_KEY: "${env.VITE_GEMINI_API_KEY}" };</script>`;
              return html.replace("</head>", `${injection}</head>`);
            }
            return html;
          },
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
