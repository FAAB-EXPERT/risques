import path from 'path';
import os from 'os';
import fs from 'fs';
import { execFile } from 'child_process';

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.json',
  '.csv',
  '.vcf',
  '.zip',
  '.png'
]);

const MAX_EXPORT_BODY_BYTES = 50 * 1024 * 1024; // 50 Mo maximum

function getCorsAndSecurityHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Private-Network': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, X-Faab-Program, X-Faab-Filename, X-Faab-Open-Finder',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store, max-age=0'
  };
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: getCorsAndSecurityHeaders()
  });
}

export async function GET(): Promise<Response> {
  return new Response(JSON.stringify({ ok: true, engine: 'nextjs-app-router' }), {
    status: 200,
    headers: {
      ...getCorsAndSecurityHeaders(),
      'Content-Type': 'application/json'
    }
  });
}

export async function POST(req: Request): Promise<Response> {
  const headers = getCorsAndSecurityHeaders();
  try {
    const arrayBuffer = await req.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_EXPORT_BODY_BYTES) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Taille de fichier supérieure à la limite de sécurité (50 Mo).'
        }),
        {
          status: 413,
          headers: { ...headers, 'Content-Type': 'application/json' }
        }
      );
    }

    const rawProgram = decodeURIComponent(
      req.headers.get('x-faab-program') || 'Programme'
    );
    const rawFilename = decodeURIComponent(
      req.headers.get('x-faab-filename') || 'export.json'
    );

    const programFolder =
      rawProgram
        .trim()
        .replace(/\.\.+/g, '_')
        .replace(/[\\/:*?"<>|\x00-\x1F]/g, '_')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120) || 'Programme';

    const fileName =
      path
        .basename(rawFilename.trim())
        .replace(/\.\.+/g, '_')
        .replace(/[\\/:*?"<>|\x00-\x1F]/g, '_')
        .trim()
        .slice(0, 180) || 'export.json';

    const ext = path.extname(fileName).toLowerCase();
    if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Extension de fichier non autorisée (${ext}).`
        }),
        {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' }
        }
      );
    }

    const downloadsDir = path.resolve(os.homedir(), 'Downloads');
    const faabPlanDir = path.resolve(downloadsDir, 'faab-plan');
    const targetProgDir = path.resolve(faabPlanDir, programFolder);
    const targetFilePath = path.resolve(targetProgDir, fileName);

    // Protection stricte contre le Path Traversal : vérification que la cible reste dans faab-plan
    if (
      !targetProgDir.startsWith(faabPlanDir + path.sep) ||
      !targetFilePath.startsWith(targetProgDir + path.sep)
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Chemin de destination non autorisé (Path Traversal bloqué).'
        }),
        {
          status: 403,
          headers: { ...headers, 'Content-Type': 'application/json' }
        }
      );
    }

    fs.mkdirSync(targetProgDir, { recursive: true });
    fs.writeFileSync(targetFilePath, Buffer.from(arrayBuffer));

    const openFinder = req.headers.get('x-faab-open-finder') === 'true';
    if (openFinder && process.platform === 'darwin') {
      execFile('open', [targetProgDir], () => {
        // Ouverture sécurisée sans interprétation shell (execFile au lieu de exec)
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        path: `Downloads/faab-plan/${programFolder}/${fileName}`,
        fullPath: targetFilePath
      }),
      {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' }
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Erreur interne lors de la sauvegarde.'
      }),
      {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' }
      }
    );
  }
}
