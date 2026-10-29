import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { execFile } from 'child_process';
import { defineConfig } from 'vite';

const ALLOWED_EXPORT_EXTENSIONS = new Set([
  '.pdf',
  '.json',
  '.csv',
  '.vcf',
  '.zip',
  '.png'
]);
const MAX_EXPORT_BYTES = 50 * 1024 * 1024;

function createSecureLocalSaveHandler() {
  return (req: any, res: any) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, X-Faab-Program, X-Faab-Filename, X-Faab-Open-Finder'
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method === 'GET') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }

    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let aborted = false;

    req.on('data', (chunk: any) => {
      if (aborted) return;
      const buf = Buffer.from(chunk);
      totalBytes += buf.length;
      if (totalBytes > MAX_EXPORT_BYTES) {
        aborted = true;
        res.statusCode = 413;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            success: false,
            error: 'Payload Too Large (max 50 MB)'
          })
        );
        return;
      }
      chunks.push(buf);
    });

    req.on('end', () => {
      if (aborted) return;
      try {
        const rawBody = Buffer.concat(chunks);
        const programFolder =
          decodeURIComponent(String(req.headers['x-faab-program'] || 'Programme'))
            .trim()
            .replace(/\.\.+/g, '_')
            .replace(/[\\/:*?"<>|\x00-\x1F]/g, '_')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 120) || 'Programme';

        const fileName =
          path
            .basename(
              decodeURIComponent(
                String(req.headers['x-faab-filename'] || 'export.json')
              ).trim()
            )
            .replace(/\.\.+/g, '_')
            .replace(/[\\/:*?"<>|\x00-\x1F]/g, '_')
            .trim()
            .slice(0, 180) || 'export.json';

        const ext = path.extname(fileName).toLowerCase();
        if (ext && !ALLOWED_EXPORT_EXTENSIONS.has(ext)) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              success: false,
              error: `Extension non autorisée (${ext})`
            })
          );
          return;
        }

        const openFinder = req.headers['x-faab-open-finder'] === 'true';

        const downloadsDir = path.resolve(os.homedir(), 'Downloads');
        const faabPlanDir = path.resolve(downloadsDir, 'faab-plan');
        const targetProgDir = path.resolve(faabPlanDir, programFolder);
        const targetFilePath = path.resolve(targetProgDir, fileName);

        // Protection stricte contre le Path Traversal
        if (
          !targetProgDir.startsWith(faabPlanDir + path.sep) ||
          !targetFilePath.startsWith(targetProgDir + path.sep)
        ) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              success: false,
              error: 'Path Traversal bloqué'
            })
          );
          return;
        }

        fs.mkdirSync(targetProgDir, { recursive: true });
        // Écrase systématiquement le fichier existant s'il porte le même nom
        fs.writeFileSync(targetFilePath, rawBody);

        if (openFinder && process.platform === 'darwin') {
          execFile('open', [targetProgDir], () => {});
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            success: true,
            path: `Downloads/faab-plan/${programFolder}/${fileName}`,
            fullPath: targetFilePath
          })
        );
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            success: false,
            error: err?.message || 'Error'
          })
        );
      }
    });
  };
}

export default defineConfig(() => {
  const localSaveHandler = createSecureLocalSaveHandler();
  return {
    // Relative base ensures asset URLs resolve correctly on any GitHub Pages repository name or domain
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'faab-plan-local-downloads-saver',
        configureServer(server) {
          server.middlewares.use('/__faab_save_export', localSaveHandler);
          server.middlewares.use('/api/faab-save-export', localSaveHandler);
        },
        configurePreviewServer(server) {
          server.middlewares.use('/__faab_save_export', localSaveHandler);
          server.middlewares.use('/api/faab-save-export', localSaveHandler);
        }
      },
      {
        name: 'github-pages-helper',
        transformIndexHtml: {
          order: 'pre',
          handler(html) {
            return html
              .replace(/<link[^>]*id="gh-raw-css"[^>]*>\s*/g, '')
              .replace(/<script[^>]*id="gh-raw-js"[^>]*><\/script>\s*/g, '')
              .replace(
                '<!-- VITE_DEV_OR_BUILD_ENTRY -->',
                '<script type="module" src="./src/main.tsx"></script>'
              );
          },
        },
        closeBundle() {
          const rootDir = process.cwd();
          const distDir = path.resolve(rootDir, 'dist');
          const docsDir = path.resolve(rootDir, 'docs');
          const publicDir = path.resolve(rootDir, 'public');
          const indexPath = path.join(distDir, 'index.html');
          const notFoundPath = path.join(distDir, '404.html');
          const noJekyllPath = path.join(distDir, '.nojekyll');

          // Ensure 404.html fallback exists for GitHub Pages SPA routing
          if (fs.existsSync(indexPath)) {
            fs.copyFileSync(indexPath, notFoundPath);
          }
          // Ensure .nojekyll exists in dist
          fs.writeFileSync(noJekyllPath, '# Disable Jekyll\n');

          // Clean and mirror dist into docs/ so "Deploy from branch -> /docs" and "/ (root)" always have fresh assets
          if (fs.existsSync(distDir)) {
            fs.rmSync(docsDir, { recursive: true, force: true });
            fs.cpSync(distDir, docsDir, { recursive: true, force: true });
          }

          // Copy static root icons/.nojekyll/PWA files so "/ (root)" mode also resolves ./logo.png, ./favicon.png, ./favicon.svg, manifest.json, sw.js and .nojekyll
          for (const file of [
            'logo.png',
            'favicon.png',
            'logo.svg',
            'favicon.svg',
            'pwa-192x192.png',
            'pwa-512x512.png',
            'apple-touch-icon.png',
            'manifest.json',
            'sw.js',
            '.nojekyll'
          ]) {
            const srcFile = path.join(publicDir, file);
            const destFile = path.join(rootDir, file);
            if (fs.existsSync(srcFile)) {
              fs.copyFileSync(srcFile, destFile);
            }
          }

          // Update root index.html fallback asset filenames to match the latest build in docs/assets/
          const rootIndexPath = path.join(rootDir, 'index.html');
          if (fs.existsSync(indexPath) && fs.existsSync(rootIndexPath)) {
            const builtHtml = fs.readFileSync(indexPath, 'utf-8');
            const jsMatch = builtHtml.match(/src="\.\/assets\/(index-[^"]+\.js)"/);
            const cssMatch = builtHtml.match(/href="\.\/assets\/(index-[^"]+\.css)"/);
            let rootHtml = fs.readFileSync(rootIndexPath, 'utf-8');
            if (cssMatch) {
              rootHtml = rootHtml.replace(
                /href="\.\/docs\/assets\/index-[^"]+\.css"/,
                `href="./docs/assets/${cssMatch[1]}"`
              );
            }
            if (jsMatch) {
              rootHtml = rootHtml.replace(
                /src="\.\/docs\/assets\/index-[^"]+\.js"/,
                `src="./docs/assets/${jsMatch[1]}"`
              );
            }
            fs.writeFileSync(rootIndexPath, rootHtml);
          }
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('jspdf') || id.includes('html2canvas')) {
                return 'vendor-pdf';
              }
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-charts';
              }
              if (id.includes('firebase') || id.includes('@firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('jszip')) {
                return 'vendor-zip';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('react') || id.includes('scheduler')) {
                return 'vendor-react';
              }
            }
          }
        }
      }
    },
    server: {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy':
          'camera=(self), microphone=(), geolocation=(), payment=()'
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy':
          'camera=(self), microphone=(), geolocation=(), payment=()'
      }
    }
  };
});
