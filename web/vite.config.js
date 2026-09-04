import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/books": "http://localhost:8000",
      "/library": "http://localhost:8000",
      "/search": "http://localhost:8000",
      "/auth": "http://localhost:8000",
    },
  },
});
