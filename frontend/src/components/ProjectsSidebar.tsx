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
  pending: 'bg-gray-400',
  crawling: 'bg-[#fc6423] animate-pulse',
  done: 'bg-green-500',
  error: 'bg-red-500',
};

export function ProjectsSidebar({
  open, onClose, projects, activeProjectId, onOpenProject, onDeleteProject, plan,
}: ProjectsSidebarProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-80 z-50 flex flex-col bg-white border-l border-gray-200 shadow-2xl"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-gray-900 font-semibold text-sm">My Projects</h2>
                <p className="text-gray-400 text-xs mt-0.5">
                  {plan === 'free' ? `${projects.length}/1 · Free plan` : `${projects.length} projects · Pro`}
                </p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                ✕
              </button>
            </div>

            {/* Project list */}
            <div className="flex-1 overflow-y-auto py-3 px-3">
              {projects.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No projects yet</div>
              ) : (
                <div className="space-y-1.5">
                  {projects.map((project) => (
                    <motion.div
                      key={project.id}
                      layout
                      onClick={() => onOpenProject(project)}
                      className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition border ${
                        activeProjectId === project.id
                          ? 'bg-[#fc6423]/8 border-[#fc6423]/25'
                          : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${statusColor[project.status]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 text-sm font-medium truncate">{project.name}</p>
                        <p className="text-gray-400 text-xs truncate mt-0.5">
                          {project.url.replace(/^https?:\/\//, '')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this project?')) onDeleteProject(project.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition text-sm shrink-0"
                      >
                        🗑
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Upgrade banner */}
            {plan === 'free' && (
              <div className="px-4 py-4 border-t border-gray-200">
                <div className="rounded-xl p-4 text-center bg-gradient-to-br from-[#fff4ef] to-orange-50 border border-[#fc6423]/20">
                  <p className="text-gray-800 text-xs font-medium mb-1">⚡ Upgrade to Pro</p>
                  <p className="text-gray-500 text-xs mb-3">Unlimited projects & deeper insights</p>
                  <button className="w-full py-2 text-xs font-semibold rounded-lg bg-[#fc6423] text-white opacity-60 cursor-not-allowed">
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
