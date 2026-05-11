import { useState, useEffect } from 'react';
import { InputPanel } from './components/InputPanel';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { ProjectsSidebar } from './components/ProjectsSidebar';
import { useAnalysisStore } from './store/analysisStore';
import { useAuthStore } from './store/authStore';
import { startAnalysis, subscribeToAnalysis } from './services/api';
import { authApi, projectsApi, Project } from './services/authApi';
import { StepEvent } from './types';

export default function App() {
  const {
    result,
    loading,
    steps,
    stepOrder,
    error,
    setLoading,
    addMessage,
    upsertStep,
    setError,
    setResult,
    setAnalysisId,
    reset,
  } = useAnalysisStore();

  const { user, isAuthenticated, setUser, logout } = useAuthStore();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [showProjects, setShowProjects] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Check session on mount
  useEffect(() => {
    authApi.me()
      .then(({ data }) => {
        setUser(data.user);
        loadProjects();
      })
      .catch(() => setUser(null));
  }, []);

  const loadProjects = () => {
    projectsApi.list()
      .then(({ data }) => setProjects(data.projects))
      .catch(() => {});
  };

  const handleAnalyze = async (url: string) => {
    if (!isAuthenticated) {
      setPendingUrl(url);
      setShowAuthModal(true);
      return;
    }
    startAnalysisFlow(url);
  };

  const startAnalysisFlow = async (url: string) => {
    // Create/find project
    let projectId: string | null = null;
    try {
      const { data } = await projectsApi.create({ url });
      projectId = data.project.id as string;

      if (data.cached) {
        // Load from cache
        const { data: proj } = await projectsApi.get(projectId!);
        if (proj.analysisResult) {
          setResult(proj.analysisResult as never);
          setLoading(false);
          setActiveProjectId(projectId);
          loadProjects();
          return;
        }
      }
      setActiveProjectId(projectId);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { code?: string; projectId?: string } } };
      if (e?.response?.data?.code === 'UPGRADE_REQUIRED') {
        setError('Free plan limit reached. You can only have 1 project on the free plan.');
        return;
      }
      if (e?.response?.data?.projectId) {
        const existingId = e.response.data.projectId;
        projectId = existingId;
        // Load cached data for existing project
        try {
          const { data: proj } = await projectsApi.get(existingId);
          if (proj.analysisResult) {
            setResult(proj.analysisResult as never);
            setLoading(false);
            setActiveProjectId(existingId);
            return;
          }
        } catch {}
      }
    }

    // Run crawl
    reset();
    setLoading(true);
    setError(null);

    try {
      const { analysisId } = await startAnalysis(url);
      setAnalysisId(analysisId);

      await subscribeToAnalysis(analysisId, {
        onMessage: (message) => {
          if (message.type !== 'step') addMessage(message);
        },
        onStep: (step: StepEvent) => upsertStep(step),
        onError: (errorMsg) => {
          setError(errorMsg);
          setLoading(false);
        },
        onComplete: (analysisResult) => {
          if (analysisResult) setResult(analysisResult);
          setLoading(false);
          loadProjects();
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start analysis');
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    loadProjects();
    if (pendingUrl) {
      const url = pendingUrl;
      setPendingUrl(null);
      startAnalysisFlow(url);
    }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    setProjects([]);
    setActiveProjectId(null);
    reset();
  };

  const handleOpenProject = async (project: Project) => {
    setShowProjects(false);
    reset();
    setActiveProjectId(project.id);

    if (project.status === 'done') {
      try {
        setLoading(true);
        const { data } = await projectsApi.get(project.id);
        if (data.analysisResult) {
          setResult(data.analysisResult as never);
        }
        setLoading(false);
      } catch {
        setLoading(false);
      }
    }
  };

  const handleNewAnalysis = () => {
    reset();
    setActiveProjectId(null);
  };

  const isActive = loading || !!result || stepOrder.length > 0;

  return (
    <>
      {!isActive ? (
        <InputPanel
          onSubmit={handleAnalyze}
          isLoading={loading}
          error={error}
          user={user}
          onShowProjects={() => setShowProjects(true)}
          onLogout={handleLogout}
          onLogin={() => setShowAuthModal(true)}
        />
      ) : (
        <Dashboard
          isLoading={loading}
          steps={steps}
          stepOrder={stepOrder}
          error={error}
          result={result}
          onNewAnalysis={handleNewAnalysis}
          user={user}
          onShowProjects={() => setShowProjects(true)}
          onLogout={handleLogout}
        />
      )}

      <AuthModal
        open={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingUrl(null); }}
        onSuccess={handleAuthSuccess}
      />

      <ProjectsSidebar
        open={showProjects}
        onClose={() => setShowProjects(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onOpenProject={handleOpenProject}
        onDeleteProject={async (id) => {
          await projectsApi.delete(id);
          loadProjects();
          if (activeProjectId === id) handleNewAnalysis();
        }}
        plan={user?.plan ?? 'free'}
      />
    </>
  );
}
