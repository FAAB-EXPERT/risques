import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

// Ce plugin permet à index.html d'utiliser directement ./assets-bundle/app.js sur GitHub Pages (0 erreur 404 console)
// tout en utilisant /src/main.tsx lors du développement et du build Vite, et synchronise automatiquement
// assets-bundle/app.js et assets-bundle/app.css à chaque build.
function githubPagesRootPlugin(): Plugin {
  return {
    name: 'github-pages-root-entry',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html
          .replace(/<link[^>]*href="\.\/assets-bundle\/app\.css[^"]*"[^>]*>/g, '')
          .replace(
            /<script[^>]*src="\.\/assets-bundle\/app\.js[^"]*"[^>]*><\/script>/g,
            '<script type="module" src="/src/main.tsx"></script>'
          );
      },
    },
    closeBundle() {
      try {
        const distAssetsDir = path.resolve(__dirname, 'dist/assets');
        const bundleDir = path.resolve(__dirname, 'assets-bundle');
        if (!fs.existsSync(distAssetsDir)) return;
        fs.mkdirSync(bundleDir, {recursive: true});

        const files = fs.readdirSync(distAssetsDir);
        const cssFile = files.find((f) => f.startsWith('index-') && f.endsWith('.css'));
        const jsFile = files.find((f) => f.startsWith('index-') && f.endsWith('.js'));

        if (cssFile) {
          fs.copyFileSync(
            path.join(distAssetsDir, cssFile),
            path.join(bundleDir, 'app.css')
          );
        }
        if (jsFile) {
          fs.copyFileSync(
            path.join(distAssetsDir, jsFile),
            path.join(bundleDir, 'app.js')
          );
        }

        // Synchroniser les fichiers statiques à la racine pour le déploiement GitHub Pages depuis la branche main (root)
        const publicSw = path.resolve(__dirname, 'public/sw.js');
        if (fs.existsSync(publicSw)) {
          fs.copyFileSync(publicSw, path.resolve(__dirname, 'sw.js'));
        }
        const publicManifest = path.resolve(__dirname, 'public/manifest.json');
        if (fs.existsSync(publicManifest)) {
          fs.copyFileSync(publicManifest, path.resolve(__dirname, 'manifest.json'));
        }
        const publicLogo = path.resolve(
          __dirname,
          'public/assets/aistudio/logo_faab_risk_8a560e79.png'
        );
        if (fs.existsSync(publicLogo)) {
          const rootLogoDir = path.resolve(__dirname, 'assets/aistudio');
          fs.mkdirSync(rootLogoDir, {recursive: true});
          fs.copyFileSync(
            publicLogo,
            path.join(rootLogoDir, 'logo_faab_risk_8a560e79.png')
          );
        }
      } catch (err) {
        console.error('Erreur lors de la synchronisation de assets-bundle:', err);
      }
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [githubPagesRootPlugin(), react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
