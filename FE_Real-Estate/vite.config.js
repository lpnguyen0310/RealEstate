import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // ✅ thêm đoạn này để fix lỗi "global is not defined"
  define: {
    global: {},
  },

  server: {
    proxy: {
      "/api": { target: "http://localhost:8080", changeOrigin: true },
      "/ws": {           // ✅ thêm luôn proxy cho websocket
        target: "http://localhost:8080",
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
