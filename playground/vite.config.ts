import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const packagesDir = path.resolve(__dirname, '../packages')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@form-render/core': path.resolve(packagesDir, 'core/src/index.ts'),
      '@form-render/react': path.resolve(packagesDir, 'react/src/index.ts'),
    },
  },
})
