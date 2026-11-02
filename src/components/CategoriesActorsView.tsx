import React, { useState, useMemo } from 'react';
import {
  Users,
  ShieldCheck,
  Briefcase,
  Layers,
  Filter,
  CreditCard,
  QrCode,
  CheckCircle2,
  Search,
  Lock,
  Award,
  Landmark,
  Handshake,
  Phone,
  Mail,
  MapPin,
  Building2,
  UserCheck
} from 'lucide-react';
import {
  ACTOR_CATEGORIES_ORDERED,
  ActorCategoryType,
  ActorGovernanceInstance,
  CategorizedActor,
  Dossier,
  LanguageCode,
  UserProfile,
  CustomDocFields,
  InstitutionalDocType
} from '../types';
import {
  ensureDossierCategorizedActors,
  normalizeRaciActorToPosition
} from '../db';
import { InternalActorProfileModal } from './InternalActorProfileModal';
import { QrBarcodeScannerModal } from './QrBarcodeScannerModal';

interface CategoriesActorsViewProps {
  dossier: Dossier;
  activeDossier?: Dossier;
  dossiers: Dossier[];
  onSelectDossier: (dossierId: string) => void;
  userProfile: UserProfile;
  language: LanguageCode;
  filterAxeId: string;
  setFilterAxeId: (id: string) => void;
  filterProjectId: string;
  setFilterProjectId: (id: string) => void;
  onUpdateCategorizedActors: (updatedActors: CategorizedActor[]) => void;
  onRenameActorInRaci?: (oldName: string, newName: string) => void;
  onUpdateUserProfile?: (profile: UserProfile) => void;
  onApplyProfileToDoc?: (
    docType: InstitutionalDocType,
    fields: Partial<CustomDocFields>
  ) => void;
  onNavigateToDocGen?: (docType?: InstitutionalDocType) => void;
}

const GOVERNANCE_OPTIONS: {
  value: ActorGovernanceInstance;
  labelFr: string;
  labelEn: string;
  badgeClass: string;
}[] = [
  {
    value: 'COPIL',
    labelFr: 'COPIL (Comité de Pilotage)',
    labelEn: 'COPIL (Steering Committee)',
    badgeClass:
      'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700'
  },
  {
    value: 'COPROJ',
    labelFr: 'COPROJ (Comité de Projet)',
    labelEn: 'COPROJ (Project Committee)',
    badgeClass:
      'bg-sky-50 dark:bg-sky-950/60 text-[#0c4a6e] dark:text-[#90D5FF] border-sky-300 dark:border-sky-700'
  },
  {
    value: 'COPIL & COPROJ',
    labelFr: 'COPIL & COPROJ',
    labelEn: 'COPIL & COPROJ',
    badgeClass:
      'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
  },
  {
    value: 'Opérationnel / Aucun',
    labelFr: 'Opérationnel / Aucun',
    labelEn: 'Operational / None',
    badgeClass:
      'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
  }
];

