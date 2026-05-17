import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { InputPanel } from './components/InputPanel';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { ProjectsSidebar } from './components/ProjectsSidebar';
import { useAnalysisStore } from './store/analysisStore';
import { useAuthStore } from './store/authStore';
import { startAnalysis, subscribeToAnalysis } from './services/api';
import { authApi, projectsApi, Project } from './services/authApi';
import { StepEvent } from './types';

// ─── Home page ────────────────────────────────────────────────────────────────

function HomePage() {
  const navigate = useNavigate();
  const { setError, reset } = useAnalysisStore();
  const { isAuthenticated, setUser } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [showProjects, setShowProjects] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const { user, logout } = useAuthStore();

  useEffect(() => {
    authApi.me()
      .then(({ data }) => {
        setUser(data.user);
        projectsApi.list().then(({ data: d }) => setProjects(d.projects)).catch(() => {});
      })
      .catch(() => setUser(null));
  }, []);

  const handleAnalyze = (url: string) => {
    if (!isAuthenticated) {
      setPendingUrl(url);
      setShowAuthModal(true);
      return;
    }
    startFlow(url);
  };

  const startFlow = async (url: string) => {
    let projectId: string | null = null;
    try {
      const { data } = await projectsApi.create({ url });
      projectId = data.project.id;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { code?: string; projectId?: string } } };
      if (e?.response?.data?.code === 'UPGRADE_REQUIRED') {
        setError('Free plan limit reached. You can only have 1 project on the free plan.');
        return;
      }
      if (e?.response?.data?.projectId) {
        projectId = e.response.data.projectId;
      }
    }

    if (!projectId) {
      setError('Failed to create project');
      return;
    }

    reset();
    navigate(`/project/${projectId}`, { state: { url, fresh: true } });
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    setProjects([]);
  };

  const { error } = useAnalysisStore();

  return (
    <>
      <InputPanel
        onSubmit={handleAnalyze}
        isLoading={false}
        error={error}
        user={user}
        onShowProjects={() => setShowProjects(true)}
        onLogout={handleLogout}
        onLogin={() => setShowAuthModal(true)}
      />

      <AuthModal
        open={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingUrl(null); }}
        onSuccess={() => {
          setShowAuthModal(false);
          projectsApi.list().then(({ data }) => setProjects(data.projects)).catch(() => {});
          if (pendingUrl) { const u = pendingUrl; setPendingUrl(null); startFlow(u); }
        }}
      />

      <ProjectsSidebar
        open={showProjects}
        onClose={() => setShowProjects(false)}
        projects={projects}
        activeProjectId={null}
        onOpenProject={(p) => { setShowProjects(false); navigate(`/project/${p.id}`); }}
        onDeleteProject={async (id) => {
          await projectsApi.delete(id);
          projectsApi.list().then(({ data }) => setProjects(data.projects)).catch(() => {});
        }}
        plan={user?.plan ?? 'free'}
      />
    </>
  );
}

// ─── Project page ─────────────────────────────────────────────────────────────

import { useParams, useLocation } from 'react-router-dom';

function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
  const [showProjects, setShowProjects] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  const {
    result, loading, steps, stepOrder, error,
    setLoading, addMessage, upsertStep, setError, setResult,
    setAnalysisId, setProjectId,
    setTwitterFeed, setLinkedinFeed, setRedditFeed, setSeoReport,
    reset,
  } = useAnalysisStore();

  useEffect(() => {
    authApi.me()
      .then(({ data }) => {
        setUser(data.user);
        projectsApi.list().then(({ data: d }) => setProjects(d.projects)).catch(() => {});
      })
      .catch(() => setUser(null));
  }, []);

  const loadProjects = () => {
    projectsApi.list().then(({ data }) => setProjects(data.projects)).catch(() => {});
  };

  useEffect(() => {
    if (!id) return;

    const fresh = (location.state as { url?: string; fresh?: boolean } | null)?.fresh;
    const url = (location.state as { url?: string } | null)?.url;

    if (fresh && url) {
      // New analysis — start the agent
      setProjectId(id);
      setLoading(true);
      setError(null);

      startAnalysis(url, id).then(({ analysisId }) => {
        setAnalysisId(analysisId);
        subscribeToAnalysis(analysisId, {
          onMessage: (msg) => { if (msg.type !== 'step') addMessage(msg); },
          onStep: (step: StepEvent) => upsertStep(step),
          onError: (msg) => { setError(msg); setLoading(false); },
          onComplete: (res) => {
            if (res) setResult(res);
            setLoading(false);
            loadProjects();
          },
        });
      }).catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to start analysis');
        setLoading(false);
      });
    } else {
      // Load existing project from DB
      setProjectId(id);
      setLoading(true);
      projectsApi.get(id).then(({ data }) => {
        if (data.analysisResult) setResult(data.analysisResult as never);
        if (data.content?.twitter) setTwitterFeed(data.content.twitter);
        if (data.content?.linkedin) setLinkedinFeed(data.content.linkedin);
        if (data.content?.reddit) setRedditFeed(data.content.reddit);
        if (data.content?.seo) setSeoReport(data.content.seo);
        setLoading(false);
      }).catch(() => setLoading(false));
    }

    return () => { reset(); };
  }, [id]);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    setProjects([]);
    reset();
    navigate('/');
  };

  return (
    <>
      <Dashboard
        isLoading={loading}
        steps={steps}
        stepOrder={stepOrder}
        error={error}
        result={result}
        onNewAnalysis={() => { reset(); navigate('/'); }}
        user={user}
        onShowProjects={() => setShowProjects(true)}
        onLogout={handleLogout}
      />

      <ProjectsSidebar
        open={showProjects}
        onClose={() => setShowProjects(false)}
        projects={projects}
        activeProjectId={id ?? null}
        onOpenProject={(p) => { setShowProjects(false); reset(); navigate(`/project/${p.id}`); }}
        onDeleteProject={async (pid) => {
          await projectsApi.delete(pid);
          loadProjects();
          if (pid === id) { reset(); navigate('/'); }
        }}
        plan={user?.plan ?? 'free'}
      />
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/project/:id" element={<ProjectPage />} />
    </Routes>
  );
}
