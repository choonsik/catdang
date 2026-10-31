import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // 상대 경로 base 설정으로 GitHub Pages(/catdang/), Vercel, Netlify 어디서든 무결점 서빙
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          peerjs: ['peerjs'],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});

