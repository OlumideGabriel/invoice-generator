import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "/frontend/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Uncomment if using local API during development
    // proxy: {
    //   '/api': 'http://localhost:5000',
    // },
  },
});
