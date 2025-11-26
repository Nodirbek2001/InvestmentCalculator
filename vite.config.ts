import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext', // Use modern JS syntax for smaller bundle size
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code to cache effective libraries separately
          'react-vendor': ['react', 'react-dom'],
          'charts': ['recharts'], 
          'ui-icons': ['lucide-react']
        }
      }
    }
  }
});