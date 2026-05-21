import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProjectSummary, SessionSummary } from '../types';

interface SidebarProps {
  projectPath?: string;
}

function Sidebar({ projectPath }: SidebarProps) {
  const { data: projects = [] } = useQuery<ProjectSummary[]>({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then((r) => r.json()),
  });

  const { data: sessions = [] } = useQuery<SessionSummary[]>({
    queryKey: ['sessions', projectPath],
    queryFn: () =>
      fetch(`/api/sessions/${projectPath}`).then((r) => r.json()),
    enabled: !!projectPath,
  });

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          项目列表
        </h2>
        <nav className="space-y-1">
          {projects.map((project) => (
            <div key={project.path}>
              <Link
                to={`/project/${project.path}`}
                className={`block px-3 py-2 rounded-md text-sm ${
                  projectPath === project.path
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{project.displayName}</span>
                  <span className="text-xs text-gray-400">
                    {project.sessionCount}
                  </span>
                </div>
              </Link>

              {projectPath === project.path && sessions.length > 0 && (
                <div className="ml-4 mt-1 space-y-1">
                  {sessions.map((session) => (
                    <Link
                      key={session.id}
                      to={`/project/${project.path}/session/${session.id}`}
                      className="block px-3 py-1.5 rounded-md text-xs text-gray-600 hover:bg-gray-100 truncate"
                    >
                      {new Date(session.startTime).toLocaleDateString('zh-CN')} - {session.model}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;
