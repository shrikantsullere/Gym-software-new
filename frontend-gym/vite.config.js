import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
              return 'vendor-pdf';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2') || id.includes('echarts') || id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('@fortawesome') || id.includes('react-icons') || id.includes('bootstrap-icons') || id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('framer-motion') || id.includes('@react-spring')) {
              return 'vendor-animation';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})
