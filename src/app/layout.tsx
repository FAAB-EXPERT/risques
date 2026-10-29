import React from 'react';
import '../index.css';

export const metadata = {
  title: 'F-PLLAN — Pilotage Stratégique, Opérationnel & Évaluation',
  description:
    'F-PLLAN (FAAB PLAN) : Application Web Universelle & Multi-Projets de Pilotage Stratégique, Ordonnancement PERT/CPM, Gantt, Kanban, RACI & Génération Documentaire.',
  applicationName: 'F-PLLAN',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'F-PLLAN',
    statusBarStyle: 'black-translucent'
  },
  icons: {
    icon: [
      { url: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }]
  }
};

export const viewport = {
  themeColor: '#0c4a6e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased selection:bg-[#90D5FF] selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
