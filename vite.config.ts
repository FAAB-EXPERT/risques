import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

// Ce plugin permet à index.html d'utiliser directement ./assets-bundle/app.js sur GitHub Pages (0 erreur 404 console)
// tout en utilisant /src/main.tsx lors du développement et du build Vite.
function githubPagesRootPlugin(): Plugin {
  return {
    name: 'github-pages-root-entry',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html
          .replace(/<link[^>]*href="\.\/assets-bundle\/app\.css"[^>]*>/g, '')
          .replace(
            /<script[^>]*src="\.\/assets-bundle\/app\.js"[^>]*><\/script>/g,
            '<script type="module" src="/src/main.tsx"></script>'
          );
      },
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [githubPagesRootPlugin(), react(), tailwindcss()],
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