export const CategoriesActorsView: React.FC<CategoriesActorsViewProps> = ({
  dossier: dossierProp,
  activeDossier,
  dossiers,
  userProfile,
  language,
  filterAxeId,
  setFilterAxeId,
  filterProjectId,
  setFilterProjectId,
  onUpdateCategorizedActors,
  onUpdateUserProfile,
  onApplyProfileToDoc,
  onNavigateToDocGen
}) => {
  const dossier = dossierProp || activeDossier || dossiers[0];
  const isEn = language === 'EN';

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    'ALL' | ActorCategoryType
  >('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modales Fiche Acteur Interne (CV, Carte, Badge) & Scanner QR/Code-barres
  const [profileModalActorName, setProfileModalActorName] = useState<string>(
    userProfile.fullName
  );
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState<boolean>(false);
  const [scannerInitialPayload, setScannerInitialPayload] = useState<
    string | undefined
  >(undefined);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Liste complète synchronisée à 100 % avec l'onglet RACI du programme actif
  const allProgramActors = useMemo<CategorizedActor[]>(() => {
    if (!dossier) return [];
    return ensureDossierCategorizedActors(dossier, userProfile);
  }, [dossier, userProfile]);

  // Axes et projets disponibles pour le Programme actif
  const programAxes = useMemo(() => dossier?.axes || [], [dossier?.axes]);

  const availableProjectsForFilter = useMemo(() => {
    const axes =
      filterAxeId === 'ALL'
        ? programAxes
        : programAxes.filter(a => a.id === filterAxeId);
    return axes.flatMap(a => a.projects || []);
  }, [programAxes, filterAxeId]);

  // Ensemble des acteurs (postes/fonctions) intervenant dans l'Axe / Projet sélectionné (via les tâches RACI)
  const allowedActorNamesByScope = useMemo<Set<string> | null>(() => {
    if (filterAxeId === 'ALL' && filterProjectId === 'ALL') {
      return null;
    }
    const set = new Set<string>();
    const splitNames = (raw?: string): string[] => {
      if (!raw) return [];
      return raw
        .split(',')
        .map(s => normalizeRaciActorToPosition(s.trim()).toLowerCase())
        .filter(
          s =>
            s.length > 0 &&
            s !== '—' &&
            s !== '-' &&
            s !== 'néant' &&
            s !== 'neant' &&
            s !== 'none'
        );
    };

    programAxes.forEach(axe => {
      if (filterAxeId !== 'ALL' && axe.id !== filterAxeId) return;
      (axe.projects || []).forEach(proj => {
        if (filterProjectId !== 'ALL' && proj.id !== filterProjectId) return;
        (proj.tasks || []).forEach(task => {
          splitNames(
            [task.assignee, task.raciR].filter(Boolean).join(', ') ||
              task.responsabilite
          ).forEach(n => set.add(n));
          splitNames([task.autorite, task.raciA].filter(Boolean).join(', ')).forEach(
            n => set.add(n)
          );
          splitNames([task.consulte, task.raciC].filter(Boolean).join(', ')).forEach(
            n => set.add(n)
          );
          splitNames([task.informe, task.raciI].filter(Boolean).join(', ')).forEach(
            n => set.add(n)
          );
        });
      });
    });

    return set;
  }, [programAxes, filterAxeId, filterProjectId]);

  // Filtrage hiérarchique Programme (Global) -> Axe -> Projet + Catégorie + Recherche
  const filteredActors = useMemo<CategorizedActor[]>(() => {
    return allProgramActors.filter(actor => {
      if (allowedActorNamesByScope) {
        const inRaciTasksOfScope = allowedActorNamesByScope.has(
          actor.name.trim().toLowerCase()
        );
        const matchExplicitScope =
          (filterAxeId === 'ALL' || actor.axeId === filterAxeId) &&
          (filterProjectId === 'ALL' || actor.projectId === filterProjectId);
        if (!inRaciTasksOfScope && !matchExplicitScope) {
          return false;
        }
      }
      if (
        selectedCategoryFilter !== 'ALL' &&
        actor.category !== selectedCategoryFilter
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          actor.name.toLowerCase().includes(q) ||
          (actor.fullName || '').toLowerCase().includes(q) ||
          (actor.roleOrFunction || '').toLowerCase().includes(q) ||
          (actor.organization || '').toLowerCase().includes(q) ||
          (actor.phone || '').toLowerCase().includes(q) ||
          (actor.email || '').toLowerCase().includes(q) ||
          (actor.address || '').toLowerCase().includes(q) ||
          (actor.governanceInstance || '').toLowerCase().includes(q) ||
          (actor.matricule || '').toLowerCase().includes(q) ||
          actor.category.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [
    allProgramActors,
    allowedActorNamesByScope,
    filterAxeId,
    filterProjectId,
    selectedCategoryFilter,
    searchQuery
  ]);

  // Compteurs par catégorie (dans l'ordre strict des 5 catégories)
  const countsByCategory = useMemo(() => {
    const counts: Record<ActorCategoryType, number> = {
      Bénéficiaires: 0,
      Interne: 0,
      Externe: 0,
      Prestataire: 0,
      'Partenaire Financier': 0
    };
    allProgramActors.forEach(actor => {
      if (allowedActorNamesByScope) {
        const inRaciTasksOfScope = allowedActorNamesByScope.has(
          actor.name.trim().toLowerCase()
        );
        const matchExplicitScope =
          (filterAxeId === 'ALL' || actor.axeId === filterAxeId) &&
          (filterProjectId === 'ALL' || actor.projectId === filterProjectId);
        if (!inRaciTasksOfScope && !matchExplicitScope) {
          return;
        }
      }
      counts[actor.category] = (counts[actor.category] || 0) + 1;
    });
    return counts;
  }, [allProgramActors, allowedActorNamesByScope, filterAxeId, filterProjectId]);

  // Liste exclusive des acteurs "Interne" pour la modale CV / Carte de Visite / Badge
  const internalOnlyActorNames = useMemo<string[]>(() => {
    const names = new Set<string>();
    allProgramActors
      .filter(a => a.category === 'Interne')
      .forEach(a => names.add(a.name));
    if (names.size === 0 && userProfile.role) {
      names.add(userProfile.role);
    }
    return Array.from(names);
  }, [allProgramActors, userProfile.role]);

  const raciContextForInternalModal = useMemo(() => {
    const rList: string[] = [];
    const aList: string[] = [];
    const cList: string[] = [];
    const iList: string[] = [];
    allProgramActors
      .filter(a => a.category === 'Interne')
      .forEach(act => {
        if (act.raciRoles?.includes('R')) rList.push(act.name);
        if (act.raciRoles?.includes('A')) aList.push(act.name);
        if (act.raciRoles?.includes('C')) cList.push(act.name);
        if (act.raciRoles?.includes('I')) iList.push(act.name);
      });
    return { rList, aList, cList, iList };
  }, [allProgramActors]);

  const handleUpdateSingleActor = (
    actorId: string,
    patch: Partial<CategorizedActor>
  ) => {
    const next = allProgramActors.map(item =>
      item.id === actorId ? { ...item, ...patch } : item
    );
    onUpdateCategorizedActors(next);
  };

  const getCategoryBadgeStyle = (cat: ActorCategoryType) => {
    switch (cat) {
      case 'Bénéficiaires':
        return {
          bg: 'bg-teal-50 dark:bg-teal-950/50',
          border: 'border-teal-300 dark:border-teal-700',
          text: 'text-teal-800 dark:text-teal-300',
          pill: 'bg-teal-600 text-white',
          icon: Users
        };
      case 'Interne':
        return {
          bg: 'bg-sky-50 dark:bg-sky-950/60',
          border: 'border-[#0284c7] dark:border-[#90D5FF]',
          text: 'text-[#0c4a6e] dark:text-[#90D5FF]',
          pill: 'bg-[#0c4a6e] text-[#90D5FF]',
          icon: ShieldCheck
        };
      case 'Externe':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/50',
          border: 'border-amber-300 dark:border-amber-700',
          text: 'text-amber-900 dark:text-amber-300',
          pill: 'bg-amber-600 text-white',
          icon: Landmark
        };
      case 'Prestataire':
        return {
          bg: 'bg-indigo-50 dark:bg-indigo-950/50',
          border: 'border-indigo-300 dark:border-indigo-700',
          text: 'text-indigo-900 dark:text-indigo-300',
          pill: 'bg-indigo-600 text-white',
          icon: Briefcase
        };
      case 'Partenaire Financier':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/50',
          border: 'border-emerald-300 dark:border-emerald-700',
          text: 'text-emerald-900 dark:text-emerald-300',
          pill: 'bg-emerald-600 text-white',
          icon: Handshake
        };
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 w-full max-w-full overflow-x-hidden">
      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* BARRE DE FILTRAGE HIÉRARCHIQUE : PROGRAMME (LECTURE SEULE GLOBAL) -> AXE -> PROJET + RECHERCHE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-[#0c4a6e] dark:text-[#90D5FF] shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>
                {isEn ? 'Hierarchical Scope:' : 'Périmètre Hiérarchique :'}
              </span>
            </div>

            {/* 1. Programme Actif (Lecture seule — piloté par le Sélecteur Global de l'application) */}
            <div
              className="flex flex-wrap items-center gap-1.5 bg-sky-50/90 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-[#90D5FF] dark:border-sky-700 min-w-0 max-w-full"
              title={
                isEn
                  ? 'Controlled by the global Programme selector in the main navigation menu'
                  : 'Dépend à 100 % du sélecteur de programme global de l’application (en lecture seule ici)'
              }
            >
              <Briefcase className="w-3.5 h-3.5 text-[#0c4a6e] dark:text-[#90D5FF] shrink-0" />
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 shrink-0">
                {isEn ? 'Active Programme:' : 'Programme Actif :'}
              </span>
              <span className="text-[11px] font-black text-[#0c4a6e] dark:text-[#90D5FF] whitespace-normal break-words">
                {dossier?.name} ({dossier?.horizonPlan})
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#0c4a6e] text-[#90D5FF] text-[8.5px] font-black uppercase shrink-0">
                {isEn ? 'Global' : 'Sélecteur Global'}
              </span>
            </div>

            {/* 2. Sélecteur d'Axe Stratégique (propre au Programme actif) */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 min-w-0 max-w-full">
              <Layers className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
              <span className="text-[10px] font-black uppercase text-slate-500 shrink-0">
                {isEn ? 'Axis:' : 'Axe :'}
              </span>
              <select
                value={filterAxeId}
                onChange={e => {
                  setFilterAxeId(e.target.value);
                  setFilterProjectId('ALL');
                }}
                className="text-[11px] font-bold text-slate-800 dark:text-white bg-transparent focus:outline-none cursor-pointer max-w-full whitespace-normal break-words"
              >
                <option value="ALL">
                  {isEn
                    ? `All Axes (${programAxes.length})`
                    : `Tous les Axes du Programme (${programAxes.length})`}
                </option>
                {programAxes.map(a => (
                  <option
                    key={a.id}
                    value={a.id}
                    className="dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Sélecteur de Projet Opérationnel (propre à l'Axe sélectionné) */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 min-w-0 max-w-full">
              <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[10px] font-black uppercase text-slate-500 shrink-0">
                {isEn ? 'Project:' : 'Projet :'}
              </span>
              <select
                value={filterProjectId}
                onChange={e => setFilterProjectId(e.target.value)}
                className="text-[11px] font-bold text-slate-800 dark:text-white bg-transparent focus:outline-none cursor-pointer max-w-full whitespace-normal break-words"
              >
                <option value="ALL">
                  {isEn
                    ? `All Projects (${availableProjectsForFilter.length})`
                    : `Tous les Projets (${availableProjectsForFilter.length})`}
                </option>
                {availableProjectsForFilter.map(p => (
                  <option
                    key={p.id}
                    value={p.id}
                    className="dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recherche + Indicateur Source Unique RACI (Aucun ajout d'acteur autorisé ici) */}
          <div className="flex flex-wrap items-center gap-2 justify-between xl:justify-end">
            <div className="relative flex-1 sm:flex-initial min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={
                  isEn
                    ? 'Search position, email, phone, COPIL/COPROJ...'
                    : 'Rechercher poste, téléphone, email, siège, COPIL...'
                }
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[11px] font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#90D5FF]"
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-[10px] font-black text-[#0c4a6e] dark:text-[#90D5FF]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
              <span>
                {isEn
                  ? `${allProgramActors.length} RACI Positions • Classify by Category (No new actor addition)`
                  : `${allProgramActors.length} Postes issus de la RACI • Rangement par Catégorie uniquement`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* LES 5 CARTES DE CATÉGORIES DANS L'ORDRE OBLIGATOIRE (1 à 5) AVEC DÉFINITIONS MÉTIER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {ACTOR_CATEGORIES_ORDERED.map(catDef => {
          const style = getCategoryBadgeStyle(catDef.id);
          const IconComp = style.icon;
          const isSelected = selectedCategoryFilter === catDef.id;
          const count = countsByCategory[catDef.id] || 0;

          return (
            <button
              key={catDef.id}
              type="button"
              onClick={() =>
                setSelectedCategoryFilter(prev =>
                  prev === catDef.id ? 'ALL' : catDef.id
                )
              }
              className={`text-left p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                isSelected
                  ? 'border-[#0c4a6e] dark:border-[#90D5FF] bg-sky-50/90 dark:bg-slate-800 shadow-md ring-2 ring-[#90D5FF]/50'
                  : `${style.bg} ${style.border} hover:shadow-sm`
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${style.pill}`}
                  >
                    {isEn ? catDef.labelEn : catDef.labelFr}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-black text-slate-900 dark:text-white">
                      {count}
                    </span>
                    <IconComp className={`w-4 h-4 ${style.text}`} />
                  </div>
                </div>

                <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 leading-snug">
                  {isEn ? catDef.definitionEn : catDef.definitionFr}
                </p>
              </div>

              <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-[9px] font-extrabold">
                {catDef.allowsPersonalSupports ? (
                  <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>Habilité : CV, Carte Pro & Badge</span>
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 shrink-0" />
                    <span>Exclu des CV / Badges Internes</span>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* SECTION PAR CATÉGORIE DANS L'ORDRE IMMUABLE (1. Bénéficiaires -> 2. Interne -> 3. Externe -> 4. Prestataire -> 5. Partenaire Financier) */}
      <div className="space-y-4">
        {ACTOR_CATEGORIES_ORDERED.filter(
          catDef =>
            selectedCategoryFilter === 'ALL' ||
            selectedCategoryFilter === catDef.id
        ).map(catDef => {
          const catActors = filteredActors.filter(
            a => a.category === catDef.id
          );
          const style = getCategoryBadgeStyle(catDef.id);
          const IconComp = style.icon;

          return (
            <div
              key={catDef.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden"
            >
              {/* Bandeau d'en-tête de la Catégorie */}
              <div
                className={`px-3.5 py-2.5 border-b ${style.bg} ${style.border} flex flex-wrap items-center justify-between gap-2.5`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${style.pill}`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        {isEn ? catDef.labelEn : catDef.labelFr}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[10px] font-black text-[#0c4a6e] dark:text-[#90D5FF]">
                        {catActors.length} {isEn ? 'Position(s)' : 'Poste(s) RACI'}
                      </span>
                      {catDef.allowsPersonalSupports ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-black uppercase">
                          ✓ Éligible aux CV (Docs 12 & 13), Carte de Visite & Badge d’Accès
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-bold">
                          Catégorie Externe aux Supports Individuels Internes
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">
                      {isEn ? catDef.definitionEn : catDef.definitionFr}
                    </p>
                  </div>
                </div>

                {catDef.id === 'Interne' && (
                  <button
                    type="button"
                    onClick={() => {
                      const firstInternal =
                        catActors[0]?.name || userProfile.fullName;
                      setProfileModalActorName(firstInternal);
                      setIsProfileModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0c4a6e] hover:bg-[#075985] text-[#90D5FF] text-[10px] font-black uppercase cursor-pointer shadow-xs"
                  >
                    <CreditCard className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isEn
                        ? 'Generate CVs, Business Cards & Badges'
                        : 'Générer CV, Carte de Visite & Badge Interne'}
                    </span>
                  </button>
                )}
              </div>

              {/* Tableau des acteurs de la catégorie (issu à 100% du RACI, aucun ajout possible — tous les intitulés des cellules affichés intégralement) */}
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[920px] text-left border-collapse text-[10px] unified-cell-font-table">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase">
                      <th className="py-2.5 px-3 w-[23%] text-[10px] whitespace-normal break-words leading-tight">
                        {isEn
                          ? 'RACI Position & Actor Full Name (First & Last Name)'
                          : 'Poste / Fonction (RACI) & Nom et Prénoms de l’Acteur'}
                      </th>
                      <th className="py-2.5 px-2.5 w-[16%] min-w-[140px] text-[10px] whitespace-normal break-words leading-tight">
                        {isEn
                          ? 'Classify by Category'
                          : 'Ranger par Catégorie'}
                      </th>
                      <th className="py-2.5 px-2.5 w-[18%] text-[10px] whitespace-normal break-words leading-tight">
                        Mobile / Téléphone & Email Professionnel
                      </th>
                      <th className="py-2.5 px-2.5 w-[19%] text-[10px] whitespace-normal break-words leading-tight">
                        Siège, Localisation & Institution / Organisme
                      </th>
                      <th className="py-2.5 px-2.5 w-[12%] text-[10px] whitespace-normal break-words leading-tight">
                        Instance de Gouvernance (COPIL / COPROJ)
                      </th>
                      <th className="py-2.5 px-3 w-[12%] text-right text-[10px] whitespace-normal break-words leading-tight">
                        Rôles RACI & Supports
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {catActors.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-5 px-4 text-center text-[10px] text-slate-400 italic whitespace-normal break-words"
                        >
                          {isEn
                            ? `No RACI actor currently assigned to "${catDef.labelEn}" for this scope.`
                            : `Aucun poste de la RACI classé dans la catégorie « ${catDef.labelFr} » pour ce périmètre.`}
                        </td>
                      </tr>
                    ) : (
                      catActors.map(actor => {
                        const isMainUser =
                          actor.name.trim().toLowerCase() ===
                            userProfile.fullName.trim().toLowerCase() ||
                          actor.name.trim().toLowerCase() ===
                            'coordonnateur général pmo';
                        const canHavePersonalSupports =
                          actor.category === 'Interne' || isMainUser;
                        const currentGov: ActorGovernanceInstance =
                          actor.governanceInstance || 'Opérationnel / Aucun';
                        const govStyle =
                          GOVERNANCE_OPTIONS.find(g => g.value === currentGov)
                            ?.badgeClass || GOVERNANCE_OPTIONS[3].badgeClass;

                        return (
                          <tr
                            key={actor.id}
                            className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            {/* 1. Poste / Fonction (Acteur issu de la RACI — Lecture seule, affiché totalement) + Saisie du Nom & Prénoms de l'acteur (affiché totalement) */}
                            <td className="py-2 px-3 align-top space-y-1.5 text-[10px] whitespace-normal break-words">
                              <div className="w-full px-2 py-1.5 rounded bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white text-[10px] leading-snug whitespace-normal break-words">
                                {actor.name}
                              </div>
                              <div className="space-y-0.5">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-[#0284c7] dark:text-[#90D5FF] px-0.5 whitespace-normal break-words">
                                  {isEn
                                    ? 'Full Name (First & Last Name):'
                                    : 'Nom & Prénoms du Titulaire :'}
                                </label>
                                <div className="flex items-start gap-1.5 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-[#90D5FF] dark:border-sky-700 shadow-2xs">
                                  <UserCheck className="w-3.5 h-3.5 text-[#0284c7] shrink-0 mt-0.5" />
                                  <textarea
                                    rows={Math.max(1, Math.ceil(((actor.fullName || '').length || 1) / 22))}
                                    value={actor.fullName || ''}
                                    onChange={e =>
                                      handleUpdateSingleActor(actor.id, {
                                        fullName: e.target.value
                                      })
                                    }
                                    placeholder={
                                      isEn
                                        ? 'Enter First & Last Name...'
                                        : 'Renseigner Nom & Prénoms...'
                                    }
                                    className="w-full bg-transparent text-[10px] font-extrabold text-[#0c4a6e] dark:text-white focus:outline-none resize-none leading-snug whitespace-normal break-words"
                                  />
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-1 px-1">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-bold text-[#0c4a6e] dark:text-[#90D5FF] whitespace-normal break-words">
                                  {actor.matricule}
                                </span>
                                {isMainUser && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#0c4a6e] text-[#90D5FF] text-[10px] font-black uppercase whitespace-normal break-words">
                                    ★ Poste Principal
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 2. Rangement par Catégorie */}
                            <td className="py-2 px-2.5 min-w-[140px] align-top space-y-1 text-[10px] whitespace-normal break-words">
                              <select
                                value={actor.category}
                                onChange={e => {
                                  const nextCat = e.target
                                    .value as ActorCategoryType;
                                  handleUpdateSingleActor(actor.id, {
                                    category: nextCat,
                                    accreditationLevel:
                                      nextCat === 'Interne'
                                        ? 'ZONE A — ACCÈS TOTAL UGP & SITES'
                                        : 'PARTENAIRE / EXTERNE (SANS BADGE INTERNE)'
                                  });
                                  const selectedLabel =
                                    ACTOR_CATEGORIES_ORDERED.find(
                                      c => c.id === nextCat
                                    )?.labelFr || nextCat;
                                  triggerToast(
                                    `✓ « ${actor.name} » rangé dans « ${selectedLabel} »`
                                  );
                                }}
                                className="w-full min-w-[125px] px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-extrabold text-[#0c4a6e] dark:text-[#90D5FF] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#90D5FF] whitespace-normal break-words"
                              >
                                {ACTOR_CATEGORIES_ORDERED.map(c => (
                                  <option key={c.id} value={c.id}>
                                    {isEn ? c.labelEn : c.labelFr}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* 3. Mobile / Téléphone & Email Professionnel (affichés intégralement) */}
                            <td className="py-2 px-2.5 align-top space-y-1.5 text-[10px] whitespace-normal break-words">
                              <div className="flex items-start gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                                <Phone className="w-3 h-3 text-[#0284c7] shrink-0 mt-0.5" />
                                <textarea
                                  rows={Math.max(1, Math.ceil(((actor.phone || '').length || 1) / 22))}
                                  value={actor.phone || ''}
                                  onChange={e =>
                                    handleUpdateSingleActor(actor.id, {
                                      phone: e.target.value
                                    })
                                  }
                                  placeholder={
                                    isEn
                                      ? 'Mobile / Phone...'
                                      : 'Mobile / Téléphone...'
                                  }
                                  className="w-full bg-transparent text-[10px] font-semibold text-slate-800 dark:text-slate-100 focus:outline-none resize-none leading-snug whitespace-normal break-words"
                                />
                              </div>

                              <div className="flex items-start gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                                <Mail className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                                <textarea
                                  rows={Math.max(1, Math.ceil(((actor.email || '').length || 1) / 22))}
                                  value={actor.email || ''}
                                  onChange={e =>
                                    handleUpdateSingleActor(actor.id, {
                                      email: e.target.value
                                    })
                                  }
                                  placeholder={
                                    isEn
                                      ? 'Professional email...'
                                      : 'Email professionnel...'
                                  }
                                  className="w-full bg-transparent text-[10px] font-semibold text-slate-800 dark:text-slate-100 focus:outline-none resize-none leading-snug whitespace-normal break-words"
                                />
                              </div>
                            </td>

                            {/* 4. Siège & Localisation géographique + Structure (affichés intégralement) */}
                            <td className="py-2 px-2.5 align-top space-y-1.5 text-[10px] whitespace-normal break-words">
                              <div className="flex items-start gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                                <MapPin className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                                <textarea
                                  rows={Math.max(2, Math.ceil(((actor.address || '').length || 1) / 22))}
                                  value={actor.address || ''}
                                  onChange={e =>
                                    handleUpdateSingleActor(actor.id, {
                                      address: e.target.value
                                    })
                                  }
                                  placeholder={
                                    isEn
                                      ? 'Headquarters & geographic location...'
                                      : 'Siège & Localisation géographique...'
                                  }
                                  className="w-full bg-transparent text-[10px] font-semibold text-slate-800 dark:text-slate-100 focus:outline-none resize-none leading-snug whitespace-normal break-words"
                                />
                              </div>

                              <div className="flex items-start gap-1.5 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                                <Building2 className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                                <textarea
                                  rows={Math.max(2, Math.ceil(((actor.organization || '').length || 1) / 22))}
                                  value={actor.organization || ''}
                                  onChange={e =>
                                    handleUpdateSingleActor(actor.id, {
                                      organization: e.target.value
                                    })
                                  }
                                  placeholder={
                                    isEn
                                      ? 'Organization / Institution...'
                                      : 'Institution / Organisme...'
                                  }
                                  className="w-full bg-transparent text-[10px] font-medium text-slate-600 dark:text-slate-300 focus:outline-none resize-none leading-snug whitespace-normal break-words"
                                />
                              </div>
                            </td>

                            {/* 5. Instance de Gouvernance (COPIL / COPROJ) */}
                            <td className="py-2 px-2.5 align-top space-y-1 text-[10px] whitespace-normal break-words">
                              <select
                                value={currentGov}
                                onChange={e => {
                                  const nextGov = e.target
                                    .value as ActorGovernanceInstance;
                                  handleUpdateSingleActor(actor.id, {
                                    governanceInstance: nextGov
                                  });
                                  triggerToast(
                                    `✓ Gouvernance de « ${actor.name} » : ${nextGov}`
                                  );
                                }}
                                className={`w-full px-2 py-1.5 rounded-lg border text-[10px] font-black cursor-pointer focus:outline-none whitespace-normal break-words ${govStyle}`}
                              >
                                {GOVERNANCE_OPTIONS.map(opt => (
                                  <option
                                    key={opt.value}
                                    value={opt.value}
                                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                                  >
                                    {isEn ? opt.labelEn : opt.labelFr}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* 6. Rôles RACI (Lecture seule issue du RACI) & Supports Individuels (Réservés Catégorie 2 Interne) */}
                            <td className="py-2 px-3 align-top text-right space-y-1.5 text-[10px]">
                              <div className="inline-flex items-center justify-end gap-1">
                                {(['R', 'A', 'C', 'I'] as const).map(rCode => {
                                  const active =
                                    actor.raciRoles?.includes(rCode);
                                  return (
                                    <span
                                      key={rCode}
                                      title={
                                        isEn
                                          ? 'RACI role derived from RACI tab'
                                          : 'Rôle issu automatiquement de l’onglet RACI'
                                      }
                                      className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${
                                        active
                                          ? 'bg-[#0c4a6e] text-[#90D5FF] shadow-2xs'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                      }`}
                                    >
                                      {rCode}
                                    </span>
                                  );
                                })}
                              </div>

                              <div className="flex flex-wrap items-center justify-end gap-1">
                                {canHavePersonalSupports ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProfileModalActorName(actor.name);
                                        setIsProfileModalOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0c4a6e] hover:bg-[#075985] text-[#90D5FF] text-[10px] font-black uppercase cursor-pointer shadow-2xs"
                                      title="Ouvrir la fiche : Carte de Visite (vCard), Badge CR80 (CODE-128) & 2 Modèles de CV (Docs 12 & 13)"
                                    >
                                      <CreditCard className="w-3 h-3 shrink-0" />
                                      <span>Carte, Badge & 2 CVs</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setScannerInitialPayload(
                                          actor.matricule
                                        );
                                        setIsScannerModalOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-black cursor-pointer"
                                      title="Scanner et authentifier le Badge / QR Code de cet acteur interne"
                                    >
                                      <QrCode className="w-3 h-3 shrink-0" />
                                      <span>Scanner</span>
                                    </button>
                                  </>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[9px] font-bold"
                                    title="Conformément aux règles de sécurité institutionnelle, seuls l'utilisateur connecté et les acteurs de la catégorie « Interne » peuvent générer un CV, une Carte de Visite ou un Badge d'Accès."
                                  >
                                    <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                                    <span>Réservé Catégorie « Interne »</span>
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALE FICHE ACTEUR INTERNE : CARTE DE VISITE (QR VCARD), BADGE (QR & CODE-128) & 2 CVs */}
      {isProfileModalOpen && (
        <InternalActorProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          initialActorName={profileModalActorName}
          allActorsList={internalOnlyActorNames}
          raciContextInfo={raciContextForInternalModal}
          dossier={dossier}
          userProfile={userProfile}
          language={language}
          executingOrgName={
            dossier?.institution ||
            userProfile.institution ||
            'Organisme Pilote du Programme'
          }
          executingDepartment="Unité de Gestion du Programme (UGP / PMO)"
          onApplyToDoc={(docType, fields) => {
            if (onApplyProfileToDoc) {
              onApplyProfileToDoc(docType, fields);
            }
          }}
          onSelectDocType={docType => {
            if (onNavigateToDocGen) {
              onNavigateToDocGen(docType);
            }
          }}
          onUpdateUserProfile={onUpdateUserProfile}
        />
      )}

      {/* MODALE SCANNER QR CODE & CODE-BARRES (CONTRÔLE D'ACCÈS INTERNE) */}
      {isScannerModalOpen && (
        <QrBarcodeScannerModal
          isOpen={isScannerModalOpen}
          onClose={() => setIsScannerModalOpen(false)}
          dossier={dossier}
          userProfile={userProfile}
          language={language}
          initialScanPayload={scannerInitialPayload}
          onOpenInternalActorModal={actorName => {
            setIsScannerModalOpen(false);
            setProfileModalActorName(actorName);
            setIsProfileModalOpen(true);
          }}
        />
      )}
    </div>
  );
};
