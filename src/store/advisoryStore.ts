import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Brief, Query, Evidence } from '../types/advisory';

/**
 * Advisory Store - Zustand Implementation
 * Enterprise-grade state management for regulatory advisory platform
 */

interface AdvisoryState {
  // Core Data
  queries: Query[];
  briefs: Brief[];
  currentStreamingBrief: Brief | null;
  
  // UI State
  isStreaming: boolean;
  activeWorkflowId: string | null;
  selectedEvidenceIds: string[];
  
  // User Context
  currentJurisdiction: string;
  complianceFrameworks: string[];
  riskTolerance: 'low' | 'medium' | 'high';
  
  // Navigation State
  currentPage: string;
  breadcrumbs: Array<{ label: string; path: string }>;
  
  // Performance Tracking
  lastQueryTimestamp: number | null;
  responseTimeMetrics: number[];
}

interface AdvisoryActions {
  // Query Management
  addQuery: (query: Query) => void;
  removeQuery: (queryId: string) => void;
  
  // Brief Management
  addBrief: (brief: Brief) => void;
  updateBrief: (briefId: string, updates: Partial<Brief>) => void;
  removeBrief: (briefId: string) => void;
  
  // Streaming Operations
  startStreaming: (brief: Brief) => void;
  updateStreamingBrief: (updates: Partial<Brief>) => void;
  completeStreaming: (completedBrief: Brief) => void;
  stopStreaming: () => void;
  
  // Evidence Management
  toggleEvidenceSelection: (evidenceId: string) => void;
  clearEvidenceSelection: () => void;
  
  // Navigation
  setCurrentPage: (page: string) => void;
  updateBreadcrumbs: (breadcrumbs: Array<{ label: string; path: string }>) => void;
  
  // User Context
  setJurisdiction: (jurisdiction: string) => void;
  updateComplianceFrameworks: (frameworks: string[]) => void;
  setRiskTolerance: (tolerance: 'low' | 'medium' | 'high') => void;
  
  // Performance
  recordResponseTime: (time: number) => void;
  
  // Bulk Operations
  clearAllData: () => void;
  exportData: () => AdvisoryState;
}

type AdvisoryStore = AdvisoryState & AdvisoryActions;

const initialState: AdvisoryState = {
  queries: [],
  briefs: [],
  currentStreamingBrief: null,
  isStreaming: false,
  activeWorkflowId: null,
  selectedEvidenceIds: [],
  currentJurisdiction: 'US',
  complianceFrameworks: ['SOX', 'GDPR'],
  riskTolerance: 'medium',
  currentPage: 'conversation',
  breadcrumbs: [],
  lastQueryTimestamp: null,
  responseTimeMetrics: [],
};

export const useAdvisoryStore = create<AdvisoryStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Query Management
        addQuery: (query) => set((state) => ({
          queries: [...state.queries, query],
          lastQueryTimestamp: Date.now(),
        })),
        
        removeQuery: (queryId) => set((state) => ({
          queries: state.queries.filter(q => q.id !== queryId),
        })),
        
        // Brief Management
        addBrief: (brief) => set((state) => ({
          briefs: [...state.briefs, brief],
        })),
        
        updateBrief: (briefId, updates) => set((state) => ({
          briefs: state.briefs.map(brief => 
            brief.id === briefId ? { ...brief, ...updates } : brief
          ),
        })),
        
        removeBrief: (briefId) => set((state) => ({
          briefs: state.briefs.filter(b => b.id !== briefId),
        })),
        
        // Streaming Operations
        startStreaming: (brief) => set({
          currentStreamingBrief: brief,
          isStreaming: true,
        }),
        
        updateStreamingBrief: (updates) => set((state) => ({
          currentStreamingBrief: state.currentStreamingBrief 
            ? { ...state.currentStreamingBrief, ...updates }
            : null,
        })),
        
        completeStreaming: (completedBrief) => set((state) => ({
          briefs: [...state.briefs, completedBrief],
          currentStreamingBrief: null,
          isStreaming: false,
          responseTimeMetrics: [
            ...state.responseTimeMetrics.slice(-9), // Keep last 10 metrics
            Date.now() - (state.lastQueryTimestamp || Date.now()),
          ],
        })),
        
        stopStreaming: () => set({
          currentStreamingBrief: null,
          isStreaming: false,
        }),
        
        // Evidence Management
        toggleEvidenceSelection: (evidenceId) => set((state) => ({
          selectedEvidenceIds: state.selectedEvidenceIds.includes(evidenceId)
            ? state.selectedEvidenceIds.filter(id => id !== evidenceId)
            : [...state.selectedEvidenceIds, evidenceId],
        })),
        
        clearEvidenceSelection: () => set({
          selectedEvidenceIds: [],
        }),
        
        // Navigation
        setCurrentPage: (page) => set({
          currentPage: page,
        }),
        
        updateBreadcrumbs: (breadcrumbs) => set({
          breadcrumbs,
        }),
        
        // User Context
        setJurisdiction: (jurisdiction) => set({
          currentJurisdiction: jurisdiction,
        }),
        
        updateComplianceFrameworks: (frameworks) => set({
          complianceFrameworks: frameworks,
        }),
        
        setRiskTolerance: (tolerance) => set({
          riskTolerance: tolerance,
        }),
        
        // Performance
        recordResponseTime: (time) => set((state) => ({
          responseTimeMetrics: [...state.responseTimeMetrics.slice(-9), time],
        })),
        
        // Bulk Operations
        clearAllData: () => set(initialState),
        
        exportData: () => get(),
      }),
      {
        name: 'advisory-storage',
        partialize: (state) => ({
          currentJurisdiction: state.currentJurisdiction,
          complianceFrameworks: state.complianceFrameworks,
          riskTolerance: state.riskTolerance,
          // Don't persist streaming states or temporary data
        }),
      }
    ),
    {
      name: 'advisory-store',
    }
  )
);

// Selectors for performance optimization
export const useQueries = () => useAdvisoryStore((state) => state.queries);
export const useBriefs = () => useAdvisoryStore((state) => state.briefs);
export const useStreamingState = () => useAdvisoryStore((state) => ({
  isStreaming: state.isStreaming,
  currentStreamingBrief: state.currentStreamingBrief,
}));
export const useUserContext = () => useAdvisoryStore((state) => ({
  jurisdiction: state.currentJurisdiction,
  frameworks: state.complianceFrameworks,
  riskTolerance: state.riskTolerance,
}));
export const usePerformanceMetrics = () => useAdvisoryStore((state) => ({
  responseTimeMetrics: state.responseTimeMetrics,
  averageResponseTime: state.responseTimeMetrics.length > 0 
    ? state.responseTimeMetrics.reduce((a, b) => a + b, 0) / state.responseTimeMetrics.length
    : 0,
}));