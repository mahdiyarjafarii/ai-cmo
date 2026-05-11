import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AnalysisState,
  AnalysisResult,
  StreamMessage,
  StepEvent,
  ChatMessage,
} from '../types';

interface Store extends AnalysisState {
  setUrl: (url: string) => void;
  setAnalysisId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  addMessage: (message: StreamMessage) => void;
  upsertStep: (step: StepEvent) => void;
  setError: (error: string | null) => void;
  setResult: (result: AnalysisResult | null) => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  reset: () => void;
}

const initialState: AnalysisState = {
  result: null,
  analysisId: null,
  loading: false,
  messages: [],
  steps: new Map(),
  stepOrder: [],
  error: null,
  url: '',
  chat: [],
};

export const useAnalysisStore = create<Store>()(
  persist(
    (set) => ({
      ...initialState,

      setUrl: (url) => set({ url }),
      setAnalysisId: (analysisId) => set({ analysisId }),
      setLoading: (loading) => set({ loading }),

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      upsertStep: (step) =>
        set((state) => {
          const newSteps = new Map(state.steps);
          const isNew = !newSteps.has(step.id);
          newSteps.set(step.id, step);
          return {
            steps: newSteps,
            stepOrder: isNew
              ? [...state.stepOrder, step.id]
              : state.stepOrder,
          };
        }),

      setError: (error) => set({ error }),
      setResult: (result) => set({ result }),

      addChatMessage: (msg) =>
        set((state) => ({ chat: [...state.chat, msg] })),

      clearChat: () => set({ chat: [] }),

      reset: () =>
        set({ ...initialState, steps: new Map(), stepOrder: [] }),
    }),
    {
      name: 'aicmo-analysis',
      // Only persist the completed result, URL, and chat — not loading state
      partialize: (state) => ({
        result: state.result,
        analysisId: state.analysisId,
        url: state.url,
        chat: state.chat,
      }),
    }
  )
);
