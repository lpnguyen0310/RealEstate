// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react({ babel: { plugins: [['babel-plugin-react-compiler']] } }),
    tailwindcss(),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  define: { global: {} },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        // ⬇️ SockJS cần HTTP cho /info, xhr_streaming..., vẫn bật ws:true để upgrade
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
        // secure: false, // nếu backend là self-signed https (không cần cho http)
      },
    },
  },
})
