import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const variant = process.env.VITE_VARIANT || 'root'

// Determine entry point based on variant
const getEntryPoint = () => {
  switch (variant) {
    case 'cannabis':
      return '/cannabis-index.html'
    case 'produce':
      return '/produce-index.html'
    default:
      return '/index.html'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root: variant === 'cannabis' ? './cannabis' : variant === 'produce' ? './produce' : './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/components': path.resolve(__dirname, './components'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/types': path.resolve(__dirname, './types'),
    },
  },
  server: {
    port: variant === 'cannabis' ? 3002 : variant === 'produce' ? 3003 : 3001,
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, getEntryPoint()),
      },
    },
  },
})
