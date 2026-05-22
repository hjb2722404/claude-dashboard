import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '../components/Sidebar';
import ResizablePanel from '../components/ResizablePanel';

interface SessionBrief {
  id: string;
  model: string;
  startTime: string;
  messageCount: number;
  totalTokens: number;
}

interface ProjectStats {
  displayName: string;
  totalSessions: number;
  totalTokens: number;
  totalInput: number;
  totalOutput: number;
  totalMessages: number;
  models: { name: string; count: number; tokens: number }[];
  topFiles: string[];
  dailyTokens: { date: string; tokens: number }[];
  sessions: SessionBrief[];
}

type SortKey = 'time' | 'tokens' | 'messages';
type SortDir = 'asc' | 'desc';

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function ProjectDetail() {
  const { projectPath } = useParams<{ projectPath: string }>();
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const { data: stats, isLoading, error } = useQuery<ProjectStats>({
    queryKey: ['project-detail', projectPath],
    queryFn: () => fetch(`/api/project-detail/${projectPath}`).then((r) => r.json()),
    enabled: !!projectPath,
  });

  const sortedSessions = useMemo(() => {
    if (!stats) return [];
    const s = [...stats.sessions];
    s.sort((a, b) => {
      let va: number, vb: number;
      switch (sortKey) {
        case 'time': va = new Date(a.startTime).getTime(); vb = new Date(b.startTime).getTime(); break;
        case 'tokens': va = a.totalTokens; vb = b.totalTokens; break;
        case 'messages': va = a.messageCount; vb = b.messageCount; break;
      }
      return sortDir === 'desc' ? vb - va : va - vb;
    });
    return s;
  }, [stats, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => (
    <svg className={`w-3 h-3 inline ml-0.5 ${active ? 'text-amber-600 dark:text-amber-400' : 'text-stone-300 dark:text-stone-600'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      {dir === 'desc' ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />}
    </svg>
  );

  const projectName = stats?.displayName?.split(/[/\\]/).pop() || projectPath || '';

  return (
    <>
      <ResizablePanel>
        <Sidebar projectPath={projectPath} />
      </ResizablePanel>
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-stone-400 dark:text-stone-500 mb-6">
            <Link to="/projects" className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">项目</Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-stone-600 dark:text-stone-300">{projectName}</span>
          </nav>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm mb-6">加载项目失败</div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5">
                  <div className="skeleton h-3 w-16 mb-3" />
                  <div className="skeleton h-8 w-24" />
                </div>
              ))}
            </div>
          ) : stats && (
            <>
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">{projectName}</h2>
              <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">{stats.displayName}</p>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: '会话数', value: stats.totalSessions.toString() },
                  { label: '总 Token', value: formatTokens(stats.totalTokens) },
                  { label: '总消息', value: stats.totalMessages.toString() },
                  { label: '模型数', value: stats.models.length.toString() },
                ].map(card => (
                  <div key={card.label} className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5">
                    <div className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">{card.label}</div>
                    <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 tabular-nums">{card.value}</div>
                  </div>
                ))}
              </div>

              {stats.topFiles.length > 0 && (
                <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5 mb-6">
                  <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">修改过的文件</h3>
                  <div className="flex flex-wrap gap-2">
                    {stats.topFiles.map(f => (
                      <span key={f} className="text-xs font-mono px-2 py-1 rounded-md bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300">{f}</span>
                    ))}
                  </div>
                </div>
              )}

              {stats.models.length > 0 && (
                <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5 mb-6">
                  <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">模型使用</h3>
                  <div className="space-y-2">
                    {stats.models.map(m => {
                      const pct = stats.totalTokens > 0 ? (m.tokens / stats.totalTokens) * 100 : 0;
                      return (
                        <div key={m.name} className="flex items-center gap-3">
                          <span className="text-xs text-stone-600 dark:text-stone-300 w-32 truncate">{m.name}</span>
                          <div className="flex-1 h-4 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 dark:bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-stone-400 dark:text-stone-500 w-20 text-right tabular-nums">{formatTokens(m.tokens)} · {m.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5">
                <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">会话列表</h3>

                <div className="flex items-center gap-4 mb-3 text-xs text-stone-500 dark:text-stone-400 px-4">
                  <button onClick={() => toggleSort('time')} className="flex items-center hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
                    时间 <SortIcon active={sortKey === 'time'} dir={sortDir} />
                  </button>
                  <button onClick={() => toggleSort('tokens')} className="flex items-center hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
                    Token <SortIcon active={sortKey === 'tokens'} dir={sortDir} />
                  </button>
                  <button onClick={() => toggleSort('messages')} className="flex items-center hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
                    消息 <SortIcon active={sortKey === 'messages'} dir={sortDir} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {sortedSessions.map(session => (
                    <Link
                      key={session.id}
                      to={`/project/${projectPath}/session/${session.id}`}
                      className="group flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
                    >
                      <span className="text-xs text-stone-400 dark:text-stone-500 w-28 shrink-0 tabular-nums">
                        {new Date(session.startTime).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">{session.model}</span>
                      <span className="text-xs text-stone-400 dark:text-stone-500">{session.messageCount} 消息</span>
                      <span className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">{formatTokens(session.totalTokens)}</span>
                      <svg className="w-3.5 h-3.5 ml-auto text-stone-300 dark:text-stone-600 group-hover:text-stone-500 dark:group-hover:text-stone-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default ProjectDetail;
