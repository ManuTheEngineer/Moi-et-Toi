import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { minify } from 'terser';

// Custom plugin to minify non-module <script> tags and copy extra assets
function minifyLegacyScripts() {
  return {
    name: 'minify-legacy-scripts',
    closeBundle: async () => {
      const distDir = resolve(__dirname, 'dist');
      const jsDir = resolve(distDir, 'js');
      if (!existsSync(jsDir)) mkdirSync(jsDir, { recursive: true });

      // Minify each JS file
      const jsFiles = [
        'app.js', 'nav.js', 'utils.js', 'weather.js', 'metrics.js',
        'modules-core.js', 'modules-social.js', 'modules-life.js',
        'dashboard.js', 'modules-track.js', 'modules-data.js',
        'template-loader.js', 'firebase-init.mjs'
      ];
      for (const file of jsFiles) {
        const src = resolve(__dirname, 'js', file);
        if (!existsSync(src)) continue;
        const code = readFileSync(src, 'utf-8');
        const result = await minify(code, {
          compress: { drop_debugger: true },
          format: { comments: false }
        });
        writeFileSync(resolve(jsDir, file), result.code);
      }

      // Copy service worker (minified)
      const swSrc = resolve(__dirname, 'sw.js');
      if (existsSync(swSrc)) {
        const swCode = readFileSync(swSrc, 'utf-8');
        const swResult = await minify(swCode, { compress: { drop_debugger: true }, format: { comments: false } });
        writeFileSync(resolve(distDir, 'sw.js'), swResult.code);
      }

      // Copy icons directory
      const iconsSrc = resolve(__dirname, 'icons');
      if (existsSync(iconsSrc)) {
        cpSync(iconsSrc, resolve(distDir, 'icons'), { recursive: true });
      }

      // Copy manifest.json
      const manifestSrc = resolve(distDir, 'assets');
      // Manifest is already handled by Vite, but ensure it's at root too
      if (existsSync(resolve(__dirname, 'manifest.json'))) {
        cpSync(resolve(__dirname, 'manifest.json'), resolve(distDir, 'manifest.json'));
      }

      console.log('  ✓ Legacy JS files minified and copied');
    }
  };
}

export default defineConfig({
  root: '.',
  publicDir: false,

  server: {
    port: 3000,
    open: true
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: false, drop_debugger: true },
      format: { comments: false }
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    },
    copyPublicDir: false,
    assetsInlineLimit: 0
  },

  plugins: [minifyLegacyScripts()],

  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{js,ts}'],
    globals: true
  }
});
