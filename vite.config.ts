import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          storefront: path.resolve(__dirname, 'apps/storefront/src/index.html'),
          admin: path.resolve(__dirname, 'apps/admin/src/index.html'),
        },
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;

            const nodeModulesIndex = id.lastIndexOf('node_modules/');
            const packageSegment = id.slice(nodeModulesIndex + 'node_modules/'.length);
            const packageName = packageSegment.startsWith('@')
              ? packageSegment.split('/').slice(0, 2).join('/')
              : packageSegment.split('/')[0];

            if (packageName === 'react' || packageName === 'react-dom' || packageName === 'react-router-dom') {
              return 'vendor-react';
            }
            if (packageName.startsWith('@tanstack')) return 'vendor-tanstack';
            if (packageName === 'lucide-react') return 'vendor-icons';
            if (packageName === 'recharts') return 'vendor-charts';
            if (packageName === 'firebase' || packageName === 'firebase-admin') return 'vendor-firebase';
            if (packageName === 'leaflet' || packageName === 'react-leaflet' || packageName === '@vis.gl/react-google-maps') return 'vendor-maps';
            if (packageName === 'motion') return 'vendor-motion';
            if (packageName === '@google/generative-ai' || packageName === '@google/genai') return 'vendor-google-ai';
            if (packageName === 'axios' || packageName === 'zod' || packageName === 'react-hook-form') return 'vendor-core';
            return undefined;
          },
        },
      }
    },
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || ''),
      'process.env.GEOAPIFY_API_KEY': JSON.stringify(process.env.GEOAPIFY_API_KEY || ''),
      'process.env.RECEIPT_OCR_API': JSON.stringify(process.env.RECEIPT_OCR_API || process.env.RECEIPT_ANALYZER_API_KEY || '')
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
