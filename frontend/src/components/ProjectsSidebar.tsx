import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../services/authApi';

interface ProjectsSidebarProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string | null;
  onOpenProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  plan: 'free' | 'pro';
}

const statusColor: Record<Project['status'], string> = {
  pending: 'bg-slate-600',
  crawling: 'bg-blue-400 animate-pulse',
  done: 'bg-green-400',
  error: 'bg-red-400',
};

export function ProjectsSidebar({
  open,
  onClose,
  projects,
  activeProjectId,
  onOpenProject,
  onDeleteProject,
  plan,
}: ProjectsSidebarProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(5,7,20,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-80 z-50 flex flex-col"
            style={{
              background: 'linear-gradient(180deg, #0d1028 0%, #080b1f 100%)',
              borderLeft: '1px solid rgba(99,102,241,0.15)',
            }}
          >
            {/* Header */}
            <div className="px-5 py-5 border-b border-slate-800/60 flex items-center justify-between">
              <div>
                <h2 className="text-slate-100 font-semibold text-sm">My Projects</h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  {plan === 'free' ? `${projects.length}/1 · Free plan` : `${projects.length} projects · Pro`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-300 transition text-lg"
              >
                ✕
              </button>
            </div>

            {/* Project list */}
            <div className="flex-1 overflow-y-auto py-3 px-3">
              {projects.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No projects yet
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <motion.div
                      key={project.id}
                      layout
                      onClick={() => onOpenProject(project)}
                      className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition border ${
                        activeProjectId === project.id
                          ? 'bg-indigo-500/10 border-indigo-500/30'
                          : 'border-transparent hover:bg-slate-800/50 hover:border-slate-700/50'
                      }`}
                    >
                      {/* Status dot */}
                      <div className={`w-2 h-2 rounded-full shrink-0 ${statusColor[project.status]}`} />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-100 text-sm font-medium truncate">
                          {project.name}
                        </p>
                        <p className="text-slate-500 text-xs truncate mt-0.5">
                          {project.url.replace(/^https?:\/\//, '')}
                        </p>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this project?')) onDeleteProject(project.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition text-sm shrink-0"
                      >
                        🗑
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Upgrade banner (free plan only) */}
            {plan === 'free' && (
              <div className="px-4 py-4 border-t border-slate-800/60">
                <div
                  className="rounded-xl p-4 text-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
                    border: '1px solid rgba(99,102,241,0.2)',
                  }}
                >
                  <p className="text-slate-300 text-xs font-medium mb-1">⚡ Upgrade to Pro</p>
                  <p className="text-slate-500 text-xs mb-3">Unlimited projects & deeper insights</p>
                  <button className="w-full py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 text-white opacity-80 cursor-not-allowed">
                    Coming Soon
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
