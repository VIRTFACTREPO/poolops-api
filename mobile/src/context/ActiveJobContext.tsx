import React, { createContext, useContext, useMemo, useState } from 'react';

export const ACTIVE_JOB_TABS = ['readings', 'treatment', 'photos', 'notes', 'complete'] as const;
export type ActiveJobTab = (typeof ACTIVE_JOB_TABS)[number];

export type ChemicalReadings = {
  freeChlorine: string;
  ph: string;
  alkalinity: string;
  calciumHardness: string;
  cyanuricAcid: string;
};

export type TreatmentRecommendation = {
  id: string;
  name: string;
  recommendedAmount: number;
  unit: 'ml' | 'g';
  reason: string;
};

export type TreatmentEntry = {
  id: string;
  name: string;
  recommendedAmount: number;
  actualAmount: string;
  unit: 'ml' | 'g';
};

export type PoolSnapshot = {
  poolId: string;
  name?: string;
  type?: string;
  volumeLitres?: number;
  gateAccess?: string;
  warnings?: string[];
  equipment?: Array<{ id?: string; name?: string; type?: string }>;
  lastVisits?: Array<{ date?: string; summary?: string }>;
};

export type ActiveJobState = {
  jobId?: string;
  pools: PoolSnapshot[];
  activePoolIndex: number;
  currentTab: ActiveJobTab;
  completedTabs: ActiveJobTab[];
  startedAt: number;
  readings: ChemicalReadings;
  poolReadings: ChemicalReadings[];
  readingsPoolIndex: number;
  treatmentPrefill: TreatmentRecommendation[];
  treatmentEntries: TreatmentEntry[];
  photos: { before?: string; after?: string };
  customerNote: string;
  officeNote: string;
};

type ActiveJobContextType = ActiveJobState & {
  setPools: (pools: PoolSnapshot[]) => void;
  setActivePoolIndex: (index: number) => void;
  setReadingsPoolIndex: (index: number) => void;
  setCurrentTab: (tab: ActiveJobTab) => void;
  markTabComplete: (tab: ActiveJobTab) => void;
  setTabComplete: (tab: ActiveJobTab, done: boolean) => void;
  setReadings: (readings: Partial<ChemicalReadings>) => void;
  setTreatmentPrefill: (items: TreatmentRecommendation[]) => void;
  setTreatmentEntries: (items: TreatmentEntry[]) => void;
  useLastReadings: (readings: ChemicalReadings) => void;
  setPhotos: (photos: { before?: string; after?: string }) => void;
  setCustomerNote: (note: string) => void;
  setOfficeNote: (note: string) => void;
  resetJob: (jobId?: string) => void;
};

const ActiveJobContext = createContext<ActiveJobContextType | undefined>(undefined);

const EMPTY_READINGS: ChemicalReadings = {
  freeChlorine: '',
  ph: '',
  alkalinity: '',
  calciumHardness: '',
  cyanuricAcid: '',
};

export function ActiveJobProvider({ children, jobId }: { children: React.ReactNode; jobId?: string }) {
  const [pools, setPoolsState] = useState<PoolSnapshot[]>([]);
  const [activePoolIndex, setActivePoolIndex] = useState(0);
  const [readingsPoolIndex, setReadingsPoolIndex] = useState(0);
  const [currentTab, setCurrentTab] = useState<ActiveJobTab>('readings');
  const [completedTabs, setCompletedTabs] = useState<ActiveJobTab[]>([]);
  const [startedAt, setStartedAt] = useState<number>(Date.now());
  const [poolReadings, setPoolReadingsState] = useState<ChemicalReadings[]>([EMPTY_READINGS]);
  const [treatmentPrefill, setTreatmentPrefill] = useState<TreatmentRecommendation[]>([]);
  const [treatmentEntries, setTreatmentEntries] = useState<TreatmentEntry[]>([]);
  const [photos, setPhotosState] = useState<{ before?: string; after?: string }>({});
  const [customerNote, setCustomerNoteState] = useState('');
  const [officeNote, setOfficeNoteState] = useState('');

  const setPools = (next: PoolSnapshot[]) => {
    setPoolsState(next);
    setPoolReadingsState((prev) => {
      if (next.length === 0) return [EMPTY_READINGS];
      return Array.from({ length: next.length }, (_, i) => prev[i] ?? EMPTY_READINGS);
    });
    setReadingsPoolIndex(0);
  };

  const markTabComplete = (tab: ActiveJobTab) => {
    setCompletedTabs((prev) => (prev.includes(tab) ? prev : [...prev, tab]));
  };

  const setTabComplete = (tab: ActiveJobTab, done: boolean) => {
    setCompletedTabs((prev) => {
      const has = prev.includes(tab);
      if (done && !has) return [...prev, tab];
      if (!done && has) return prev.filter((t) => t !== tab);
      return prev;
    });
  };

  const setReadings = (next: Partial<ChemicalReadings>) => {
    setPoolReadingsState((prev) => {
      const updated = [...prev];
      updated[readingsPoolIndex] = { ...(updated[readingsPoolIndex] ?? EMPTY_READINGS), ...next };
      return updated;
    });
  };

  const useLastReadings = (last: ChemicalReadings) => {
    setPoolReadingsState((prev) => {
      const updated = [...prev];
      updated[readingsPoolIndex] = last;
      return updated;
    });
  };

  const setPhotos = (next: { before?: string; after?: string }) => {
    setPhotosState((prev) => ({ ...prev, ...next }));
  };

  const setCustomerNote = (next: string) => {
    setCustomerNoteState(next);
  };

  const setOfficeNote = (next: string) => {
    setOfficeNoteState(next);
  };

  const resetJob = () => {
    setPoolsState([]);
    setActivePoolIndex(0);
    setReadingsPoolIndex(0);
    setCurrentTab('readings');
    setCompletedTabs([]);
    setStartedAt(Date.now());
    setPoolReadingsState([EMPTY_READINGS]);
    setTreatmentPrefill([]);
    setTreatmentEntries([]);
    setPhotosState({});
    setCustomerNoteState('');
    setOfficeNoteState('');
  };

  const readings = poolReadings[readingsPoolIndex] ?? EMPTY_READINGS;

  const value = useMemo(
    () => ({
      jobId,
      pools,
      activePoolIndex,
      currentTab,
      completedTabs,
      startedAt,
      readings,
      poolReadings,
      readingsPoolIndex,
      treatmentPrefill,
      treatmentEntries,
      photos,
      customerNote,
      officeNote,
      setPools,
      setActivePoolIndex,
      setReadingsPoolIndex,
      setCurrentTab,
      markTabComplete,
      setTabComplete,
      setReadings,
      setTreatmentPrefill,
      setTreatmentEntries,
      useLastReadings,
      setPhotos,
      setCustomerNote,
      setOfficeNote,
      resetJob,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [jobId, pools, activePoolIndex, currentTab, completedTabs, startedAt, readings, poolReadings, readingsPoolIndex, treatmentPrefill, treatmentEntries, photos, customerNote, officeNote],
  );

  return <ActiveJobContext.Provider value={value}>{children}</ActiveJobContext.Provider>;
}

export function useActiveJob() {
  const context = useContext(ActiveJobContext);
  if (!context) {
    throw new Error('useActiveJob must be used within ActiveJobProvider');
  }
  return context;
}
