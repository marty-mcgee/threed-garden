import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 4444,
    strictPort: true,
    hmr: {
      port: 443 // Run the websocket server on the SSL port
    }
  },

  build: {
    outDir: "dist"
  },

  plugins: [
    react()
  ],

  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
      '@': path.resolve(__dirname, 'src'),
    },
  }
})
