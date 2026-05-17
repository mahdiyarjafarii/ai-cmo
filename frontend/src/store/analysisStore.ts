import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AnalysisState,
  AnalysisResult,
  StreamMessage,
  StepEvent,
  ChatMessage,
  TwitterFeed,
  LinkedInFeed,
  RedditFeed,
  SeoReport,
} from '../types';

interface Store extends AnalysisState {
  setUrl: (url: string) => void;
  setAnalysisId: (id: string | null) => void;
  setProjectId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  addMessage: (message: StreamMessage) => void;
  upsertStep: (step: StepEvent) => void;
  setError: (error: string | null) => void;
  setResult: (result: AnalysisResult | null) => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  setTwitterFeed: (feed: TwitterFeed | null) => void;
  setLinkedinFeed: (feed: LinkedInFeed | null) => void;
  setRedditFeed: (feed: RedditFeed | null) => void;
  setSeoReport: (report: SeoReport | null) => void;
  reset: () => void;
}

const initialState: AnalysisState = {
  result: null,
  analysisId: null,
  projectId: null,
  loading: false,
  messages: [],
  steps: new Map(),
  stepOrder: [],
  error: null,
  url: '',
  chat: [],
  twitterFeed: null,
  linkedinFeed: null,
  redditFeed: null,
  seoReport: null,
};

export const useAnalysisStore = create<Store>()(
  persist(
    (set) => ({
      ...initialState,

      setUrl: (url) => set({ url }),
      setAnalysisId: (analysisId) => set({ analysisId }),
      setProjectId: (projectId) => set({ projectId }),
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
            stepOrder: isNew ? [...state.stepOrder, step.id] : state.stepOrder,
          };
        }),

      setError: (error) => set({ error }),
      setResult: (result) => set({ result }),

      addChatMessage: (msg) =>
        set((state) => ({ chat: [...state.chat, msg] })),

      clearChat: () => set({ chat: [] }),

      setTwitterFeed: (twitterFeed) => set({ twitterFeed }),
      setLinkedinFeed: (linkedinFeed) => set({ linkedinFeed }),
      setRedditFeed: (redditFeed) => set({ redditFeed }),
      setSeoReport: (seoReport) => set({ seoReport }),

      reset: () =>
        set({ ...initialState, steps: new Map(), stepOrder: [] }),
    }),
    {
      name: 'aicmo-analysis',
      partialize: (state) => ({
        result: state.result,
        analysisId: state.analysisId,
        projectId: state.projectId,
        url: state.url,
        chat: state.chat,
        twitterFeed: state.twitterFeed,
        linkedinFeed: state.linkedinFeed,
        redditFeed: state.redditFeed,
        seoReport: state.seoReport,
      }),
    }
  )
);
