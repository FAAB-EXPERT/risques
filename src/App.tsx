import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  LayoutDashboard, Folder, CalendarDays, Calendar, AlertTriangle, 
  Activity, Menu, 
  Diamond, Star, Shield, Grid, Filter, Plus, Trash2, Edit, X, Save,
  Home, Mail, Phone, Unlock, HelpCircle, ChevronRight
} from 'lucide-react';

const BriefcaseIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

// Valeurs d'options définies
const DROPDOWNS = {
  riskStatus: ['nouveau', 'en traitement', 'bloqué', 'traité'],
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
  criticite: ['modéré', 'critique', 'tres critique'],
  consequence: ['cout', 'délai', 'qualité'],
  tendance: ['stable', 'hausse', 'baisse']
};

export interface TaskItem {
  id: string;
  type: string;
  taskOrMilestone: string;
  activity: string;
  phase: string;
  name: string;
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  status: string;
  assignee: string;
  responsabilite: string;
  livrable: string;
  validated?: boolean;
  antecedent?: string;
  dateIdentification: string;
  declarePar: string;
  riskStatus: string;
  nature: string;
  probabilite: string;
  gravite: string;
  criticite: string;
  consequence: string;
  tendance: string;
  actionPreventive: string;
  actionCorrective: string;
  dateResolution: string;
  resolutionFinale: string;
  commentaire: string;
  projectName?: string;
  projectId?: string;
  axeId?: string;
  dossierId?: string;
  isReadOnly?: boolean;
  number?: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  tasks: TaskItem[];
  dossierId?: string;
  dossierName?: string;
  axeName?: string;
  axeId?: string;
  isReadOnly?: boolean;
}

export interface AxeItem {
  id: string;
  name: string;
  projects: ProjectItem[];
}

export interface DossierItem {
  id: string;
  name: string;
  horizonPlan: string;
  psdYear: number;
  horizonYears: number;
  isReadOnly?: boolean;
  type: string;
  institution: string;
  description: string;
  axes: AxeItem[];
}

const initialData: DossierItem[] = [
  {
    id: 'dossier-strategique-default',
    name: 'Plan Stratégique d\'Activités & Risques',
    horizonPlan: '2026-2035',
    psdYear: 2026,
    horizonYears: 10,
    isReadOnly: false,
    type: 'standard',
    institution: 'MINISTÈRE DE LA TRANSITION DIGITALE',
    description: 'Cadre de référence stratégique et opérationnel pour le suivi des tâches, risques et budgets de l\'entreprise.',
    axes: [
      {
        id: 'axe-1-demo',
        name: 'Axe 1 : Transformation Digitale & Gestion Sécurisée',
        projects: [
          {
            id: 'proj-1-demo',
            name: 'Projet Pilote : Déploiement du Registre de Risques',
            tasks: [
              {
                id: 't-demo-1',
                type: 'tache',
                taskOrMilestone: 'tache',
                activity: 'Audit technique initial',
                phase: 'AVANT PROJET',
                name: 'Instabilité potentielle des serveurs d\'hébergement',
                startDate: '2026-06-01',
                endDate: '2026-06-30',
                status: 'En cours',
                assignee: 'Jean-Marc D.',
                responsabilite: 'Administrateur Systèmes',
                livrable: 'Diagnostic de charge validé',
                dateIdentification: '2026-06-09',
                declarePar: 'Michael K.',
                riskStatus: 'en traitement',
                nature: 'technologie / technique',
                probabilite: 'probable',
                gravite: 'grave',
                criticite: 'critique',
                consequence: 'délai',
                tendance: 'stable',
                actionPreventive: 'Mise en place de serveurs de redondance à chaud.',
                actionCorrective: 'Basculement automatique DNS en cas de panne.',
                dateResolution: '',
                resolutionFinale: '',
                commentaire: 'Le prestataire réseau effectue un audit de sécurité supplémentaire.'
              },
              {
                id: 't-demo-2',
                type: 'tache',
                taskOrMilestone: 'tache',
                activity: 'Plan d\'achat de licences',
                phase: 'CONCEPTION',
                name: 'Fluctuations des coûts des licences logicielles',
                startDate: '2026-06-10',
                endDate: '2026-08-15',
                status: 'À faire',
                assignee: 'Sophie L.',
                responsabilite: 'Directrice Financière',
                livrable: 'Budget prévisionnel ajusté',
                dateIdentification: '2026-06-12',
                declarePar: 'Sophie L.',
                riskStatus: 'bloqué',
                nature: 'economique / financier',
                probabilite: 'très probable',
                gravite: 'catastrophique',
                criticite: 'tres critique',
                consequence: 'cout',
                tendance: 'hausse',
                actionPreventive: 'Négociation de contrats pluriannuels à tarifs bloqués.',
                actionCorrective: 'Recours à des alternatives open-source.',
                dateResolution: '',
                resolutionFinale: '',
                commentaire: 'Dépassement critique constaté. Risque de rupture d\'approvisionnement.'
              },
              {
                id: 't-demo-3',
                type: 'jalon',
                taskOrMilestone: 'jalon',
                activity: 'Validation conformité légale',
                phase: 'PLANIFICATION',
                name: 'Retards réglementaires sur la conformité RGPD',
                startDate: '2026-07-20',
                endDate: '2026-07-20',
                status: 'Terminé',
                assignee: 'Marc-Antoine K.',
                responsabilite: 'Délégué à la Protection des Données',
                livrable: 'Registre RGPD validé',
                dateIdentification: '2026-06-15',
                declarePar: 'Marc-Antoine K.',
                riskStatus: 'traité',
                nature: 'légal /juridique',
                probabilite: 'peu probable',
                gravite: 'majeur',
                criticite: 'modéré',
                consequence: 'qualité',
                tendance: 'baisse',
                actionPreventive: 'Audits internes bi-hebdomadaires.',
                actionCorrective: 'Externalisation de la validation légale.',
                dateResolution: '2026-07-20',
                resolutionFinale: 'Validation complète par le cabinet d\'avocats conseil.',
                commentaire: 'Dossier clos avec succès.'
              },
              {
                id: 't-demo-4',
                type: 'tache',
                taskOrMilestone: 'tache',
                activity: 'Ateliers de formation interne',
                phase: 'EXÉCUTION & SUIVI',
                name: 'Résistance interne au changement organisationnel',
                startDate: '2026-07-01',
                endDate: '2026-12-31',
                status: 'En cours',
                assignee: 'Awa C.',
                responsabilite: 'Responsable Conduite du Changement',
                livrable: 'Plan de formation déployé',
                dateIdentification: '2026-06-18',
                declarePar: 'Awa C.',
                riskStatus: 'en traitement',
                nature: 'socio culturel',
                probabilite: 'probable',
                gravite: 'grave',
                criticite: 'critique',
                consequence: 'qualité',
                tendance: 'stable',
                actionPreventive: 'Ateliers de co-construction et communication transparente.',
                actionCorrective: 'Mise en place de référents par département.',
                dateResolution: '',
                resolutionFinale: '',
                commentaire: 'Bonne adhésion globale sur les premiers ateliers pilotes.'
              }
            ]
          }
        ]
      }
    ] 
  }
];

const STANDARD_PHASES = ['AVANT PROJET', 'CONCEPTION', 'PLANIFICATION', 'EXÉCUTION & SUIVI', 'CLÔTURE'];

const defaultTaskForm: TaskItem = {
  id: '',
  name: '',
  startDate: '2026-06-01',
  endDate: '2026-06-30',
  actualStartDate: '',
  actualEndDate: '',
  status: 'À faire',
  assignee: '',
  responsabilite: '',
  livrable: '',
  validated: false,
  antecedent: '—',
  type: 'tache',
  taskOrMilestone: 'tache',
  activity: '',
  phase: 'AVANT PROJET',
  dateIdentification: '2026-06-09',
  declarePar: '',
  riskStatus: 'nouveau',
  nature: 'politique/ administratif',
  probabilite: 'probable',
  gravite: 'majeur',
  criticite: 'modéré',
  consequence: 'délai',
  tendance: 'stable',
  actionPreventive: '',
  actionCorrective: '',
  dateResolution: '',
  resolutionFinale: '',
  commentaire: ''
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  override render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 text-red-800 rounded-xl border border-red-200 m-4">
          <h3 className="font-bold text-lg mb-2">Une erreur est survenue lors de l'affichage du module</h3>
          <p className="text-xs font-mono mb-4">{this.state.error?.toString()}</p>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
          >
            Réinitialiser complètement l'application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface KanbanCardProps {
  task: TaskItem;
  borderColor: string;
  onDragStart?: (e: React.DragEvent, task: TaskItem) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ task, borderColor, onDragStart }) => (
  <div 
    draggable={!task.isReadOnly}
    onDragStart={(e) => onDragStart && onDragStart(e, task)}
    className={`bg-white rounded-xl shadow-sm border-t-4 ${borderColor} border border-gray-200 p-4 flex flex-col space-y-3 mb-4 transition-all ${!task.isReadOnly ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : 'opacity-80 cursor-not-allowed'}`}
  >
    <div className="flex justify-between items-start">
       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{(task.taskOrMilestone || task.type) === 'jalon' ? 'Jalon' : 'Risque'}</span>
       <div className="flex space-x-1">
          {(task.taskOrMilestone || task.type) === 'jalon' ? <span className="bg-orange-100 text-orange-700 text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center"><Star className="w-2.5 h-2.5 mr-1 fill-current"/> JALON</span> : null}
          {task.riskStatus === 'bloqué' ? <span className="bg-red-100 text-red-700 text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center"><AlertTriangle className="w-2.5 h-2.5 mr-1"/> BLOQUÉ</span> : null}
       </div>
    </div>
    <div className="inline-block bg-sky-50 text-sky-700 text-[9px] px-2 py-0.5 rounded font-bold uppercase w-max">{task.phase || ''}</div>
    <h4 className="font-bold text-gray-800 text-xs leading-snug">{task.name || ''}</h4>

    <div className="bg-gray-50 rounded p-2 text-[11px]">
      <div className="flex justify-between items-center text-gray-500">
        <span className="flex items-center"><Calendar className="w-3 h-3 mr-1"/> Identification</span>
        <span className="font-semibold text-gray-700">
          {task.dateIdentification || task.startDate ? new Date(task.dateIdentification || task.startDate).toLocaleDateString('fr-FR', {day:'2-digit', month:'short', year:'numeric'}) : ''}
        </span>
      </div>
    </div>

    <div className="flex items-center text-[11px] text-gray-500 pt-1 border-t border-gray-100 mt-1">
      <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-[9px] mr-1.5 border border-sky-200">
        {(task.assignee || 'N').substring(0, 2).toUpperCase()}
      </div>
      <span className="truncate max-w-[130px] font-medium" title={task.assignee || ''}>{task.assignee || 'Non assigné'}</span>
    </div>
  </div>
);

interface InlineEditState {
  taskId: string;
  dossierId: string;
  axeId: string;
  projectId: string;
  phase: string;
  data: TaskItem;
}

