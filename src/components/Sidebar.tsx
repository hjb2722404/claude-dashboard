import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProjectSummary, SessionSummary } from '../types';

interface SidebarProps {
  projectPath?: string;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function Sidebar({ projectPath }: SidebarProps) {
  const { data: projects = [] } = useQuery<ProjectSummary[]>({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then((r) => r.json()),
  });

  const { data: sessions = [] } = useQuery<SessionSummary[]>({
    queryKey: ['sessions', projectPath],
    queryFn: () => fetch(`/api/sessions/${projectPath}`).then((r) => r.json()),
    enabled: !!projectPath,
  });

  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const compareUrl = selected.length === 2 && projectPath
    ? `/compare?p1=${projectPath}&s1=${selected[0]}&p2=${projectPath}&s2=${selected[1]}`
    : '';

  return (
    <aside className="h-full bg-stone-950 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-4 px-3">
          项目
        </h2>
        <nav className="space-y-0.5">
          {projects.map((project) => (
            <div key={project.path}>
              <Link
                to={`/project/${project.path}`}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  projectPath === project.path
                    ? 'bg-stone-800 text-stone-50 font-medium border-l-2 border-amber-500 pl-2.5'
                    : 'text-stone-400 hover:bg-stone-900 hover:text-stone-200'
                }`}
              >
                <span className="truncate">{project.displayName}</span>
                <span className={`text-xs tabular-nums ${
                  projectPath === project.path ? 'text-stone-400' : 'text-stone-600'
                }`}>
                  {project.sessionCount}
                </span>
              </Link>

              {projectPath === project.path && sessions.length > 0 && (
                <div className="mt-1 px-2">
                  {compareMode && selected.length === 2 && compareUrl && (
                    <Link
                      to={compareUrl}
                      className="block text-center text-xs py-1.5 rounded-md bg-amber-600 text-stone-50 hover:bg-amber-500 transition-colors mb-2"
                    >
                      对比选中的 {selected.length} 个会话
                    </Link>
                  )}
                  <div className="flex items-center justify-between mb-1 px-1">
                    <span className="text-[10px] text-stone-600 uppercase tracking-wider">
                      {compareMode ? `已选 ${selected.length}/2` : '会话'}
                    </span>
                    <button
                      onClick={() => { setCompareMode(!compareMode); setSelected([]); }}
                      className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                        compareMode ? 'text-amber-500 bg-stone-900' : 'text-stone-600 hover:text-stone-400'
                      }`}
                    >
                      {compareMode ? '取消' : '对比'}
                    </button>
                  </div>
                  <div className="space-y-0.5 border-l border-stone-800 pl-3">
                    {sessions.map((session) => {
                      const isSelected = selected.includes(session.id);
                      return (
                        <div key={session.id} className="relative">
                          {compareMode && (
                            <button
                              onClick={() => toggleSelect(session.id)}
                              className={`absolute left-[-19px] top-1/2 -translate-y-1/2 w-3 h-3 rounded border transition-colors z-10 ${
                                isSelected ? 'bg-amber-500 border-amber-500' : 'border-stone-600 hover:border-stone-400'
                              }`}
                            />
                          )}
                          <Link
                            to={compareMode ? '#' : `/project/${project.path}/session/${session.id}`}
                            onClick={compareMode ? (e) => { e.preventDefault(); toggleSelect(session.id); } : undefined}
                            className={`flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-colors duration-200 group ${
                              isSelected
                                ? 'text-amber-400 bg-stone-900'
                                : 'text-stone-500 hover:text-stone-300 hover:bg-stone-900'
                            }`}
                          >
                            <span className="truncate">{new Date(session.startTime).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} · {session.model}</span>
                            <span className="text-stone-600 group-hover:text-stone-400 tabular-nums shrink-0 ml-1">{formatTokens(session.totalTokens)}</span>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
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
