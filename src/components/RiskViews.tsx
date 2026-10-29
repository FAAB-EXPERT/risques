import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Activity, AlertTriangle, Briefcase, Calendar, CheckCircle2, ChevronDown, ChevronRight,
  Diamond, Edit, Filter, Grid, HelpCircle, Layers, LayoutDashboard,
  Plus, Save, Star, Trash2, TrendingUp, UserCheck, X
} from 'lucide-react';
import { Dossier, Task, LanguageCode, CurrencyCode } from '../types';
import { STANDARD_PHASES, getTodayISO, computeEffectiveStatus } from '../pertUtils';
import { convertFromFCFA, convertToFCFA } from '../i18n';

export const RISK_DROPDOWNS = {
  riskStatus: ['nouveau', 'en traitement', 'bloqué', 'traité'],
  pestelScores: ['1/5', '2/5', '3/5', '4/5', '5/5'],
  nature: [
    'politique/ administratif',
    'economique / financier',
    'socio culturel',
    'technologie / technique',
    'environnement / santé',
    'légal /juridique'
  ],
  probabilite: ['improbable', 'peu probable', 'probable', 'très probable'],
  gravite: ['mineur', 'majeur', 'grave', 'catastrophique'],
  criticite: ['faible', 'modéré', 'critique', 'tres critique'],
  consequence: ['cout', 'délai', 'qualité'],
  faiblesse: ['ressource humaine', 'ressource materielle', 'ressource financiere'],
  tendance: ['stable', 'hausse', 'baisse']
};

export function getTranslatedPhase(phaseName: string, lang: LanguageCode): string {
  if (lang !== 'EN') return phaseName;
  if (phaseName.includes('AVANT PROJET') || phaseName.includes('CADRAGE')) return 'PHASE 1: PREPARATORY & SCOPING';
  if (phaseName.includes('PLANIFICATION') || phaseName.includes('CONCEPTION')) return 'PHASE 2: PLANNING & DESIGN';
  if (phaseName.includes('EXÉCUTION') || phaseName.includes('MISE EN')) return 'PHASE 3: EXECUTION & IMPLEMENTATION';
  if (phaseName.includes('SUIVI') || phaseName.includes('AUDIT')) return 'PHASE 4: MONITORING, SAFETY & AUDIT';
  if (phaseName.includes('CLÔTURE') || phaseName.includes('CAPITALISATION')) return 'PHASE 5: CLOSURE & CAPITALIZATION';
  return phaseName;
}

export function getTranslatedDropdownLabel(value: string, lang: LanguageCode): string {
  if (lang !== 'EN') return value;
  const lower = (value || '').toLowerCase().trim();
  const map: Record<string, string> = {
    'nouveau': 'new',
    'en traitement': 'in progress',
    'bloqué': 'blocked',
    'traité': 'treated / resolved',
    'politique/ administratif': 'political / administrative',
    'economique / financier': 'economic / financial',
    'socio culturel': 'socio-cultural',
    'technologie / technique': 'technology / technical',
    'environnement / santé': 'environmental / health',
    'légal /juridique': 'legal / regulatory',
    'improbable': 'unlikely',
    'peu probable': 'low probability',
    'probable': 'probable',
    'très probable': 'highly probable',
    'mineur': 'minor',
    'majeur': 'major',
    'grave': 'severe',
    'catastrophique': 'catastrophic',
    'faible': 'low',
    'modéré': 'moderate',
    'critique': 'critical',
    'tres critique': 'very critical',
    'cout': 'cost',
    'délai': 'delay',
    'qualité': 'quality',
    'ressource humaine': 'human resource',
    'ressource materielle': 'material resource',
    'ressource financiere': 'financial resource',
    'stable': 'stable',
    'hausse': 'increase',
    'baisse': 'decrease'
  };
  return map[lower] || value;
}

export function parsePestelScore(val?: string): number {
  if (!val) return 3;
  const match = String(val).match(/(\d+)/);
  if (!match) return 3;
  const num = parseInt(match[1], 10);
  if (isNaN(num)) return 3;
  return Math.max(1, Math.min(5, num));
}

export function getProbNumericLevel(p?: string): number {
  const val = (p || '').toLowerCase().trim();
  if (val.includes('très') || val.includes('tres')) return 4;
  if (val.includes('peu')) return 2;
  if (val.includes('improbable')) return 1;
  return 3; // probable
}

export function getGravNumericLevel(g?: string): number {
  const val = (g || '').toLowerCase().trim();
  if (val.includes('catastrophique')) return 4;
  if (val.includes('grave')) return 3;
  if (val.includes('majeur')) return 2;
  return 1; // mineur
}

// Logique ISO 31000 : Calcul automatique de la Criticité en fonction de Probabilité × Gravité / Impact
export function computeCriticiteFromProbAndGrav(
  prob?: string,
  grav?: string
): 'faible' | 'modéré' | 'critique' | 'tres critique' {
  const p = getProbNumericLevel(prob);
  const g = getGravNumericLevel(grav);
  const score = p * g; // 1 à 16
  if (score >= 12) return 'tres critique';
  if (score >= 6 || g === 4) return 'critique';
  if (score >= 3) return 'modéré';
  return 'faible';
}

// Logique Management des Risques : Remplissage automatique de Probabilité, Gravité et Tendance selon l'Évaluation PESTEL (1/5 à 5/5) et le contexte opérationnel
export function deriveAutoRiskParameters(
  task: Task,
  pestelScore: number,
  effStatus: Task['status']
): {
  probabilite: 'improbable' | 'peu probable' | 'probable' | 'très probable';
  gravite: 'mineur' | 'majeur' | 'grave' | 'catastrophique';
  criticite: 'faible' | 'modéré' | 'critique' | 'tres critique';
  tendance: 'stable' | 'hausse' | 'baisse';
} {
  const isJalon = (task.taskOrMilestone || task.type) === 'jalon';
  const isBlocked = effStatus === 'Bloqué' || task.riskStatus === 'bloqué';
  const isTreated = effStatus === 'Terminé' || task.riskStatus === 'traité';
  const highBudget = (Number(task.budget) || 0) >= 25000000;

  let autoProb: 'improbable' | 'peu probable' | 'probable' | 'très probable' = 'probable';
  if (pestelScore <= 1) {
    autoProb = 'improbable';
  } else if (pestelScore === 2) {
    autoProb = isBlocked ? 'probable' : 'peu probable';
  } else if (pestelScore === 3) {
    autoProb = isBlocked ? 'très probable' : isTreated ? 'peu probable' : 'probable';
  } else if (pestelScore === 4) {
    autoProb = isBlocked ? 'très probable' : 'probable';
  } else {
    autoProb = 'très probable';
  }

  let autoGrav: 'mineur' | 'majeur' | 'grave' | 'catastrophique' = 'majeur';
  if (pestelScore <= 1) {
    autoGrav = isJalon || highBudget ? 'majeur' : 'mineur';
  } else if (pestelScore === 2) {
    autoGrav = isBlocked ? 'grave' : isJalon || highBudget ? 'majeur' : 'mineur';
  } else if (pestelScore === 3) {
    autoGrav = isBlocked ? 'grave' : 'majeur';
  } else if (pestelScore === 4) {
    autoGrav = isBlocked && (isJalon || highBudget) ? 'catastrophique' : 'grave';
  } else {
    autoGrav = 'catastrophique';
  }

  const finalProb = (task.probabilite as any) || autoProb;
  const finalGrav = (task.gravite as any) || autoGrav;
  const finalCrit = computeCriticiteFromProbAndGrav(finalProb, finalGrav);

  const autoTendance: 'stable' | 'hausse' | 'baisse' =
    isTreated || pestelScore <= 2
      ? 'baisse'
      : isBlocked || pestelScore >= 4
      ? 'hausse'
      : 'stable';

  return {
    probabilite: finalProb,
    gravite: finalGrav,
    criticite: finalCrit,
    tendance: (task.tendance as any) || autoTendance
  };
}

interface RiskViewCommonProps {
  dossier: Dossier;
  language: LanguageCode;
  currency: CurrencyCode;
  filterAxeId: string;
  setFilterAxeId: (id: string) => void;
  filterProjectId: string;
  setFilterProjectId: (id: string) => void;
  onAddTaskInPhase?: (projectId: string, phase: string, type: 'tache' | 'jalon', taskData?: Partial<Task>) => void;
  onUpdateTask?: (projectId: string, taskId: string, patch: Partial<Task>) => void;
  onDeleteTask?: (projectId: string, taskId: string) => void;
  onNavigateTab?: (tabId: string) => void;
}

// Extraction normalisée de toutes les tâches / risques d'un dossier avec filtres
function useEnrichedRiskTasks(dossier: Dossier, filterAxeId: string, filterProjectId: string) {
  return useMemo(() => {
    const today = getTodayISO();
    const rows: Array<Task & { projectName: string; axeName: string; axeId: string }> = [];

    (dossier.axes || []).forEach(axe => {
      if (filterAxeId !== 'ALL' && axe.id !== filterAxeId) return;

      (axe.projects || []).forEach(proj => {
        if (filterProjectId !== 'ALL' && proj.id !== filterProjectId) return;

        (proj.tasks || []).forEach(t => {
          const effStatus = computeEffectiveStatus(t, today);
          const taskOrMilestone = t.taskOrMilestone || t.type || 'tache';
          const riskStatus =
            t.riskStatus ||
            (effStatus === 'Terminé'
              ? 'traité'
              : effStatus === 'En cours'
              ? 'en traitement'
              : effStatus === 'Bloqué'
              ? 'bloqué'
              : 'nouveau');
          const dateIdentification = t.dateIdentification || t.startDate || today;
          const pestelScore = parsePestelScore(t.evaluationPestel);
          const evaluationPestel = `${pestelScore}/5`;
          const autoParams = deriveAutoRiskParameters(t, pestelScore, effStatus);
          const probabilite = autoParams.probabilite;
          const gravite = autoParams.gravite;
          const criticite = autoParams.criticite;
          const nature = t.categorie || t.nature || 'technologie / technique';
          const consequence = t.consequence || 'qualité';
          const tendance = autoParams.tendance;
          const activity = t.activity || t.name;

          rows.push({
            ...t,
            status: effStatus,
            taskOrMilestone,
            riskStatus,
            dateIdentification,
            evaluationPestel,
            probabilite,
            gravite,
            criticite,
            nature,
            categorie: nature,
            consequence,
            tendance,
            activity,
            projectName: proj.name,
            axeName: axe.name,
            axeId: axe.id,
            projectId: proj.id
          });
        });
      });
    });

    return rows;
  }, [dossier, filterAxeId, filterProjectId]);
}