function MainApp() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('cnra_activeTab') || 'accueil'); 
  const [isExploring, setIsExploring] = useState(() => localStorage.getItem('cnra_isExploring') === 'true');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [isCreatingDossier, setIsCreatingDossier] = useState(false);
  const [newDossierForm, setNewDossierForm] = useState({
    name: 'Nouveau Portefeuille d\'expérimentation',
    type: 'PSD', 
    startYear: 2026,
    horizonYears: 10,
    institution: 'INSTITUTION PAR DÉFAUT',
    description: 'Espace d\'expérimentation libre pour simuler et créer un portefeuille avec la méthodologie.'
  });

  const TODAY = useMemo(() => new Date('2026-05-28'), []);

  // Extraction et parsing ultra-robuste pour éviter les écrans blancs
  const [data, setData] = useState<DossierItem[]>(() => {
    try {
      const savedData = localStorage.getItem('cnra_data');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return initialData;
    } catch {
      return initialData;
    }
  });

  const [activeDossierId, setActiveDossierId] = useState<string>(() => {
    const savedId = localStorage.getItem('cnra_activeDossierId');
    if (savedId) return savedId;
    return initialData[0]?.id || '';
  });

  useEffect(() => { localStorage.setItem('cnra_data', JSON.stringify(data)); }, [data]);
  useEffect(() => { localStorage.setItem('cnra_activeDossierId', activeDossierId); }, [activeDossierId]);
  useEffect(() => { localStorage.setItem('cnra_activeTab', activeTab); }, [activeTab]);
  useEffect(() => { localStorage.setItem('cnra_isExploring', String(isExploring)); }, [isExploring]);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string | null; step: number }>({ id: null, step: 0 });

  // Variables de filtrage transversales
  const [filterDashboardAxe, setFilterDashboardAxe] = useState('FULL');
  const [filterDashboardProj, setFilterDashboardProj] = useState('FULL');
  const [filterProcessusAxe, setFilterProcessusAxe] = useState('FULL');
  const [filterProcessusProj, setFilterProcessusProj] = useState('FULL');
  const [filterKanbanAxe, setFilterKanbanAxe] = useState('FULL');
  const [filterKanbanProj, setFilterKanbanProj] = useState('FULL');
  const [filterGanttAxe, setFilterGanttAxe] = useState('FULL');
  const [filterGanttProj, setFilterGanttProj] = useState('FULL');
  const [filterMatriceAxe, setFilterMatriceAxe] = useState('FULL');
  const [filterMatriceProj, setFilterMatriceProj] = useState('FULL');

  const [ganttStartMonth, setGanttStartMonth] = useState('2026-01');
  const [ganttEndMonth, setGanttEndMonth] = useState('2028-12');
  const [ganttViewMode, setGanttViewMode] = useState('mois');

  // Sécurité anticrash lors du changement d'ID ou de dossier supprimé
  const activeDossier = useMemo(() => {
    return data.find(d => d.id === activeDossierId) || data[0] || initialData[0];
  }, [data, activeDossierId]);

  const currentInstitution = useMemo(() => {
    if (isExploring && activeDossier) {
      return activeDossier.institution || 'ENTREPRISE';
    }
    return 'ENTREPRISE';
  }, [isExploring, activeDossier]);

  // Synchronisation dynamique de l'échelle temporelle pour le Gantt
  useEffect(() => {
    if (activeDossier) {
      const startYear = activeDossier.psdYear || parseInt(activeDossier.horizonPlan?.split('-')[0]) || 2026;
      const length = Number(activeDossier.horizonYears) || 3;
      const endYear = startYear + length - 1; 
      setGanttStartMonth(`${startYear}-01`);
      setGanttEndMonth(`${endYear}-12`);
    }
  }, [activeDossierId, activeDossier]);

  const allProjects = useMemo(() => {
    const projects: ProjectItem[] = [];
    if (activeDossier && Array.isArray(activeDossier.axes)) {
      activeDossier.axes.forEach(axe => {
        if (axe && Array.isArray(axe.projects)) {
          axe.projects.forEach(proj => {
            if (proj) {
              projects.push({ 
                ...proj, 
                dossierId: activeDossier.id,
                dossierName: activeDossier.name, 
                axeName: axe.name, 
                axeId: axe.id, 
                isReadOnly: !!activeDossier.isReadOnly,
                tasks: Array.isArray(proj.tasks) ? proj.tasks : []
              });
            }
          });
        }
      });
    }
    return projects;
  }, [activeDossier]);

  const allTasks = useMemo(() => {
    const tasks: TaskItem[] = [];
    allProjects.forEach(proj => {
      if (proj && Array.isArray(proj.tasks)) {
        proj.tasks.forEach(task => {
          if (task) {
            tasks.push({ 
              ...task, 
              projectName: proj.name,
              projectId: proj.id,
              axeId: proj.axeId,
              dossierId: proj.dossierId,
              isReadOnly: !!proj.isReadOnly
            });
          }
        });
      }
    });
    return tasks;
  }, [allProjects]);

  const dashProjects = useMemo(() => {
    let filtered = allProjects;
    if (filterDashboardAxe !== 'FULL') filtered = filtered.filter(p => p.axeId === filterDashboardAxe);
    if (filterDashboardProj !== 'FULL') filtered = filtered.filter(p => p.id === filterDashboardProj);
    return filtered;
  }, [allProjects, filterDashboardAxe, filterDashboardProj]);

  const dashTasks = useMemo(() => {
    const validIds = dashProjects.map(p => p.id);
    return allTasks.filter(t => validIds.includes(t.projectId || ''));
  }, [allTasks, dashProjects]);

  const cpmDashboardData = useMemo(() => {
    if (dashTasks.length === 0) return "Aucun risque planifié";
    let minStart = Infinity;
    let maxEnd = -Infinity;
    dashTasks.forEach(t => {
      const sd = new Date(t.dateIdentification || t.startDate).getTime();
      const ed = new Date(t.dateResolution || t.endDate).getTime();
      if (!isNaN(sd) && !isNaN(ed)) {
        if (sd < minStart) minStart = sd;
        if (ed > maxEnd) maxEnd = ed;
      }
    });
    if (minStart === Infinity) return "Dates manquantes";
    const diffDays = Math.ceil((maxEnd - minStart) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays >= 365) {
      return `${(diffDays / 365).toFixed(1)} Ans (${diffDays} j) d'horizon`;
    }
    return `${diffDays} Jours de traitement global`;
  }, [dashTasks]);

  const stats = useMemo(() => {
    const total = dashTasks.length;
    const completed = dashTasks.filter(t => t.riskStatus === 'traité').length;
    const blocked = dashTasks.filter(t => t.riskStatus === 'bloqué').length;
    const inProgress = dashTasks.filter(t => t.riskStatus === 'en traitement').length;
    const todo = dashTasks.filter(t => t.riskStatus === 'nouveau').length;
    
    let currentlyDelayedCount = 0;

    dashTasks.forEach(t => {
      const startD = t.startDate ? new Date(t.startDate) : null;
      const endD = t.endDate ? new Date(t.endDate) : null;
      
      const isAFaire = t.riskStatus === 'nouveau';
      const isTermine = t.riskStatus === 'traité';

      const hasValidStart = startD && !isNaN(startD.getTime());
      const hasValidEnd = endD && !isNaN(endD.getTime());

      let isDelayed = false;
      if (!isTermine) {
        if (hasValidEnd && TODAY > endD) {
          isDelayed = true; 
        } else if (hasValidStart && TODAY > startD && isAFaire) {
          isDelayed = true; 
        }
      }
      if (isDelayed) {
        currentlyDelayedCount++;
      }
    });

    return { 
      total, 
      completed, 
      blocked, 
      inProgress, 
      todo,
      delayed: currentlyDelayedCount
    };
  }, [dashTasks, TODAY]);

  // CALCUL STATISTIQUES AVANCÉES DU PORTFOLIO
  const computedDashboardStats = useMemo(() => {
    const criticiteCounts: Record<string, number> = { 'modéré': 0, 'critique': 0, 'tres critique': 0 };
    const natureCounts: Record<string, number> = {};
    DROPDOWNS.nature.forEach(n => { natureCounts[n] = 0; });
    const consequenceCounts: Record<string, number> = { 'cout': 0, 'délai': 0, 'qualité': 0 };
    const tendanceCounts: Record<string, number> = { 'stable': 0, 'hausse': 0, 'baisse': 0 };
    const graviteCounts: Record<string, number> = { 'mineur': 0, 'majeur': 0, 'grave': 0, 'catastrophique': 0 };
    const probabiliteCounts: Record<string, number> = { 'improbable': 0, 'peu probable': 0, 'probable': 0, 'très probable': 0 };

    dashTasks.forEach(t => {
      if (!t) return;
      // 1. Criticité
      const crit = (t.criticite || 'modéré').toLowerCase().trim();
      if (crit.includes('tres') || crit.includes('très') || crit.includes('tres critique')) {
        criticiteCounts['tres critique']++;
      } else if (crit.includes('critique')) {
        criticiteCounts['critique']++;
      } else {
        criticiteCounts['modéré']++;
      }

      // 2. Nature du Risque
      const nat = (t.nature || '').toLowerCase().trim();
      if (natureCounts[nat] !== undefined) {
        natureCounts[nat]++;
      } else {
        const found = DROPDOWNS.nature.find(n => n.toLowerCase().trim() === nat);
        if (found) {
          natureCounts[found] = (natureCounts[found] || 0) + 1;
        }
      }

      // 3. Conséquence si avéré
      const cons = (t.consequence || '').toLowerCase().trim();
      if (cons.includes('cout') || cons.includes('coût')) consequenceCounts['cout']++;
      else if (cons.includes('délai') || cons.includes('delai')) consequenceCounts['délai']++;
      else if (cons.includes('qualité') || cons.includes('qualite')) consequenceCounts['qualité']++;

      // 4. Tendance d'évolution
      const tend = (t.tendance || 'stable').toLowerCase().trim();
      if (tendanceCounts[tend] !== undefined) {
        tendanceCounts[tend]++;
      }

      // 5. Gravité (Impact)
      const grav = (t.gravite || 'mineur').toLowerCase().trim();
      if (graviteCounts[grav] !== undefined) {
        graviteCounts[grav]++;
      }

      // 6. Probabilité
      const prob = (t.probabilite || 'probable').toLowerCase().trim();
      if (probabiliteCounts[prob] !== undefined) {
        probabiliteCounts[prob]++;
      }
    });

    // Formats d'objets pour Recharts
    const criticitePie = [
      { name: 'Modéré', value: criticiteCounts['modéré'], color: '#3b82f6' },
      { name: 'Critique', value: criticiteCounts['critique'], color: '#f59e0b' },
      { name: 'Très critique', value: criticiteCounts['tres critique'], color: '#ef4444' }
    ];

    const natureBar = Object.keys(natureCounts).map((key, idx) => ({
      name: key.split('/')[0].trim(),
      fullname: key,
      'Risques': natureCounts[key] || 0,
      color: ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'][idx % 6]
    }));

    const consequencePie = [
      { name: 'Coût', value: consequenceCounts['cout'], color: '#ef4444' },
      { name: 'Délai', value: consequenceCounts['délai'], color: '#0ea5e9' },
      { name: 'Qualité', value: consequenceCounts['qualité'], color: '#10b981' }
    ];

    const tendancePie = [
      { name: 'Stable', value: tendanceCounts['stable'], color: '#94a3b8' },
      { name: 'Hausse', value: tendanceCounts['hausse'], color: '#ef4444' },
      { name: 'Baisse', value: tendanceCounts['baisse'], color: '#10b981' }
    ];

    const graviteBar = [
      { name: 'Mineur', 'Nombre': graviteCounts['mineur'], color: '#10b981' },
      { name: 'Majeur', 'Nombre': graviteCounts['majeur'], color: '#3b82f6' },
      { name: 'Grave', 'Nombre': graviteCounts['grave'], color: '#f59e0b' },
      { name: 'Catastrophique', 'Nombre': graviteCounts['catastrophique'], color: '#dc2626' }
    ];

    const probabiliteBar = [
      { name: 'Improbable', 'Fréquence': probabiliteCounts['improbable'], color: '#94a3b8' },
      { name: 'Peu probable', 'Fréquence': probabiliteCounts['peu probable'], color: '#3b82f6' },
      { name: 'Probable', 'Fréquence': probabiliteCounts['probable'], color: '#f59e0b' },
      { name: 'Très probable', 'Fréquence': probabiliteCounts['très probable'], color: '#ef4444' }
    ];

    return { criticitePie, natureBar, consequencePie, tendancePie, graviteBar, probabiliteBar };
  }, [dashTasks]);

  const bottlenecks = useMemo(() => {
    const list: Array<TaskItem & { reasons: string[] }> = [];
    dashTasks.forEach(t => {
      let isBottleneck = false;
      const reasons: string[] = [];

      if ((t.riskStatus === 'nouveau' || t.riskStatus === 'bloqué') && t.criticite === 'tres critique') {
        isBottleneck = true;
        reasons.push("Risque critique non résolu");
      }

      if (isBottleneck) {
        const matchingProj = dashProjects.find(p => p.id === t.projectId);
        list.push({
          ...t,
          projectName: matchingProj ? matchingProj.name : "Projet Inconnu",
          reasons
        });
      }
    });
    return list;
  }, [dashTasks, dashProjects]);

  const globalProgress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const projectStats = useMemo(() => {
    const pStats: Array<{
      projectName: string;
      shortName: string;
      total: number;
      'Traités': number;
      'En cours': number;
      'Bloqués': number;
      'Nouveaux': number;
      'Critiques': number;
      progress: number;
    }> = [];

    dashProjects.forEach(proj => {
      const safeTasks = Array.isArray(proj.tasks) ? proj.tasks : [];
      const total = safeTasks.length;
      const completed = safeTasks.filter(t => t.riskStatus === 'traité').length;
      const inProgress = safeTasks.filter(t => t.riskStatus === 'en traitement').length;
      const blocked = safeTasks.filter(t => t.riskStatus === 'bloqué').length;
      const todo = safeTasks.filter(t => t.riskStatus === 'nouveau').length;
      
      const delayed = safeTasks.filter(t => t.criticite === 'tres critique' && t.riskStatus !== 'traité').length;

      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      const shortName = (proj.name || 'Projet Inconnu').replace(/Projet\s*(\d)?\s*:\s*/, '');

      pStats.push({ 
        projectName: proj.name || 'Projet Inconnu', 
        shortName: shortName,
        total, 
        'Traités': completed, 
        'En cours': inProgress, 
        'Bloqués': blocked,
        'Nouveaux': todo, 
        'Critiques': delayed,
        progress 
      });
    });
    return pStats;
  }, [dashProjects]);

  interface GanttColumn {
    label: string;
    parentLabel: string;
    start: Date;
    end: Date;
  }

  const ganttColumns = useMemo(() => {
    const startStr = ganttStartMonth || '2026-01';
    const endStr = ganttEndMonth || '2028-12';
    const [sYear, sMonth] = startStr.split('-').map(Number);
    const [eYear, eMonth] = endStr.split('-').map(Number);
    if (isNaN(sYear) || isNaN(sMonth) || isNaN(eYear) || isNaN(eMonth)) {
      return [];
    }
    const startDate = new Date(sYear, sMonth - 1, 1);
    const endDate = new Date(eYear, eMonth, 0); 
    
    const cols: GanttColumn[] = [];
    let curr = new Date(startDate);
    const maxCols = 100;

    if (ganttViewMode === 'jour') {
        while (curr <= endDate && cols.length < maxCols) {
            cols.push({
                label: curr.getDate().toString().padStart(2, '0'),
                parentLabel: curr.toLocaleString('fr-FR', { month: 'short', year: 'numeric' }),
                start: new Date(curr.getFullYear(), curr.getMonth(), curr.getDate(), 0, 0, 0),
                end: new Date(curr.getFullYear(), curr.getMonth(), curr.getDate(), 23, 59, 59)
            });
            curr = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate() + 1);
        }
    } else if (ganttViewMode === 'semaine') {
        let currWeekStart = new Date(startDate);
        let weekNum = 1;
        while (currWeekStart <= endDate && cols.length < maxCols) {
            const currWeekEnd = new Date(currWeekStart.getFullYear(), currWeekStart.getMonth(), currWeekStart.getDate() + 6, 23, 59, 59);
            const actualEnd = currWeekEnd > endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59) : currWeekEnd;
            
            cols.push({
                label: `S${weekNum}`,
                parentLabel: currWeekStart.toLocaleString('fr-FR', { month: 'short', year: 'numeric' }),
                start: new Date(currWeekStart.getFullYear(), currWeekStart.getMonth(), currWeekStart.getDate(), 0, 0, 0),
                end: actualEnd
            });
            
            const nextWeekStart = new Date(currWeekStart.getFullYear(), currWeekStart.getMonth(), currWeekStart.getDate() + 7);
            if (nextWeekStart.getMonth() !== currWeekStart.getMonth()) {
                weekNum = 1;
            } else {
                weekNum++;
            }
            currWeekStart = nextWeekStart;
        }
    } else if (ganttViewMode === 'mois') {
        while (curr <= endDate && cols.length < maxCols) {
            const mEnd = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);
            cols.push({
                label: curr.toLocaleString('fr-FR', { month: 'short' }).substring(0,3),
                parentLabel: curr.getFullYear().toString(),
                start: new Date(curr.getFullYear(), curr.getMonth(), 1, 0, 0, 0),
                end: new Date(mEnd.getFullYear(), mEnd.getMonth(), mEnd.getDate(), 23, 59, 59)
            });
            curr = new Date(curr.getFullYear(), curr.getMonth() + 1, 1);
        }
    } else if (ganttViewMode === 'trimestre') {
        while (curr <= endDate && cols.length < maxCols) {
            const q = Math.floor(curr.getMonth() / 3) + 1;
            const qEnd = new Date(curr.getFullYear(), q * 3, 0);
            const actualEnd = qEnd > endDate ? endDate : qEnd;
            cols.push({
                label: `T${q}`,
                parentLabel: curr.getFullYear().toString(),
                start: new Date(curr.getFullYear(), curr.getMonth(), 1, 0, 0, 0),
                end: new Date(actualEnd.getFullYear(), actualEnd.getMonth(), actualEnd.getDate(), 23, 59, 59)
            });
            curr = new Date(curr.getFullYear(), curr.getMonth() + 3, 1);
        }
    } else if (ganttViewMode === 'semestre') {
        while (curr <= endDate && cols.length < maxCols) {
            const s = Math.floor(curr.getMonth() / 6) + 1;
            const sEnd = new Date(curr.getFullYear(), s * 6, 0);
            const actualEnd = sEnd > endDate ? endDate : sEnd;
            cols.push({
                label: `S${s}`,
                parentLabel: curr.getFullYear().toString(),
                start: new Date(curr.getFullYear(), curr.getMonth(), 1, 0, 0, 0),
                end: new Date(actualEnd.getFullYear(), actualEnd.getMonth(), actualEnd.getDate(), 23, 59, 59)
            });
            curr = new Date(curr.getFullYear(), curr.getMonth() + 6, 1);
        }
    }
    return cols;
  }, [ganttStartMonth, ganttEndMonth, ganttViewMode]);

  const ganttParents = useMemo(() => {
    const parents: Array<{ label: string; count: number }> = [];
    if (!ganttColumns || ganttColumns.length === 0) return [];
    let currentParent: { label: string; count: number } | null = null;
    ganttColumns.forEach(col => {
        if (!currentParent || currentParent.label !== col.parentLabel) {
            if (currentParent) parents.push(currentParent);
            currentParent = { label: col.parentLabel, count: 1 };
        } else {
            currentParent.count++;
        }
    });
    if (currentParent) parents.push(currentParent);
    return parents;
  }, [ganttColumns]);

  const handleSaveNewDossier = () => {
    if (!newDossierForm.name.trim()) {
      setValidationError("Veuillez saisir le nom du dossier.");
      return;
    }
    if (!newDossierForm.institution.trim()) {
      setValidationError("Veuillez renseigner l'institution rattachée.");
      return;
    }
    const years = Number(newDossierForm.horizonYears) || 10;
    const startYear = Number(newDossierForm.startYear) || 2026;
    const endYear = startYear + years - 1;
    const horizonStr = `${startYear}-${endYear}`;

    const newDossier: DossierItem = { 
      id: `dossier-${Date.now()}`, 
      name: newDossierForm.name.trim(), 
      psdYear: startYear,
      horizonYears: years,
      horizonPlan: horizonStr, 
      isReadOnly: false, 
      type: newDossierForm.type,
      institution: newDossierForm.institution.trim(),
      description: newDossierForm.description || 'Espace d\'expérimentation.',
      axes: [
        {
          id: `axe-1-${Date.now()}`,
          name: 'Axe 1 : Transformation Digitale & Performance administrative',
          projects: [
            {
              id: `proj-sim-${Date.now()}`,
              name: 'Projet Pilote : Déploiement de la méthodologie GAR',
              tasks: [
                {
                  id: `t-sim-init-${Date.now()}`,
                  type: 'tache',
                  taskOrMilestone: 'tache',
                  activity: 'Diagnostic technique',
                  phase: 'AVANT PROJET',
                  name: 'Risque cyber ou fuite de données d\'évaluation',
                  startDate: `${startYear}-03-01`,
                  endDate: `${startYear}-05-15`,
                  status: 'À faire',
                  assignee: 'Comité de Pilotage GAR',
                  responsabilite: 'Coordinateur Performance',
                  livrable: 'Diagnostic SWOT validé',
                  dateIdentification: `${startYear}-03-01`,
                  declarePar: 'Michael K.',
                  riskStatus: 'nouveau',
                  nature: 'technologie / technique',
                  probabilite: 'probable',
                  gravite: 'grave',
                  criticite: 'critique',
                  consequence: 'délai',
                  tendance: 'stable',
                  actionPreventive: 'Mise en place de protocoles de sécurité renforcés.',
                  actionCorrective: 'Restauration des sauvegardes chiffrées.',
                  dateResolution: '',
                  resolutionFinale: '',
                  commentaire: 'Audit technique planifié.'
                }
              ]
            }
          ]
        }
      ] 
    };

    setData([...data, newDossier]);
    setActiveDossierId(newDossier.id);
    setIsCreatingDossier(false);
    setValidationError('');
  };

  const handleUpdateDossier = (id: string, field: keyof DossierItem, value: any) => {
    setData(data.map(d => {
      if (d.id === id) {
        const updated = { ...d, [field]: value };
        const startY = Number(updated.psdYear);
        const yearsLength = Number(updated.horizonYears);
        
        if (!isNaN(startY) && !isNaN(yearsLength) && yearsLength > 0) {
          const endY = startY + yearsLength - 1;
          updated.horizonPlan = `${startY}-${endY}`;
        } else if (!isNaN(startY)) {
          updated.horizonPlan = `${startY}`;
        }
        return updated;
      }
      return d;
    }));
  };

  const handleDeleteDossier = (id: string) => {
    setData(data.filter(d => d.id !== id));
  };

  const handleAddAxe = (dossierId: string) => {
    setData(data.map(d => d.id === dossierId ? { 
      ...d, 
      axes: [...(d.axes || []), { id: `axe-${Date.now()}-${Math.floor(Math.random()*1000)}`, name: 'Nouvel Axe Stratégique', projects: [] }] 
    } : d));
  };

  const handleUpdateAxe = (dossierId: string, axeId: string, field: keyof AxeItem, value: any) => {
    setData(data.map(d => dossierId === d.id ? { 
      ...d, 
      axes: d.axes.map(a => a.id === axeId ? { ...a, [field]: value } : a) 
    } : d));
  };

  const handleDeleteAxe = (dossierId: string, axeId: string) => {
     setData(data.map(d => dossierId === d.id ? { 
       ...d, 
       axes: d.axes.filter(a => a.id !== axeId) 
     } : d));
  };

  const handleAddProject = (dossierId: string, axeId: string) => {
    setData(data.map(d => dossierId === d.id ? { 
      ...d, 
      axes: d.axes.map(a => a.id === axeId ? { 
        ...a, 
        projects: [...(a.projects || []), { id: `proj-${Date.now()}-${Math.floor(Math.random()*1000)}`, name: 'Nouveau Projet d\'entraînement', tasks: [] }] 
      } : a) 
    } : d));
  };

  const handleUpdateProject = (dossierId: string, axeId: string, projId: string, field: keyof ProjectItem, value: any) => {
    setData(data.map(d => dossierId === d.id ? { 
      ...d, 
      axes: d.axes.map(a => a.id === axeId ? { 
        ...a, 
        projects: a.projects.map(p => p.id === projId ? { ...p, [field]: value } : p) 
      } : a) 
    } : d));
  };
  
  const handleDeleteProject = (dossierId: string, axeId: string, projId: string) => {
    setData(data.map(d => d.id === dossierId ? { 
      ...d, 
      axes: d.axes.map(a => a.id === axeId ? { 
        ...a, 
        projects: a.projects.filter(p => p.id !== projId) 
      } : a) 
    } : d));
  };

  const [inlineEdit, setInlineEdit] = useState<InlineEditState | null>(null);
  const [taskDeleteConfirmation, setTaskDeleteConfirmation] = useState<string | null>(null); 
  const [validationError, setValidationError] = useState('');

  const openInlineAdd = (dossierId: string, axeId: string, projectId: string, phase: string, type = 'tache') => {
    setInlineEdit({
      taskId: 'new', dossierId, axeId, projectId, phase,
      data: { ...defaultTaskForm, phase, type, taskOrMilestone: type }
    });
  };

  const openInlineEdit = (dossierId: string, axeId: string, projectId: string, task: TaskItem) => {
    setInlineEdit({
      taskId: task.id, dossierId, axeId, projectId, phase: task.phase,
      data: { ...defaultTaskForm, ...task }
    });
  };

  // Logic de synchronisation temporelle selon Jalon/Tâche
  const handleInlineChange = (field: keyof TaskItem, value: any) => {
    setInlineEdit(prev => {
      if (!prev) return null;
      const newData: TaskItem = { ...prev.data, [field]: value };
      
      if (field === 'taskOrMilestone') {
        newData.type = value;
      }
      if (field === 'type') {
        newData.taskOrMilestone = value;
      }

      // Si jalon, date début = date fin
      if (newData.taskOrMilestone === 'jalon' || newData.type === 'jalon') {
        if (field === 'startDate') {
          newData.endDate = value;
        } else if (field === 'endDate') {
          newData.startDate = value;
        } else if (field === 'taskOrMilestone' || field === 'type') {
          newData.endDate = newData.startDate;
        }
      }
      
      return { ...prev, data: newData };
    });
  };

  const cancelInlineEdit = () => {
    setInlineEdit(null);
    setValidationError('');
  };
  
  const saveInlineEdit = () => {
    if (!inlineEdit) return;
    if (!inlineEdit.data.name.trim()) {
      setValidationError("Veuillez saisir un intitulé pour le risque.");
      return;
    }
    if (!STANDARD_PHASES.includes(inlineEdit.data.phase)) {
      setValidationError("Phase invalide. Le cycle de projet imposé doit être respecté.");
      return;
    }

    setValidationError('');

    // Synchronisation fluide des dates de repli
    if (inlineEdit.data.dateIdentification) {
      if (!inlineEdit.data.startDate) {
        inlineEdit.data.startDate = inlineEdit.data.dateIdentification;
      }
      if (!inlineEdit.data.endDate) {
        inlineEdit.data.endDate = inlineEdit.data.dateIdentification;
      }
    }
    if (inlineEdit.data.dateResolution) {
      inlineEdit.data.endDate = inlineEdit.data.dateResolution;
    }
    
    setData(data.map(d => {
      if (d.id !== inlineEdit.dossierId) return d;
      return {
        ...d, axes: d.axes.map(a => {
          if (a.id !== inlineEdit.axeId) return a;
          return {
            ...a, projects: a.projects.map(p => {
              if (p.id !== inlineEdit.projectId) return p;
              const tasks = p.tasks || [];
              let newTasks: TaskItem[];
              if (inlineEdit.taskId === 'new') {
                newTasks = [...tasks, { ...inlineEdit.data, id: `t-${Date.now()}` }];
              } else {
                newTasks = tasks.map(t => t.id === inlineEdit.taskId ? inlineEdit.data : t);
              }
              return { ...p, tasks: newTasks };
            })
          };
        })
      };
    }));
    setInlineEdit(null);
  };

  const handleDeleteTask = (dossierId: string, axeId: string, projectId: string, taskId: string) => {
    setData(data.map(d => {
      if (d.id !== dossierId) return d;
      return {
        ...d, axes: d.axes.map(a => {
          if (a.id !== axeId) return a;
          return {
            ...a, projects: a.projects.map(p => {
              if (p.id !== projectId) return p;
              return { ...p, tasks: p.tasks.filter(t => t.id !== taskId) };
            })
          };
        })
      };
    }));
    setTaskDeleteConfirmation(null);
  };

  const renderAccueil = () => (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 max-w-5xl mx-auto font-sans">
      <div className="bg-sky-600 rounded-2xl p-8 md:p-12 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
            Maîtrisez le Pilotage et le <br/>
            <span className="text-sky-200">Suivi des Risques Opérationnels</span>
          </h1>
          <p className="text-sky-100 text-lg mb-8 leading-relaxed font-medium font-sans">
            Cette plateforme est un outil de gouvernance et de maîtrise des processus opérationnels d'exposition aux risques. Identifiez avec rigueur les menaces stratégiques, planifiez vos mesures d'atténuation et pilotez vos plans d'actions préventives et correctives de manière agile pour sécuriser l'atteinte de vos résultats (méthode GAR).
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => { 
                setActiveTab('projects'); 
                setIsExploring(false); 
              }} 
              className="bg-white text-sky-700 hover:bg-sky-50 font-bold px-6 py-3.5 rounded-lg shadow-lg transition-all flex items-center cursor-pointer"
            >
              <Folder className="w-5 h-5 mr-3" />
              Accéder aux Portefeuilles
            </button>
          </div>
        </div>
        
        <div className="bg-sky-800/50 rounded-xl p-5 border border-sky-500 w-full md:w-[340px] shadow-2xl relative z-10 backdrop-blur-sm">
          <p className="text-sky-200 text-[10px] font-bold tracking-widest uppercase mb-1">Application conçue par :</p>
          <h3 className="text-white font-black text-lg mb-3">KOFFIE FABIEN MICHAEL</h3>
          <div className="space-y-2 text-xs text-sky-100 font-medium font-sans">
            <p className="flex items-center"><Mail className="w-4 h-4 mr-2" /> fabien.frikupgeneration@gmail.com</p>
            <p className="flex items-center"><Phone className="w-4 h-4 mr-2" /> +225 07 48 08 27 39</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative text-slate-800">
        <h4 className="flex items-center text-rose-600 font-black tracking-widest text-sm uppercase mb-3 drop-shadow-sm">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Accord de confidentialité & Propriété intellectuelle
        </h4>
        <p className="text-xs text-slate-600 font-medium leading-relaxed text-justify font-sans">
          La présente plateforme, incluant son architecture structurelle, sa logique algorithmique et son design d'interface, constitue une œuvre de l'esprit protégée appartenant à son créateur. En utilisant cette application, l'administration ou l'institution utilisatrice s'engage formellement à respecter la stricte confidentialité de ce système. Toute copie, reproduction, ingénierie inverse, ou distribution non expressément autorisée de cet outil à des tiers est rigoureusement interdite sous peine de poursuites légales.
        </p>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in pb-10 font-sans">
      <div className="flex justify-between items-center border-b pb-2 border-sky-200 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Tableau de Bord ISO 31000</h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">Gouvernance & Cartographie des risques par axes stratégiques</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          {cpmDashboardData && (
            <div className="bg-sky-50 px-4 py-2 rounded-xl shadow-sm border border-sky-200 min-w-[200px] flex flex-col justify-center">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-sky-800 flex items-center"><Activity className="w-3 h-3 mr-1"/>Suivi des Résolutions</span>
              </div>
              <span className="text-sm font-black text-sky-600 uppercase tracking-wide">{cpmDashboardData}</span>
            </div>
          )}
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 min-w-[250px]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-gray-600">Taux de Résolution Globale</span>
              <span className="text-lg font-bold text-emerald-600">{globalProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${globalProgress}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/70 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-gray-200 mb-4 shrink-0 text-sm">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center">
            <Filter className="w-3 h-3 mr-1 text-sky-500" /> 1. Filtrer par Axe Stratégique
          </label>
          <div className="relative">
            <select 
              className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-800 text-sm font-semibold rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 p-2.5 pr-8 outline-none transition-shadow cursor-pointer"
              value={filterDashboardAxe}
              onChange={(e) => { 
                setFilterDashboardAxe(e.target.value); 
                setFilterDashboardProj('FULL');
              }}
            >
              <option value="FULL">Toutes les données (Vue Globale)</option>
              {activeDossier?.axes?.map(axe => (
                <option key={axe.id} value={axe.id}>{axe.name}</option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 text-gray-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
          </div>
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center">
            <Filter className="w-3 h-3 mr-1 text-sky-500" /> 2. Filtrer par Projet OP
          </label>
          <div className="relative">
            <select 
              className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-800 text-sm font-semibold rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 p-2.5 pr-8 outline-none transition-shadow cursor-pointer"
              value={filterDashboardProj}
              onChange={(e) => setFilterDashboardProj(e.target.value)}
            >
              <option value="FULL">Tous les projets {filterDashboardAxe !== 'FULL' ? 'de cet axe' : ''}</option>
              {allProjects
                .filter(p => filterDashboardAxe === 'FULL' || p.axeId === filterDashboardAxe)
                .map((proj, idx) => (
                  <option key={proj.id} value={proj.id}>{idx + 1}. {proj.name}</option>
              ))}
            </select>
            <ChevronRight className="w-4 h-4 text-gray-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-slate-400 flex flex-col justify-center">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider mb-1">Risques Totaux</p>
          <p className="text-3xl font-black text-slate-800 leading-none">{stats.total}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-emerald-500 flex flex-col justify-center">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider mb-1">Risques Traités</p>
          <p className="text-3xl font-black text-emerald-600 leading-none">{stats.completed}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-red-500 flex flex-col justify-center">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider mb-1">Risques Bloqués</p>
          <p className="text-3xl font-black text-rose-600 leading-none">{stats.blocked}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-sky-400 flex flex-col justify-center">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider mb-1">Risques Nouveaux</p>
          <p className="text-3xl font-black text-sky-600 leading-none">{stats.todo}</p>
        </div>
      </div>

      {/* Goulots d'étranglement / Alertes */}
      {bottlenecks.length > 0 && (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-red-100 overflow-hidden">
          <div className="bg-red-50/50 px-5 py-3 border-b border-red-100 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
              <h3 className="font-bold text-red-900 text-xs md:text-sm uppercase tracking-wider">
                Analyse Critique des Risques Majeurs non résolus ({bottlenecks.length})
              </h3>
            </div>
            <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full">
              Action requise immédiate
            </span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {bottlenecks.map(b => (
              <div key={b.id} className="p-3 bg-red-50/30 border border-red-100/80 rounded-xl flex flex-col justify-between hover:shadow-xs transition-shadow">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="bg-red-100 text-red-800 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                      {(b.taskOrMilestone || b.type) === 'jalon' ? 'Jalon Critique' : 'Risque non traité'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold max-w-[150px] truncate" title={b.projectName}>
                      {b.projectName}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs leading-snug">{b.name}</h4>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-red-100 mt-2 text-[10px]">
                  <div className="flex items-center">
                    <span className="font-bold text-slate-600">Resp: {b.assignee || '—'}</span>
                  </div>
                  <span className="text-slate-400 font-medium">
                    Identifié le: {b.dateIdentification || b.startDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GRILLE ANALYTIQUE ENTIÈREMENT ALIGNÉE SUR LA GOUVERNANCE RISQUES (6 GRAPHES) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Graphique 1 : Répartition par Criticité */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Graphe 1</h3>
            <h4 className="text-sm font-bold text-slate-800 leading-snug">Répartition par Niveau de Criticité</h4>
          </div>
          <div className="h-48 w-full my-3 flex items-center justify-center">
            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={computedDashboardStats.criticitePie} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={55} 
                    outerRadius={75} 
                    paddingAngle={3} 
                    dataKey="value"
                  >
                    {computedDashboardStats.criticitePie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400 italic">Aucun risque pour le moment</span>
            )}
          </div>
          <div className="space-y-1.5 border-t border-slate-100 pt-3">
            {computedDashboardStats.criticitePie.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="flex items-center text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                  {item.name}
                </span>
                <span className="font-bold text-slate-800">{item.value} ({stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Graphique 2 : Nature du Risque (Analyse PESTEL) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Graphe 2</h3>
            <h4 className="text-sm font-bold text-slate-800 leading-snug">Nature du Risque (Secteurs PESTEL)</h4>
          </div>
          <div className="h-48 w-full my-3">
            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={computedDashboardStats.natureBar} layout="vertical" margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 9, fontWeight: 'bold' }} />
                  <RechartsTooltip />
                  <Bar dataKey="Risques" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    {computedDashboardStats.natureBar.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">Données insuffisantes</div>
            )}
          </div>
          <div className="text-[10px] text-center text-slate-400 font-medium border-t border-slate-100 pt-3">
            Ventilation basée sur les 6 piliers réglementaires & stratégiques
          </div>
        </div>

        {/* Graphique 3 : Conséquence si avéré (QCD Triangle) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Graphe 3</h3>
            <h4 className="text-sm font-bold text-slate-800 leading-snug">Impact Majeur (Qualité-Coût-Délai)</h4>
          </div>
          <div className="h-48 w-full my-3 flex items-center justify-center">
            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={computedDashboardStats.consequencePie} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={55} 
                    outerRadius={75} 
                    paddingAngle={3} 
                    dataKey="value"
                  >
                    {computedDashboardStats.consequencePie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400 italic">Aucun risque pour le moment</span>
            )}
          </div>
          <div className="space-y-1.5 border-t border-slate-100 pt-3">
            {computedDashboardStats.consequencePie.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="flex items-center text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                  {item.name}
                </span>
                <span className="font-bold text-slate-800">{item.value} ({stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Graphique 4 : Tendance d'Évolution */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Graphe 4</h3>
            <h4 className="text-sm font-bold text-slate-800 leading-snug">Tendance d'Évolution des Risques</h4>
          </div>
          <div className="h-48 w-full my-3 flex items-center justify-center">
            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={computedDashboardStats.tendancePie} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={0} 
                    outerRadius={75} 
                    paddingAngle={0} 
                    dataKey="value"
                  >
                    {computedDashboardStats.tendancePie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400 italic">Aucun risque enregistré</span>
            )}
          </div>
          <div className="space-y-1.5 border-t border-slate-100 pt-3">
            {computedDashboardStats.tendancePie.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="flex items-center text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                  {item.name}
                </span>
                <span className="font-bold text-slate-800">{item.value} ({stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Graphique 5 : Gravité (Impact) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Graphe 5</h3>
            <h4 className="text-sm font-bold text-slate-800 leading-snug">Gravité Constatée (Impact)</h4>
          </div>
          <div className="h-48 w-full my-3">
            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={computedDashboardStats.graviteBar} margin={{ left: -15, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip />
                  <Bar dataKey="Nombre" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {computedDashboardStats.graviteBar.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">Aucune donnée</div>
            )}
          </div>
          <div className="text-[10px] text-center text-slate-400 font-medium border-t border-slate-100 pt-3">
            Classification des incidents selon les seuils financiers & d'échéances
          </div>
        </div>

        {/* Graphique 6 : Probabilité de Matérialisation */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
          <div>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Graphe 6</h3>
            <h4 className="text-sm font-bold text-slate-800 leading-snug">Probabilité de Matérialisation</h4>
          </div>
          <div className="h-48 w-full my-3">
            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={computedDashboardStats.probabiliteBar} margin={{ left: -15, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip />
                  <Bar dataKey="Fréquence" fill="#3F9384" radius={[4, 4, 0, 0]}>
                    {computedDashboardStats.probabiliteBar.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">Aucune donnée</div>
            )}
          </div>
          <div className="text-[10px] text-center text-slate-400 font-medium border-t border-slate-100 pt-3">
            Estimation de l'occurrence selon la méthodologie d'audit interne
          </div>
        </div>

      </div>

      {/* Profil Global par Projet d'origine */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm mt-6">
        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-sky-500" /> Profil Synthétique des Portefeuilles d'Activités
        </h3>
        <div className="h-80">
          {projectStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectStats} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="shortName" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                <YAxis allowDecimals={false} />
                <RechartsTooltip cursor={{fill: 'transparent'}} />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="total" name="Total Risques" fill="#64748b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Traités" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="En cours" stackId="a" fill="#0ea5e9" />
                <Bar dataKey="Bloqués" stackId="a" fill="#f43f5e" />
                <Bar dataKey="Nouveaux" stackId="a" fill="#9CA3AF" />
                <Bar dataKey="Critiques" name="Critiques / Très Critiques" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 italic">Aucun projet à analyser</div>
          )}
        </div>
      </div>
    </div>
  );

  const [selectedCell, setSelectedMatrixCell] = useState<{ prob: number; grav: number } | null>(null);

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

  const renderMatriceRisques = () => {
    let filteredProjects = allProjects;
    if (filterMatriceAxe !== 'FULL') filteredProjects = filteredProjects.filter(p => p.axeId === filterMatriceAxe);
    if (filterMatriceProj !== 'FULL') filteredProjects = filteredProjects.filter(p => p.id === filterMatriceProj);
    const validProjIds = filteredProjects.map(p => p.id);

    const risksForMatrix = allTasks.filter(t => validProjIds.includes(t.projectId || ''));

    const matrixGrid = [
      // Row 4: Très probable
      [
        { label: 'Très probable (4)', probVal: 4, gravVal: 1, color: 'bg-amber-400 hover:bg-amber-500 text-slate-800' },
        { label: 'Très probable (4)', probVal: 4, gravVal: 2, color: 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse' },
        { label: 'Très probable (4)', probVal: 4, gravVal: 3, color: 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse' },
        { label: 'Très probable (4)', probVal: 4, gravVal: 4, color: 'bg-red-700 hover:bg-red-800 text-white animate-pulse' }
      ],
      // Row 3: Probable
      [
        { label: 'Probable (3)', probVal: 3, gravVal: 1, color: 'bg-green-400 hover:bg-green-500 text-slate-800' },
        { label: 'Probable (3)', probVal: 3, gravVal: 2, color: 'bg-amber-400 hover:bg-amber-500 text-slate-800' },
        { label: 'Probable (3)', probVal: 3, gravVal: 3, color: 'bg-rose-500 hover:bg-rose-600 text-white' },
        { label: 'Probable (3)', probVal: 3, gravVal: 4, color: 'bg-red-700 hover:bg-red-800 text-white animate-pulse' }
      ],
      // Row 2: Peu probable
      [
        { label: 'Peu probable (2)', probVal: 2, gravVal: 1, color: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
        { label: 'Peu probable (2)', probVal: 2, gravVal: 2, color: 'bg-green-400 hover:bg-green-500 text-slate-800' },
        { label: 'Peu probable (2)', probVal: 2, gravVal: 3, color: 'bg-amber-500 hover:bg-amber-600 text-white' },
        { label: 'Peu probable (2)', probVal: 2, gravVal: 4, color: 'bg-rose-500 hover:bg-rose-600 text-white' }
      ],
      // Row 1: Improbable
      [
        { label: 'Improbable (1)', probVal: 1, gravVal: 1, color: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
        { label: 'Improbable (1)', probVal: 1, gravVal: 2, color: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
        { label: 'Improbable (1)', probVal: 1, gravVal: 3, color: 'bg-green-400 hover:bg-green-500 text-slate-800' },
        { label: 'Improbable (1)', probVal: 1, gravVal: 4, color: 'bg-amber-500 hover:bg-amber-600 text-white' }
      ]
    ];

    const clickedRisks = selectedCell 
      ? risksForMatrix.filter(t => getProbValue(t.probabilite) === selectedCell.prob && getGravValue(t.gravite) === selectedCell.grav)
      : [];

    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-10 font-sans">
        <div className="flex justify-between items-center border-b pb-1 border-sky-200 shrink-0 mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <Grid className="w-5 h-5 mr-2 text-sky-500" /> 
            Matrice des Risques Opérationnels (ISO 31000)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4 shrink-0 text-sm">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Filter className="w-3 h-3 mr-1 text-sky-500" /> 1. Filtrer par Axe Stratégique
            </label>
            <select 
              className="w-full bg-gray-50 border border-gray-300 text-gray-800 text-xs font-semibold rounded-xl p-2 cursor-pointer outline-none"
              value={filterMatriceAxe}
              onChange={(e) => { 
                setFilterMatriceAxe(e.target.value); 
                setFilterMatriceProj('FULL');
              }}
            >
              <option value="FULL">Toutes les données (Vue Globale)</option>
              {activeDossier?.axes?.map(axe => (
                <option key={axe.id} value={axe.id}>{axe.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Filter className="w-3 h-3 mr-1 text-sky-500" /> 2. Filtrer par Projet OP
            </label>
            <select 
              className="w-full bg-gray-50 border border-gray-300 text-gray-800 text-xs font-semibold rounded-xl p-2 cursor-pointer outline-none"
              value={filterMatriceProj}
              onChange={(e) => setFilterMatriceProj(e.target.value)}
            >
              <option value="FULL">Tous les projets {filterMatriceAxe !== 'FULL' ? 'de cet axe' : ''}</option>
              {allProjects
                .filter(p => filterMatriceAxe === 'FULL' || p.axeId === filterMatriceAxe)
                .map((proj, idx) => (
                  <option key={proj.id} value={proj.id}>{idx + 1}. {proj.name}</option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Grille Thermique interactive */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="text-center mb-4">
              <h3 className="font-bold text-slate-800 text-sm">Cartographie Probabilité / Gravité (QCD)</h3>
              <p className="text-[10px] text-slate-400">Cliquez sur une cellule pour voir la liste des incidents opérationnels associés</p>
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
                {matrixGrid.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex gap-2 mb-2">
                    {/* Axe Y graduation */}
                    <div className="w-24 flex items-center justify-end pr-2 text-[10px] font-bold text-slate-500">
                      {row[0].label.split('(')[0]}
                    </div>

                    {/* Cellules */}
                    {row.map((cell, colIdx) => {
                      const matchingCount = risksForMatrix.filter(t => 
                        getProbValue(t.probabilite) === cell.probVal && 
                        getGravValue(t.gravite) === cell.gravVal
                      ).length;

                      const isSelected = selectedCell && selectedCell.prob === cell.probVal && selectedCell.grav === cell.gravVal;

                      return (
                        <div 
                          key={colIdx} 
                          onClick={() => setSelectedMatrixCell({ prob: cell.probVal, grav: cell.gravVal })}
                          className={`flex-1 aspect-[4/3] rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-xs border ${cell.color} ${
                            isSelected ? 'ring-4 ring-sky-500 scale-105 shadow-md border-white' : 'border-transparent hover:scale-102'
                          }`}
                        >
                          <span className="text-xl font-black">{matchingCount || '0'}</span>
                          <span className="text-[8px] uppercase font-black opacity-80 mt-0.5">Risque{matchingCount > 1 ? 's' : ''}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Axe X Graduation */}
                <div className="flex mt-2">
                  <div className="w-24"></div>
                  <div className="flex-1 flex gap-2">
                    {['Mineur (1)', 'Majeur (2)', 'Grave (3)', 'Catastrophique (4)'].map((label, idx) => (
                      <div key={idx} className="flex-1 text-center text-[10px] font-bold text-slate-500">
                        {label}
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
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center gap-6 text-[10px] font-bold flex-wrap">
              <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-emerald-500"></span> Acceptable</div>
              <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-green-400"></span> Sous Contrôle</div>
              <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-amber-400"></span> Vigilance</div>
              <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-rose-500"></span> Alerte Critique</div>
              <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-red-700 animate-pulse"></span> Alerte Majeure</div>
            </div>
          </div>

          {/* Volet Détail des risques sélectionnés */}
          <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm h-full max-h-[480px] overflow-y-auto">
            <h3 className="font-bold text-slate-800 text-sm mb-3">Détail des incidents de la cellule</h3>
            {selectedCell ? (
              <div className="space-y-3">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] font-semibold text-slate-500">
                  Filtre actif : Probabilité <span className="text-slate-800">{selectedCell.prob}/4</span> & Gravité <span className="text-slate-800">{selectedCell.grav}/4</span>
                </div>

                {clickedRisks.length > 0 ? (
                  clickedRisks.map(r => (
                    <div key={r.id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-[9px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                          {r.type === 'tache' ? `Risque` : `Jalon`}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          r.riskStatus === 'traité' ? 'bg-green-100 text-green-800' :
                          r.riskStatus === 'en traitement' ? 'bg-amber-100 text-amber-800' :
                          r.riskStatus === 'bloqué' ? 'bg-rose-100 text-rose-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {r.riskStatus || 'nouveau'}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs mb-1">{r.name}</h4>
                      <p className="text-[10px] text-slate-500 italic mb-2">Activité support: {r.activity || '—'}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 border-t border-slate-100 pt-2 font-medium">
                        <div>Resp : <span className="font-bold text-slate-700">{r.assignee || '—'}</span></div>
                        <div className="text-right">Axe : <span className="font-bold text-slate-700">{r.axeId ? 'Axe Actif' : 'Axe 1'}</span></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic text-xs py-8 text-center">Aucun risque dans cette cellule pour les filtres choisis.</p>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 italic text-xs flex flex-col items-center">
                <HelpCircle className="w-8 h-8 text-slate-300 mb-2" />
                Sélectionnez une cellule de la matrice pour examiner les incidents associés.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderProjectManager = () => {
    const filteredDossiers = data;

    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-10">
        <div className="flex justify-between items-center border-b pb-2 border-sky-200 shrink-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Folder className="w-6 h-6 mr-2 text-sky-500" /> 
            Portefeuilles d'Activités & Dossiers
          </h2>
          <button 
            onClick={() => setIsCreatingDossier(true)}
            className="bg-sky-600 text-white hover:bg-sky-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" /> Nouveau PSD / Dossier
          </button>
        </div>

        {isCreatingDossier && (
          <div className="bg-white border-2 border-teal-500 p-6 rounded-2xl shadow-lg space-y-4 animate-in zoom-in-95 duration-200 font-sans">
            <h3 className="text-lg font-black text-teal-900 flex items-center">
              <Plus className="w-5 h-5 mr-2" /> Initialiser un Nouveau Dossier
            </h3>
            {validationError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs font-semibold flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 shrink-0"/> {validationError}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest block mb-1">Institution Rattachée</label>
                <input 
                  type="text" 
                  value={newDossierForm.institution} 
                  onChange={e => setNewDossierForm({ ...newDossierForm, institution: e.target.value })}
                  placeholder="Ex: MINISTÈRE DE L'AGRICULTURE, ENTREPRISE PRIVÉE, etc."
                  className="w-full p-2.5 text-sm border border-teal-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-400 font-bold text-teal-950 uppercase"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest block mb-1">Nom du Portefeuille / PSD d'entraînement</label>
                <input 
                  type="text" 
                  value={newDossierForm.name} 
                  onChange={e => setNewDossierForm({ ...newDossierForm, name: e.target.value })}
                  placeholder="Ex: Nouveau Portefeuille (À notre échelle)"
                  className="w-full p-2.5 text-sm border border-teal-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest block mb-1">Description libre du Portefeuille</label>
              <textarea 
                rows={2}
                value={newDossierForm.description} 
                onChange={e => setNewDossierForm({ ...newDossierForm, description: e.target.value })}
                placeholder="Espace d'expérimentation libre pour simuler et créer un portefeuille..."
                className="w-full p-2.5 text-sm border border-teal-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-400 text-slate-600 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest block mb-1">Type de Document</label>
                <select
                  value={newDossierForm.type}
                  onChange={e => {
                    const type = e.target.value;
                    const horizonYears = type === 'PSD' ? 10 : 3;
                    setNewDossierForm({ ...newDossierForm, type, horizonYears });
                  }}
                  className="w-full p-2.5 text-sm border border-teal-200 rounded-lg outline-none bg-white font-semibold text-teal-900"
                >
                  <option value="PSD">Plan Stratégique (PSD)</option>
                  <option value="Dossier Opérationnel">Dossier Opérationnel</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest block mb-1">Année de Début</label>
                <input 
                  type="number" 
                  value={newDossierForm.startYear} 
                  onChange={e => setNewDossierForm({ ...newDossierForm, startYear: parseInt(e.target.value) || 2026 })}
                  className="w-full p-2.5 text-sm border border-teal-200 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest block mb-1">Durée d'Horizon (Années)</label>
                <input 
                  type="number" 
                  min="1"
                  max="100"
                  value={newDossierForm.horizonYears} 
                  onChange={e => setNewDossierForm({ ...newDossierForm, horizonYears: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full p-2.5 text-sm border border-teal-200 rounded-lg outline-none font-bold text-teal-900"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t">
              <button 
                onClick={() => setIsCreatingDossier(false)} 
                className="px-4 py-2 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer"
              >
                Annuler
              </button>
              <button 
                onClick={handleSaveNewDossier} 
                className="px-4 py-2 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow transition cursor-pointer"
              >
                Créer l'Espace de suivi
              </button>
            </div>
          </div>
        )}
        
        {/* Grille de cartes de portefeuilles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDossiers.map(dossier => {
            return (
              <div 
                key={dossier.id} 
                className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between overflow-hidden relative transition-all duration-300 hover:shadow-md border-l-[6px] border-l-emerald-500"
              >
                <div className="p-6 flex flex-col h-full font-sans">
                  <div className="flex justify-between items-start w-full">
                    <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-600">
                      <BriefcaseIcon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider bg-teal-100 text-teal-800">
                        Éditable
                      </span>
                      <button 
                        onClick={() => setDeleteConfirmation({ id: dossier.id, step: 1 })}
                        className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                        title="Supprimer la simulation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {deleteConfirmation.id === dossier.id && (
                    <div className="mt-3 flex items-center space-x-2 bg-red-50 p-2 rounded-lg border border-red-200 shadow-sm transition-all duration-300">
                      {deleteConfirmation.step === 1 && (
                        <>
                          <span className="text-xs font-bold text-red-600 px-1">Sûr ?</span>
                          <button onClick={() => setDeleteConfirmation({ id: dossier.id, step: 2 })} className="bg-red-500 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-red-600 transition-colors cursor-pointer">Oui</button>
                          <button onClick={() => setDeleteConfirmation({ id: null, step: 0 })} className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-[10px] font-bold hover:bg-gray-400 transition-colors cursor-pointer">Non</button>
                        </>
                      )}
                      {deleteConfirmation.step === 2 && (
                        <>
                          <span className="text-[10px] font-black text-red-600 px-1 uppercase tracking-wider animate-pulse">Irréversible !</span>
                          <button onClick={() => { handleDeleteDossier(dossier.id); setDeleteConfirmation({ id: null, step: 0 }); }} className="bg-red-700 text-white px-3 py-1 rounded text-[10px] font-bold hover:bg-red-800 shadow-md transition-colors cursor-pointer">Détruire</button>
                          <button onClick={() => setDeleteConfirmation({ id: null, step: 0 })} className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-[10px] font-bold hover:bg-gray-400 transition-colors cursor-pointer">Annuler</button>
                        </>
                      )}
                    </div>
                  )}

                  <div className="border-b border-dashed border-teal-200/80 pb-2 mt-4">
                    <p className="text-[10.5px] font-black tracking-widest text-slate-400 uppercase truncate" title={dossier.institution || 'INSTITUTION PAR DÉFAUT'}>
                      {dossier.institution || 'INSTITUTION PAR DÉFAUT'}
                    </p>
                  </div>

                  <div className="py-3 flex-1 flex flex-col">
                    <h3 className="text-base font-black text-slate-800 leading-snug line-clamp-2" title={dossier.name}>
                      {dossier.name}
                    </h3>
                    <p className="text-[11.5px] text-slate-500 font-medium mt-2 leading-relaxed line-clamp-3">
                      {dossier.description || 'Espace d\'expérimentation pour la saisie et le suivi des risques opérationnels.'}
                    </p>
                  </div>

                  <div className="border-t border-dashed border-teal-200/80 pt-4 mt-2">
                    <div className="flex justify-between items-center text-[11px] text-slate-400 font-bold mb-4">
                      <span className="bg-teal-50 text-teal-800 px-2 py-1 rounded border border-teal-200">Horizon: {dossier.horizonPlan}</span>
                      <span>{dossier.axes?.length || 0} Axes</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3 space-y-2">
                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Modifier l'institution :</label>
                        <input 
                          type="text" 
                          value={dossier.institution || ''} 
                          onChange={e => handleUpdateDossier(dossier.id, 'institution', e.target.value)}
                          className="w-full mt-1 p-1.5 text-xs font-bold border border-slate-200 rounded uppercase bg-white outline-none focus:border-teal-400" 
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Modifier le titre :</label>
                        <input 
                          type="text" 
                          value={dossier.name || ''} 
                          onChange={e => handleUpdateDossier(dossier.id, 'name', e.target.value)}
                          className="w-full mt-1 p-1.5 text-xs font-bold border border-slate-200 rounded bg-white outline-none focus:border-teal-400" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Année Début :</label>
                          <input 
                            type="number" 
                            value={dossier.psdYear === undefined || dossier.psdYear === null ? '' : dossier.psdYear} 
                            onChange={e => handleUpdateDossier(dossier.id, 'psdYear', e.target.value)}
                            className="w-full mt-1 p-1.5 text-xs font-bold border border-slate-200 rounded bg-white outline-none focus:border-teal-400" 
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Échéance (ans) :</label>
                          <input 
                            type="number" 
                            min="1"
                            value={dossier.horizonYears === undefined || dossier.horizonYears === null ? '' : dossier.horizonYears} 
                            onChange={e => handleUpdateDossier(dossier.id, 'horizonYears', e.target.value)}
                            className="w-full mt-1 p-1.5 text-xs font-bold border border-slate-200 rounded bg-white outline-none focus:border-teal-400" 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Modifier la description :</label>
                        <textarea 
                          value={dossier.description || ''} 
                          onChange={e => handleUpdateDossier(dossier.id, 'description', e.target.value)}
                          className="w-full mt-1 p-1.5 text-xs font-medium border border-slate-200 rounded bg-white outline-none focus:border-teal-400" 
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setActiveDossierId(dossier.id);
                        setIsExploring(true);
                        setActiveTab('dashboard');
                      }}
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-sm transition-colors text-sm cursor-pointer"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>Ouvrir Suivi des risques</span>
                    </button>
                  </div>
                </div>

                <div className="bg-teal-50/50 p-4 border-t border-slate-100 space-y-3 font-sans">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-teal-800 uppercase tracking-wider">Axes Stratégiques</span>
                    <button 
                      onClick={() => handleAddAxe(dossier.id)}
                      className="bg-teal-600 hover:bg-teal-700 text-white text-[9px] px-2 py-1 rounded font-bold flex items-center cursor-pointer"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Ajouter Axe
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                    {dossier.axes?.map((axe, axeIdx) => (
                      <div key={axe.id} className="bg-white p-2 rounded-lg border border-slate-200 relative shadow-xs">
                        <button 
                          onClick={() => handleDeleteAxe(dossier.id, axe.id)}
                          className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <div className="flex items-center space-x-1.5 pr-6">
                          <span className="bg-teal-100 text-teal-800 font-black text-[9px] w-4 h-4 rounded flex items-center justify-center shrink-0">{axeIdx + 1}</span>
                          <input 
                            type="text" 
                            value={axe.name} 
                            onChange={e => handleUpdateAxe(dossier.id, axe.id, 'name', e.target.value)}
                            placeholder="Nom de l'axe..." 
                            className="w-full p-1 text-[11px] font-bold border border-slate-100 rounded focus:border-teal-400 outline-none" 
                          />
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-1 border-t border-slate-100">
                          <button onClick={() => handleAddProject(dossier.id, axe.id)} className="text-[8px] bg-slate-100 hover:bg-teal-100 text-slate-700 hover:text-teal-800 px-1.5 py-0.5 rounded font-black flex items-center transition-colors cursor-pointer">
                            <Plus className="w-2.5 h-2.5 mr-0.5" /> Ajouter un Projet
                          </button>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{axe.projects?.length || 0} projets</span>
                        </div>
                        {axe.projects?.length > 0 && (
                          <div className="mt-1.5 space-y-1 pl-4">
                            {axe.projects.map((proj, projIdx) => (
                              <div key={proj.id} className="flex items-center gap-1">
                                <span className="text-[9px] text-slate-400 font-bold">{projIdx + 1}.</span>
                                <input 
                                  type="text" 
                                  value={proj.name} 
                                  onChange={e => handleUpdateProject(dossier.id, axe.id, proj.id, 'name', e.target.value)} 
                                  className="w-full p-1 text-[9px] font-semibold border-b border-transparent focus:border-teal-200 outline-none" 
                                  placeholder="Nom du projet..."
                                />
                                <button onClick={() => handleDeleteProject(dossier.id, axe.id, proj.id)} className="text-slate-300 hover:text-red-500 cursor-pointer"><X className="w-3 h-3" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderProcessus = () => {
    let filteredProjects = allProjects;
    if (filterProcessusAxe !== 'FULL') filteredProjects = filteredProjects.filter(p => p.axeId === filterProcessusAxe);
    if (filterProcessusProj !== 'FULL') filteredProjects = filteredProjects.filter(p => p.id === filterProcessusProj);
    
    const colSpanCount = 22; 

    const enrichedProjects = filteredProjects.map(project => {
      const phaseGroups = STANDARD_PHASES.map(phaseName => {
        const pTasks = Array.isArray(project.tasks) ? project.tasks.filter(t => t.phase === phaseName) : [];
        let minStart = Infinity;
        pTasks.forEach(t => {
            const d = new Date(t.dateIdentification || t.startDate).getTime();
            if (!isNaN(d) && d < minStart) minStart = d;
        });
        return { phase: phaseName, tasks: pTasks, minStart };
      });

      phaseGroups.sort((a, b) => {
        if (a.minStart === Infinity && b.minStart === Infinity) return STANDARD_PHASES.indexOf(a.phase) - STANDARD_PHASES.indexOf(b.phase);
        if (a.minStart === Infinity) return 1;
        if (b.minStart === Infinity) return -1;
        return a.minStart - b.minStart;
      });

      phaseGroups.forEach(group => {
        group.tasks.sort((a, b) => {
          const dA = new Date(a.dateIdentification || a.startDate).getTime();
          const dB = new Date(b.dateIdentification || b.startDate).getTime();
          if (isNaN(dA) && isNaN(dB)) return 0;
          if (isNaN(dA)) return 1;
          if (isNaN(dB)) return -1;
          return dA - dB;
        });
      });

      const groups = phaseGroups.map((group, phaseIndex) => {
        const items = group.tasks.map((t, idx) => {
          return { 
            ...t, 
            number: `${phaseIndex + 1}.${idx + 1}`
          };
        });
        return { phase: group.phase, items };
      });
      return { ...project, groups };
    });

    return (
      <div className="animate-in fade-in duration-500 pb-10 flex flex-col h-full relative font-sans">
        <div className="flex justify-between items-center border-b pb-1 border-sky-200 shrink-0 mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center"><Activity className="w-5 h-5 mr-2 text-sky-500" /> Suivi des Risques (Saisie Opérationnelle)</h2>
        </div>

        {validationError && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 mb-4 flex items-center text-sm font-semibold animate-bounce">
            <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
            {validationError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4 shrink-0">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Filter className="w-3 h-3 mr-1" /> 1. Filtrer par Axe Stratégique
            </label>
            <div className="relative">
              <select 
                className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-800 text-sm font-medium rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 p-2.5 pr-8 outline-none transition-shadow cursor-pointer"
                value={filterProcessusAxe}
                onChange={(e) => { 
                  setFilterProcessusAxe(e.target.value); 
                  setFilterProcessusProj('FULL');
                }}
              >
                <option value="FULL">Toutes les données (Vue Globale)</option>
                {activeDossier?.axes?.map(axe => (
                  <option key={axe.id} value={axe.id}>{axe.name}</option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 text-gray-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Filter className="w-3 h-3 mr-1" /> 2. Filtrer par Projet OP
            </label>
            <div className="relative">
              <select 
                className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-800 text-sm font-medium rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 p-2.5 pr-8 outline-none transition-shadow cursor-pointer"
                value={filterProcessusProj}
                onChange={(e) => setFilterProcessusProj(e.target.value)}
              >
                <option value="FULL">Tous les projets {filterProcessusAxe !== 'FULL' ? 'de cet axe' : ''}</option>
                {allProjects
                  .filter(p => filterProcessusAxe === 'FULL' || p.axeId === filterProcessusAxe)
                  .map((proj, idx) => (
                    <option key={proj.id} value={proj.id}>{idx + 1}. {proj.name}</option>
                  ))}
              </select>
              <ChevronRight className="w-4 h-4 text-gray-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-10">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 shrink-0 flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-800 flex items-center">
                Matrice d'Identification et de Résolution des Risques
              </h2>
            </div>
            
            <div className="overflow-x-auto relative max-h-[600px] hide-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap" style={{ minWidth: '2800px' }}>
                <thead className="bg-slate-800 text-white text-xs shadow-md sticky top-0 z-40">
                  <tr>
                    {/* Colonnes en-tête */}
                    <th rowSpan={2} className="px-3 py-3 border-b border-slate-700 border-r border-slate-600 text-center text-[10px] uppercase font-sans w-32">Tâche / Jalon</th>
                    <th rowSpan={2} className="px-3 py-3 border-b border-slate-700 border-r border-slate-600 text-center text-[10px] uppercase font-sans w-44">Activité</th>
                    <th rowSpan={2} className="px-3 py-3 border-b border-slate-700 border-r border-slate-600 text-center text-[10px] uppercase font-sans w-28">Date Début</th>
                    <th rowSpan={2} className="px-3 py-3 border-b border-slate-700 border-r border-slate-600 text-center text-[10px] uppercase font-sans w-28">Date Fin</th>

                    <th rowSpan={2} className="px-2 py-3 border-b border-slate-700 border-r border-slate-600 text-[10px] uppercase font-sans w-24">Type</th>
                    <th rowSpan={2} className="px-2 py-3 border-b border-slate-700 border-r border-slate-600 text-center text-[10px] uppercase font-sans w-32">Responsable</th>
                    
                    {/* Groupe Identification */}
                    <th colSpan={4} className="px-2 py-1.5 border-b border-slate-700 border-r border-slate-600 text-center bg-sky-950 text-[10px] uppercase font-sans text-sky-200">Identification</th>
                    
                    <th rowSpan={2} className="px-2 py-3 border-b border-slate-700 border-r border-slate-600 text-center text-[10px] uppercase font-sans w-32">Nature du Risque</th>
                    <th rowSpan={2} className="px-2 py-3 border-b border-slate-700 border-r border-slate-600 text-center text-[10px] uppercase font-sans w-24">Probabilité</th>
                    <th rowSpan={2} className="px-2 py-3 border-b border-slate-700 border-r border-slate-600 text-center text-[10px] uppercase font-sans w-24">Gravité (Impact)</th>
                    <th rowSpan={2} className="px-2 py-3 border-b border-slate-700 border-r border-slate-600 text-center text-[10px] uppercase font-sans w-24">Criticité</th>
                    <th rowSpan={2} className="px-2 py-3 border-b border-slate-700 border-r border-slate-600 text-center text-[10px] uppercase font-sans w-28">Conséquence si avéré</th>
                    <th rowSpan={2} className="px-2 py-3 border-b border-slate-700 border-r border-slate-600 text-center text-[10px] uppercase font-sans w-24">Tendance</th>
                    <th rowSpan={2} className="px-2 py-3 border-b border-slate-700 border-r border-slate-600 text-center text-[10px] uppercase font-sans w-40">Action Préventive</th>
                    <th rowSpan={2} className="px-2 py-3 border-b border-slate-700 border-r border-slate-600 text-center text-[10px] uppercase font-sans w-40">Action Corrective</th>
                    
                    {/* Groupe Résolution */}
                    <th colSpan={3} className="px-2 py-1.5 border-b border-slate-700 border-r border-slate-600 text-center bg-emerald-950 text-[10px] uppercase font-sans text-emerald-200">Résolution</th>
                    
                    <th rowSpan={2} className="px-2 py-3 border-b border-slate-700 text-center bg-slate-700 w-20 min-w-[80px] text-[10px] uppercase sticky right-0 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.3)] font-sans">Actions</th>
                  </tr>
                  <tr className="bg-slate-700 text-[9px] text-white">
                    {/* Sous-colonnes d'identification */}
                    <th className="px-2 py-1.5 border-b border-slate-600 border-r text-center w-56">Intitulé du risque</th>
                    <th className="px-2 py-1.5 border-b border-slate-600 border-r text-center w-28">Date d'id.</th>
                    <th className="px-2 py-1.5 border-b border-slate-600 border-r text-center w-32">Déclaré par</th>
                    <th className="px-2 py-1.5 border-b border-slate-600 border-r text-center w-28">Statut</th>
                    
                    {/* Sous-colonnes de résolution */}
                    <th className="px-2 py-1.5 border-b border-slate-600 border-r text-center w-28">Date de résol.</th>
                    <th className="px-2 py-1.5 border-b border-slate-600 border-r text-center w-40">Résolution finale</th>
                    <th className="px-2 py-1.5 border-b border-slate-600 border-r text-center w-40">Commentaire</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 font-sans">
                  {enrichedProjects.map(project => {
                    return (
                      <React.Fragment key={project.id}>
                        <tr className="bg-gray-200 border-b">
                          <td colSpan={colSpanCount} className="px-3 py-2.5 font-bold text-gray-800 text-sm bg-gray-200 z-20 relative">
                            <div className="flex justify-between items-center w-full sticky left-4">
                              <span className="flex items-center">
                                <Unlock className="w-3.5 h-3.5 mr-2 text-teal-600 animate-pulse" />
                                Projet : <span className="text-teal-700 ml-1 font-black">{project.name || ''}</span>
                              </span>
                            </div>
                          </td>
                        </tr>
                        
                        {project.groups.map((group, idx) => (
                          <React.Fragment key={`${project.id}-phase-${idx}`}>
                            <tr className="bg-slate-700 border-b border-slate-600">
                              <td colSpan={colSpanCount} className="p-0">
                                <div className="px-3 py-1.5 w-max text-sky-200 font-bold text-[11px] uppercase tracking-widest flex items-center sticky left-4">
                                  PHASE DU CYCLE : {group.phase}
                                  <div className="flex space-x-2">
                                    <button 
                                      onClick={() => openInlineAdd(project.dossierId || '', project.axeId || '', project.id, group.phase, 'tache')} 
                                      className="ml-4 bg-teal-500 hover:bg-teal-400 text-white px-2 py-0.5 rounded text-[9px] flex items-center shadow transition-colors cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3 mr-1"/> Ajouter Risque
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                            
                            {(() => {
                              const renderInlineEditRow = (itemData: TaskItem) => {
                                return (
                                <tr className="bg-sky-50/80 border-b-2 border-sky-300 shadow-inner text-xs">
                                  {/* 1. Tâche / Jalon */}
                                  <td className="px-2 py-2 border-r border-sky-200 w-32">
                                    <select 
                                      value={itemData.taskOrMilestone || 'tache'} 
                                      onChange={(e) => handleInlineChange('taskOrMilestone', e.target.value)} 
                                      className="w-full text-[10px] p-1.5 border border-sky-300 rounded font-bold text-sky-700 outline-none focus:ring-1 focus:ring-sky-500"
                                    >
                                      <option value="tache">Tâche</option>
                                      <option value="jalon">Jalon</option>
                                    </select>
                                  </td>

                                  {/* 2. Activité */}
                                  <td className="px-2 py-2 border-r border-sky-200 w-44">
                                    <input 
                                      type="text" 
                                      value={itemData.activity || ''} 
                                      onChange={(e) => handleInlineChange('activity', e.target.value)} 
                                      className="w-full text-[10px] p-1.5 border border-sky-300 rounded bg-white font-semibold text-slate-800" 
                                      placeholder="Activité support..." 
                                    />
                                  </td>

                                  {/* 3. Date Début */}
                                  <td className="px-2 py-2 border-r border-sky-200 w-28">
                                    <input 
                                      type="date" 
                                      value={itemData.startDate || ''} 
                                      onChange={(e) => handleInlineChange('startDate', e.target.value)} 
                                      className="w-full text-[10px] p-1.5 border border-sky-300 rounded bg-white" 
                                    />
                                  </td>

                                  {/* 4. Date Fin */}
                                  <td className="px-2 py-2 border-r border-sky-200 w-28">
                                    <input 
                                      type="date" 
                                      value={itemData.endDate || ''} 
                                      onChange={(e) => handleInlineChange('endDate', e.target.value)} 
                                      disabled={itemData.taskOrMilestone === 'jalon'}
                                      className="w-full text-[10px] p-1.5 border border-sky-300 rounded bg-white disabled:bg-gray-200 disabled:text-gray-400" 
                                    />
                                  </td>
                                  
                                  {/* 5. Type */}
                                  <td className="px-2 py-2 border-r border-sky-200 w-24">
                                    <span className="text-[10px] font-bold text-slate-500 px-2 py-1 bg-slate-100 rounded">
                                      {itemData.type === 'tache' ? 'R.' : 'J.'} {itemData.number || 'Nouv.'}
                                    </span>
                                  </td>
                                  
                                  {/* 6. Responsable */}
                                  <td className="px-2 py-2 border-r border-sky-200 w-32">
                                    <input type="text" value={itemData.assignee || ''} onChange={(e) => handleInlineChange('assignee', e.target.value)} className="w-full text-[10px] p-1.5 border border-sky-300 rounded mb-1 bg-white" placeholder="Nom..." />
                                    <input type="text" value={itemData.responsabilite || ''} onChange={(e) => handleInlineChange('responsabilite', e.target.value)} className="w-full text-[10px] p-1 border border-sky-300 rounded bg-white" placeholder="Rôle..." />
                                  </td>

                                  {/* Sous-colonnes d'Identification */}
                                  <td className="px-2 py-2 border-r border-sky-200 w-56">
                                    <input 
                                      type="text" 
                                      value={itemData.name || ''} 
                                      onChange={(e) => handleInlineChange('name', e.target.value)} 
                                      className="w-full text-[10px] p-1.5 border border-sky-300 rounded font-bold bg-white" 
                                      placeholder="Nom de l'incident..." 
                                      autoFocus 
                                    />
                                  </td>
                                  
                                  <td className="px-2 py-2 border-r border-sky-200 w-28">
                                    <input 
                                      type="date" 
                                      value={itemData.dateIdentification || ''} 
                                      onChange={(e) => handleInlineChange('dateIdentification', e.target.value)} 
                                      className="w-full text-[10px] p-1.5 border border-sky-300 rounded bg-white" 
                                    />
                                  </td>
                                  
                                  <td className="px-2 py-2 border-r border-sky-200 w-32">
                                    <input 
                                      type="text" 
                                      value={itemData.declarePar || ''} 
                                      onChange={(e) => handleInlineChange('declarePar', e.target.value)} 
                                      className="w-full text-[10px] p-1.5 border border-sky-300 rounded bg-white" 
                                      placeholder="Nom..." 
                                    />
                                  </td>
                                  
                                  <td className="px-2 py-2 border-r border-sky-200 w-28">
                                    <select 
                                      value={itemData.riskStatus || 'nouveau'} 
                                      onChange={(e) => handleInlineChange('riskStatus', e.target.value)} 
                                      className="w-full text-[10px] p-1.5 border border-sky-300 rounded bg-white font-bold"
                                    >
                                      {DROPDOWNS.riskStatus.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  </td>

                                  <td className="px-2 py-2 border-r border-sky-200 w-32">
                                    <select 
                                      value={itemData.nature || 'politique/ administratif'} 
                                      onChange={(e) => handleInlineChange('nature', e.target.value)} 
                                      className="w-full text-[10px] p-1.5 border border-sky-300 rounded bg-white font-semibold"
                                    >
                                      {DROPDOWNS.nature.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  </td>

                                  <td className="px-2 py-2 border-r border-sky-200 w-24">
                                    <select 
                                      value={itemData.probabilite || 'probable'} 
                                      onChange={(e) => handleInlineChange('probabilite', e.target.value)} 
                                      className="w-full text-[10px] p-1.5 border border-sky-300 rounded bg-white font-semibold"
                                    >
                                      {DROPDOWNS.probabilite.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  </td>

                                  <td className="px-2 py-2 border-r border-sky-200 w-24">
                                    <select 
                                      value={itemData.gravite || 'majeur'} 
                                      onChange={(e) => handleInlineChange('gravite', e.target.value)} 
                                      className="w-full text-[10px] p-1.5 border border-sky-300 rounded bg-white font-semibold"
                                    >
                                      {DROPDOWNS.gravite.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  </td>

                                  <td className="px-2 py-2 border-r border-sky-200 w-24">
                                    <select 
                                      value={itemData.criticite || 'modéré'} 
                                      onChange={(e) => handleInlineChange('criticite', e.target.value)} 
                                      className="w-full text-[10px] p-1.5 border border-sky-300 rounded bg-white font-semibold"
                                    >
                                      {DROPDOWNS.criticite.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  </td>

                                  <td className="px-2 py-2 border-r border-sky-200 w-28">
                                    <select 
                                      value={itemData.consequence || 'délai'} 
                                      onChange={(e) => handleInlineChange('consequence', e.target.value)} 
                                      className="w-full text-[10px] p-1.5 border border-sky-300 rounded bg-white font-semibold"
                                    >
                                      {DROPDOWNS.consequence.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  </td>

                                  <td className="px-2 py-2 border-r border-sky-200 w-24">
                                    <select 
                                      value={itemData.tendance || 'stable'} 
                                      onChange={(e) => handleInlineChange('tendance', e.target.value)} 
                                      className="w-full text-[10px] p-1.5 border border-sky-300 rounded bg-white font-semibold"
                                    >
                                      {DROPDOWNS.tendance.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  </td>

                                  <td className="px-2 py-2 border-r border-sky-200 w-40">
                                    <input 
                                      type="text" 
                                      value={itemData.actionPreventive || ''} 
                                      onChange={(e) => handleInlineChange('actionPreventive', e.target.value)} 
                                      className="w-full text-[10px] p-1.5 border border-sky-300 rounded bg-white" 
                                      placeholder="Préventive..." 
                                    />
                                  </td>

                                  <td className="px-2 py-2 border-r border-sky-200 w-40">
                                    <input 
                                      type="text" 
                                      value={itemData.actionCorrective || ''} 
                                      onChange={(e) => handleInlineChange('actionCorrective', e.target.value)} 
                                      className="w-full text-[10px] p-1.5 border border-sky-300 rounded bg-white" 
                                      placeholder="Corrective..." 
                                    />
                                  </td>

                                  {/* Sous-colonnes de Résolution */}
                                  <td className="px-2 py-2 border-r border-sky-200 w-28">
                                    <input 
                                      type="date" 
                                      value={itemData.dateResolution || ''} 
                                      onChange={(e) => handleInlineChange('dateResolution', e.target.value)} 
                                      className="w-full text-[10px] p-1.5 border border-sky-300 rounded bg-white" 
                                    />
                                  </td>
                                  
                                  <td className="px-2 py-2 border-r border-sky-200 w-40">
                                    <input 
                                      type="text" 
                                      value={itemData.resolutionFinale || ''} 
                                      onChange={(e) => handleInlineChange('resolutionFinale', e.target.value)} 
                                      className="w-full text-[10px] p-1.5 border border-sky-300 rounded bg-white" 
                                      placeholder="Détails finaux..." 
                                    />
                                  </td>
                                  
                                  <td className="px-2 py-2 border-r border-sky-200 w-40">
                                    <input 
                                      type="text" 
                                      value={itemData.commentaire || ''} 
                                      onChange={(e) => handleInlineChange('commentaire', e.target.value)} 
                                      className="w-full text-[10px] p-1.5 border border-sky-300 rounded bg-white" 
                                      placeholder="Notes additionnelles..." 
                                    />
                                  </td>

                                  {/* Actions */}
                                  <td className="px-2 py-2 text-center bg-sky-50/90 sticky right-0 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] w-20">
                                    <div className="flex justify-center gap-1.5">
                                      <button onClick={saveInlineEdit} className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded shadow-sm cursor-pointer" title="Enregistrer"><Save className="w-4 h-4"/></button>
                                      <button onClick={cancelInlineEdit} className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded shadow-sm cursor-pointer" title="Annuler"><X className="w-4 h-4"/></button>
                                    </div>
                                  </td>
                                </tr>
                                );
                              };

                              const isAddingNew = inlineEdit && inlineEdit.taskId === 'new' && inlineEdit.projectId === project.id && inlineEdit.phase === group.phase;

                              return (
                                <>
                                  {group.items.length === 0 && !isAddingNew ? (
                                    <tr>
                                      <td colSpan={colSpanCount} className="px-8 py-3 text-left text-slate-400 italic text-[11px] bg-slate-50">
                                        Aucun incident d'entraînement n'est encore consigné pour cette phase du cycle.
                                      </td>
                                    </tr>
                                  ) : (
                                    group.items.map((item) => {
                                      if (inlineEdit && inlineEdit.taskId === item.id) {
                                        return <React.Fragment key={`edit-${item.id}`}>{renderInlineEditRow(inlineEdit.data)}</React.Fragment>;
                                      }
                                      return (
                                        <tr key={item.id} className="group border-b hover:bg-sky-50/40 transition-colors text-xs bg-slate-50 font-sans">
                                          {/* 1. Tâche / Jalon */}
                                          <td className="px-3 py-1.5 text-center border-r border-gray-200 w-32 font-bold">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                              (item.taskOrMilestone || item.type) === 'jalon' 
                                                ? 'bg-orange-100 text-orange-800' 
                                                : 'bg-blue-100 text-blue-800'
                                            }`}>
                                              {(item.taskOrMilestone || item.type) === 'jalon' ? 'Jalon' : 'Tâche'}
                                            </span>
                                          </td>

                                          {/* 2. Activité */}
                                          <td className="px-3 py-1.5 border-r border-gray-200 w-44 font-bold text-slate-700 whitespace-normal leading-tight text-[10.5px]">
                                            {item.activity || '—'}
                                          </td>

                                          {/* 3. Date Début */}
                                          <td className="px-3 py-1.5 text-center border-r border-gray-200 text-slate-600 text-[10px] w-28 font-medium">
                                            {item.startDate || '—'}
                                          </td>

                                          {/* 4. Date Fin */}
                                          <td className="px-3 py-1.5 text-center border-r border-gray-200 text-slate-600 text-[10px] w-28 font-medium">
                                            {item.endDate || '—'}
                                          </td>

                                          {/* 5. Type */}
                                          <td className="px-2 py-1.5 font-bold text-sky-600 border-r border-gray-200 w-24 text-[11px]">
                                            <div className="flex items-center">
                                              <span className="w-auto mr-1">{item.type === 'tache' ? `R. ${item.number}` : `J. ${item.number}`}</span>
                                              {(item.taskOrMilestone || item.type) === 'jalon' && <Diamond className="w-3 h-3 text-amber-500 fill-current shrink-0" />}
                                            </div>
                                          </td>
                                          
                                          {/* 6. Responsable */}
                                          <td className="px-2 py-1.5 border-r border-gray-200 text-[11px] w-32">
                                            <div className="font-bold text-slate-700 truncate">{item.assignee || '—'}</div>
                                            <div className="text-[9px] text-gray-400 font-normal truncate">{item.responsabilite || '—'}</div>
                                          </td>

                                          {/* Identification Sub-columns */}
                                          <td className="px-2 py-1.5 font-semibold text-slate-800 whitespace-normal leading-tight w-56 border-r border-gray-200 text-[10px]">
                                            {item.name || '—'}
                                          </td>
                                          
                                          <td className="px-2 py-1.5 text-center text-slate-600 border-r border-gray-200 text-[10px] w-28">
                                            {item.dateIdentification || item.startDate || '—'}
                                          </td>
                                          
                                          <td className="px-2 py-1.5 text-center text-slate-600 border-r border-gray-200 text-[10px] w-32 truncate">
                                            {item.declarePar || '—'}
                                          </td>
                                          
                                          <td className="px-2 py-1.5 text-center border-r border-gray-200 text-[10px] w-28">
                                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                                              item.riskStatus === 'traité' ? 'bg-green-100 text-green-800 border border-green-200' :
                                              item.riskStatus === 'en traitement' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                              item.riskStatus === 'bloqué' ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse' :
                                              'bg-slate-100 text-slate-700 border border-slate-200'
                                            }`}>
                                              {item.riskStatus || 'nouveau'}
                                            </span>
                                          </td>

                                          <td className="px-2 py-1.5 text-center border-r border-gray-200 text-[10px] w-32 capitalize text-slate-700 truncate">
                                            {item.nature || '—'}
                                          </td>

                                          <td className="px-2 py-1.5 text-center border-r border-gray-200 text-[10px] w-24 capitalize font-semibold text-slate-700">
                                            {item.probabilite || '—'}
                                          </td>

                                          <td className="px-2 py-1.5 text-center border-r border-gray-200 text-[10px] w-24 capitalize font-semibold text-slate-700">
                                            {item.gravite || '—'}
                                          </td>

                                          <td className="px-2 py-1.5 text-center border-r border-gray-200 text-[10px] w-24">
                                            <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                                              item.criticite === 'tres critique' ? 'bg-red-100 text-red-800' :
                                              item.criticite === 'critique' ? 'bg-orange-100 text-orange-800' :
                                              'bg-blue-100 text-blue-800'
                                            }`}>
                                              {item.criticite || '—'}
                                            </span>
                                          </td>

                                          <td className="px-2 py-1.5 text-center border-r border-gray-200 text-[10px] w-28">
                                            <span className="bg-sky-50 text-sky-800 px-1.5 py-0.5 rounded font-bold uppercase text-[9px]">
                                              {item.consequence || '—'}
                                            </span>
                                          </td>

                                          <td className="px-2 py-1.5 text-center border-r border-gray-200 text-[10px] w-24">
                                            <span className={`inline-flex items-center gap-1 font-bold ${
                                              item.tendance === 'hausse' ? 'text-rose-600' :
                                              item.tendance === 'baisse' ? 'text-emerald-600' :
                                              'text-slate-500'
                                            }`}>
                                              {item.tendance === 'hausse' ? '▲ Hausse' :
                                               item.tendance === 'baisse' ? '▼ Baisse' :
                                               '◀▶ Stable'}
                                            </span>
                                          </td>

                                          <td className="px-2 py-1.5 border-r border-gray-200 text-[10px] w-40 max-w-[160px] truncate text-slate-600 italic" title={item.actionPreventive}>
                                            {item.actionPreventive || '—'}
                                          </td>

                                          <td className="px-2 py-1.5 border-r border-gray-200 text-[10px] w-40 max-w-[160px] truncate text-slate-600 italic" title={item.actionCorrective}>
                                            {item.actionCorrective || '—'}
                                          </td>

                                          {/* Résolution Sub-columns */}
                                          <td className="px-2 py-1.5 text-center border-r border-gray-200 text-[10px] w-28 text-slate-600">
                                            {item.dateResolution || '—'}
                                          </td>
                                          
                                          <td className="px-2 py-1.5 border-r border-gray-200 text-[10px] w-40 max-w-[160px] truncate text-slate-700 font-medium" title={item.resolutionFinale}>
                                            {item.resolutionFinale || '—'}
                                          </td>
                                          
                                          <td className="px-2 py-1.5 border-r border-gray-200 text-[10px] w-40 max-w-[160px] truncate text-slate-500" title={item.commentaire}>
                                            {item.commentaire || '—'}
                                          </td>
                                          
                                          {/* Actions */}
                                          <td className="px-2 py-1.5 text-center bg-white sticky right-0 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] w-20">
                                            {taskDeleteConfirmation === item.id ? (
                                              <div className="flex flex-col gap-1 items-center animate-in fade-in">
                                                <span className="text-[8px] text-red-600 font-bold leading-none uppercase">Sûr ?</span>
                                                <div className="flex gap-1">
                                                  <button onClick={() => handleDeleteTask(project.dossierId || '', project.axeId || '', project.id, item.id)} className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer">Oui</button>
                                                  <button onClick={() => setTaskDeleteConfirmation(null)} className="bg-gray-300 text-gray-800 px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer">Non</button>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="flex justify-center gap-2">
                                                <button onClick={() => openInlineEdit(project.dossierId || '', project.axeId || '', project.id, item)} className="text-sky-600 hover:bg-sky-50 p-1.5 rounded cursor-pointer" title="Modifier">
                                                  <Edit className="w-3.5 h-3.5"/>
                                                </button>
                                                <button onClick={() => setTaskDeleteConfirmation(item.id)} className="text-red-400 hover:bg-red-50 p-1.5 rounded cursor-pointer" title="Supprimer">
                                                  <Trash2 className="w-3.5 h-3.5"/>
                                                </button>
                                              </div>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })
                                  )}
                                  
                                  {isAddingNew && renderInlineEditRow(inlineEdit.data)}
                                </>
                              );
                            })()}
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGantt = () => {
    let filteredProjects = allProjects;
    if (filterGanttAxe !== 'FULL') filteredProjects = filteredProjects.filter(p => p.axeId === filterGanttAxe);
    if (filterGanttProj !== 'FULL') filteredProjects = filteredProjects.filter(p => p.id === filterGanttProj);

    const enrichedProjects = filteredProjects.map(project => {
      const phaseGroups = STANDARD_PHASES.map(phaseName => {
        const pTasks = Array.isArray(project.tasks) ? project.tasks.filter(t => t.phase === phaseName) : [];
        let minStart = Infinity;
        pTasks.forEach(t => {
            const d = new Date(t.dateIdentification || t.startDate).getTime();
            if (!isNaN(d) && d < minStart) minStart = d;
        });
        return { phase: phaseName, tasks: pTasks, minStart };
      });

      phaseGroups.sort((a, b) => {
        if (a.minStart === Infinity && b.minStart === Infinity) return STANDARD_PHASES.indexOf(a.phase) - STANDARD_PHASES.indexOf(b.phase);
        if (a.minStart === Infinity) return 1;
        if (b.minStart === Infinity) return -1;
        return a.minStart - b.minStart;
      });

      phaseGroups.forEach(group => {
        group.tasks.sort((a, b) => {
          const dA = new Date(a.dateIdentification || a.startDate).getTime();
          const dB = new Date(b.dateIdentification || b.startDate).getTime();
          if (isNaN(dA) && isNaN(dB)) return 0;
          if (isNaN(dA)) return 1;
          if (isNaN(dB)) return -1;
          return dA - dB;
        });
      });

      const groups = phaseGroups.map((group, phaseIndex) => {
        const items = group.tasks.map((t, idx) => {
          return { 
            ...t, 
            number: `${phaseIndex + 1}.${idx + 1}`
          };
        });
        return { phase: group.phase, items };
      });
      return { ...project, groups };
    });

    let totalMinStart = Infinity;
    let totalMaxEnd = -Infinity;
    let hasTotalValidDates = false;

    enrichedProjects.forEach(project => {
      project.groups.forEach(group => {
        group.items.forEach(t => {
          const sd = new Date(t.dateIdentification || t.startDate).getTime();
          const ed = new Date(t.dateResolution || t.endDate).getTime();
          if (!isNaN(sd) && !isNaN(ed)) {
            hasTotalValidDates = true;
            if (sd < totalMinStart) totalMinStart = sd;
            if (ed > totalMaxEnd) totalMaxEnd = ed;
          }
        });
      });
    });

    let totalCpmText: string | null = null;
    if (hasTotalValidDates) {
      const diffDays = Math.ceil((totalMaxEnd - totalMinStart) / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays >= 365) {
          const years = (diffDays / 365).toFixed(1);
          totalCpmText = `${years} an${Number(years) > 1 ? 's' : ''} (${diffDays} j)`;
      } else if (diffDays >= 30) {
          const months = (diffDays / 30).toFixed(1);
          totalCpmText = `~${months} mois (${diffDays} j)`;
      } else {
          totalCpmText = `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      }
    }

    return (
      <div className="animate-in fade-in duration-500 pb-10 flex flex-col h-full font-sans">
        <div className="flex justify-between items-center border-b pb-1 border-sky-200 shrink-0 mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center"><CalendarDays className="w-5 h-5 mr-2 text-sky-500" /> Chronogramme d'exposition aux Risques</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4 shrink-0">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Filter className="w-3 h-3 mr-1" /> 1. Filtrer par Axe Stratégique
            </label>
            <div className="relative">
              <select 
                className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-800 text-sm font-medium rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 p-2.5 pr-8 outline-none transition-shadow cursor-pointer"
                value={filterGanttAxe}
                onChange={(e) => { 
                  setFilterGanttAxe(e.target.value); 
                  setFilterGanttProj('FULL');
                }}
              >
                <option value="FULL">Toutes les données (Vue Globale)</option>
                {activeDossier?.axes?.map(axe => (
                  <option key={axe.id} value={axe.id}>{axe.name}</option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 text-gray-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Filter className="w-3 h-3 mr-1" /> 2. Filtrer par Projet OP
            </label>
            <div className="relative">
              <select 
                className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-800 text-sm font-medium rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 p-2.5 pr-8 outline-none transition-shadow cursor-pointer"
                value={filterGanttProj}
                onChange={(e) => setFilterGanttProj(e.target.value)}
              >
                <option value="FULL">Tous les projets {filterGanttAxe !== 'FULL' ? 'de cet axe' : ''}</option>
                {allProjects
                  .filter(p => filterGanttAxe === 'FULL' || p.axeId === filterGanttAxe)
                  .map((proj, idx) => (
                    <option key={proj.id} value={proj.id}>{idx + 1}. {proj.name}</option>
                  ))}
              </select>
              <ChevronRight className="w-4 h-4 text-gray-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 shrink-0 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center">
              <CalendarDays className="w-5 h-5 mr-2 text-sky-600" />
              Planification Temporelle d'exposition
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-3 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm bg-white text-xs font-bold text-slate-600">
                <div className="flex items-center"><div className="w-3 h-1.5 bg-sky-300 rounded mr-1.5"></div>Actif (En attente)</div>
                <div className="flex items-center"><div className="w-3 h-1.5 bg-emerald-500 rounded mr-1.5"></div>Résolu</div>
              </div>
              
              {totalCpmText && (
                <div className="flex items-center space-x-2 px-4 py-1.5 rounded-lg border border-sky-300 shadow-inner bg-gradient-to-r from-sky-50 to-sky-100 text-xs font-black text-sky-800">
                  <Activity className="w-4 h-4 text-sky-600 animate-pulse" />
                  <span className="uppercase tracking-widest">Horizon : {totalCpmText}</span>
                </div>
              )}

              <div className="flex items-center space-x-3 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm text-sm flex-wrap">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="font-bold text-gray-600 text-xs">Vue :</span>
                <select value={ganttViewMode} onChange={e => setGanttViewMode(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-xs cursor-pointer">
                  <option value="jour">Jours</option>
                  <option value="semaine">Semaines</option>
                  <option value="mois">Mois</option>
                  <option value="trimestre">Trimestres</option>
                  <option value="semestre">Semestres</option>
                </select>
                <div className="h-4 w-px bg-gray-300 mx-2"></div>
                <span className="font-bold text-gray-600 text-xs">Période :</span>
                <input type="month" value={ganttStartMonth} onChange={e => setGanttStartMonth(e.target.value)} className="border border-gray-300 rounded px-1.5 py-1 text-xs cursor-pointer"/>
                <span className="text-gray-400 font-bold text-xs">à</span>
                <input type="month" value={ganttEndMonth} onChange={e => setGanttEndMonth(e.target.value)} className="border border-gray-300 rounded px-1.5 py-1 text-xs cursor-pointer"/>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto relative max-h-[600px] hide-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-max">
              <thead className="bg-slate-800 text-white text-xs shadow-md sticky top-0 z-40">
                <tr>
                  <th className="px-2 py-3 border-b border-slate-700 border-r border-slate-600 sticky left-0 bg-slate-800 z-50 w-24 text-[10px] uppercase" rowSpan={2}>Risque</th>
                  <th className="px-3 py-3 border-b border-slate-700 border-r border-slate-600 sticky left-[96px] bg-slate-800 z-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] w-48 text-[10px] uppercase" rowSpan={2}>Intitulé</th>
                  <th className="px-1 py-3 border-b border-slate-700 border-r text-center w-16 text-[10px] uppercase" rowSpan={2}>Criticité</th>
                  {ganttParents.map((parent, idx) => (
                    <th key={idx} className="px-4 py-1.5 border-b border-slate-700 border-r text-center font-bold" colSpan={parent.count}>{parent.label}</th>
                  ))}
                </tr>
                <tr className="bg-slate-700">
                  {ganttColumns.map((col, i) => (
                    <th key={i} className="px-2 py-1.5 text-center border-r border-slate-600 text-[10px] min-w-[40px]">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {enrichedProjects.length === 0 && (
                  <tr><td colSpan={3 + ganttColumns.length} className="text-center py-12 text-gray-400 italic">Aucun incident ne correspond à cette sélection.</td></tr>
                )}
                {enrichedProjects.map(project => {
                  return (
                    <React.Fragment key={`gantt-p-${project.id}`}>
                      <tr className="bg-gray-200 border-b">
                        <td colSpan={3 + ganttColumns.length} className="px-4 py-3 font-bold text-gray-800 text-sm bg-gray-200 z-20 relative">
                          <div className="flex justify-between items-center w-max sticky left-4 z-40">
                            <span className="flex items-center">
                              Projet : <span className="text-sky-600 ml-1 font-black">{project.name || ''}</span>
                            </span>
                          </div>
                        </td>
                      </tr>
                      
                      {project.groups.map((group, idx) => (
                        <React.Fragment key={`gantt-${project.id}-phase-${idx}`}>
                          {(() => {
                            let phaseSpanText: string | null = null;
                            if (group.items && group.items.length > 0) {
                              let minStart = Infinity;
                              let maxEnd = -Infinity;
                              let hasValidDates = false;

                              group.items.forEach(t => {
                                const sd = new Date(t.dateIdentification || t.startDate).getTime();
                                const ed = new Date(t.dateResolution || t.endDate).getTime();
                                if (!isNaN(sd) && !isNaN(ed)) {
                                  hasValidDates = true;
                                  if (sd < minStart) minStart = sd;
                                  if (ed > maxEnd) maxEnd = ed;
                                }
                              });

                              if (hasValidDates) {
                                const diffDays = Math.ceil((maxEnd - minStart) / (1000 * 60 * 60 * 24)) + 1;
                                if (diffDays >= 365) {
                                    const years = (diffDays / 365).toFixed(1);
                                    phaseSpanText = `Cycle : ${years} an${Number(years) > 1 ? 's' : ''} (${diffDays} j)`;
                                } else if (diffDays >= 30) {
                                    const months = (diffDays / 30).toFixed(1);
                                    phaseSpanText = `Cycle : ~${months} mois (${diffDays} j)`;
                                } else {
                                    phaseSpanText = `Cycle : ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
                                }
                              }
                            }

                            return (
                              <tr className="bg-slate-700 border-b border-slate-600">
                                <td colSpan={3 + ganttColumns.length} className="p-0">
                                  <div className="px-4 py-2 w-max text-sky-200 font-bold text-xs uppercase tracking-widest flex items-center sticky left-4 z-40">
                                    <span>PHASE : {group.phase}</span>
                                    {phaseSpanText && (
                                      <span className="ml-6 text-sky-300 font-black text-[10px] bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-sky-500/30 shadow-sm whitespace-nowrap tracking-normal flex items-center">
                                        <Activity className="w-3 h-3 mr-1" />
                                        {phaseSpanText}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })()}
                          
                          {group.items.length === 0 ? (
                            <tr>
                              <td colSpan={3 + ganttColumns.length} className="px-8 py-3 text-left text-slate-400 italic text-[11px] bg-slate-50">
                                Aucun risque n'est encore enregistré pour cette phase.
                              </td>
                            </tr>
                          ) : (
                            group.items.map((item) => (
                              <tr key={`gantt-t-${item.id}`} className="group border-b hover:bg-sky-50/40 transition-colors text-xs bg-slate-50">
                                <td className="px-2 py-3 font-bold text-sky-600 sticky left-0 bg-slate-50 group-hover:bg-sky-50 z-30 border-r border-gray-200 w-24 text-[11px]">
                                  <div className="flex items-center">
                                    <span className="w-auto mr-1 truncate">{item.type === 'tache' ? `R. ${item.number}` : `J. ${item.number}`}</span>
                                    {(item.taskOrMilestone || item.type) === 'jalon' && <Diamond className="w-3 h-3 text-amber-500 fill-current shrink-0" />}
                                  </div>
                                </td>
                                <td className="px-2 py-3 font-bold text-slate-800 border-r border-gray-200 text-[11px] sticky left-[96px] bg-slate-50 group-hover:bg-sky-50 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-48 truncate">{item.name || ''}</td>
                                <td className="px-1 py-3 text-slate-600 text-center font-bold border-r border-gray-200 bg-slate-50/50 text-[10px] w-16 uppercase">{item.criticite || '—'}</td>
                                
                                {ganttColumns.map((col, i) => {
                                  const sd = new Date(item.dateIdentification || item.startDate);
                                  const ed = new Date(item.dateResolution || item.endDate || item.startDate);
                                  
                                  const isTraité = item.riskStatus === 'traité';
                                  const colStart = col.start.getTime();
                                  const colEnd = col.end.getTime();

                                  let pActive = false, pStart = false, pEnd = false;
                                  if (!isNaN(sd.getTime())) {
                                    const st = sd.getTime();
                                    const et = ed && !isNaN(ed.getTime()) ? ed.getTime() : st + (24*60*60*1000*30);
                                    pActive = st <= colEnd && et >= colStart;
                                    pStart = st >= colStart && st <= colEnd;
                                    pEnd = et >= colStart && et <= colEnd;
                                  }

                                  const isJalon = (item.taskOrMilestone || item.type) === 'jalon';

                                  let pClasses = `absolute top-3 h-2 ${isTraité ? 'bg-emerald-400' : 'bg-red-400'} z-10 transition-all `;
                                  if (isJalon) {
                                      pClasses = 'absolute top-2 h-4 w-4 bg-sky-300 rounded-full z-10 left-1/2 -translate-x-1/2 flex items-center justify-center shadow-sm';
                                  } else {
                                      if (pStart && pEnd) pClasses += 'left-1 right-1 rounded-full';
                                      else if (pStart) pClasses += 'left-1 right-[-1px] rounded-l-full';
                                      else if (pEnd) pClasses += 'left-0 right-1 rounded-r-full';
                                      else pClasses += 'left-0 right-[-1px]';
                                  }

                                  return (
                                    <td key={i} className={`p-0 border-r border-gray-100 min-w-[40px] h-10 relative ${pActive ? 'bg-slate-50/50' : ''}`}>
                                      {pActive && (
                                        <div className={pClasses} title={`Exposition : ${item.name} (${sd.toLocaleDateString('fr-FR')} - ${ed ? ed.toLocaleDateString('fr-FR') : 'En cours'})`}>
                                          {isJalon && <Diamond className="w-2.5 h-2.5 text-white fill-current" />}
                                        </div>
                                      )}
                                    </td>
                                  )
                                })}
                              </tr>
                            ))
                          )}
                        </React.Fragment>
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

  const renderKanban = () => {
    let filteredProjects = allProjects;
    if (filterKanbanAxe !== 'FULL') filteredProjects = filteredProjects.filter(p => p.axeId === filterKanbanAxe);
    if (filterKanbanProj !== 'FULL') filteredProjects = filteredProjects.filter(p => p.id === filterKanbanProj);
    const validProjIds = filteredProjects.map(p => p.id);

    const tasksToRender = allTasks
      .filter(t => validProjIds.includes(t.projectId || ''))
      .sort((a, b) => {
        const dA = new Date(a.dateIdentification || a.startDate).getTime();
        const dB = new Date(b.dateIdentification || b.startDate).getTime();
        if (isNaN(dA) && isNaN(dB)) return 0;
        if (isNaN(dA)) return 1;
        if (isNaN(dB)) return -1;
        return dA - dB;
      });
    
    const cols = [
      { id: 'nouveau', title: 'Nouveau', color: 'border-gray-300', bg: 'bg-gray-100' },
      { id: 'en traitement', title: 'En cours', color: 'border-sky-400', bg: 'bg-sky-50' },
      { id: 'bloqué', title: 'Bloqué', color: 'border-rose-400', bg: 'bg-rose-50' },
      { id: 'traité', title: 'Traité', color: 'border-green-400', bg: 'bg-green-50' }
    ];

    const handleDragStart = (e: React.DragEvent, task: TaskItem) => {
      if (task.isReadOnly) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData('taskId', task.id);
      e.dataTransfer.setData('projectId', task.projectId || '');
      e.dataTransfer.setData('axeId', task.axeId || '');
      e.dataTransfer.setData('dossierId', task.dossierId || '');
    };

    const handleDrop = (e: React.DragEvent, newRiskStatus: string) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('taskId');
      const projectId = e.dataTransfer.getData('projectId');
      const axeId = e.dataTransfer.getData('axeId');
      const dossierId = e.dataTransfer.getData('dossierId');
      
      if (taskId && projectId && axeId && dossierId) {
        let matchedStatus = 'À faire';
        if (newRiskStatus === 'traité') matchedStatus = 'Terminé';
        if (newRiskStatus === 'en traitement') matchedStatus = 'En cours';
        if (newRiskStatus === 'bloqué') matchedStatus = 'Bloqué';
        
        setData(data.map(d => {
          if (d.id !== dossierId) return d;
          return {
            ...d, axes: d.axes.map(a => {
              if (a.id !== axeId) return a;
              return {
                ...a, projects: a.projects.map(p => {
                  if (p.id !== projectId) return p;
                  return {
                    ...p, tasks: p.tasks.map(t => {
                      if (t.id === taskId) {
                        return { ...t, riskStatus: newRiskStatus, status: matchedStatus };
                      }
                      return t;
                    })
                  };
                })
              };
            })
          };
        }));
      }
    };

    return (
      <div className="animate-in fade-in duration-500 pb-10 flex flex-col h-full font-sans">
        <div className="flex justify-between items-center border-b pb-1 border-sky-200 shrink-0 mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center"><Grid className="w-5 h-5 mr-2 text-sky-500" /> Tableau Kanban des Risques</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4 shrink-0">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Filter className="w-3 h-3 mr-1" /> 1. Filtrer par Axe Stratégique
            </label>
            <div className="relative">
              <select 
                className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-800 text-sm font-medium rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 p-2.5 pr-8 outline-none transition-shadow cursor-pointer"
                value={filterKanbanAxe}
                onChange={(e) => { 
                  setFilterKanbanAxe(e.target.value); 
                  setFilterKanbanProj('FULL');
                }}
              >
                <option value="FULL">Toutes les données (Vue Globale)</option>
                {activeDossier?.axes?.map(axe => (
                  <option key={axe.id} value={axe.id}>{axe.name}</option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 text-gray-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center">
              <Filter className="w-3 h-3 mr-1" /> 2. Filtrer par Projet OP
            </label>
            <div className="relative">
              <select 
                className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-800 text-sm font-medium rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 p-2.5 pr-8 outline-none transition-shadow cursor-pointer"
                value={filterKanbanProj}
                onChange={(e) => setFilterKanbanProj(e.target.value)}
              >
                <option value="FULL">Tous les projets {filterKanbanAxe !== 'FULL' ? 'de cet axe' : ''}</option>
                {allProjects
                  .filter(p => filterKanbanAxe === 'FULL' || p.axeId === filterKanbanAxe)
                  .map((proj, idx) => (
                    <option key={proj.id} value={proj.id}>{idx + 1}. {proj.name}</option>
                ))}
              </select>
              <ChevronRight className="w-4 h-4 text-gray-400 absolute right-3 top-3 rotate-90 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 h-full items-start">
          {cols.map(col => (
            <div 
              key={col.id} 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`${col.bg} p-3 rounded-lg min-w-[300px] flex-1 flex flex-col max-h-full border border-gray-200 shadow-sm transition-colors duration-200`}
            >
              <h3 className="font-bold border-b border-gray-200 pb-2 mb-3 text-gray-700 flex justify-between items-center text-xs uppercase tracking-wider">
                {col.title} <span className="bg-white text-xs px-2.5 py-1 rounded-full shadow-sm font-black">{tasksToRender.filter(t => (t.riskStatus || 'nouveau') === col.id).length}</span>
              </h3>
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 hide-scrollbar min-h-[150px]">
                {tasksToRender.filter(t => (t.riskStatus || 'nouveau') === col.id).length === 0 && (
                  <div className="text-center text-xs text-gray-400 italic py-8 pointer-events-none">Aucun risque ici.</div>
                )}
                {tasksToRender.filter(t => (t.riskStatus || 'nouveau') === col.id).map(task => (
                  <KanbanCard key={task.id} task={task} borderColor={col.color} onDragStart={handleDragStart} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-sky-50/20 flex flex-col font-sans text-slate-800">
      <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-3 flex justify-between items-center shrink-0 z-50 relative font-sans">
        <div className="flex items-center space-x-3">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 mr-1 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-200 cursor-pointer"><Menu className="w-5 h-5" /></button>
          <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-inner uppercase tracking-wider">{currentInstitution.substring(0, 4)}</div>
          <div>
            <h1 className="text-xl font-black text-gray-800 leading-none tracking-tight uppercase">{currentInstitution}</h1>
            <p className="text-xs text-sky-600 font-bold tracking-wide uppercase mt-0.5">
              {isExploring && activeDossier ? activeDossier.name : "Suivi des risques & performance"}
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className={`bg-white border-gray-200 shrink-0 flex flex-col transition-all duration-300 ease-in-out overflow-hidden z-40 relative shadow-[4px_0_15px_-3px_rgba(0,0,0,0.05)] border-r ${isSidebarOpen ? 'w-56' : 'w-[72px]'}`}>
          <div className="w-full px-3 py-6 flex flex-col h-full overflow-y-auto hide-scrollbar overflow-x-hidden">
            <nav className="space-y-1.5 flex-1 text-[13px] font-bold">
              <button onClick={() => { setActiveTab('accueil'); setIsExploring(false); }} className={`w-full flex items-center ${isSidebarOpen ? 'px-4 space-x-3' : 'justify-center'} py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'accueil' ? 'bg-sky-600 text-white shadow-lg' : 'text-gray-400 hover:bg-sky-50 hover:text-sky-600'}`}>
                <Home className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span>Accueil</span>}
              </button>

              <button onClick={() => { setActiveTab('projects'); setIsExploring(false); }} className={`w-full flex items-center ${isSidebarOpen ? 'px-4 space-x-3' : 'justify-center'} py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'projects' ? 'bg-sky-600 text-white shadow-lg' : 'text-gray-400 hover:bg-sky-50 hover:text-sky-600'}`}>
                <Folder className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span>Portefeuilles</span>}
              </button>
              
              {isExploring && (
                <>
                  {isSidebarOpen && activeDossier && (
                    <div className="my-2 p-2 bg-sky-50 border border-sky-100 rounded-lg flex items-center shadow-inner animate-in fade-in">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 animate-pulse shrink-0"></div>
                      <span className="text-[10px] font-black text-sky-800 truncate" title={activeDossier.name}>{activeDossier.name}</span>
                    </div>
                  )}
                  <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center ${isSidebarOpen ? 'px-4 space-x-3' : 'justify-center'} py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-[#3F9384] text-white shadow-lg shadow-teal-100' : 'text-gray-400 hover:bg-teal-50 hover:text-teal-600'}`}>
                    <LayoutDashboard className="w-5 h-5 shrink-0" />
                    {isSidebarOpen && <span>Dashboard</span>}
                  </button>
                  <button onClick={() => setActiveTab('processus')} className={`w-full flex items-center ${isSidebarOpen ? 'px-4 space-x-3' : 'justify-center'} py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'processus' ? 'bg-[#3F9384] text-white shadow-lg shadow-teal-100' : 'text-gray-400 hover:bg-teal-50 hover:text-teal-600'}`}>
                    <Activity className="w-5 h-5 shrink-0" />
                    {isSidebarOpen && <span>Saisie Opérations</span>}
                  </button>
                  <button onClick={() => setActiveTab('matrice')} className={`w-full flex items-center ${isSidebarOpen ? 'px-4 space-x-3' : 'justify-center'} py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'matrice' ? 'bg-[#3F9384] text-white shadow-lg shadow-teal-100' : 'text-gray-400 hover:bg-teal-50 hover:text-teal-600'}`}>
                    <Grid className="w-5 h-5 shrink-0" />
                    {isSidebarOpen && <span>Matrice des Risques</span>}
                  </button>
                  <button onClick={() => setActiveTab('gantt')} className={`w-full flex items-center ${isSidebarOpen ? 'px-4 space-x-3' : 'justify-center'} py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'gantt' ? 'bg-[#3F9384] text-white shadow-lg shadow-teal-100' : 'text-gray-400 hover:bg-teal-50 hover:text-teal-600'}`}>
                    <CalendarDays className="w-5 h-5 shrink-0" />
                    {isSidebarOpen && <span>Chronogramme</span>}
                  </button>
                  <button onClick={() => setActiveTab('kanban')} className={`w-full flex items-center ${isSidebarOpen ? 'px-4 space-x-3' : 'justify-center'} py-3 rounded-xl transition-all cursor-pointer ${activeTab === 'kanban' ? 'bg-[#3F9384] text-white shadow-lg shadow-teal-100' : 'text-gray-400 hover:bg-teal-50 hover:text-teal-600'}`}>
                    <Grid className="w-5 h-5 shrink-0" />
                    {isSidebarOpen && <span>Tableau Kanban</span>}
                  </button>
                </>
              )}
            </nav>
            {isSidebarOpen ? (
              <div className="mt-auto pt-4 border-t border-gray-100 text-[10px] text-gray-500 flex flex-col items-center shrink-0">
                <div className="bg-sky-50/50 p-3 rounded-lg border border-sky-100 w-full text-center shadow-sm">
                  <div className="flex justify-center mb-1.5"><Shield className="w-4 h-4 text-sky-500" /></div>
                  <p className="font-bold text-gray-800 text-[11px] mb-0.5">Koffié Fabien Michael</p>
                  <p className="text-[8px] text-sky-600 font-bold uppercase tracking-wider mb-2">Propriété Intellectuelle</p>
                  <div className="space-y-1.5 text-gray-700 mt-2">
                    <p className="flex justify-center items-center font-medium tracking-wide"> +225 07 48 08 27 39</p>
                    <p className="flex justify-center items-center break-all font-medium"> fabien.frikupgeneration@gmail.com</p>
                  </div>
                  <p className="text-[8.5px] text-gray-500 mt-2.5 border-t border-sky-200/60 pt-2 leading-tight">
                    Toute reproduction interdite.<br/>Pour toute collaboration ou réutilisation, veuillez me contacter.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-auto pt-4 border-t border-gray-100 text-[10px] text-gray-400 text-center font-bold cursor-pointer flex flex-col items-center" title="Propriété de Koffié Fabien Michael&#10; +225 07 48 08 27 39&#10; fabien.frikupgeneration@gmail.com&#10;Pour toute collaboration, veuillez me contacter.">
                <Shield className="w-4 h-4 text-sky-400 mb-1" />
                <span className="text-gray-600">KFM</span>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto bg-sky-50/20 z-10 relative">
          <ErrorBoundary>
            {activeTab === 'accueil' && renderAccueil()}
            {activeTab === 'projects' && renderProjectManager()}
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'processus' && renderProcessus()}
            {activeTab === 'matrice' && renderMatriceRisques()}
            {activeTab === 'gantt' && renderGantt()}
            {activeTab === 'kanban' && renderKanban()}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return <MainApp />;
}
