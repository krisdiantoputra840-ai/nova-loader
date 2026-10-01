import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import devServer from '@hono/vite-dev-server'
import nodeAdapter from '@hono/vite-dev-server/node'
import path from 'node:path'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    devServer({
      adapter: nodeAdapter,
      entry: 'src/server/index.ts',
      exclude: [/^(?!\/api).*/],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/client'),
    },
  },
})
