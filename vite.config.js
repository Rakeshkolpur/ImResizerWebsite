import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    open: true,
  },
  optimizeDeps: {
    include: [
      'pdfjs-dist',
      'fabric-pure-browser',
      'pdf-lib',
      'tesseract.js'
    ],
    exclude: [
      'pdfjs-dist/build/pdf.worker.min.js'
    ]
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    }
  },
  resolve: {
    alias: {
      'pdfjs-dist': resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.js')
    }
  }
})
