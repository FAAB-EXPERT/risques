# CNRA - Pilotage Stratégique & Suivi des Opérations

Application web de gouvernance stratégique, planification décennale (PSD), suivi opérationnel des tâches, diagramme de Gantt multi-échelle et tableau Kanban interactif.

## 🚀 Déploiement sur GitHub Pages

Deux causes courantes empêchent l'affichage sur GitHub :
1. **Les chemins absolus des fichiers générés (`/assets/...`)** : Ce problème a été résolu en configurant `base: './'` dans `vite.config.ts`.
2. **La configuration de GitHub Pages dans les paramètres du dépôt GitHub**.

### Activer GitHub Pages avec GitHub Actions (Recommandé) :
1. Allez sur votre dépôt GitHub.
2. Cliquez sur **Settings** (Paramètres) > **Pages** (dans le menu de gauche).
3. Sous la section **Build and deployment** :
   - Pour **Source**, sélectionnez **GitHub Actions**.
4. Poussez votre code (`git push origin main`).
5. L'action `.github/workflows/deploy.yml` construira automatiquement l'application et la déploiera en ligne !

### Déploiement local :
```bash
# Installation des dépendances
npm install

# Lancement du serveur de développement
npm run dev

# Construction pour la production
npm run build
```
