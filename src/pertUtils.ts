import { Dossier, PertNode, Project, Task } from './types';

export const STANDARD_PHASES = [
  'AVANT PROJET',
  'CONCEPTION',
  'PLANIFICATION',
  'EXÉCUTION & SUIVI',
  'CLÔTURE'
];

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(dateStr: string, days: number): string {
  const base = new Date(dateStr);
  if (isNaN(base.getTime())) return getTodayISO();
  base.setDate(base.getDate() + days);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, '0');
  const d = String(base.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Normalise les dates d'exécution réelles (Déb. Exéc et Fin Exéc) en fonction de la date d'aujourd'hui :
 * - Aucune date d'exécution ne peut être postérieure à todayISO.
 * - Dès que Déb. Exéc et Fin Exéc sont renseignées (<= todayISO), la tâche a le statut "Terminé".
 * - Si la tâche est "Bloqué", Déb. Exéc peut s'afficher mais Fin Exéc ne doit pas s'afficher.
 * - Si la tâche est "En cours", Déb. Exéc peut s'afficher mais Fin Exéc ne peut pas s'afficher.
 * - Si la tâche a pour statut "À faire", aucune date ne peut s'afficher dans Déb. Exéc et Fin Exéc.
 */
export function getNormalizedExecutionDates(
  task: Task,
  todayISO: string = getTodayISO()
): { actualStart: string; actualEnd: string } {
  const rStat = (task.riskStatus || '').toLowerCase().trim();
  const candidateStart = (task.actualStartDate || task.dateIdentification || '').trim();
  const candidateEnd = (task.actualEndDate || task.dateResolution || '').trim();

  const rawStart =
    candidateStart !== '' && candidateStart <= todayISO
      ? candidateStart
      : '';
  const rawEnd =
    candidateEnd !== '' && candidateEnd <= todayISO
      ? candidateEnd
      : '';

  const fallbackStartedByToday =
    task.startDate &&
    task.startDate.trim() !== '' &&
    task.startDate.trim() <= todayISO &&
    task.status !== 'À faire' &&
    rStat !== 'nouveau'
      ? task.startDate.trim()
      : '';

  const effectiveStart = rawStart || fallbackStartedByToday;

  if (rStat === 'nouveau') {
    return { actualStart: '', actualEnd: '' };
  }

  if (rStat === 'bloqué') {
    return { actualStart: effectiveStart, actualEnd: '' };
  }

  if (rStat === 'traité') {
    const startToUse = effectiveStart || task.startDate || todayISO;
    const endToUse = rawEnd || candidateEnd || task.endDate || todayISO;
    return {
      actualStart: startToUse,
      actualEnd: endToUse >= startToUse ? endToUse : startToUse
    };
  }

  // Dès que Déb. Exéc et Fin Exéc sont toutes deux renseignées (<= todayISO), la tâche est Terminée
  if (effectiveStart && rawEnd && rStat !== 'en traitement') {
    return {
      actualStart: effectiveStart,
      actualEnd: rawEnd >= effectiveStart ? rawEnd : effectiveStart
    };
  }

  // Si la tâche est bloquée, Déb. Exéc peut s'afficher mais Fin Exéc ne doit pas s'afficher
  if (task.manualBlocked || task.status === 'Bloqué') {
    return {
      actualStart: effectiveStart,
      actualEnd: ''
    };
  }

  // Si la tâche est En cours (commencée mais pas encore terminée), Déb. Exéc s'affiche mais Fin Exéc ne s'affiche pas
  if (effectiveStart) {
    return {
      actualStart: effectiveStart,
      actualEnd: ''
    };
  }

  // Si la tâche a pour statut "À faire", aucune date ne s'affiche dans Déb. Exéc et Fin Exéc
  return {
    actualStart: '',
    actualEnd: ''
  };
}

/**
 * Statut automatique fonction du suivi des risques (riskStatus), de la date d'aujourd'hui et des dates d'exécution.
 */
export function computeEffectiveStatus(task: Task, todayISO: string = getTodayISO()): Task['status'] {
  const rStat = (task.riskStatus || '').toLowerCase().trim();
  if (rStat === 'traité') return 'Terminé';
  if (rStat === 'bloqué') return 'Bloqué';
  if (rStat === 'en traitement') return 'En cours';
  if (rStat === 'nouveau') return 'À faire';

  const { actualStart, actualEnd } = getNormalizedExecutionDates(task, todayISO);

  // Dès que Déb. Exéc et Fin Exéc d'une tâche sont renseignées (<= todayISO), la tâche marque le statut "Terminé"
  if (actualStart && actualEnd) {
    return 'Terminé';
  }

  if (task.manualBlocked || task.status === 'Bloqué') {
    return 'Bloqué';
  }

  if (actualStart) {
    return 'En cours';
  }

  if (task.startDate && todayISO >= task.startDate && task.status !== 'À faire') {
    return 'En cours';
  }

  return 'À faire';
}

export interface TaskComputedMetrics {
  plannedDurationDays: number;
  plannedDurationLabel: string;
  realDurationDays: number | null;
  realDurationLabel: string;
  ecartDebutDays: number;
  ecartDebutLabel: string;
  ecartFinDays: number;
  ecartFinLabel: string;
  effectiveStatus: Task['status'];
  effectiveActualStartDate: string;
  effectiveActualEndDate: string;
}

export function computeTaskMetrics(task: Task, todayISO: string = getTodayISO()): TaskComputedMetrics {
  const effectiveStatus = computeEffectiveStatus(task, todayISO);
  const { actualStart, actualEnd } = getNormalizedExecutionDates(task, todayISO);

  // Règles d'affichage strictes selon le statut effectif :
  // - "À faire" : ni Déb. Exéc ni Fin Exéc ne peuvent s'afficher
  // - "En cours" : Déb. Exéc peut s'afficher, Fin Exéc ne peut pas s'afficher
  // - "Bloqué" : Déb. Exéc peut s'afficher, Fin Exéc ne doit pas s'afficher
  // - "Terminé" : Déb. Exéc et Fin Exéc s'affichent (<= todayISO)
  const effectiveActualStartDate =
    effectiveStatus === 'À faire' ? '' : actualStart;
  const effectiveActualEndDate =
    effectiveStatus === 'Terminé' ? actualEnd : '';

  const todayMs = new Date(todayISO).getTime();
  const startPrevMs = new Date(task.startDate).getTime();
  const endPrevMs = new Date(task.endDate).getTime();

  const plannedDurationDays =
    task.type === 'jalon'
      ? 0
      : !isNaN(startPrevMs) && !isNaN(endPrevMs)
      ? Math.max(1, Math.round((endPrevMs - startPrevMs) / 86400000))
      : 1;

  const plannedDurationLabel = `${plannedDurationDays}j`;

  const actStartMs = effectiveActualStartDate
    ? new Date(effectiveActualStartDate).getTime()
    : NaN;
  const actEndMs = effectiveActualEndDate
    ? new Date(effectiveActualEndDate).getTime()
    : NaN;

  // Durée réelle d'exécution
  let realDurationDays: number | null = null;
  let realDurationLabel = '—';
  if (task.type === 'jalon') {
    if (!isNaN(actEndMs) || !isNaN(actStartMs)) {
      realDurationDays = 0;
      realDurationLabel = '0j';
    }
  } else if (!isNaN(actStartMs) && !isNaN(actEndMs)) {
    realDurationDays = Math.max(1, Math.round((actEndMs - actStartMs) / 86400000));
    realDurationLabel = `${realDurationDays}j`;
  } else if (!isNaN(actStartMs) && todayMs >= actStartMs) {
    realDurationDays = Math.max(1, Math.round((todayMs - actStartMs) / 86400000));
    realDurationLabel = `${realDurationDays}j`;
  }

  // Écart début : différence entre Déb. Exéc (ou aujourd'hui si non démarré et en retard) et Déb. Prév
  let ecartDebutDays = 0;
  if (!isNaN(startPrevMs)) {
    if (!isNaN(actStartMs)) {
      ecartDebutDays = Math.round((actStartMs - startPrevMs) / 86400000);
    } else if (todayMs > startPrevMs && effectiveStatus !== 'Terminé') {
      ecartDebutDays = Math.round((todayMs - startPrevMs) / 86400000);
    }
  }

  // Écart fin : différence entre Fin Exéc (ou aujourd'hui si non terminé et échéance dépassée) et Fin Prév
  let ecartFinDays = 0;
  if (!isNaN(endPrevMs)) {
    if (!isNaN(actEndMs)) {
      ecartFinDays = Math.round((actEndMs - endPrevMs) / 86400000);
    } else if (todayMs > endPrevMs && effectiveStatus !== 'Terminé') {
      ecartFinDays = Math.round((todayMs - endPrevMs) / 86400000);
    }
  }

  const formatEcart = (days: number): string => {
    if (days > 0) return `+${days}j (Retard)`;
    if (days < 0) return `${days}j (Avance)`;
    return '0j (À temps)';
  };

  return {
    plannedDurationDays,
    plannedDurationLabel,
    realDurationDays,
    realDurationLabel,
    ecartDebutDays,
    ecartDebutLabel: formatEcart(ecartDebutDays),
    ecartFinDays,
    ecartFinLabel: formatEcart(ecartFinDays),
    effectiveStatus,
    effectiveActualStartDate,
    effectiveActualEndDate
  };
}

/**
 * Recalcule automatiquement les dates prévues d'une tâche lors d'un changement de statut Kanban
 * en conservant sa durée et la logique des dépendances (cascade sur les tâches suivantes).
 */
export function recalculateProjectTasksOnKanbanMove(
  tasks: Task[],
  movedTaskId: string,
  newStatus: Task['status'],
  todayISO: string = getTodayISO()
): Task[] {
  const cloned: Task[] = tasks.map(t => ({ ...t }));
  const target = cloned.find(t => t.id === movedTaskId);
  if (!target) return cloned;

  const metrics = computeTaskMetrics(target, todayISO);
  const duration = target.type === 'jalon' ? 0 : Math.max(1, metrics.plannedDurationDays);

  target.status = newStatus;
  target.manualBlocked = newStatus === 'Bloqué';

  if (newStatus === 'En cours') {
    const execStart = target.actualStartDate || target.dateIdentification || todayISO;
    target.actualStartDate = execStart;
    target.dateIdentification = target.dateIdentification || execStart;
    target.actualEndDate = '';
    target.dateResolution = '';
    target.riskStatus = 'en traitement';
    // Recalculate planned dates around current execution start while preserving duration
    target.startDate = execStart;
    target.endDate = target.type === 'jalon' ? execStart : addDaysISO(execStart, duration);
  } else if (newStatus === 'Terminé') {
    const execEnd = target.actualEndDate || target.dateResolution || todayISO;
    const execStart = target.actualStartDate || target.dateIdentification || (target.type === 'jalon' ? execEnd : addDaysISO(execEnd, -duration));
    target.actualStartDate = execStart;
    target.dateIdentification = target.dateIdentification || execStart;
    target.actualEndDate = execEnd;
    target.dateResolution = execEnd;
    target.riskStatus = 'traité';
    target.startDate = execStart;
    target.endDate = execEnd;
  } else if (newStatus === 'À faire') {
    target.actualStartDate = '';
    target.actualEndDate = '';
    target.dateResolution = '';
    target.riskStatus = 'nouveau';
    // Shift planned start to tomorrow if it was in the past, preserving duration
    const baseStart = target.startDate > todayISO ? target.startDate : addDaysISO(todayISO, 1);
    target.startDate = baseStart;
    target.endDate = target.type === 'jalon' ? baseStart : addDaysISO(baseStart, duration);
  } else if (newStatus === 'Bloqué') {
    // Keep actualEndDate empty and shift planned end if already passed, preserving duration
    target.actualEndDate = '';
    target.dateResolution = '';
    target.riskStatus = 'bloqué';
    if (target.endDate < todayISO) {
      target.startDate = todayISO;
      target.endDate = target.type === 'jalon' ? todayISO : addDaysISO(todayISO, duration);
    }
  }

  // Cascade logical dependencies to all successor tasks while preserving each successor's duration
  const visited = new Set<string>([target.id]);
  const queue: string[] = [target.id];

  while (queue.length > 0) {
    const predId = queue.shift()!;
    const predTask = cloned.find(t => t.id === predId);
    if (!predTask) continue;

    const successors = cloned.filter(t => t.antecedent === predId && !visited.has(t.id));
    for (const succ of successors) {
      visited.add(succ.id);
      const succMetrics = computeTaskMetrics(succ, todayISO);
      const succDur = succ.type === 'jalon' ? 0 : Math.max(1, succMetrics.plannedDurationDays);
      const nextStart = addDaysISO(predTask.endDate, succ.type === 'jalon' ? 0 : 1);
      succ.startDate = nextStart;
      succ.endDate = succ.type === 'jalon' ? nextStart : addDaysISO(nextStart, succDur);
      queue.push(succ.id);
    }
  }

  return cloned;
}

export interface ProjectPertResult {
  projectId: string;
  projectName: string;
  nodes: PertNode[];
  projectDuration: number;
  criticalPathNodes: PertNode[];
  criticalPathCodes: string[];
  blockedCriticalNodes: PertNode[];
  delayedCriticalNodes: PertNode[];
  slackNodes: PertNode[];
  totalBudget: number;
  criticalPathBudget: number;
  nonCriticalBudget: number;
  totalDisbursed: number;
  totalEarnedValue: number;
  totalActualCost: number;
  costVariance: number;
  cpi: number;
  disbursementRate: number;
  earnedValueRate: number;
  interpretation: {
    criticalPathSummary: string;
    slackSummary: string;
    riskAndSteeringSummary: string;
  };
  budgetInterpretation: {
    criticalBudgetSummary: string;
    evmAndVarianceSummary: string;
    financialSteeringSummary: string;
  };
  condensedReportSummary: string;
}

export function computePertForProject(
  project: Project,
  todayISO: string = getTodayISO(),
  lang: 'FR' | 'EN' = 'FR'
): ProjectPertResult {
  const isEn = lang === 'EN';
  const rawTasks = Array.isArray(project.tasks) ? project.tasks : [];

  // Order tasks by standard phases so numbering matches Planification & Suivi des tâches
  const orderedTasks: { task: Task; code: string }[] = [];
  STANDARD_PHASES.forEach((phaseName, pIdx) => {
    const phaseTasks = rawTasks.filter(t => t.phase === phaseName);
    phaseTasks.forEach((tk, tIdx) => {
      const prefix = tk.type === 'jalon' ? 'J' : 'T';
      orderedTasks.push({
        task: tk,
        code: `${prefix}.${pIdx + 1}.${tIdx + 1}`
      });
    });
  });

  // Include any task whose phase is custom
  rawTasks
    .filter(t => !STANDARD_PHASES.includes(t.phase))
    .forEach((tk, idx) => {
      const prefix = tk.type === 'jalon' ? 'J' : 'T';
      orderedTasks.push({
        task: tk,
        code: `${prefix}.X.${idx + 1}`
      });
    });

  const codeById = new Map<string, string>();
  const taskById = new Map<string, Task>();
  orderedTasks.forEach(({ task, code }) => {
    codeById.set(task.id, code);
    taskById.set(task.id, task);
  });

  // Helper to get full chain of preceding task codes (Précéd.)
  const getPrecedingChain = (taskId: string): string[] => {
    const chain: string[] = [];
    const seen = new Set<string>([taskId]);
    let curr = taskById.get(taskId);
    while (curr && curr.antecedent && curr.antecedent !== '—' && codeById.has(curr.antecedent)) {
      if (seen.has(curr.antecedent)) break; // prevent cycles
      seen.add(curr.antecedent);
      chain.unshift(codeById.get(curr.antecedent)!);
      curr = taskById.get(curr.antecedent);
    }
    return chain;
  };

  // Initialize PertNodes
  const nodes: PertNode[] = orderedTasks.map(({ task, code }) => {
    const metrics = computeTaskMetrics(task, todayISO);
    const hasValidAnt = Boolean(task.antecedent && task.antecedent !== '—' && codeById.has(task.antecedent));
    const antId = hasValidAnt ? task.antecedent! : '—';
    const antCode = hasValidAnt ? codeById.get(task.antecedent!)! : '—';
    const chain = getPrecedingChain(task.id);

    const budget = Number(task.budget) || 0;
    const montantDecaissement =
      task.montantDecaissement !== undefined ? Number(task.montantDecaissement) : budget;
    const progresBudget =
      task.progresBudget !== undefined
        ? Number(task.progresBudget)
        : task.valeurAcquise !== undefined && budget > 0
        ? Math.round((Number(task.valeurAcquise) / budget) * 100)
        : metrics.effectiveStatus === 'Terminé'
        ? 100
        : metrics.effectiveStatus === 'En cours'
        ? 50
        : 0;
    const valeurAcquise =
      task.valeurAcquise !== undefined
        ? Number(task.valeurAcquise)
        : Math.round((budget * progresBudget) / 100);
    const coutReel =
      task.coutReel !== undefined ? Number(task.coutReel) : montantDecaissement;
    const ecartCout = valeurAcquise - coutReel;
    const tauxDecaissement = budget > 0 ? Math.round((montantDecaissement / budget) * 100) : 0;
    const cpi = coutReel > 0 ? Number((valeurAcquise / coutReel).toFixed(2)) : 1;

    return {
      id: task.id,
      code,
      name: task.name,
      libelleRisque: task.libelleRisque,
      riskStatus: task.riskStatus,
      criticite: task.criticite,
      type: task.type,
      phase: task.phase,
      projectId: project.id,
      projectName: project.name,
      assignee: task.assignee || '—',
      bailleur: task.bailleur || '—',
      livrable: task.livrable || '—',
      budget,
      montantDecaissement,
      valeurAcquise,
      coutReel,
      progresBudget,
      ecartCout,
      tauxDecaissement,
      cpi,
      cumBudgetES: budget,
      isBudgetCritical: false,
      startDate: task.startDate,
      endDate: task.endDate,
      actualStartDate: task.actualStartDate,
      actualEndDate: task.actualEndDate,
      status: metrics.effectiveStatus,
      duration: metrics.plannedDurationDays,
      antecedentId: antId,
      antecedentCode: antCode,
      precedingChainCodes: chain.length > 0 ? chain.join(' → ') : '—',
      successorCodes: [],
      es: 0,
      ef: metrics.plannedDurationDays,
      ls: 0,
      lf: metrics.plannedDurationDays,
      totalFloat: 0,
      freeFloat: 0,
      isCritical: false,
      startDelayDays: metrics.ecartDebutDays,
      endDelayDays: metrics.ecartFinDays,
      level: chain.length
    };
  });

  const nodeMap = new Map<string, PertNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  // Populate successorCodes
  nodes.forEach(n => {
    if (n.antecedentId !== '—' && nodeMap.has(n.antecedentId)) {
      const pred = nodeMap.get(n.antecedentId)!;
      pred.successorCodes.push(n.code);
    }
  });

  // Forward Pass (ES, EF & Cumulative Budget along predecessor chain) sorted by level
  const sortedByLevel = [...nodes].sort((a, b) => a.level - b.level);
  sortedByLevel.forEach(n => {
    if (n.antecedentId !== '—' && nodeMap.has(n.antecedentId)) {
      const pred = nodeMap.get(n.antecedentId)!;
      n.es = pred.ef;
      n.cumBudgetES = pred.cumBudgetES + n.budget;
    } else {
      n.es = 0;
      n.cumBudgetES = n.budget;
    }
    n.ef = n.es + n.duration;
  });

  const projectDuration = nodes.length > 0 ? Math.max(...nodes.map(n => n.ef), 1) : 0;

  // Backward Pass (LF, LS) in reverse level order
  const reverseByLevel = [...sortedByLevel].reverse();
  reverseByLevel.forEach(n => {
    const succs = nodes.filter(s => s.antecedentId === n.id);
    if (succs.length === 0) {
      n.lf = projectDuration;
    } else {
      n.lf = Math.min(...succs.map(s => s.ls));
    }
    n.ls = Math.max(0, n.lf - n.duration);
    n.totalFloat = Math.max(0, n.ls - n.es);
    n.freeFloat = succs.length > 0 ? Math.max(0, Math.min(...succs.map(s => s.es)) - n.ef) : n.totalFloat;
    n.isCritical = n.totalFloat === 0;
    n.isBudgetCritical = n.isCritical || n.ecartCout < 0 || n.coutReel > n.budget;
  });

  const criticalPathNodes = sortedByLevel.filter(n => n.isCritical);
  const criticalPathCodes = criticalPathNodes.map(n => n.code);
  const blockedCriticalNodes = criticalPathNodes.filter(n => n.status === 'Bloqué');
  const delayedCriticalNodes = criticalPathNodes.filter(n => n.endDelayDays > 0 || n.startDelayDays > 0);
  const slackNodes = nodes.filter(n => n.totalFloat > 0);

  // Project-level Budgetary PERT metrics
  const totalBudget = nodes.reduce((s, n) => s + n.budget, 0);
  const criticalPathBudget = criticalPathNodes.reduce((s, n) => s + n.budget, 0);
  const nonCriticalBudget = Math.max(0, totalBudget - criticalPathBudget);
  const totalDisbursed = nodes.reduce((s, n) => s + n.montantDecaissement, 0);
  const totalEarnedValue = nodes.reduce((s, n) => s + n.valeurAcquise, 0);
  const totalActualCost = nodes.reduce((s, n) => s + n.coutReel, 0);
  const costVariance = totalEarnedValue - totalActualCost;
  const cpi = totalActualCost > 0 ? Number((totalEarnedValue / totalActualCost).toFixed(2)) : 1;
  const disbursementRate = totalBudget > 0 ? Math.round((totalDisbursed / totalBudget) * 100) : 0;
  const earnedValueRate = totalBudget > 0 ? Math.round((totalEarnedValue / totalBudget) * 100) : 0;
  const critBudgetPct = totalBudget > 0 ? Math.round((criticalPathBudget / totalBudget) * 100) : 0;

  const maxSlipDays = delayedCriticalNodes.length > 0
    ? Math.max(...delayedCriticalNodes.map(n => Math.max(n.endDelayDays, n.startDelayDays)))
    : 0;

  const criticalPathSummary =
    criticalPathNodes.length > 0
      ? isEn
        ? `The critical path of project "${project.name}" spans ${criticalPathNodes.length} zero-float activity/milestone item(s) (${criticalPathCodes.join(' → ')}) for an incompressible total duration of ${projectDuration} day(s). Any delay on these tasks directly shifts the project completion date.`
        : `Le chemin critique du projet « ${project.name} » traverse ${criticalPathNodes.length} activité(s)/jalon(s) à marge nulle (${criticalPathCodes.join(' → ')}) pour une durée totale incompressible de ${projectDuration} jour(s). Tout retard sur l’une de ces tâches décale directement la date de fin du projet.`
      : isEn
      ? `No activity recorded to compute the critical path.`
      : `Aucune activité enregistrée pour calculer le chemin critique.`;

  const slackSummary =
    slackNodes.length > 0
      ? isEn
        ? `${slackNodes.length} activity item(s) have positive total float (${slackNodes.map(s => `${s.code}: +${s.totalFloat}d`).join(', ')}), providing operational flexibility to temporarily reallocate resources toward the critical path without impacting final delivery.`
        : `${slackNodes.length} activité(s) disposent d’une marge totale positive (${slackNodes.map(s => `${s.code}: +${s.totalFloat}j`).join(', ')}), offrant une réserve de souplesse opérationnelle permettant de redéployer ponctuellement des ressources vers le chemin critique sans impacter la livraison finale.`
      : isEn
      ? `All activities in this project lie on the critical path (total float = 0d). Maximum vigilance is required at every stage.`
      : `Toutes les activités de ce projet sont sur le chemin critique (marge totale = 0j). La vigilance doit être maximale sur chaque étape.`;

  const riskAndSteeringSummary =
    blockedCriticalNodes.length > 0 || maxSlipDays > 0
      ? isEn
        ? `PERT STEERING ALERT: ${blockedCriticalNodes.length} blocked critical task(s) (${blockedCriticalNodes.map(b => b.code).join(', ') || 'none'}) and ${delayedCriticalNodes.length} delayed critical task(s) generate an estimated schedule pressure of +${maxSlipDays} day(s). Recommended action: immediately clear bottlenecks and fast-track critical links.`
        : `ALERTE DE PILOTAGE PERT : ${blockedCriticalNodes.length} tâche(s) critique(s) bloquée(s) (${blockedCriticalNodes.map(b => b.code).join(', ') || 'aucune'}) et ${delayedCriticalNodes.length} tâche(s) critique(s) en retard entraînent une tension calendaire estimée à +${maxSlipDays} jour(s). Action recommandée : lever immédiatement les blocages et accélérer l’exécution des maillons critiques.`
      : isEn
      ? `CONTROLLED TRAJECTORY: No blockage or critical overrun detected on the critical path. The planned schedule of ${projectDuration} day(s) is on track.`
      : `TRAJECTOIRE MAÎTRISÉE : Aucun blocage ni dépassement critique n’est constaté sur le chemin critique. Le calendrier prévisionnel de ${projectDuration} jour(s) est respecté.`;

  const criticalBudgetSummary = isEn
    ? `BUDGETARY PERT EXPOSURE: Out of a total planned budget of ${totalBudget.toLocaleString('en-US')} FCFA, ${criticalPathBudget.toLocaleString('en-US')} FCFA (${critBudgetPct}%) is concentrated on the critical path (${criticalPathCodes.join(' → ') || 'N/A'}) and ${nonCriticalBudget.toLocaleString('en-US')} FCFA on flexible tasks.`
    : `EXPOSITION PERT BUDGÉTAIRE : Sur un budget prévisionnel total de ${totalBudget.toLocaleString('fr-FR')} FCFA, ${criticalPathBudget.toLocaleString('fr-FR')} FCFA (${critBudgetPct}%) sont concentrés sur le chemin critique (${criticalPathCodes.join(' → ') || 'N/A'}) et ${nonCriticalBudget.toLocaleString('fr-FR')} FCFA sur les tâches à marge positive.`;

  const evmAndVarianceSummary = isEn
    ? `EARNED VALUE (EVM) & DISBURSEMENT: Disbursed = ${totalDisbursed.toLocaleString('en-US')} FCFA (${disbursementRate}%) · Earned Value (EV) = ${totalEarnedValue.toLocaleString('en-US')} FCFA (${earnedValueRate}%) · Actual Cost (AC) = ${totalActualCost.toLocaleString('en-US')} FCFA · Cost Variance (CV = EV - AC) = ${costVariance >= 0 ? '+' : ''}${costVariance.toLocaleString('en-US')} FCFA (CPI = ${cpi}).`
    : `VALEUR ACQUISE (EVM) & DÉCAISSEMENT : Décaissé = ${totalDisbursed.toLocaleString('fr-FR')} FCFA (${disbursementRate}%) · Valeur Acquise (VA) = ${totalEarnedValue.toLocaleString('fr-FR')} FCFA (${earnedValueRate}%) · Coût Réel (CR) = ${totalActualCost.toLocaleString('fr-FR')} FCFA · Écart de Coût (EC = VA - CR) = ${costVariance >= 0 ? '+' : ''}${costVariance.toLocaleString('fr-FR')} FCFA (Indice CPI = ${cpi}).`;

  const overrunNodes = nodes.filter(n => n.ecartCout < 0);
  const financialSteeringSummary =
    overrunNodes.length > 0 || costVariance < 0
      ? isEn
        ? `BUDGETARY STEERING ALERT: ${overrunNodes.length} activity item(s) (${overrunNodes.map(o => o.code).join(', ')}) show a negative cost variance (Actual Cost > Earned Value). Prioritise financial control on critical path disbursements.`
        : `ALERTE DE PILOTAGE BUDGÉTAIRE : ${overrunNodes.length} activité(s) (${overrunNodes.map(o => o.code).join(', ')}) présentent un écart de coût défavorable (Coût Réel > Valeur Acquise). Renforcer le contrôle fiduciaire sur les décaissements du chemin critique.`
      : isEn
      ? `CONTROLLED FINANCIAL TRAJECTORY: Earned value matches or exceeds actual costs (CPI = ${cpi} >= 1). Budget execution is aligned with technical progress.`
      : `TRAJECTOIRE FINANCIÈRE MAÎTRISÉE : La valeur acquise couvre les coûts réels engagés (CPI = ${cpi} >= 1). L’exécution budgétaire est alignée sur l’avancement physique du réseau PERT.`;

  const condensedReportSummary = isEn
    ? `[1. TASK PERT] Critical Path: ${criticalPathCodes.join(' → ') || 'N/A'} (${projectDuration}d, ${slackNodes.length} flexible task(s)). ${riskAndSteeringSummary}\n[2. BUDGETARY PERT] Total Budget: ${totalBudget.toLocaleString('en-US')} FCFA (Critical Path: ${critBudgetPct}%) | Disbursed: ${totalDisbursed.toLocaleString('en-US')} FCFA (${disbursementRate}%) | Earned Value: ${totalEarnedValue.toLocaleString('en-US')} FCFA (${earnedValueRate}%) | Actual Cost: ${totalActualCost.toLocaleString('en-US')} FCFA | Cost Variance: ${costVariance >= 0 ? '+' : ''}${costVariance.toLocaleString('en-US')} FCFA (CPI: ${cpi}). ${financialSteeringSummary}`
    : `[1. PERT DES TÂCHES] Chemin Critique : ${criticalPathCodes.join(' → ') || 'N/A'} (${projectDuration}j, ${slackNodes.length} tâche(s) à marge souple). ${riskAndSteeringSummary}\n[2. PERT BUDGÉTAIRE] Budget Prévu : ${totalBudget.toLocaleString('fr-FR')} FCFA (dont ${critBudgetPct}% sur chemin critique) | Décaissement : ${totalDisbursed.toLocaleString('fr-FR')} FCFA (${disbursementRate}%) | Valeur Acquise : ${totalEarnedValue.toLocaleString('fr-FR')} FCFA (${earnedValueRate}%) | Coût Réel : ${totalActualCost.toLocaleString('fr-FR')} FCFA | Écart Coût (VA-CR) : ${costVariance >= 0 ? '+' : ''}${costVariance.toLocaleString('fr-FR')} FCFA (CPI : ${cpi}). ${financialSteeringSummary}`;

  return {
    projectId: project.id,
    projectName: project.name,
    nodes,
    projectDuration,
    criticalPathNodes,
    criticalPathCodes,
    blockedCriticalNodes,
    delayedCriticalNodes,
    slackNodes,
    totalBudget,
    criticalPathBudget,
    nonCriticalBudget,
    totalDisbursed,
    totalEarnedValue,
    totalActualCost,
    costVariance,
    cpi,
    disbursementRate,
    earnedValueRate,
    interpretation: {
      criticalPathSummary,
      slackSummary,
      riskAndSteeringSummary
    },
    budgetInterpretation: {
      criticalBudgetSummary,
      evmAndVarianceSummary,
      financialSteeringSummary
    },
    condensedReportSummary
  };
}

export function computeDossierPertSummary(
  dossier?: Dossier,
  todayISO: string = getTodayISO(),
  lang: 'FR' | 'EN' = 'FR'
): ProjectPertResult[] {
  if (!dossier) return [];
  const results: ProjectPertResult[] = [];
  (dossier.axes || []).forEach(axe => {
    (axe.projects || []).forEach(proj => {
      results.push(computePertForProject(proj, todayISO, lang));
    });
  });
  return results;
}