// ============================================================================
// 1. DASHBOARD DES RISQUES ISO 31000 (6 Graphiques + Matrices PESTEL/SWOT/TOWS + Profils + Cartographie)
// ============================================================================
export const RiskDashboardView: React.FC<RiskViewCommonProps> = ({
  dossier,
  language,
  filterAxeId,
  setFilterAxeId,
  filterProjectId,
  setFilterProjectId,
  onNavigateTab
}) => {
  const riskTasks = useEnrichedRiskTasks(dossier, filterAxeId, filterProjectId);
  const [matrixTab, setMatrixTab] = useState<'all' | 'pestel' | 'swot' | 'tows'>('all');
  const [selectedDashCell, setSelectedDashCell] = useState<{ prob: number; grav: number } | null>(null);

  const stats = useMemo(() => {
    const total = riskTasks.length;
    const completed = riskTasks.filter(t => t.riskStatus === 'traité' || t.status === 'Terminé').length;
    const blocked = riskTasks.filter(t => t.riskStatus === 'bloqué' || t.status === 'Bloqué').length;
    const inProgress = riskTasks.filter(t => t.riskStatus === 'en traitement' || t.status === 'En cours').length;
    const todo = Math.max(0, total - completed - blocked - inProgress);
    const critical = riskTasks.filter(
      t =>
        (t.criticite === 'tres critique' || t.criticite === 'critique') &&
        t.riskStatus !== 'traité' &&
        t.status !== 'Terminé'
    ).length;

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, blocked, inProgress, todo, critical, rate };
  }, [riskTasks]);

  const avgTreatmentDays = useMemo(() => {
    if (riskTasks.length === 0) return 0;
    let sumDays = 0;
    let count = 0;
    riskTasks.forEach(t => {
      const sd = new Date(t.dateIdentification || t.startDate).getTime();
      const ed = new Date(t.dateResolution || t.endDate || t.startDate).getTime();
      if (!isNaN(sd) && !isNaN(ed)) {
        const diff = Math.max(1, Math.round(Math.abs(ed - sd) / (1000 * 60 * 60 * 24)));
        sumDays += diff;
        count++;
      }
    });
    return count > 0 ? Math.round(sumDays / count) : 0;
  }, [riskTasks]);

  const cpmData = useMemo(() => {
    if (riskTasks.length === 0) return language === 'EN' ? 'No risks planned' : 'Aucun risque planifié';
    let minStart = Infinity;
    let maxEnd = -Infinity;
    riskTasks.forEach(t => {
      const sd = new Date(t.dateIdentification || t.startDate).getTime();
      const ed = new Date(t.dateResolution || t.endDate || t.startDate).getTime();
      if (!isNaN(sd) && !isNaN(ed)) {
        if (sd < minStart) minStart = sd;
        if (ed > maxEnd) maxEnd = ed;
      }
    });
    if (minStart === Infinity) return language === 'EN' ? 'Missing dates' : 'Dates manquantes';
    const diffDays = Math.ceil((maxEnd - minStart) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays >= 365) {
      return `${(diffDays / 365).toFixed(1)} ${language === 'EN' ? 'Years' : 'Ans'} (${diffDays} j)`;
    }
    return `${diffDays} ${language === 'EN' ? 'Days' : 'Jours'}`;
  }, [riskTasks, language]);

  const computedStats = useMemo(() => {
    const isEN = language === 'EN';
    const criticiteCounts = { critique: 0, elevee: 0, modere: 0, faible: 0 };
    const pestelSectors = [
      { key: 'politique', label: isEN ? 'Political' : 'Politique', count: 0, scoreSum: 0 },
      { key: 'economique', label: isEN ? 'Economic' : 'Economique', count: 0, scoreSum: 0 },
      { key: 'socio', label: isEN ? 'Socio-Cultural' : 'Socio Culturel', count: 0, scoreSum: 0 },
      { key: 'technologie', label: isEN ? 'Technology' : 'Technologie', count: 0, scoreSum: 0 },
      { key: 'environnement', label: isEN ? 'Environmental' : 'Environnement', count: 0, scoreSum: 0 },
      { key: 'légal', label: isEN ? 'Legal' : 'Légal', count: 0, scoreSum: 0 }
    ];
    const consequenceCounts = { qualite: 0, cout: 0, delai: 0 };
    const tendanceCounts = { stable: 0, hausse: 0, baisse: 0 };
    const graviteCounts = { mineur: 0, majeur: 0, grave: 0, catastrophique: 0 };
    const probabiliteCounts = { improbable: 0, peuProbable: 0, probable: 0, tresProbable: 0 };

    riskTasks.forEach(t => {
      const crit = (t.criticite || 'modéré').toLowerCase().trim();
      const grav = (t.gravite || 'majeur').toLowerCase().trim();
      if (crit.includes('tres') || crit.includes('très')) {
        criticiteCounts.critique++;
      } else if (crit.includes('critique') || crit.includes('élev') || crit.includes('elev')) {
        if (grav.includes('catastrophique') || grav.includes('grave')) {
          criticiteCounts.critique++;
        } else {
          criticiteCounts.elevee++;
        }
      } else if (grav.includes('mineur') || t.riskStatus === 'traité') {
        criticiteCounts.faible++;
      } else {
        criticiteCounts.modere++;
      }

      const nat = (t.categorie || t.nature || 'technologie').toLowerCase().trim();
      const score = parsePestelScore(t.evaluationPestel);
      const sec =
        pestelSectors.find(s => nat.includes(s.key) || (s.key === 'légal' && nat.includes('legal'))) ||
        pestelSectors[3];
      sec.count++;
      sec.scoreSum += score;

      const cons = (t.consequence || 'qualité').toLowerCase().trim();
      if (cons.includes('cout') || cons.includes('coût')) consequenceCounts.cout++;
      else if (cons.includes('délai') || cons.includes('delai')) consequenceCounts.delai++;
      else consequenceCounts.qualite++;

      const tend = (t.tendance || 'stable').toLowerCase().trim();
      if (tend.includes('hausse')) tendanceCounts.hausse++;
      else if (tend.includes('baisse')) tendanceCounts.baisse++;
      else tendanceCounts.stable++;

      if (grav.includes('catastrophique')) graviteCounts.catastrophique++;
      else if (grav.includes('grave')) graviteCounts.grave++;
      else if (grav.includes('majeur')) graviteCounts.majeur++;
      else graviteCounts.mineur++;

      const prob = (t.probabilite || 'peu probable').toLowerCase().trim();
      if (prob.includes('très') || prob.includes('tres')) probabiliteCounts.tresProbable++;
      else if (prob.includes('peu')) probabiliteCounts.peuProbable++;
      else if (prob.includes('improbable')) probabiliteCounts.improbable++;
      else probabiliteCounts.probable++;
    });

    const criticitePie = [
      { name: isEN ? 'Critical' : 'Critique', value: criticiteCounts.critique, color: '#ef4444' },
      { name: isEN ? 'High' : 'Élevée', value: criticiteCounts.elevee, color: '#f59e0b' },
      { name: isEN ? 'Moderate' : 'Modéré', value: criticiteCounts.modere, color: '#ea580c' },
      { name: isEN ? 'Low' : 'Faible', value: criticiteCounts.faible, color: '#10b981' }
    ];

    const consequencePie = [
      { name: isEN ? 'Quality' : 'Qualité', value: consequenceCounts.qualite, color: '#ea580c' },
      { name: isEN ? 'Cost' : 'Coût', value: consequenceCounts.cout, color: '#ef4444' },
      { name: isEN ? 'Delay' : 'Délai', value: consequenceCounts.delai, color: '#10b981' }
    ];

    const tendancePie = [
      { name: isEN ? 'Stable' : 'Stable', value: tendanceCounts.stable, color: '#94a3b8' },
      { name: isEN ? 'Increase' : 'Hausse', value: tendanceCounts.hausse, color: '#ef4444' },
      { name: isEN ? 'Decrease' : 'Baisse', value: tendanceCounts.baisse, color: '#10b981' }
    ];

    const graviteBar = [
      { name: isEN ? 'Minor' : 'Mineur', shortLabel: isEN ? 'Minor' : 'Mineur', count: graviteCounts.mineur, color: '#10b981' },
      { name: isEN ? 'Major' : 'Majeur', shortLabel: isEN ? 'Major' : 'Majeur', count: graviteCounts.majeur, color: '#ea580c' },
      { name: isEN ? 'Severe' : 'Grave', shortLabel: isEN ? 'Severe' : 'Grave', count: graviteCounts.grave, color: '#f59e0b' },
      { name: isEN ? 'Catastrophic' : 'Catastrophique', shortLabel: isEN ? 'Catastr.' : 'Catastro...', count: graviteCounts.catastrophique, color: '#ef4444' }
    ];

    const probabiliteBar = [
      { name: isEN ? 'Unlikely' : 'Improbable', shortLabel: isEN ? 'Unlikely' : 'Improba...', count: probabiliteCounts.improbable, color: '#cbd5e1' },
      { name: isEN ? 'Low prob.' : 'Peu probable', shortLabel: isEN ? 'Low prob.' : 'Peu prob...', count: probabiliteCounts.peuProbable, color: '#ea580c' },
      { name: isEN ? 'Probable' : 'Probable', shortLabel: isEN ? 'Probable' : 'Probable', count: probabiliteCounts.probable, color: '#f59e0b' },
      { name: isEN ? 'Very prob.' : 'Très probable', shortLabel: isEN ? 'Very prob.' : 'Très pro...', count: probabiliteCounts.tresProbable, color: '#ef4444' }
    ];

    return {
      criticiteCounts,
      criticitePie,
      pestelSectors,
      consequenceCounts,
      consequencePie,
      tendanceCounts,
      tendancePie,
      graviteBar,
      probabiliteBar
    };
  }, [riskTasks, language]);

  // Matrices Décisionnelles : Scénarii Prospectifs (PESTEL), SWOT (FFOM) & TOWS
  const strategicMatrices = useMemo(() => {
    const total = riskTasks.length;
    const scen1: typeof riskTasks = [];
    const scen2: typeof riskTasks = [];
    const scen3: typeof riskTasks = [];
    const scen4: typeof riskTasks = [];

    const forces: Array<{ id: string; label: string; badge: string }> = [];
    const faiblesses: Array<{ id: string; label: string; badge: string }> = [];
    const opportunites: Array<{ id: string; label: string; badge: string }> = [];
    const menaces: Array<{ id: string; label: string; badge: string }> = [];

    riskTasks.forEach(t => {
      const score = parsePestelScore(t.evaluationPestel);
      const crit = (t.criticite || 'modéré').toLowerCase().trim();
      const tend = (t.tendance || 'stable').toLowerCase().trim();
      const isTreated = t.riskStatus === 'traité' || t.status === 'Terminé';
      const isBlocked = t.riskStatus === 'bloqué' || t.status === 'Bloqué';
      const isCritical = crit.includes('critique');

      // Ventilation Scénarii Prospectifs (1 à 4)
      if (score >= 5 || isBlocked || (isCritical && !isTreated && score >= 4)) {
        scen4.push(t);
      } else if (score === 4 || tend.includes('hausse') || (isCritical && !isTreated)) {
        scen3.push(t);
      } else if (score <= 2 || isTreated || tend.includes('baisse')) {
        scen1.push(t);
      } else {
        scen2.push(t);
      }

      // Diagnostic SWOT / FFOM
      if (isTreated || score <= 2 || tend.includes('baisse')) {
        forces.push({
          id: t.id,
          label: t.name || t.activity || 'Activité',
          badge: 'PESTEL OK'
        });
      }

      if (isBlocked || (t.faiblesse && t.faiblesse.trim() !== '' && !isTreated && isCritical)) {
        faiblesses.push({
          id: t.id,
          label: t.name || t.activity || 'Activité',
          badge: t.faiblesse || 'Blocage actif'
        });
      }

      if (
        (t.actionPreventive && t.actionPreventive.trim() !== '') ||
        (t.autorite && t.autorite.trim() !== '') ||
        isTreated
      ) {
        if (opportunites.length < 4) {
          opportunites.push({
            id: t.id,
            label: t.name || t.activity || 'Activité',
            badge: '1 bailleur(s)'
          });
        }
      }

      if (score >= 4 || isCritical || tend.includes('hausse') || t.gravite === 'catastrophique') {
        menaces.push({
          id: t.id,
          label: t.name || t.activity || 'Activité',
          badge: 'PESTEL Critique'
        });
      }
    });

    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

    return {
      scen1: { list: scen1, pct: pct(scen1.length) },
      scen2: { list: scen2, pct: pct(scen2.length) },
      scen3: { list: scen3, pct: pct(scen3.length) },
      scen4: { list: scen4, pct: pct(scen4.length) },
      forces,
      faiblesses,
      opportunites,
      menaces
    };
  }, [riskTasks]);

  const bottlenecks = useMemo(() => {
    return riskTasks.filter(
      t =>
        t.riskStatus !== 'traité' &&
        t.status !== 'Terminé' &&
        (t.riskStatus === 'bloqué' ||
          t.status === 'Bloqué' ||
          t.criticite === 'tres critique' ||
          t.criticite === 'critique' ||
          t.gravite === 'catastrophique')
    );
  }, [riskTasks]);

  const projectStats = useMemo(() => {
    const list: Array<{
      id: string;
      fullName: string;
      shortName: string;
      total: number;
      Traité: number;
      EnCours: number;
      Bloqué: number;
      Nouveau: number;
      Critique: number;
    }> = [];

    (dossier.axes || []).forEach(axe => {
      if (filterAxeId !== 'ALL' && axe.id !== filterAxeId) return;
      (axe.projects || []).forEach((proj, pIdx) => {
        if (filterProjectId !== 'ALL' && proj.id !== filterProjectId) return;
        const ptsk = proj.tasks || [];
        const total = ptsk.length;
        const today = getTodayISO();
        let Traité = 0;
        let EnCours = 0;
        let Bloqué = 0;
        let Critique = 0;

        ptsk.forEach(t => {
          const eff = computeEffectiveStatus(t, today);
          const rSt = (t.riskStatus || '').toLowerCase().trim();
          if (rSt === 'traité' || eff === 'Terminé') Traité++;
          else if (rSt === 'bloqué' || eff === 'Bloqué') Bloqué++;
          else if (rSt === 'en traitement' || eff === 'En cours') EnCours++;

          if (
            (t.criticite === 'tres critique' || t.criticite === 'critique') &&
            rSt !== 'traité' &&
            eff !== 'Terminé'
          ) {
            Critique++;
          }
        });

        const Nouveau = Math.max(0, total - Traité - EnCours - Bloqué);

        list.push({
          id: proj.id,
          fullName: proj.name.startsWith('Projet') ? proj.name : `Projet ${pIdx + 1} : ${proj.name}`,
          shortName: proj.name.length > 25 ? proj.name.substring(0, 23) + '…' : proj.name,
          total,
          Traité,
          EnCours,
          Bloqué,
          Nouveau,
          Critique
        });
      });
    });

    return list;
  }, [dossier, filterAxeId, filterProjectId]);

  const getProbValue = (p?: string) => {
    const val = (p || '').toLowerCase().trim();
    if (val.includes('très') || val.includes('tres')) return 4;
    if (val.includes('peu')) return 2;
    if (val.includes('improbable')) return 1;
    return 3;
  };

  const getGravValue = (g?: string) => {
    const val = (g || '').toLowerCase().trim();
    if (val.includes('catastrophique')) return 4;
    if (val.includes('grave')) return 3;
    if (val.includes('majeur')) return 2;
    return 1;
  };

  const dashboardMatrixGrid = useMemo(() => {
    const isEN = language === 'EN';
    const rowVP = isEN ? 'Very prob.' : 'Très probable';
    const rowP = isEN ? 'Probable' : 'Probable';
    const rowLP = isEN ? 'Low prob.' : 'Peu probable';
    const rowU = isEN ? 'Unlikely' : 'Improbable';

    return [
      [
        { rowLabel: rowVP, probVal: 4, gravVal: 1, color: 'bg-amber-500 hover:bg-amber-600 text-white' },
        { rowLabel: rowVP, probVal: 4, gravVal: 2, color: 'bg-rose-500 hover:bg-rose-600 text-white' },
        { rowLabel: rowVP, probVal: 4, gravVal: 3, color: 'bg-red-800 hover:bg-red-900 text-white' },
        { rowLabel: rowVP, probVal: 4, gravVal: 4, color: 'bg-red-800 hover:bg-red-900 text-white' }
      ],
      [
        { rowLabel: rowP, probVal: 3, gravVal: 1, color: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
        { rowLabel: rowP, probVal: 3, gravVal: 2, color: 'bg-amber-500 hover:bg-amber-600 text-white' },
        { rowLabel: rowP, probVal: 3, gravVal: 3, color: 'bg-rose-500 hover:bg-rose-600 text-white' },
        { rowLabel: rowP, probVal: 3, gravVal: 4, color: 'bg-red-800 hover:bg-red-900 text-white' }
      ],
      [
        { rowLabel: rowLP, probVal: 2, gravVal: 1, color: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
        { rowLabel: rowLP, probVal: 2, gravVal: 2, color: 'bg-amber-500 hover:bg-amber-600 text-white' },
        { rowLabel: rowLP, probVal: 2, gravVal: 3, color: 'bg-amber-500 hover:bg-amber-600 text-white' },
        { rowLabel: rowLP, probVal: 2, gravVal: 4, color: 'bg-rose-500 hover:bg-rose-600 text-white' }
      ],
      [
        { rowLabel: rowU, probVal: 1, gravVal: 1, color: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
        { rowLabel: rowU, probVal: 1, gravVal: 2, color: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
        { rowLabel: rowU, probVal: 1, gravVal: 3, color: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
        { rowLabel: rowU, probVal: 1, gravVal: 4, color: 'bg-amber-500 hover:bg-amber-600 text-white' }
      ]
    ];
  }, [language]);

  const selectedCellRisks = selectedDashCell
    ? riskTasks.filter(
        t =>
          getProbValue(t.probabilite) === selectedDashCell.prob &&
          getGravValue(t.gravite) === selectedDashCell.grav
      )
    : [];

  const maxGravCount = Math.max(1, ...computedStats.graviteBar.map(b => b.count));
  const maxProbCount = Math.max(1, ...computedStats.probabiliteBar.map(b => b.count));

  const isEN = language === 'EN';

  return (
    <div className="space-y-6 pb-12 font-sans animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 rounded-2xl text-white shadow-md">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-widest mb-2 backdrop-blur-xs">
            <Activity className="w-3.5 h-3.5" />
            {isEN ? 'ISO 31000 & RBM Method' : 'ISO 31000 & Méthode GAR'}
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {isEN ? 'Risk Dashboard' : 'Tableau de Bord des Risques'}
          </h2>
          <p className="text-xs text-orange-100 font-medium mt-1">
            {isEN
              ? 'Governance, mapping and control of operational risk exposure'
              : "Gouvernance, cartographie et maîtrise de l'exposition aux risques opérationnels"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 bg-white/15 backdrop-blur-md border border-white/30 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-orange-100 block">
              {isEN ? 'EXPOSURE HORIZON' : "Horizon d'Exposition"}
            </span>
            <span className="text-sm font-black text-white">{cpmData}</span>
          </div>

          <div className="px-4 py-2 bg-white/15 backdrop-blur-md border border-white/30 rounded-xl min-w-[170px]">
            <div className="flex justify-between text-[10px] uppercase font-bold text-orange-100 mb-1">
              <span>{isEN ? 'Resolution' : 'Résolution'}</span>
              <span className="text-white font-black">{stats.rate}%</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-400 h-2 rounded-full transition-all duration-500" style={{ width: `${stats.rate}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Synchronized Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1.5">
            <Filter className="w-3 h-3" />
            {isEN ? '1. Filter by Strategic Axis' : '1. Filtrer par Axe Stratégique'}
          </label>
          <select
            value={filterAxeId}
            onChange={e => {
              setFilterAxeId(e.target.value);
              setFilterProjectId('ALL');
            }}
            className="w-full p-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="ALL">{isEN ? 'All axes (Global View)' : 'Tous les axes (Vue Globale)'}</option>
            {(dossier.axes || []).map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1.5">
            <Filter className="w-3 h-3" />
            {isEN ? '2. Filter by Operational Project' : '2. Filtrer par Projet Opérationnel'}
          </label>
          <select
            value={filterProjectId}
            onChange={e => setFilterProjectId(e.target.value)}
            className="w-full p-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="ALL">
              {isEN
                ? `All projects ${filterAxeId !== 'ALL' ? 'of this axis' : ''}`
                : `Tous les projets ${filterAxeId !== 'ALL' ? 'de cet axe' : ''}`}
            </option>
            {(dossier.axes || [])
              .filter(a => filterAxeId === 'ALL' || a.id === filterAxeId)
              .flatMap(a => a.projects || [])
              .map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
          </select>
        </div>
      </div>

      {/* 4 TOP KPI CARDS (Exact Screenshot 1 layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
            {isEN ? 'TOTAL RISKS' : 'RISQUES TOTAUX'}
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats.total}
          </span>
        </div>

        <div className="px-5 py-4 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/80 rounded-2xl shadow-xs flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            {isEN ? 'TREATED RISKS' : 'RISQUES TRAITÉS'}
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">
            {stats.completed}
          </span>
        </div>

        <div className="px-5 py-4 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700/80 rounded-2xl shadow-xs flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
            {isEN ? 'BLOCKED RISKS' : 'RISQUES BLOQUÉS'}
          </span>
          <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
            {stats.blocked}
          </span>
        </div>

        <div className="px-5 py-4 bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-700/80 rounded-2xl shadow-xs flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-orange-800 dark:text-orange-400">
            {isEN ? 'CRITICAL RISKS' : 'RISQUES CRITIQUES'}
          </span>
          <span className="text-2xl sm:text-3xl font-black text-orange-600 dark:text-orange-400">
            {stats.critical}
          </span>
        </div>
      </div>

      {/* 6 GRAPHIQUES ANALYTIQUES DU PORTFOLIO (Exact Screenshot 1 layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* GRAPHE 1 : Répartition par Niveau de Criticité */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isEN ? 'GRAPH 1' : 'GRAPHE 1'}
            </span>
            <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
              {isEN ? 'Breakdown by Criticality Level' : 'Répartition par Niveau de Criticité'}
            </h4>
          </div>

          <div className="h-48 w-full my-2 flex items-center justify-center">
            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={computedStats.criticitePie.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {computedStats.criticitePie
                      .filter(d => d.value > 0)
                      .map((entry, idx) => (
                        <Cell key={`cell-crit-${idx}`} fill={entry.color} />
                      ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400 italic">{isEN ? 'No data' : 'Aucune donnée'}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shrink-0" />
              <span>{isEN ? 'Critical:' : 'Critique :'} <strong className="text-slate-900 dark:text-white">{computedStats.criticiteCounts.critique}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shrink-0" />
              <span>{isEN ? 'High:' : 'Élevée :'} <strong className="text-slate-900 dark:text-white">{computedStats.criticiteCounts.elevee}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c] shrink-0" />
              <span>{isEN ? 'Moderate:' : 'Modéré :'} <strong className="text-slate-900 dark:text-white">{computedStats.criticiteCounts.modere}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shrink-0" />
              <span>{isEN ? 'Low:' : 'Faible :'} <strong className="text-slate-900 dark:text-white">{computedStats.criticiteCounts.faible}</strong></span>
            </div>
          </div>
        </div>

        {/* GRAPHE 2 : Nature du Risque (Secteurs PESTEL) */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isEN ? 'GRAPH 2' : 'GRAPHE 2'}
            </span>
            <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
              {isEN ? 'Risk Nature (PESTEL Sectors)' : 'Nature du Risque (Secteurs PESTEL)'}
            </h4>
          </div>

          <div className="my-3 space-y-2">
            {computedStats.pestelSectors.map(sec => {
              const barPct = stats.total > 0 ? Math.round((sec.count / stats.total) * 100) : 0;
              const avgNote = sec.count > 0 ? `${Math.round(sec.scoreSum / sec.count)}/5` : '-';
              return (
                <div key={sec.key} className="flex items-center gap-2.5">
                  <span className="w-24 text-right text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">
                    {sec.label}
                  </span>
                  <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
                    {sec.count > 0 && (
                      <div
                        className="h-full bg-orange-600 rounded-md transition-all duration-500"
                        style={{ width: `${Math.max(12, barPct)}%` }}
                      />
                    )}
                  </div>
                  <span className="w-4 text-right text-[11px] font-black text-slate-900 dark:text-white">
                    {sec.count}
                  </span>
                  <span
                    className={`min-w-[28px] text-center px-1.5 py-0.5 rounded border text-[10px] font-black ${
                      sec.count > 0
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    {avgNote}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 2 Summary Boxes inside Graphe 2 */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <div className="p-2.5 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/70">
              <div className="text-[9px] font-black uppercase tracking-wider text-orange-800 dark:text-orange-300 flex items-center gap-1">
                <span>↗</span>
                <span>{isEN ? 'RESOLUTION TRACKING' : 'SUIVI DES RÉSOLUTIONS'}</span>
              </div>
              <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                {isEN ? `${avgTreatmentDays} days of processing` : `${avgTreatmentDays} jours de traitement`}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  {isEN ? 'Resolution Rate' : 'Taux de Résolution'}
                </span>
                <span className="font-black text-emerald-700 dark:text-emerald-400 text-xs">{stats.rate}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.rate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9.5px] text-slate-400 pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
            <span>{isEN ? 'PESTEL Sectors: Number of occurrences' : 'Secteurs PESTEL : Nombre d\'occurrences'}</span>
            <span className="font-bold text-slate-500 dark:text-slate-400">
              {isEN ? 'Badge: PESTEL Rating Score (1 to 5)' : 'Badge : Note Évaluation PESTEL (1 à 5)'}
            </span>
          </div>
        </div>

        {/* GRAPHE 3 : Impact Majeur (Qualité-Coût-Délai) */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isEN ? 'GRAPH 3' : 'GRAPHE 3'}
            </span>
            <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
              {isEN ? 'Major Impact (Quality-Cost-Delay)' : 'Impact Majeur (Qualité-Coût-Délai)'}
            </h4>
          </div>

          <div className="h-48 w-full my-2 flex items-center justify-center">
            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={computedStats.consequencePie.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {computedStats.consequencePie
                      .filter(d => d.value > 0)
                      .map((entry, idx) => (
                        <Cell key={`cq-${idx}`} fill={entry.color} />
                      ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400 italic">{isEN ? 'No data' : 'Aucune donnée'}</span>
            )}
          </div>

          <div className="grid grid-cols-3 text-center border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="flex flex-col items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c] mb-1" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{isEN ? 'Quality' : 'Qualité'}</span>
              <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                {computedStats.consequenceCounts.qualite}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] mb-1" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{isEN ? 'Cost' : 'Coût'}</span>
              <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                {computedStats.consequenceCounts.cout}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] mb-1" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{isEN ? 'Delay' : 'Délai'}</span>
              <span className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                {computedStats.consequenceCounts.delai}
              </span>
            </div>
          </div>
        </div>

        {/* GRAPHE 4 : Tendance d'Évolution des Risques */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isEN ? 'GRAPH 4' : 'GRAPHE 4'}
            </span>
            <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
              {isEN ? 'Risk Evolution Trend' : "Tendance d'Évolution des Risques"}
            </h4>
          </div>

          <div className="h-44 w-full my-2 flex items-center justify-center">
            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={computedStats.tendancePie.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={66}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {computedStats.tendancePie
                      .filter(d => d.value > 0)
                      .map((entry, idx) => (
                        <Cell key={`td-${idx}`} fill={entry.color} />
                      ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400 italic">{isEN ? 'No data' : 'Aucune donnée'}</span>
            )}
          </div>

          <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
            {computedStats.tendancePie.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="flex items-center text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-black text-slate-900 dark:text-white">
                  {item.value} ({stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* GRAPHE 5 : Gravité Constatée (Impact) */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isEN ? 'GRAPH 5' : 'GRAPHE 5'}
            </span>
            <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
              {isEN ? 'Observed Severity (Impact)' : 'Gravité Constatée (Impact)'}
            </h4>
          </div>

          <div className="h-44 w-full my-3 flex items-end justify-around px-4 pt-6 border-b border-slate-100 dark:border-slate-800 pb-2">
            {computedStats.graviteBar.map(bar => {
              const heightPx = bar.count > 0 ? Math.max(18, Math.round((bar.count / maxGravCount) * 110)) : 3;
              return (
                <div key={bar.name} className="flex flex-col items-center gap-1.5 w-14">
                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                    {bar.count}
                  </span>
                  <div
                    className="w-8 rounded-t-md transition-all duration-500"
                    style={{ height: `${heightPx}px`, backgroundColor: bar.color }}
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-full">
                    {bar.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-center text-slate-400 pt-1">
            {isEN
              ? 'Incident classification based on financial & deadline thresholds'
              : "Classification des incidents selon les seuils financiers & d'échéances"}
          </p>
        </div>

        {/* GRAPHE 6 : Probabilité de Matérialisation */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isEN ? 'GRAPH 6' : 'GRAPHE 6'}
            </span>
            <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
              {isEN ? 'Materialization Probability' : 'Probabilité de Matérialisation'}
            </h4>
          </div>

          <div className="h-44 w-full my-3 flex items-end justify-around px-4 pt-6 border-b border-slate-100 dark:border-slate-800 pb-2">
            {computedStats.probabiliteBar.map(bar => {
              const heightPx = bar.count > 0 ? Math.max(18, Math.round((bar.count / maxProbCount) * 110)) : 3;
              return (
                <div key={bar.name} className="flex flex-col items-center gap-1.5 w-14">
                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                    {bar.count}
                  </span>
                  <div
                    className="w-8 rounded-t-md transition-all duration-500"
                    style={{ height: `${heightPx}px`, backgroundColor: bar.color }}
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-full">
                    {bar.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-center text-slate-400 pt-1">
            {isEN
              ? 'Occurrence estimation based on internal audit methodology'
              : "Estimation de l'occurrence selon la méthodologie d'audit interne"}
          </p>
        </div>
      </div>

      {/* SECTION EXÉCUTIVE SOMBRE : Analyse Critique & Évaluation des Risques (Norme ISO 31000) (Screenshot 2) */}
      <div className="p-6 bg-slate-900 dark:bg-slate-950 text-white rounded-3xl shadow-lg border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {isEN
                  ? 'Critical Analysis & Risk Evaluation (ISO 31000 Standard)'
                  : 'Analyse Critique & Évaluation des Risques (Norme ISO 31000)'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEN
                  ? 'Executive summary of overall exposure, operational vulnerabilities and mitigation recommendations.'
                  : "Synthèse exécutive de l'exposition globale, vulnérabilités opérationnelles et recommandations d'atténuation."}
              </p>
            </div>
          </div>

          <div className="px-3.5 py-1.5 rounded-full bg-rose-950/80 border border-rose-700/60 text-rose-200 text-xs font-black self-start sm:self-center shrink-0">
            {isEN ? `Resolution Rate: ${stats.rate}%` : `Taux de Résolution : ${stats.rate}%`}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-amber-400 mb-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isEN ? 'MAJOR VULNERABILITIES' : 'VULNÉRABILITÉS MAJEURES'}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {stats.critical > 0
                ? isEN
                  ? `${stats.critical} active major critical risk(s) identified in the selected scope requiring priority mitigation.`
                  : `${stats.critical} risque(s) critique(s) majeur(s) actif(s) recensé(s) sur le périmètre sélectionné nécessitant une mitigation prioritaire.`
                : isEN
                ? 'No active major critical risk identified in the selected scope.'
                : 'Aucun risque critique majeur actif recensé sur le périmètre sélectionné.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-orange-400 mb-2">
              <Activity className="w-3.5 h-3.5" />
              <span>{isEN ? 'CONTROL INDEX & TIMELINES' : 'INDICE DE MAÎTRISE & DÉLAIS'}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isEN
                ? `Estimated average incident processing time: `
                : 'Délai moyen estimé de traitement des incidents : '}
              <strong className="text-white">{avgTreatmentDays} {isEN ? 'days' : 'jours'}</strong>.{' '}
              {isEN
                ? `${stats.blocked} activity(ies) currently blocked require governance arbitration.`
                : `${stats.blocked} activité(s) actuellement bloquée(s) requièrent un arbitrage de la gouvernance.`}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-emerald-400 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isEN ? 'ISO 31000 RECOMMENDATIONS' : 'RECOMMANDATIONS ISO 31000'}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isEN
                ? 'Strengthen weekly monitoring of corrective actions and reallocate resources to identified bottlenecks.'
                : "Renforcer le suivi hebdomadaire des actions correctives et réallouer les ressources sur les goulots d'étranglement identifiés."}
            </p>
          </div>
        </div>
      </div>

      {/* MATRICES DÉCISIONNELLES : Scénarii Prospectifs (PESTEL), SWOT (FFOM) & TOWS (Screenshots 2, 3, 5, 6, 7) */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 mt-0.5">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 text-[9.5px] font-black uppercase tracking-wider">
                  {isEN ? '360° STRATEGIC GOVERNANCE' : 'GOUVERNANCE STRATÉGIQUE 360°'}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {isEN ? '• Dynamic Operational Input' : '• Saisie Opérationnelle Dynamique'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {isEN
                  ? 'Decision Matrices: Prospective Scenarios (PESTEL), SWOT & TOWS'
                  : 'Matrices Décisionnelles : Scénarii Prospectifs (PESTEL), SWOT (FFOM) & TOWS'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isEN
                  ? 'Forecast projection and strategic alignment generated in real time from PESTEL scores, weaknesses, donors and recorded risks.'
                  : 'Projection prévisionnelle et alignement stratégique générés en temps réel à partir des notes PESTEL, faiblesses, bailleurs et risques enregistrés.'}
              </p>
            </div>
          </div>

          {/* 4 Segmented Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start lg:self-center">
            {(
              [
                { id: 'all', label: isEN ? 'Full View' : 'Vue Complète' },
                { id: 'pestel', label: isEN ? `PESTEL Scenarios (${riskTasks.length})` : `Scénarii PESTEL (${riskTasks.length})` },
                { id: 'swot', label: isEN ? 'SWOT Diagnostic' : 'SWOT (FFOM)' },
                { id: 'tows', label: isEN ? 'TOWS Matrix' : 'Matrice TOWS' }
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMatrixTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  matrixTab === tab.id
                    ? 'bg-white dark:bg-slate-900 text-orange-700 dark:text-orange-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 1. MATRICE DES SCENARII PROSPECTIFS */}
        {(matrixTab === 'all' || matrixTab === 'pestel') && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">
                  {isEN
                    ? '1. PROSPECTIVE SCENARIOS MATRIX (From PESTEL & Risk Trend)'
                    : '1. MATRICE DES SCENARII PROSPECTIFS (Émanant du PESTEL & Tendance Risques)'}
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                {isEN
                  ? `Breakdown of ${riskTasks.length} activity(ies) based on PESTEL rating (1 to 5) and risk status`
                  : `Ventilation de ${riskTasks.length} activité(s) selon l'évaluation PESTEL (1 à 5) et l'état des risques`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Scénario 1 : Optimiste */}
              <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/70 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[9.5px] font-black uppercase">
                      {isEN ? 'SCENARIO 1: OPTIMISTIC' : 'SCÉNARIO 1 : OPTIMISTE'}
                    </span>
                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                      {strategicMatrices.scen1.pct}%
                    </span>
                  </div>
                  <h5 className="text-xs font-black text-slate-900 dark:text-white">
                    {isEN ? 'Virtuous Trajectory & Acceleration' : 'Trajectoire Vertueuse & Accélération'}
                  </h5>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isEN
                      ? 'Activities with PESTEL ≤ 2, closed risks or completed tasks without blockages. Favorable climate and good execution.'
                      : 'Activités avec PESTEL ≤ 2, risques clôturés ou tâches terminées sans blocage. Climat favorable et bonne exécution.'}
                  </p>
                  <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/50">
                    <span className="text-[9.5px] font-black uppercase text-emerald-800 dark:text-emerald-400 block mb-0.5">
                      {isEN ? 'GOVERNANCE DIRECTIVE:' : 'DIRECTIVE GOUVERNANCE :'}
                    </span>
                    <p className="text-[11px] text-emerald-900 dark:text-emerald-200 leading-snug">
                      {isEN
                        ? 'Capitalize on achievements, accelerate schedule and anticipate upcoming milestones.'
                        : 'Capitaliser sur les acquis, accélérer le calendrier et anticiper les jalons suivants.'}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">
                    {isEN ? 'Attached volume:' : 'Volume rattaché :'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-black">
                    {strategicMatrices.scen1.list.length} {isEN ? 'activity(ies)' : 'activité(s)'}
                  </span>
                </div>
              </div>

              {/* Scénario 2 : Tendance Médiane */}
              <div className="p-4 rounded-2xl bg-orange-50/40 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/70 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-300 text-[9.5px] font-black uppercase">
                      {isEN ? 'SCENARIO 2: MEDIAN TREND' : 'SCÉNARIO 2 : TENDANCE MÉDIANE'}
                    </span>
                    <span className="text-sm font-black text-orange-700 dark:text-orange-400">
                      {strategicMatrices.scen2.pct}%
                    </span>
                  </div>
                  <h5 className="text-xs font-black text-slate-900 dark:text-white">
                    {isEN ? 'Plan-Compliant Trajectory (AWPB)' : 'Trajectoire Conforme au Plan (PTBA)'}
                  </h5>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isEN
                      ? 'Activities with standard PESTEL rating (3) and moderate risks under monitoring. Stable overall execution.'
                      : 'Activités avec note PESTEL standard (3) et risques modérés sous surveillance. Exécution globale stable.'}
                  </p>
                  <div className="pt-2 border-t border-orange-200/60 dark:border-orange-800/50">
                    <span className="text-[9.5px] font-black uppercase text-orange-800 dark:text-orange-400 block mb-0.5">
                      {isEN ? 'GOVERNANCE DIRECTIVE:' : 'DIRECTIVE GOUVERNANCE :'}
                    </span>
                    <p className="text-[11px] text-orange-900 dark:text-orange-200 leading-snug">
                      {isEN
                        ? 'Maintain periodic review cadences and monitor forecast costs and deadlines.'
                        : 'Maintenir les rythmes de revues périodiques et surveiller les coûts et délais prévisionnels.'}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-orange-200/60 dark:border-orange-800/50 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-orange-800 dark:text-orange-300">
                    {isEN ? 'Attached volume:' : 'Volume rattaché :'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-300 font-black">
                    {strategicMatrices.scen2.list.length} {isEN ? 'activity(ies)' : 'activité(s)'}
                  </span>
                </div>
              </div>

              {/* Scénario 3 : Vigilance Forte */}
              <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/70 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[9.5px] font-black uppercase">
                      {isEN ? 'SCENARIO 3: HIGH VIGILANCE' : 'SCÉNARIO 3 : VIGILANCE FORTE'}
                    </span>
                    <span className="text-sm font-black text-amber-700 dark:text-amber-400">
                      {strategicMatrices.scen3.pct}%
                    </span>
                  </div>
                  <h5 className="text-xs font-black text-slate-900 dark:text-white">
                    {isEN ? 'Environmental & PESTEL Deterioration' : 'Dégradation Environnementale & PESTEL'}
                  </h5>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isEN
                      ? 'Activities with PESTEL rating = 4 or increasing / high criticality risks. Risk of drift on deliverables.'
                      : 'Activités avec note PESTEL = 4 ou risques en hausse / criticité élevée. Risque de dérive sur les livrables.'}
                  </p>
                  <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/50">
                    <span className="text-[9.5px] font-black uppercase text-amber-800 dark:text-amber-400 block mb-0.5">
                      {isEN ? 'GOVERNANCE DIRECTIVE:' : 'DIRECTIVE GOUVERNANCE :'}
                    </span>
                    <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-snug">
                      {isEN
                        ? 'Trigger contingency plans and secure validation circuits with donors.'
                        : 'Déclencher les plans de contingence et sécuriser les circuits de validation avec les bailleurs.'}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/50 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-amber-800 dark:text-amber-300">
                    {isEN ? 'Attached volume:' : 'Volume rattaché :'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-black">
                    {strategicMatrices.scen3.list.length} {isEN ? 'activity(ies)' : 'activité(s)'}
                  </span>
                </div>
              </div>

              {/* Scénario 4 : Rupture / Crise */}
              <div className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/70 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 text-[9.5px] font-black uppercase">
                      {isEN ? 'SCENARIO 4: BREAKDOWN / CRISIS' : 'SCÉNARIO 4 : RUPTURE / CRISE'}
                    </span>
                    <span className="text-sm font-black text-rose-700 dark:text-rose-400">
                      {strategicMatrices.scen4.pct}%
                    </span>
                  </div>
                  <h5 className="text-xs font-black text-slate-900 dark:text-white">
                    {isEN ? 'Blockages & Major Critical Risks' : 'Blocages & Risques Critiques Majeurs'}
                  </h5>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isEN
                      ? 'Activities with PESTEL = 5, tasks in Blocked status or unresolved critical risks.'
                      : 'Activités avec PESTEL = 5, tâches en statut Bloqué ou risques critiques non résolus.'}
                  </p>
                  <div className="pt-2 border-t border-rose-200/60 dark:border-rose-800/50">
                    <span className="text-[9.5px] font-black uppercase text-rose-800 dark:text-rose-400 block mb-0.5">
                      {isEN ? 'GOVERNANCE DIRECTIVE:' : 'DIRECTIVE GOUVERNANCE :'}
                    </span>
                    <p className="text-[11px] text-rose-900 dark:text-rose-200 leading-snug">
                      {isEN
                        ? 'Convene crisis committee, immediate financial arbitration and resource reallocation.'
                        : 'Convoquer le comité de crise, arbitrage financier immédiat et réallocation des moyens.'}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-rose-200/60 dark:border-rose-800/50 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-rose-800 dark:text-rose-300">
                    {isEN ? 'Attached volume:' : 'Volume rattaché :'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300 font-black">
                    {strategicMatrices.scen4.list.length} {isEN ? 'activity(ies)' : 'activité(s)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. MATRICE SWOT / FFOM */}
        {(matrixTab === 'all' || matrixTab === 'swot') && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">
                  {isEN
                    ? '2. SWOT MATRIX (Strengths, Weaknesses, Opportunities, Threats)'
                    : '2. MATRICE SWOT / FFOM (Forces, Faiblesses, Opportunités, Menaces)'}
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                {isEN
                  ? 'Internal & external strategic diagnostic based on planning and monitoring data'
                  : 'Diagnostic stratégique interne & externe fondé sur les données de planification et de suivi'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FORCES */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-black uppercase text-slate-900 dark:text-white">
                      {isEN ? 'STRENGTHS (S - POSITIVE INTERNAL FACTORS)' : 'FORCES (S - FACTEURS INTERNES POSITIFS)'}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black">
                    {strategicMatrices.forces.length} {isEN ? 'item(s)' : 'item(s)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isEN
                    ? 'Mastered activities, completed on time, with strong PESTEL resilience (score ≤ 2).'
                    : 'Activités maîtrisées, terminées dans les délais, et présentant une résilience PESTEL forte (score ≤ 2).'}
                </p>
                <div className="space-y-1.5">
                  {strategicMatrices.forces.length > 0 ? (
                    strategicMatrices.forces.map(item => (
                      <div
                        key={item.id}
                        className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                      >
                        <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 truncate">
                          {item.label}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9.5px] font-black shrink-0">
                          {item.badge}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] italic text-slate-400">
                      {isEN ? 'No strength recorded.' : 'Aucune force répertoriée.'}
                    </p>
                  )}
                </div>
              </div>

              {/* FAIBLESSES */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-black uppercase text-slate-900 dark:text-white">
                      {isEN ? 'WEAKNESSES (W - VULNERABLE INTERNAL FACTORS)' : 'FAIBLESSES (W - FACTEURS INTERNES VULNÉRABLES)'}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-black">
                    {strategicMatrices.faiblesses.length} {isEN ? 'item(s)' : 'item(s)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isEN
                    ? 'Weaknesses identified during tracking, active operational blockages and declared reasons.'
                    : 'Faiblesses identifiées lors du suivi, blocages opérationnels actifs et motifs déclarés en Étape 6 & 8.'}
                </p>
                <div className="space-y-1.5">
                  {strategicMatrices.faiblesses.length > 0 ? (
                    strategicMatrices.faiblesses.map(item => (
                      <div
                        key={item.id}
                        className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                      >
                        <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 truncate">
                          {item.label}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[9.5px] font-black shrink-0">
                          {getTranslatedDropdownLabel(item.badge, language)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] italic text-slate-400">
                      {isEN ? 'No weakness recorded.' : 'Aucune faiblesse répertoriée.'}
                    </p>
                  )}
                </div>
              </div>

              {/* OPPORTUNITÉS */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="text-xs font-black uppercase text-slate-900 dark:text-white">
                      {isEN ? 'OPPORTUNITIES (O - LEVERS & PARTNERSHIPS)' : 'OPPORTUNITÉS (O - LEVIERS & PARTENARIATS)'}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-[10px] font-black">
                    {strategicMatrices.opportunites.length} {isEN ? 'item(s)' : 'item(s)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isEN
                    ? 'Financial partners & donors mobilized, preventive plans and favorable margins of action.'
                    : "Partenaires financiers & bailleurs mobilisés en Étape 5, plans préventifs et marges d'action favorables."}
                </p>
                <div className="space-y-1.5">
                  {strategicMatrices.opportunites.length > 0 ? (
                    strategicMatrices.opportunites.map(item => (
                      <div
                        key={item.id}
                        className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                      >
                        <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 truncate">
                          {item.label}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 text-[9.5px] font-black shrink-0">
                          {item.badge}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] italic text-slate-400">
                      {isEN ? 'No opportunity recorded.' : 'Aucune opportunité répertoriée.'}
                    </p>
                  )}
                </div>
              </div>

              {/* MENACES */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-xs font-black uppercase text-slate-900 dark:text-white">
                      {isEN ? 'THREATS (T - EXTERNAL RISKS & DRIFTS)' : 'MENACES (T - RISQUES EXTERNES & DÉRIVES)'}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-black">
                    {strategicMatrices.menaces.length} {isEN ? 'item(s)' : 'item(s)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isEN
                    ? 'High or critical risks, severe PESTEL scores (4-5) and deteriorating trends.'
                    : 'Risques à criticité élevée ou critique, notes PESTEL sévères (4-5) et tendances en dégradation.'}
                </p>
                <div className="space-y-1.5">
                  {strategicMatrices.menaces.length > 0 ? (
                    strategicMatrices.menaces.map(item => (
                      <div
                        key={item.id}
                        className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                      >
                        <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 truncate">
                          {item.label}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[9.5px] font-black shrink-0">
                          {item.badge}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] italic text-slate-400">
                      {isEN ? 'No threat recorded.' : 'Aucune menace répertoriée.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. MATRICE TOWS (Matrice des Stratégies Croisées) */}
        {(matrixTab === 'all' || matrixTab === 'tows') && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">
                  {isEN
                    ? '3. TOWS MATRIX (Cross-Strategy Matrix)'
                    : '3. MATRICE TOWS (Matrice des Stratégies Croisées)'}
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                {isEN
                  ? 'Intersection of Strengths/Weaknesses × Opportunities/Threats for executive arbitration'
                  : "Croisement Forces/Faiblesses × Opportunités/Menaces pour l'arbitrage exécutif"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* STRATÉGIES SO */}
              <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-indigo-900 dark:text-indigo-300">
                    {isEN
                      ? '◎ SO STRATEGIES (STRENGTHS + OPPORTUNITIES): ATTACK & EXPANSION'
                      : '◎ STRATÉGIES SO (FORCES + OPPORTUNITÉS) : ATTAQUE & EXPANSION'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 text-[9.5px] font-black">
                    Maxi-Maxi
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isEN
                    ? `Capitalize on ${strategicMatrices.forces.length} internal strengths and program successes to maximize leverage with ${strategicMatrices.opportunites.length} identified financial partners and donors.`
                    : `Capitaliser sur les ${strategicMatrices.forces.length} forces internes et succès du programme pour maximiser l'effet de levier des ${strategicMatrices.opportunites.length} partenaires financiers et bailleurs identifiés.`}
                </p>
                <ul className="text-[11px] text-indigo-900 dark:text-indigo-200 space-y-1 list-disc list-inside">
                  <li>
                    {isEN
                      ? 'Accelerate signing of conditional disbursement tranches with donors.'
                      : 'Accélérer la signature des tranches conditionnelles de décaissement avec les bailleurs.'}
                  </li>
                  <li>
                    {isEN
                      ? 'Replicate completed activity methodologies across new scopes.'
                      : 'Dupliquer les méthodologies des activités achevées sur les nouveaux périmètres.'}
                  </li>
                </ul>
              </div>

              {/* STRATÉGIES ST */}
              <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-emerald-900 dark:text-emerald-300">
                    {isEN
                      ? '🛡 ST STRATEGIES (STRENGTHS + THREATS): DEFENSE & ARMOR'
                      : '🛡 STRATÉGIES ST (FORCES + MENACES) : DÉFENSE & BLINDAGE'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-[9.5px] font-black">
                    Maxi-Mini
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isEN
                    ? `Deploy acquired expertise and resilience to neutralize ${strategicMatrices.menaces.length} PESTEL sector threats and critical risks.`
                    : `Déployer l'expertise et la résilience acquises pour neutraliser les ${strategicMatrices.menaces.length} menaces sectorielles PESTEL et risques critiques.`}
                </p>
                <ul className="text-[11px] text-emerald-900 dark:text-emerald-200 space-y-1 list-disc list-inside">
                  <li>
                    {isEN
                      ? 'Secure legal and environmental framework for sensitive activities.'
                      : 'Sécuriser le cadre juridique et environnemental des activités sensibles.'}
                  </li>
                  <li>
                    {isEN
                      ? 'Implement early quality control reviews on at-risk deliverables.'
                      : 'Mettre en place des revues de contrôle qualité anticipées sur les livrables à risque.'}
                  </li>
                </ul>
              </div>

              {/* STRATÉGIES WO */}
              <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-900 dark:text-amber-300">
                    {isEN
                      ? '⚡ WO STRATEGIES (WEAKNESSES + OPPORTUNITIES): TURNAROUND & ADJUSTMENT'
                      : '⚡ STRATÉGIES WO (FAIBLESSES + OPPORTUNITÉS) : REDRESSEMENT & AJUSTEMENT'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-[9.5px] font-black">
                    Mini-Maxi
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isEN
                    ? `Allocate financial partner support and training plans to resolve ${strategicMatrices.faiblesses.length} execution weaknesses and unblock ${stats.blocked} blocked task(s).`
                    : `Allouer les appuis des partenaires financiers et plans de formation pour lever les ${strategicMatrices.faiblesses.length} faiblesses d'exécution et débloquer les ${stats.blocked} tâche(s) bloquée(s).`}
                </p>
                <ul className="text-[11px] text-amber-900 dark:text-amber-200 space-y-1 list-disc list-inside">
                  <li>
                    {isEN
                      ? 'Strengthen technical assistance on declared bottlenecks.'
                      : "Renforcer l'assistance technique sur les goulots d'étranglement déclarés."}
                  </li>
                  <li>
                    {isEN
                      ? 'Mobilize contingency reserves to finance corrective actions.'
                      : 'Mobiliser les réserves de prévoyance pour financer les actions correctives.'}
                  </li>
                </ul>
              </div>

              {/* STRATÉGIES WT */}
              <div className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-rose-900 dark:text-rose-300">
                    {isEN
                      ? '⚠ WT STRATEGIES (WEAKNESSES + THREATS): SURVIVAL & ARBITRATION'
                      : '⚠ STRATÉGIES WT (FAIBLESSES + MENACES) : SURVIE & ARBITRAGE'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-300 text-[9.5px] font-black">
                    Mini-Mini
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isEN
                    ? 'Contain the cumulative impact of internal execution weaknesses and external critical PESTEL shocks (scores 4 and 5).'
                    : "Contenir l'impact cumulé des faiblesses d'exécution internes et des chocs PESTEL externes critiques (notes 4 et 5)."}
                </p>
                <ul className="text-[11px] text-rose-900 dark:text-rose-200 space-y-1 list-disc list-inside">
                  <li>
                    {isEN
                      ? 'Immediately activate steering committee to rule on chronic blocked tasks.'
                      : 'Activer immédiatement le comité de pilotage pour statuer sur les tâches bloquées chroniques.'}
                  </li>
                  <li>
                    {isEN
                      ? 'Reconfigure or stop non-viable activity components to protect overall budget.'
                      : "Reconfigurer ou arrêter les composantes d'activités non viables afin de protéger le budget global."}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PROFIL SYNTHÉTIQUE DES PORTEFEUILLES D'ACTIVITÉS (Screenshot 4) */}
      {projectStats.length > 0 && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-600 text-xs font-black">
                ↗
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {isEN
                  ? 'Synthetic Profile of Activity Portfolios'
                  : "Profil Synthétique des Portefeuilles d'Activités"}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                {isEN ? 'Total Risks' : 'Total Risques'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                {isEN ? 'Treated' : 'Traités'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                {isEN ? 'In progress' : 'En cours'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                {isEN ? 'Blocked' : 'Bloqués'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                {isEN ? 'New' : 'Nouveaux'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-black">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                {isEN ? 'Critical / Very Critical' : 'Critiques / Très Critiques'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {projectStats.map(proj => (
              <div key={proj.id} className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-black text-slate-900 dark:text-white">
                    {proj.fullName}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Total: <strong className="text-slate-900 dark:text-white">{proj.total}</strong></span>
                    <span>•</span>
                    <span>{isEN ? 'Treated:' : 'Traités:'} <strong className="text-emerald-600 dark:text-emerald-400">{proj.Traité}</strong></span>
                    <span>•</span>
                    <span>{isEN ? 'Blocked:' : 'Bloqués:'} <strong className="text-rose-600 dark:text-rose-400">{proj.Bloqué}</strong></span>
                    <span>•</span>
                    <span>{isEN ? 'Critical:' : 'Critiques:'} <strong className="text-red-600 dark:text-red-400">{proj.Critique}</strong></span>
                  </div>
                </div>

                <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex">
                  {proj.total > 0 ? (
                    <>
                      {proj.Traité > 0 && (
                        <div
                          className="h-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center transition-all duration-500"
                          style={{ width: `${(proj.Traité / proj.total) * 100}%` }}
                        >
                          {proj.Traité}
                        </div>
                      )}
                      {proj.EnCours > 0 && (
                        <div
                          className="h-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center transition-all duration-500"
                          style={{ width: `${(proj.EnCours / proj.total) * 100}%` }}
                        >
                          {proj.EnCours}
                        </div>
                      )}
                      {proj.Bloqué > 0 && (
                        <div
                          className="h-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center transition-all duration-500"
                          style={{ width: `${(proj.Bloqué / proj.total) * 100}%` }}
                        >
                          {proj.Bloqué}
                        </div>
                      )}
                      {proj.Nouveau > 0 && (
                        <div
                          className="h-full bg-slate-400 text-white text-[10px] font-black flex items-center justify-center transition-all duration-500"
                          style={{ width: `${(proj.Nouveau / proj.total) * 100}%` }}
                        >
                          {proj.Nouveau}
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CARTOGRAPHIE PROBABILITÉ / GRAVITÉ (QCD) + DÉTAIL + ANALYSE CRITIQUE (Screenshot 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 4x4 Interactive Cartography */}
        <div className="lg:col-span-6 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
          <div className="text-center mb-5">
            <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wide">
              {isEN ? 'PROBABILITY / SEVERITY MAPPING (QCD)' : 'CARTOGRAPHIE PROBABILITÉ / GRAVITÉ (QCD)'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isEN
                ? 'Click on a cell to view the full list of associated operational incidents'
                : 'Cliquez sur une cellule pour voir la liste complète des incidents opérationnels associés'}
            </p>
          </div>

          <div className="flex">
            <div className="flex flex-col justify-center items-center mr-1">
              <span className="transform -rotate-90 text-[10px] font-black text-slate-400 tracking-widest uppercase w-28 text-center">
                {isEN ? '← PROBABILITY' : '← PROBABILITÉ'}
              </span>
            </div>

            <div className="flex-1">
              {dashboardMatrixGrid.map((row, rIdx) => (
                <div key={rIdx} className="flex gap-2 mb-2">
                  <div className="w-24 flex items-center justify-end pr-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    {row[0].rowLabel}
                  </div>

                  {row.map((cell, cIdx) => {
                    const count = riskTasks.filter(
                      t =>
                        getProbValue(t.probabilite) === cell.probVal &&
                        getGravValue(t.gravite) === cell.gravVal
                    ).length;
                    const isSelected =
                      selectedDashCell &&
                      selectedDashCell.prob === cell.probVal &&
                      selectedDashCell.grav === cell.gravVal;

                    return (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => setSelectedDashCell({ prob: cell.probVal, grav: cell.gravVal })}
                        className={`flex-1 py-3.5 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 shadow-xs border ${cell.color} ${
                          isSelected
                            ? 'ring-4 ring-orange-500 scale-105 shadow-md border-white dark:border-slate-900'
                            : 'border-transparent hover:scale-102'
                        }`}
                      >
                        <span className="text-lg font-black leading-none">{count}</span>
                        <span className="text-[8px] uppercase font-black opacity-90 mt-1">
                          {count > 1 ? (isEN ? 'RISKS' : 'RISQUES') : (isEN ? 'RISK' : 'RISQUE')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}

              <div className="flex mt-2">
                <div className="w-24" />
                <div className="flex-1 flex gap-2">
                  {(isEN
                    ? ['Minor (1)', 'Major (2)', 'Severe (3)', 'Catastr. (4)']
                    : ['Mineur (1)', 'Majeur (2)', 'Grave (3)', 'Catastr. (4)']
                  ).map((l, i) => (
                    <div key={i} className="flex-1 text-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {l}
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center mt-3 text-[10px] font-black text-slate-400 tracking-widest uppercase">
                {isEN ? 'SEVERITY (IMPACT) →' : 'GRAVITÉ (IMPACT) →'}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-center gap-4 text-[10px] font-bold">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {isEN ? 'Acceptable' : 'Acceptable'}</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> {isEN ? 'Under Control' : 'Sous Contrôle'}</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> {isEN ? 'Vigilance' : 'Vigilance'}</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> {isEN ? 'Critical Alert' : 'Alerte Critique'}</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-800" /> {isEN ? 'Major Alert' : 'Alerte Majeure'}</div>
          </div>
        </div>

        {/* Right: Cell Details + Unresolved Critical Risks */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card 1: Détail des incidents de la cellule */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
            <h3 className="font-black text-slate-900 dark:text-white text-sm">
              {isEN ? 'Cell Incident Details' : 'Détail des incidents de la cellule'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 mb-4">
              {isEN ? 'Select a cell in the matrix to filter' : 'Sélectionnez une case de la matrice pour filtrer'}
            </p>

            {selectedDashCell ? (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {selectedCellRisks.length > 0 ? (
                  selectedCellRisks.map(r => (
                    <div
                      key={r.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {r.libelleRisque || r.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                          {getTranslatedDropdownLabel(r.riskStatus || 'nouveau', language)}
                        </span>
                      </div>
                      {r.libelleRisque && (
                        <p className="text-[10px] text-slate-500">
                          {isEN ? 'Activity:' : 'Activité :'} <strong>{r.name}</strong>
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700">
                        <span>{isEN ? 'Lead:' : 'Resp :'} <strong className="text-slate-800 dark:text-slate-200">{r.assignee || '—'}</strong></span>
                        <span>{isEN ? 'Project:' : 'Projet :'} <strong className="text-slate-800 dark:text-slate-200">{r.projectName}</strong></span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    {isEN
                      ? 'No operational incident recorded in this cell.'
                      : 'Aucun incident opérationnel enregistré dans cette cellule.'}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-1.5">
                <HelpCircle className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {isEN
                    ? 'Select a cell from the left matrix to examine associated incidents.'
                    : 'Sélectionnez une cellule de la matrice de gauche pour examiner les incidents associés.'}
                </p>
                <p className="text-[11px] text-slate-400 max-w-md">
                  {isEN
                    ? 'The full list of incident files with preventive and corrective actions will appear directly here.'
                    : "La liste complète des fiches d'incidents avec actions préventives et correctives s'affichera directement ici."}
                </p>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('risk_operations')}
                className="text-xs font-black text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>
                  {isEN
                    ? 'Go to Risk & Delay Tracking Matrix'
                    : 'Accéder à la Matrice de Suivi des Risques & Délais'}
                </span>
                <span>↗</span>
              </button>
            </div>
          </div>

          {/* Card 2: ANALYSE CRITIQUE DES RISQUES MAJEURS NON RÉSOLUS */}
          <div className="p-5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/70 rounded-3xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <h4 className="text-xs font-black uppercase tracking-wider">
                  {isEN
                    ? `CRITICAL ANALYSIS OF UNRESOLVED MAJOR RISKS (${bottlenecks.length})`
                    : `ANALYSE CRITIQUE DES RISQUES MAJEURS NON RÉSOLUS (${bottlenecks.length})`}
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-200 text-[10px] font-black">
                {isEN ? 'Action required' : 'Action requise'}
              </span>
            </div>

            {bottlenecks.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/50 text-center text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2">
                <span className="text-emerald-600">✅</span>
                <span>
                  {isEN
                    ? 'No unresolved critical risk in the selected scope.'
                    : 'Aucun risque critique non résolu dans le périmètre sélectionné.'}
                </span>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {bottlenecks.map(b => (
                  <div
                    key={b.id}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 shadow-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {b.libelleRisque || b.name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 text-[9px] font-black uppercase">
                        {getTranslatedDropdownLabel(b.criticite || 'critique', language)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{isEN ? 'Lead:' : 'Resp :'} <strong>{b.assignee || '—'}</strong></span>
                      <span>{isEN ? 'Project:' : 'Projet :'} <strong>{b.projectName}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. SAISIE OPÉRATIONS (Matrice d'Identification et de Résolution - 22 Colonnes)
// ============================================================================
export const RiskOperationsView: React.FC<RiskViewCommonProps> = ({
  dossier,
  filterAxeId,
  setFilterAxeId,
  filterProjectId,
  setFilterProjectId,
  onUpdateTask,
  language = 'FR',
  currency = 'FCFA'
}) => {
  const isEN = language === 'EN';
  const [filterPhase, setFilterPhase] = useState<string>('ALL');
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});

  const todayISO = useMemo(() => getTodayISO(), []);
  const axes = dossier.axes || [];

  const filteredAxes = useMemo(() => {
    if (filterAxeId === 'ALL') return axes;
    return axes.filter(a => a.id === filterAxeId);
  }, [axes, filterAxeId]);

  const availableProjects = useMemo(() => {
    return filteredAxes.flatMap(a => a.projects || []);
  }, [filteredAxes]);

  const allAssignees = useMemo(() => {
    const set = new Set<string>();
    axes.forEach(ax => {
      (ax.projects || []).forEach(pr => {
        (pr.tasks || []).forEach(tk => {
          if (tk.assignee && tk.assignee.trim()) {
            tk.assignee
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
              .forEach(actor => set.add(actor));
          }
        });
      });
    });
    return Array.from(set).sort();
  }, [axes]);

  // Code generation computed BEFORE phase / status / assignee filters, synchronized across projects
  const allEnrichedTasks = useMemo(() => {
    const list: Array<{
      task: Task;
      projId: string;
      projName: string;
      axeId: string;
      axeName: string;
      code: string;
      effectiveStatus: Task['status'];
      projectTaskOptions: Array<{ id: string; code: string; name: string }>;
    }> = [];

    filteredAxes.forEach(axe => {
      const axeProjects = (axe.projects || []).filter(
        p => filterProjectId === 'ALL' || p.id === filterProjectId
      );

      axeProjects.forEach(proj => {
        const rawTasks = proj.tasks || [];
        const codeMap = new Map<string, string>();
        const projectTaskOptions: Array<{ id: string; code: string; name: string }> = [];

        STANDARD_PHASES.forEach((pName, pIdx) => {
          const pTasks = rawTasks.filter(tk => tk.phase === pName);
          pTasks.forEach((tk, tIdx) => {
            const isJ = (tk.taskOrMilestone || tk.type) === 'jalon';
            const c = `${isJ ? 'J' : 'T'}.${pIdx + 1}.${tIdx + 1}`;
            codeMap.set(tk.id, c);
            projectTaskOptions.push({ id: tk.id, code: c, name: tk.name });
          });
        });

        rawTasks
          .filter(tk => !STANDARD_PHASES.includes(tk.phase))
          .forEach((tk, tIdx) => {
            const isJ = (tk.taskOrMilestone || tk.type) === 'jalon';
            const c = `${isJ ? 'J' : 'T'}.X.${tIdx + 1}`;
            codeMap.set(tk.id, c);
            projectTaskOptions.push({ id: tk.id, code: c, name: tk.name });
          });

        rawTasks.forEach(tk => {
          const effectiveStatus = computeEffectiveStatus(tk, todayISO);
          list.push({
            task: tk,
            projId: proj.id,
            projName: proj.name,
            axeId: axe.id,
            axeName: axe.name,
            code: codeMap.get(tk.id) || 'T.1.1',
            effectiveStatus,
            projectTaskOptions
          });
        });
      });
    });

    return list;
  }, [filteredAxes, filterProjectId, todayISO]);

  const togglePhaseCollapse = (key: string) => {
    setCollapsedPhases(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const phasesToDisplay =
    filterPhase === 'ALL'
      ? STANDARD_PHASES
      : STANDARD_PHASES.filter(ph => ph === filterPhase);

  return (
    <div className="space-y-4 pb-12 font-sans animate-in fade-in duration-300">
      {/* 5 Synchronized Filter Dropdowns */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {/* 1. Axe Stratégique */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <Filter className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="block text-[8px] font-extrabold uppercase text-slate-400 leading-none mb-0.5">
                {isEN ? '1. Strategic Axis' : '1. Axe Stratégique'}
              </label>
              <select
                value={filterAxeId}
                onChange={e => {
                  setFilterAxeId(e.target.value);
                  setFilterProjectId('ALL');
                }}
                className="w-full bg-transparent text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate cursor-pointer"
              >
                <option value="ALL">{isEN ? `All axes (${axes.length})` : `Tous les axes (${axes.length})`}</option>
                {axes.map(ax => (
                  <option key={ax.id} value={ax.id}>{ax.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Projet Opérationnel */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <Briefcase className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="block text-[8px] font-extrabold uppercase text-slate-400 leading-none mb-0.5">
                {isEN ? '2. Operational Project' : '2. Projet Opérationnel'}
              </label>
              <select
                value={filterProjectId}
                onChange={e => setFilterProjectId(e.target.value)}
                className="w-full bg-transparent text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate cursor-pointer"
              >
                <option value="ALL">{isEN ? `All projects (${availableProjects.length})` : `Tous les projets (${availableProjects.length})`}</option>
                {availableProjects.map(pr => (
                  <option key={pr.id} value={pr.id}>{pr.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Phase */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <Layers className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="block text-[8px] font-extrabold uppercase text-slate-400 leading-none mb-0.5">
                {isEN ? '3. Phase' : '3. Phase'}
              </label>
              <select
                value={filterPhase}
                onChange={e => setFilterPhase(e.target.value)}
                className="w-full bg-transparent text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate cursor-pointer"
              >
                <option value="ALL">{isEN ? 'All phases (5)' : 'Toutes les phases (5)'}</option>
                {STANDARD_PHASES.map((ph, idx) => (
                  <option key={ph} value={ph}>P{idx + 1}: {getTranslatedPhase(ph, language)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Responsable / RACI */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <UserCheck className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="block text-[8px] font-extrabold uppercase text-slate-400 leading-none mb-0.5">
                {isEN ? '4. Lead / RACI' : '4. Responsable'}
              </label>
              <select
                value={filterAssignee}
                onChange={e => setFilterAssignee(e.target.value)}
                className="w-full bg-transparent text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate cursor-pointer"
              >
                <option value="ALL">{isEN ? `All leads (${allAssignees.length})` : `Tous responsables (${allAssignees.length})`}</option>
                {allAssignees.map(resp => (
                  <option key={resp} value={resp}>{resp}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Statut Effectif */}
          <div className="col-span-2 sm:col-span-1 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="block text-[8px] font-extrabold uppercase text-slate-400 leading-none mb-0.5">
                {isEN ? '5. Status' : '5. Statut'}
              </label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full bg-transparent text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate cursor-pointer"
              >
                <option value="ALL">{isEN ? 'All statuses' : 'Tous statuts'}</option>
                <option value="À faire">{isEN ? 'To Do' : 'À Faire'}</option>
                <option value="En cours">{isEN ? 'In Progress' : 'En Cours'}</option>
                <option value="Bloqué">{isEN ? 'Blocked' : 'Bloqué'}</option>
                <option value="Terminé">{isEN ? 'Completed / Treated' : 'Terminé / Traité'}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-auto max-h-[75vh] sm:max-h-[calc(100vh-185px)] relative">
          <table className="w-full text-left text-xs whitespace-nowrap border-separate border-spacing-0" style={{ minWidth: '3800px' }}>
            <thead className="bg-[#c2410c] text-white shadow-md sticky top-0 z-40">
              <tr className="bg-[#c2410c] text-white">
                {/* 1. TYPE (Locked Col 1) */}
                <th
                  rowSpan={2}
                  style={{ position: 'sticky', top: 0, left: 0 }}
                  className="sticky top-0 left-0 z-50 bg-[#c2410c] px-2 py-3 border-b-2 border-orange-200 border-r border-orange-700 text-center text-[10px] uppercase w-[48px] min-w-[48px] max-w-[48px]"
                >
                  {isEN ? 'TYPE' : 'TYPE'}
                </th>
                {/* 2. ACTIVITÉ / TÂCHE (Locked Col 2) */}
                <th
                  rowSpan={2}
                  style={{ position: 'sticky', top: 0, left: 48 }}
                  className="sticky top-0 left-[48px] z-50 bg-[#c2410c] px-3 py-3 border-b-2 border-orange-200 border-r-2 border-orange-300 text-left text-[10px] uppercase w-[116px] min-w-[116px] max-w-[116px] sm:w-[136px] sm:min-w-[136px] sm:max-w-[136px] shadow-[3px_0_6px_rgba(0,0,0,0.28)]"
                >
                  {isEN ? 'ACTIVITY / TASK' : 'ACTIVITÉ / TÂCHE'}
                </th>
                {/* NEW 1: Livrable */}
                <th rowSpan={2} className="px-3 py-3 border-b-2 border-orange-200 border-r border-orange-700 text-left text-[10px] uppercase w-32 min-w-[128px]">
                  {isEN ? 'DELIVERABLE' : 'LIVRABLE'}
                </th>
                {/* NEW 2: Bailleur / Financement */}
                <th rowSpan={2} className="px-3 py-3 border-b-2 border-orange-200 border-r border-orange-700 text-left text-[10px] uppercase w-36 min-w-[140px]">
                  {isEN ? 'DONOR / FUNDING' : 'BAILLEUR / FINANCEMENT'}
                </th>
                {/* NEW 3: Budget */}
                <th rowSpan={2} className="px-3 py-3 border-b-2 border-orange-200 border-r border-orange-700 text-right text-[10px] uppercase w-28 min-w-[110px]">
                  BUDGET ({currency})
                </th>
                {/* NEW 6: Déb. Prév */}
                <th rowSpan={2} className="px-2 py-3 border-b-2 border-orange-200 border-r border-orange-700 text-center text-[10px] uppercase w-28 min-w-[110px]">
                  {isEN ? 'PLAN. START' : 'DÉB. PRÉV'}
                </th>
                {/* NEW 7: Fin Prév */}
                <th rowSpan={2} className="px-2 py-3 border-b-2 border-orange-200 border-r border-orange-700 text-center text-[10px] uppercase w-28 min-w-[110px]">
                  {isEN ? 'PLAN. END' : 'FIN PRÉV'}
                </th>
                {/* NEW 8: Date de décaissement */}
                <th rowSpan={2} className="px-2 py-3 border-b-2 border-orange-200 border-r border-orange-700 text-center text-[10px] uppercase w-28 min-w-[112px]">
                  {isEN ? 'DISBURSEMENT DATE' : 'DATE DE DÉCAISSEMENT'}
                </th>
                {/* NEW 9: Décaissement (réduit) */}
                <th rowSpan={2} className="px-2 py-3 border-b-2 border-orange-200 border-r border-orange-700 text-right text-[10px] uppercase w-24 min-w-[96px] max-w-[96px]">
                  {isEN ? `DISBURSEMENT (${currency})` : `DÉCAISSEMENT (${currency})`}
                </th>
                {/* 2.5. LIBELLÉ DU RISQUE */}
                <th rowSpan={2} className="px-3 py-3 border-b-2 border-orange-200 border-r border-orange-700 text-center text-[10px] uppercase w-48 min-w-[180px] max-w-[180px]">
                  {isEN ? 'RISK DESCRIPTION' : 'LIBELLÉ DU RISQUE'}
                </th>
                {/* 3. RESPONSABLES / RACI */}
                <th rowSpan={2} className="px-3 py-3 border-b-2 border-orange-200 border-r border-orange-700 text-center text-[10px] uppercase w-36">
                  {isEN ? 'LEAD / RACI' : 'RESPONSABLES / RACI'}
                </th>

                {/* Groupe IDENTIFICATION */}
                <th colSpan={2} className="px-2 py-1.5 border-b border-orange-700 border-r border-orange-700 text-center bg-orange-800 text-[10px] uppercase text-orange-100 font-bold">
                  {isEN ? 'IDENTIFICATION' : 'IDENTIFICATION'}
                </th>

                {/* 6. CATÉGORIE */}
                <th rowSpan={2} className="px-3 py-3 border-b-2 border-orange-200 border-r border-orange-700 text-center text-[10px] uppercase w-32">
                  {isEN ? 'CATEGORY' : 'CATÉGORIE'}
                </th>
                {/* 7. EVALUATION PESTEL */}
                <th rowSpan={2} className="px-2 py-3 border-b-2 border-orange-200 border-r border-orange-700 text-center text-[10px] uppercase w-28">
                  {isEN ? 'PESTEL RATING' : 'EVALUATION PESTEL'}
                </th>
                {/* 8. PROBABILITÉ */}
                <th rowSpan={2} className="px-2 py-3 border-b-2 border-orange-200 border-r border-orange-700 text-center text-[10px] uppercase w-28">
                  {isEN ? 'PROBABILITY' : 'PROBABILITÉ'}
                </th>
                {/* 9. GRAVITÉ / IMPACT */}
                <th rowSpan={2} className="px-2 py-3 border-b-2 border-orange-200 border-r border-orange-700 text-center text-[10px] uppercase w-28">
                  {isEN ? 'SEVERITY / IMPACT' : 'GRAVITÉ / IMPACT'}
                </th>
                {/* 10. CRITICITÉ */}
                <th rowSpan={2} className="px-2 py-3 border-b-2 border-orange-200 border-r border-orange-700 text-center text-[10px] uppercase w-28">
                  {isEN ? 'CRITICALITY' : 'CRITICITÉ'}
                </th>
                {/* 11. CONSÉQUENCE SI AVÉRÉ */}
                <th rowSpan={2} className="px-3 py-3 border-b-2 border-orange-200 border-r border-orange-700 text-center text-[10px] uppercase w-36">
                  {isEN ? 'CONSEQUENCE IF REALIZED' : 'CONSÉQUENCE SI AVÉRÉ'}
                </th>
                {/* 12. FAIBLESSE */}
                <th rowSpan={2} className="px-3 py-3 border-b-2 border-orange-200 border-r border-orange-700 text-center text-[10px] uppercase w-32 min-w-[128px] max-w-[128px]">
                  {isEN ? 'WEAKNESS' : 'FAIBLESSE'}
                </th>
                {/* 13. TENDANCE */}
                <th rowSpan={2} className="px-2 py-3 border-b-2 border-orange-200 border-r border-orange-700 text-center text-[10px] uppercase w-24">
                  {isEN ? 'TREND' : 'TENDANCE'}
                </th>
                {/* 14. ACTION PRÉVENTIVE */}
                <th rowSpan={2} className="px-3 py-3 border-b-2 border-orange-200 border-r border-orange-700 text-center text-[10px] uppercase w-48 min-w-[192px] max-w-[192px]">
                  {isEN ? 'PREVENTIVE ACTION' : 'ACTION PRÉVENTIVE'}
                </th>
                {/* 15. ACTION CORRECTIVE */}
                <th rowSpan={2} className="px-3 py-3 border-b-2 border-orange-200 border-r border-orange-700 text-center text-[10px] uppercase w-48 min-w-[192px] max-w-[192px]">
                  {isEN ? 'CORRECTIVE ACTION' : 'ACTION CORRECTIVE'}
                </th>
                {/* 16. STATUT */}
                <th rowSpan={2} className="px-2 py-3 border-b-2 border-orange-200 border-r border-orange-700 text-center text-[10px] uppercase w-28">
                  {isEN ? 'STATUS' : 'STATUT'}
                </th>

                {/* Groupe RÉSOLUTION */}
                <th colSpan={2} className="px-2 py-1.5 border-b border-orange-700 border-r border-orange-700 text-center bg-amber-800 text-[10px] uppercase text-amber-100 font-bold">
                  {isEN ? 'RESOLUTION' : 'RÉSOLUTION'}
                </th>

                {/* 19. COMMENTAIRE */}
                <th rowSpan={2} className="px-3 py-3 border-b-2 border-orange-200 text-center text-[10px] uppercase w-48 min-w-[192px] max-w-[192px]">
                  {isEN ? 'COMMENT' : 'COMMENTAIRE'}
                </th>
              </tr>
              <tr className="bg-orange-800 text-[9px] text-orange-100">
                <th className="px-2 py-1.5 border-b-2 border-orange-200 border-r border-orange-700 text-center w-28">{isEN ? 'ID DATE' : "DATE D'ID."}</th>
                <th className="px-2 py-1.5 border-b-2 border-orange-200 border-r border-orange-700 text-center w-32 min-w-[128px] max-w-[128px]">{isEN ? 'DECLARED BY' : 'DÉCLARÉ PAR'}</th>

                <th className="px-2 py-1.5 border-b-2 border-orange-200 border-r border-orange-700 text-center w-28">{isEN ? 'RESOL. DATE' : 'DATE DE RÉSOL.'}</th>
                <th className="px-2 py-1.5 border-b-2 border-orange-200 border-r border-orange-700 text-center w-48 min-w-[192px] max-w-[192px]">{isEN ? 'FINAL RESOLUTION' : 'RÉSOLUTION FINALE'}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {phasesToDisplay.map((phaseName, pIdx) => {
                const collapseKey = `PHASE__${phaseName}`;
                const isCollapsed = Boolean(collapsedPhases[collapseKey]);

                // Filter & Sort tasks within this phase chronologically (startDate then endDate)
                const phaseTasks = allEnrichedTasks
                  .filter(item => {
                    const tk = item.task;
                    const matchPhase = tk.phase === phaseName;
                    const matchAssignee =
                      filterAssignee === 'ALL' ||
                      (tk.assignee || '').includes(filterAssignee);
                    const matchStatus =
                      filterStatus === 'ALL' || item.effectiveStatus === filterStatus;
                    return matchPhase && matchAssignee && matchStatus;
                  })
                  .sort((a, b) => {
                    const d1 = a.task.startDate || '9999-12-31';
                    const d2 = b.task.startDate || '9999-12-31';
                    if (d1 !== d2) return d1.localeCompare(d2);
                    const e1 = a.task.endDate || '9999-12-31';
                    const e2 = b.task.endDate || '9999-12-31';
                    return e1.localeCompare(e2);
                  });

                // Phase sub-totals by status
                const treatedCount = phaseTasks.filter(item => item.effectiveStatus === 'Terminé' || item.task.riskStatus === 'traité').length;
                const inProgressCount = phaseTasks.filter(item => item.effectiveStatus === 'En cours' || item.task.riskStatus === 'en traitement').length;
                const blockedCount = phaseTasks.filter(item => item.effectiveStatus === 'Bloqué' || item.task.riskStatus === 'bloqué').length;
                const todoCount = phaseTasks.length - treatedCount - inProgressCount - blockedCount;

                return (
                  <React.Fragment key={collapseKey}>
                    {/* Collapsible Phase Header Row */}
                    <tr className="bg-orange-100 dark:bg-slate-800 border-y border-orange-300 dark:border-orange-800">
                      <td colSpan={27} className="p-0">
                        <div className="px-3 py-1.5 flex items-center justify-between sticky left-2 w-max gap-6">
                          <button
                            type="button"
                            onClick={() => togglePhaseCollapse(collapseKey)}
                            className="flex items-center gap-2 cursor-pointer select-none text-left"
                          >
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                            )}
                            <span className="px-1.5 py-0.5 rounded bg-orange-600 text-white font-mono text-[8px] font-black uppercase">
                              PHASE {pIdx + 1}
                            </span>
                            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-orange-900 dark:text-orange-300">
                              {getTranslatedPhase(phaseName, language)}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                              ({phaseTasks.length} {phaseTasks.length > 1 ? (isEN ? 'items' : 'éléments') : (isEN ? 'item' : 'élément')})
                            </span>
                          </button>

                          {/* Phase Sub-totals */}
                          <div className="flex items-center gap-3 text-[9px] font-extrabold">
                            <span className="text-emerald-700 dark:text-emerald-400">{isEN ? 'Completed / Treated:' : 'Terminé / Traité:'} {treatedCount}</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-orange-700 dark:text-orange-400">{isEN ? 'In progress:' : 'En cours:'} {inProgressCount}</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-rose-700 dark:text-rose-400">{isEN ? 'Blocked:' : 'Bloqué:'} {blockedCount}</span>
                            {todoCount > 0 && (
                              <>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span className="text-slate-600 dark:text-slate-400">{isEN ? 'To do:' : 'À faire:'} {todoCount}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {!isCollapsed && (
                      phaseTasks.length === 0 ? (
                        <tr>
                          <td colSpan={27} className="px-6 py-3 text-slate-400 italic text-[11px]">
                            {isEN ? `No item recorded in phase "${getTranslatedPhase(phaseName, language)}".` : `Aucun élément enregistré dans la phase « ${phaseName} ».`}
                          </td>
                        </tr>
                      ) : (
                        phaseTasks.map(item => {
                          const t = item.task;
                          const isJalon = (t.taskOrMilestone || t.type) === 'jalon';
                          const taskCode = item.code;
                          const rStat = t.riskStatus || (item.effectiveStatus === 'Terminé' ? 'traité' : item.effectiveStatus === 'En cours' ? 'en traitement' : item.effectiveStatus === 'Bloqué' ? 'bloqué' : 'nouveau');
                          const rawFaiblesse = (t.faiblesse || 'ressource humaine').toLowerCase().trim();
                          const currentFaiblesse = RISK_DROPDOWNS.faiblesse.includes(rawFaiblesse)
                            ? rawFaiblesse
                            : rawFaiblesse.includes('materiel') || rawFaiblesse.includes('matériel')
                            ? 'ressource materielle'
                            : rawFaiblesse.includes('financ')
                            ? 'ressource financiere'
                            : 'ressource humaine';

                          const displayedBudget = Math.round(
                            convertFromFCFA(t.budget || 0, currency)
                          );

                          const displayedDisbursement = Math.round(
                            convertFromFCFA(t.montantDecaissement || 0, currency)
                          );

                          // Logique Management des Risques ISO 31000 :
                          // Évaluation PESTEL notée sur 5 (1/5 à 5/5), remplissage automatique de Probabilité & Gravité,
                          // et calcul automatique de la Criticité en fonction de Probabilité × Gravité / Impact
                          const currentPestelScore = parsePestelScore(t.evaluationPestel);
                          const currentPestelValue = `${currentPestelScore}/5`;
                          const autoRisk = deriveAutoRiskParameters(t, currentPestelScore, item.effectiveStatus);
                          const currentProb = autoRisk.probabilite;
                          const currentGrav = autoRisk.gravite;
                          const computedCrit = computeCriticiteFromProbAndGrav(currentProb, currentGrav);
                          const probNum = getProbNumericLevel(currentProb);
                          const gravNum = getGravNumericLevel(currentGrav);

                          const critBadgeClass =
                            computedCrit === 'tres critique'
                              ? 'bg-red-700 text-white border-red-800'
                              : computedCrit === 'critique'
                              ? 'bg-rose-500 text-white border-rose-600'
                              : computedCrit === 'modéré'
                              ? 'bg-amber-400 text-slate-950 border-amber-500'
                              : 'bg-emerald-500 text-white border-emerald-600';

                          return (
                            <tr key={t.id} className="hover:bg-orange-50/40 dark:hover:bg-slate-800/50 transition-colors">
                              {/* 1. TYPE (Sticky Left 0) */}
                              <td
                                style={{ position: 'sticky', left: 0 }}
                                className="p-1 border-r border-slate-200 dark:border-slate-800 sticky left-0 z-20 bg-white dark:bg-slate-900 w-[48px] min-w-[48px] max-w-[48px] align-top text-center"
                              >
                                <span
                                  className={`w-full text-center font-mono text-[9px] font-black px-1 py-1 rounded leading-tight block select-none ${
                                    isJalon
                                      ? 'bg-amber-400 text-slate-950'
                                      : 'bg-orange-600 text-white'
                                  }`}
                                >
                                  {taskCode}
                                </span>
                              </td>

                              {/* 2. ACTIVITÉ / TÂCHE (Sticky Left 48px) */}
                              <td
                                style={{ position: 'sticky', left: 48 }}
                                className="p-1 border-r-2 border-orange-500 dark:border-orange-400 border-b border-slate-200 dark:border-slate-800 font-extrabold text-slate-900 dark:text-white text-[10px] leading-tight sticky left-[48px] z-20 bg-white dark:bg-slate-900 w-[116px] min-w-[116px] max-w-[116px] sm:w-[136px] sm:min-w-[136px] sm:max-w-[136px] align-top shadow-[3px_0_6px_rgba(234,88,12,0.18)]"
                              >
                                <div className="w-full p-1 font-extrabold text-[10px] leading-snug text-slate-900 dark:text-white whitespace-normal break-words">
                                  {t.name || t.activity || '—'}
                                </div>
                              </td>

                              {/* NEW 1: Livrable (Read-only) */}
                              <td className="p-1 border-r border-slate-100 dark:border-slate-800 text-[10px] w-32 min-w-[128px] align-top">
                                <div className="w-full p-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 whitespace-normal break-words leading-snug select-none">
                                  {t.livrable || '—'}
                                </div>
                              </td>

                              {/* NEW 2: Bailleur / Financement (Read-only) */}
                              <td className="p-1 border-r border-slate-100 dark:border-slate-800 text-[10px] w-36 min-w-[140px] align-top">
                                <div className="w-full p-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 whitespace-normal break-words leading-snug select-none">
                                  {t.bailleur || '—'}
                                </div>
                              </td>

                              {/* NEW 3: Budget (Read-only) */}
                              <td className="p-1 border-r border-slate-100 dark:border-slate-800 text-[10px] w-28 min-w-[110px] align-top">
                                <div className="w-full p-1 text-right font-mono text-[10px] font-bold text-slate-900 dark:text-white select-none">
                                  {displayedBudget.toLocaleString()}
                                </div>
                              </td>

                              {/* NEW 6: Déb. Prév (Read-only) */}
                              <td className="p-1 border-r border-slate-100 dark:border-slate-800 text-[10px] w-28 min-w-[110px] align-top">
                                <div className="p-1 text-center font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300 select-none">
                                  {t.startDate || '—'}
                                </div>
                              </td>

                              {/* NEW 7: Fin Prév (Read-only) */}
                              <td className="p-1 border-r border-slate-100 dark:border-slate-800 text-[10px] w-28 min-w-[110px] align-top">
                                <div className="p-1 text-center font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300 select-none">
                                  {t.endDate || '—'}
                                </div>
                              </td>

                              {/* NEW 8: Date de décaissement */}
                              <td className="p-1 border-r border-slate-100 dark:border-slate-800 text-[10px] w-28 min-w-[112px] align-top">
                                <input
                                  type="date"
                                  value={t.dateDecaissement || ''}
                                  onChange={e =>
                                    onUpdateTask &&
                                    onUpdateTask(item.projId, t.id, { dateDecaissement: e.target.value })
                                  }
                                  className="w-full bg-transparent p-1 text-center text-[10px] font-semibold text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 rounded border border-transparent focus:border-orange-400 outline-none"
                                />
                              </td>

                              {/* NEW 9: Décaissement (réduit) */}
                              <td className="p-1 border-r border-slate-100 dark:border-slate-800 text-[10px] w-24 min-w-[96px] max-w-[96px] align-top">
                                <input
                                  type="number"
                                  value={displayedDisbursement}
                                  onChange={e =>
                                    onUpdateTask &&
                                    onUpdateTask(item.projId, t.id, {
                                      montantDecaissement: convertToFCFA(Number(e.target.value), currency)
                                    })
                                  }
                                  className="w-full bg-transparent p-1 text-right font-mono text-[10px] font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 rounded border border-transparent focus:border-orange-400 outline-none"
                                />
                              </td>

                              {/* 2.5 LIBELLÉ DU RISQUE */}
                              <td className="p-1 border-r border-slate-100 dark:border-slate-800 text-[10px] w-48 min-w-[180px] max-w-[180px] align-top">
                                <textarea
                                  rows={4}
                                  value={t.libelleRisque || ''}
                                  onChange={e => onUpdateTask && onUpdateTask(item.projId, t.id, { libelleRisque: e.target.value })}
                                  placeholder={isEN ? 'Risk description...' : 'Libellé du risque...'}
                                  className="w-full bg-transparent p-1 text-[10px] font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 rounded border border-transparent focus:border-orange-400 outline-none resize-none leading-snug whitespace-normal break-words"
                                />
                              </td>

                              {/* 3. RESPONSABLES / RACI */}
                              <td className="p-1 border-r border-slate-100 dark:border-slate-800 text-[10px] w-36 min-w-[144px] max-w-[144px] align-top">
                                <div className="w-full p-1 text-[10px] font-bold text-slate-800 dark:text-slate-200 whitespace-normal break-words leading-snug">
                                  {t.assignee || '—'}
                                </div>
                              </td>

                              {/* 4. DATE D'ID. */}
                              <td className="p-1 border-r border-slate-100 dark:border-slate-800 text-[10px] align-top">
                                <input
                                  type="date"
                                  value={t.dateIdentification || t.startDate || ''}
                                  onChange={e => onUpdateTask && onUpdateTask(item.projId, t.id, { dateIdentification: e.target.value })}
                                  className="w-full bg-transparent p-1 text-center text-[10px] text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 rounded border border-transparent focus:border-orange-400 outline-none"
                                />
                              </td>

                              {/* 5. DÉCLARÉ PAR */}
                              <td className="p-1 border-r border-slate-100 dark:border-slate-800 text-[10px] w-32 min-w-[128px] max-w-[128px] align-top">
                                <textarea
                                  rows={4}
                                  value={t.declarePar || ''}
                                  onChange={e => onUpdateTask && onUpdateTask(item.projId, t.id, { declarePar: e.target.value })}
                                  placeholder={isEN ? 'Declared by...' : 'Déclaré par...'}
                                  className="w-full bg-transparent p-1 text-[10px] text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 rounded border border-transparent focus:border-orange-400 outline-none resize-none leading-snug whitespace-normal break-words"
                                />
                              </td>

                              {/* 6. CATÉGORIE */}
                              <td className="p-1 text-center border-r border-slate-100 dark:border-slate-800 align-top">
                                <select
                                  value={t.categorie || t.nature || 'technologie / technique'}
                                  onChange={e => onUpdateTask && onUpdateTask(item.projId, t.id, { categorie: e.target.value, nature: e.target.value })}
                                  className="bg-transparent p-1 text-center text-[10px] capitalize rounded border border-transparent focus:border-orange-400 outline-none cursor-pointer font-medium"
                                >
                                  {RISK_DROPDOWNS.nature.map(n => (
                                    <option key={n} value={n}>{getTranslatedDropdownLabel(n, language)}</option>
                                  ))}
                                </select>
                              </td>

                              {/* 7. EVALUATION PESTEL (Choix 1 à 5 notés sur 5 -> remplit auto Probabilité, Gravité et Criticité) */}
                              <td className="p-1 text-center border-r border-slate-100 dark:border-slate-800 text-[10px] align-top">
                                <select
                                  value={currentPestelValue}
                                  onChange={e => {
                                    const nextPestel = e.target.value;
                                    const nextScore = parsePestelScore(nextPestel);
                                    const taskWithoutManualOverride: Task = {
                                      ...t,
                                      probabilite: undefined,
                                      gravite: undefined,
                                      tendance: undefined
                                    };
                                    const autoNext = deriveAutoRiskParameters(
                                      taskWithoutManualOverride,
                                      nextScore,
                                      item.effectiveStatus
                                    );
                                    onUpdateTask &&
                                      onUpdateTask(item.projId, t.id, {
                                        evaluationPestel: nextPestel,
                                        probabilite: autoNext.probabilite,
                                        gravite: autoNext.gravite,
                                        criticite: autoNext.criticite,
                                        tendance: autoNext.tendance
                                      });
                                  }}
                                  className="bg-orange-50/70 dark:bg-slate-800 px-2 py-1 text-center font-mono font-black text-[10px] text-orange-800 dark:text-orange-300 rounded border border-orange-200 dark:border-orange-800 focus:border-orange-500 outline-none cursor-pointer"
                                >
                                  {RISK_DROPDOWNS.pestelScores.map(ps => (
                                    <option key={ps} value={ps}>{ps}</option>
                                  ))}
                                </select>
                              </td>

                              {/* 8. PROBABILITÉ (Rempli automatiquement, met à jour la Criticité) */}
                              <td className="p-1 text-center border-r border-slate-100 dark:border-slate-800 align-top">
                                <select
                                  value={currentProb}
                                  onChange={e => {
                                    const nextProb = e.target.value;
                                    const nextCrit = computeCriticiteFromProbAndGrav(nextProb, currentGrav);
                                    onUpdateTask &&
                                      onUpdateTask(item.projId, t.id, {
                                        probabilite: nextProb as any,
                                        gravite: currentGrav as any,
                                        criticite: nextCrit
                                      });
                                  }}
                                  className="bg-transparent p-1 text-center text-[10px] font-semibold capitalize rounded border border-transparent focus:border-orange-400 outline-none cursor-pointer"
                                >
                                  {RISK_DROPDOWNS.probabilite.map(p => (
                                    <option key={p} value={p}>{getTranslatedDropdownLabel(p, language)}</option>
                                  ))}
                                </select>
                              </td>

                              {/* 9. GRAVITÉ / IMPACT (Rempli automatiquement, met à jour la Criticité) */}
                              <td className="p-1 text-center border-r border-slate-100 dark:border-slate-800 align-top">
                                <select
                                  value={currentGrav}
                                  onChange={e => {
                                    const nextGrav = e.target.value;
                                    const nextCrit = computeCriticiteFromProbAndGrav(currentProb, nextGrav);
                                    onUpdateTask &&
                                      onUpdateTask(item.projId, t.id, {
                                        probabilite: currentProb as any,
                                        gravite: nextGrav as any,
                                        criticite: nextCrit
                                      });
                                  }}
                                  className="bg-transparent p-1 text-center text-[10px] font-semibold capitalize rounded border border-transparent focus:border-orange-400 outline-none cursor-pointer"
                                >
                                  {RISK_DROPDOWNS.gravite.map(g => (
                                    <option key={g} value={g}>{getTranslatedDropdownLabel(g, language)}</option>
                                  ))}
                                </select>
                              </td>

                              {/* 10. CRITICITÉ (Calculée automatiquement en fonction de PROBABILITÉ × GRAVITÉ / IMPACT) */}
                              <td className="p-1 text-center border-r border-slate-100 dark:border-slate-800 align-top">
                                <div
                                  title={`${isEN ? 'Auto-calculated (Probability × Severity):' : 'Calcul automatique (Probabilité × Gravité) :'} ${probNum} × ${gravNum} = ${probNum * gravNum}/16`}
                                  className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md border text-[9px] font-black uppercase tracking-wider select-none shadow-2xs ${critBadgeClass}`}
                                >
                                  <span>{getTranslatedDropdownLabel(computedCrit, language)}</span>
                                  <span className="opacity-85 font-mono text-[8px]">({probNum * gravNum})</span>
                                </div>
                              </td>

                              {/* 11. CONSÉQUENCE SI AVÉRÉ */}
                              <td className="p-1 text-center border-r border-slate-100 dark:border-slate-800 align-top">
                                <select
                                  value={t.consequence || 'délai'}
                                  onChange={e => onUpdateTask && onUpdateTask(item.projId, t.id, { consequence: e.target.value as any })}
                                  className="bg-transparent p-1 text-center text-[10px] font-bold uppercase rounded border border-transparent focus:border-orange-400 outline-none cursor-pointer"
                                >
                                  {RISK_DROPDOWNS.consequence.map(c => (
                                    <option key={c} value={c}>{getTranslatedDropdownLabel(c, language)}</option>
                                  ))}
                                </select>
                              </td>

                              {/* 12. FAIBLESSE */}
                              <td className="p-1 text-center border-r border-slate-100 dark:border-slate-800 text-[10px] w-32 min-w-[128px] max-w-[128px] align-top">
                                <select
                                  value={currentFaiblesse}
                                  onChange={e => onUpdateTask && onUpdateTask(item.projId, t.id, { faiblesse: e.target.value })}
                                  className="w-full bg-transparent p-1 text-center text-[10px] font-semibold rounded border border-transparent focus:border-orange-400 outline-none cursor-pointer"
                                >
                                  {RISK_DROPDOWNS.faiblesse.map(fb => (
                                    <option key={fb} value={fb}>{getTranslatedDropdownLabel(fb, language)}</option>
                                  ))}
                                </select>
                              </td>

                              {/* 13. TENDANCE */}
                              <td className="p-1 text-center border-r border-slate-100 dark:border-slate-800 align-top">
                                <select
                                  value={t.tendance || 'stable'}
                                  onChange={e => onUpdateTask && onUpdateTask(item.projId, t.id, { tendance: e.target.value as any })}
                                  className="bg-transparent p-1 text-center text-[10px] font-bold rounded border border-transparent focus:border-orange-400 outline-none cursor-pointer"
                                >
                                  {RISK_DROPDOWNS.tendance.map(tnd => (
                                    <option key={tnd} value={tnd}>{getTranslatedDropdownLabel(tnd, language)}</option>
                                  ))}
                                </select>
                              </td>

                              {/* 14. ACTION PRÉVENTIVE */}
                              <td className="p-1 border-r border-slate-100 dark:border-slate-800 text-[10px] w-48 min-w-[192px] max-w-[192px] align-top">
                                <textarea
                                  rows={4}
                                  value={t.actionPreventive || ''}
                                  onChange={e => onUpdateTask && onUpdateTask(item.projId, t.id, { actionPreventive: e.target.value })}
                                  placeholder={isEN ? 'Preventive action...' : 'Action préventive...'}
                                  className="w-full bg-transparent p-1 text-[10px] text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 rounded border border-transparent focus:border-orange-400 outline-none resize-none leading-snug whitespace-normal break-words"
                                />
                              </td>

                              {/* 15. ACTION CORRECTIVE */}
                              <td className="p-1 border-r border-slate-100 dark:border-slate-800 text-[10px] w-48 min-w-[192px] max-w-[192px] align-top">
                                <textarea
                                  rows={4}
                                  value={t.actionCorrective || ''}
                                  onChange={e => onUpdateTask && onUpdateTask(item.projId, t.id, { actionCorrective: e.target.value })}
                                  placeholder={isEN ? 'Corrective action...' : 'Action corrective...'}
                                  className="w-full bg-transparent p-1 text-[10px] text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 rounded border border-transparent focus:border-orange-400 outline-none resize-none leading-snug whitespace-normal break-words"
                                />
                              </td>

                              {/* 16. STATUT */}
                              <td className="p-1 text-center border-r border-slate-100 dark:border-slate-800 align-top">
                                <select
                                  value={rStat}
                                  onChange={e => {
                                    const nextRiskStatus = e.target.value;
                                    const mappedStatus: Task['status'] =
                                      nextRiskStatus === 'traité'
                                        ? 'Terminé'
                                        : nextRiskStatus === 'bloqué'
                                        ? 'Bloqué'
                                        : nextRiskStatus === 'en traitement'
                                        ? 'En cours'
                                        : 'À faire';
                                    onUpdateTask &&
                                      onUpdateTask(item.projId, t.id, {
                                        riskStatus: nextRiskStatus,
                                        status: mappedStatus,
                                        manualBlocked: nextRiskStatus === 'bloqué',
                                        ...(nextRiskStatus === 'traité'
                                          ? {
                                              actualStartDate: t.actualStartDate || t.dateIdentification || t.startDate || todayISO,
                                              actualEndDate: t.dateResolution || todayISO,
                                              dateResolution: t.dateResolution || todayISO
                                            }
                                          : nextRiskStatus === 'en traitement'
                                          ? {
                                              actualStartDate: t.actualStartDate || t.dateIdentification || t.startDate || todayISO,
                                              actualEndDate: ''
                                            }
                                          : nextRiskStatus === 'bloqué'
                                          ? { actualEndDate: '' }
                                          : { actualStartDate: '', actualEndDate: '' })
                                      });
                                  }}
                                  className="bg-transparent p-1 text-center font-black text-[9px] uppercase tracking-wider rounded border border-transparent focus:border-orange-400 outline-none cursor-pointer"
                                >
                                  {RISK_DROPDOWNS.riskStatus.map(s => (
                                    <option key={s} value={s}>{getTranslatedDropdownLabel(s, language)}</option>
                                  ))}
                                </select>
                              </td>

                              {/* 17. DATE DE RÉSOL. */}
                              <td className="p-1 border-r border-slate-100 dark:border-slate-800 text-[10px] align-top">
                                <input
                                  type="date"
                                  value={t.dateResolution || ''}
                                  onChange={e => {
                                    const nextDate = e.target.value;
                                    onUpdateTask &&
                                      onUpdateTask(item.projId, t.id, {
                                        dateResolution: nextDate,
                                        actualEndDate: nextDate,
                                        ...(nextDate
                                          ? {
                                              riskStatus: 'traité',
                                              status: 'Terminé',
                                              manualBlocked: false,
                                              actualStartDate: t.actualStartDate || t.dateIdentification || t.startDate || nextDate
                                            }
                                          : {})
                                      });
                                  }}
                                  className="w-full bg-transparent p-1 text-center text-[10px] text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 rounded border border-transparent focus:border-orange-400 outline-none"
                                />
                              </td>

                              {/* 18. RÉSOLUTION FINALE */}
                              <td className="p-1 border-r border-slate-100 dark:border-slate-800 text-[10px] w-48 min-w-[192px] max-w-[192px] align-top">
                                <textarea
                                  rows={4}
                                  value={t.resolutionFinale || ''}
                                  onChange={e => onUpdateTask && onUpdateTask(item.projId, t.id, { resolutionFinale: e.target.value })}
                                  placeholder={isEN ? 'Final resolution...' : 'Résolution finale...'}
                                  className="w-full bg-transparent p-1 text-[10px] text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 rounded border border-transparent focus:border-orange-400 outline-none resize-none leading-snug whitespace-normal break-words"
                                />
                              </td>

                              {/* 19. COMMENTAIRE */}
                              <td className="p-1 border-r border-slate-100 dark:border-slate-800 text-[10px] w-48 min-w-[192px] max-w-[192px] align-top">
                                <textarea
                                  rows={4}
                                  value={t.commentaire || ''}
                                  onChange={e => onUpdateTask && onUpdateTask(item.projId, t.id, { commentaire: e.target.value })}
                                  placeholder={isEN ? 'Comment...' : 'Commentaire...'}
                                  className="w-full bg-transparent p-1 text-[10px] text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 rounded border border-transparent focus:border-orange-400 outline-none resize-none leading-snug whitespace-normal break-words"
                                />
                              </td>
                            </tr>
                          );
                        })
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. MATRICE DES RISQUES OPÉRATIONNELS (ISO 31000 - Grille 4x4 Interactive)
// ============================================================================
export const RiskMatrixView: React.FC<RiskViewCommonProps> = ({
  dossier,
  filterAxeId,
  setFilterAxeId,
  filterProjectId,
  setFilterProjectId
}) => {
  const riskTasks = useEnrichedRiskTasks(dossier, filterAxeId, filterProjectId);
  const [selectedCell, setSelectedCell] = useState<{ prob: number; grav: number } | null>(null);

  const getProbValue = (p?: string) => {
    const val = (p || '').toLowerCase().trim();
    if (val.includes('très') || val.includes('tres')) return 4;
    if (val.includes('peu')) return 2;
    if (val.includes('improbable')) return 1;
    return 3;
  };

  const getGravValue = (g?: string) => {
    const val = (g || '').toLowerCase().trim();
    if (val.includes('catastrophique')) return 4;
    if (val.includes('grave')) return 3;
    if (val.includes('majeur')) return 2;
    return 1;
  };

  const matrixGrid = [
    // Ligne 4: Très probable
    [
      { label: 'Très probable (4)', probVal: 4, gravVal: 1, color: 'bg-amber-400 hover:bg-amber-500 text-slate-900' },
      { label: 'Très probable (4)', probVal: 4, gravVal: 2, color: 'bg-orange-500 hover:bg-orange-600 text-white' },
      { label: 'Très probable (4)', probVal: 4, gravVal: 3, color: 'bg-rose-500 hover:bg-rose-600 text-white' },
      { label: 'Très probable (4)', probVal: 4, gravVal: 4, color: 'bg-red-700 hover:bg-red-800 text-white' }
    ],
    // Ligne 3: Probable
    [
      { label: 'Probable (3)', probVal: 3, gravVal: 1, color: 'bg-emerald-400 hover:bg-emerald-500 text-slate-900' },
      { label: 'Probable (3)', probVal: 3, gravVal: 2, color: 'bg-amber-400 hover:bg-amber-500 text-slate-900' },
      { label: 'Probable (3)', probVal: 3, gravVal: 3, color: 'bg-orange-500 hover:bg-orange-600 text-white' },
      { label: 'Probable (3)', probVal: 3, gravVal: 4, color: 'bg-red-700 hover:bg-red-800 text-white' }
    ],
    // Ligne 2: Peu probable
    [
      { label: 'Peu probable (2)', probVal: 2, gravVal: 1, color: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
      { label: 'Peu probable (2)', probVal: 2, gravVal: 2, color: 'bg-emerald-400 hover:bg-emerald-500 text-slate-900' },
      { label: 'Peu probable (2)', probVal: 2, gravVal: 3, color: 'bg-amber-400 hover:bg-amber-500 text-slate-900' },
      { label: 'Peu probable (2)', probVal: 2, gravVal: 4, color: 'bg-rose-500 hover:bg-rose-600 text-white' }
    ],
    // Ligne 1: Improbable
    [
      { label: 'Improbable (1)', probVal: 1, gravVal: 1, color: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
      { label: 'Improbable (1)', probVal: 1, gravVal: 2, color: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
      { label: 'Improbable (1)', probVal: 1, gravVal: 3, color: 'bg-emerald-400 hover:bg-emerald-500 text-slate-900' },
      { label: 'Improbable (1)', probVal: 1, gravVal: 4, color: 'bg-amber-400 hover:bg-amber-500 text-slate-900' }
    ]
  ];

  const clickedRisks = selectedCell
    ? riskTasks.filter(t => getProbValue(t.probabilite) === selectedCell.prob && getGravValue(t.gravite) === selectedCell.grav)
    : [];

  return (
    <div className="space-y-6 pb-12 font-sans animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 rounded-2xl text-white shadow-md">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-widest mb-2 backdrop-blur-xs">
            <Grid className="w-3.5 h-3.5" />
            Norme ISO 31000
          </div>
          <h2 className="text-2xl font-black tracking-tight">Matrice des Risques Opérationnels</h2>
          <p className="text-xs text-orange-100 font-medium mt-1">
            Cartographie thermique 4x4 (Probabilité × Gravité) avec inspection dynamique des incidents
          </p>
        </div>
      </div>

      {/* Synchronized Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1.5">
            <Filter className="w-3 h-3" />
            1. Filtrer par Axe Stratégique
          </label>
          <select
            value={filterAxeId}
            onChange={e => {
              setFilterAxeId(e.target.value);
              setFilterProjectId('ALL');
            }}
            className="w-full p-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="ALL">Tous les axes (Vue Globale)</option>
            {(dossier.axes || []).map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1.5">
            <Filter className="w-3 h-3" />
            2. Filtrer par Projet Opérationnel
          </label>
          <select
            value={filterProjectId}
            onChange={e => setFilterProjectId(e.target.value)}
            className="w-full p-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="ALL">Tous les projets {filterAxeId !== 'ALL' ? 'de cet axe' : ''}</option>
            {(dossier.axes || [])
              .filter(a => filterAxeId === 'ALL' || a.id === filterAxeId)
              .flatMap(a => a.projects || [])
              .map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
          </select>
        </div>
      </div>

      {/* Grille Thermique + Volet d'inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Grille 4x4 */}
        <div className="lg:col-span-7 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
          <div className="text-center mb-5">
            <h3 className="font-black text-slate-800 dark:text-white text-sm">Cartographie Probabilité / Gravité</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Cliquez sur une case pour afficher la liste des incidents opérationnels correspondants</p>
          </div>

          <div className="flex">
            {/* Axe Y Label */}
            <div className="flex flex-col justify-center items-center mr-2">
              <span className="transform -rotate-90 text-[10px] font-black text-slate-400 tracking-widest uppercase w-36 text-center">
                ← PROBABILITÉ (Fréquence)
              </span>
            </div>

            {/* Conteneur Grille */}
            <div className="flex-1">
              {matrixGrid.map((row, rIdx) => (
                <div key={rIdx} className="flex gap-2 mb-2">
                  <div className="w-24 flex items-center justify-end pr-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {row[0].label.split('(')[0]}
                  </div>

                  {row.map((cell, cIdx) => {
                    const count = riskTasks.filter(t => getProbValue(t.probabilite) === cell.probVal && getGravValue(t.gravite) === cell.gravVal).length;
                    const isSelected = selectedCell && selectedCell.prob === cell.probVal && selectedCell.grav === cell.gravVal;

                    return (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => setSelectedCell({ prob: cell.probVal, grav: cell.gravVal })}
                        className={`flex-1 aspect-[4/3] rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 shadow-xs border ${cell.color} ${
                          isSelected ? 'ring-4 ring-orange-500 scale-105 shadow-md border-white dark:border-slate-900' : 'border-transparent hover:scale-102'
                        }`}
                      >
                        <span className="text-xl font-black">{count}</span>
                        <span className="text-[8px] uppercase font-black opacity-80 mt-0.5">
                          {count > 1 ? 'Risques' : 'Risque'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* Axe X Graduation */}
              <div className="flex mt-2">
                <div className="w-24" />
                <div className="flex-1 flex gap-2">
                  {['Mineur (1)', 'Majeur (2)', 'Grave (3)', 'Catastrophique (4)'].map((l, i) => (
                    <div key={i} className="flex-1 text-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {l}
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center mt-3 text-[10px] font-black text-slate-400 tracking-widest uppercase">
                GRAVITÉ (Impact) →
              </div>
            </div>
          </div>

          {/* Légende */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-center gap-4 text-[10px] font-bold">
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-emerald-500" /> Acceptable</div>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-emerald-400" /> Sous Contrôle</div>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-amber-400" /> Vigilance</div>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-orange-500" /> Alerte Critique</div>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-red-700" /> Alerte Majeure</div>
          </div>
        </div>

        {/* Volet Détail des Risques sélectionnés */}
        <div className="lg:col-span-5 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm max-h-[520px] overflow-y-auto">
          <h3 className="font-black text-slate-800 dark:text-white text-sm mb-3">Détail des Incidents de la Cellule</h3>
          {selectedCell ? (
            <div className="space-y-3">
              <div className="p-2.5 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-xl text-[11px] font-bold text-orange-900 dark:text-orange-200">
                Cellule sélectionnée : Probabilité <strong>{selectedCell.prob}/4</strong> & Gravité <strong>{selectedCell.grav}/4</strong> ({clickedRisks.length} incidents)
              </div>

              {clickedRisks.length > 0 ? (
                clickedRisks.map(r => (
                  <div key={r.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                        {r.type === 'jalon' ? 'Jalon' : 'Risque'}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        r.riskStatus === 'traité' ? 'bg-emerald-100 text-emerald-800' :
                        r.riskStatus === 'en traitement' ? 'bg-orange-100 text-orange-800' :
                        r.riskStatus === 'bloqué' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {r.riskStatus || 'nouveau'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                      {r.libelleRisque || r.name}
                    </h4>
                    {r.libelleRisque && (
                      <p className="text-[10px] text-orange-700 dark:text-orange-300 font-semibold mb-1">
                        Libellé risque : {r.libelleRisque}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-500 italic mb-2">
                      Activité / Tâche : {r.name || r.activity || '—'}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 border-t border-slate-100 dark:border-slate-700 pt-2 font-medium">
                      <div>Resp : <strong className="text-slate-800 dark:text-slate-200">{r.assignee || '—'}</strong></div>
                      <div className="text-right">Projet : <strong className="text-slate-800 dark:text-slate-200 truncate">{r.projectName}</strong></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic text-xs py-8 text-center">Aucun incident dans cette case pour les filtres actifs.</p>
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center">
              <HelpCircle className="w-8 h-8 text-slate-300 mb-2" />
              Cliquez sur une case de la matrice pour en afficher le détail.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
