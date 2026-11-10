import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Load root .env file for client-side process.env access
const rootEnvPath = path.resolve(__dirname, '../.env');
const rootEnv = fs.existsSync(rootEnvPath)
  ? fs.readFileSync(rootEnvPath, 'utf8')
  : '';

const envVars: Record<string, string> = {};
rootEnv.split('\n').forEach((line) => {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
});

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    outDir: '../public', // Build directly into server/public for Namecheap deployment
    emptyOutDir: true,
  },
  define: {
    'process.env': {
      EVENT_NAME: JSON.stringify(envVars.EVENT_NAME || 'Workers Ball 2026'),
      EVENT_DATE: JSON.stringify(envVars.EVENT_DATE || '22nd Nov. 2026'),
      EVENT_TIME: JSON.stringify(envVars.EVENT_TIME || '4PM'),
      VENUE: JSON.stringify(envVars.VENUE || 'Harvesters Globe Ologolo'),
      REGISTRATION_URL: JSON.stringify(envVars.REGISTRATION_URL || 'http://localhost:5173/register'),
    },
  },
});
