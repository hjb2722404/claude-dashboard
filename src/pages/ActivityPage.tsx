import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ResizablePanel from '../components/ResizablePanel';
import { useBookmarks } from '../hooks/useBookmarks';

interface RecentSession {
  projectPath: string;
  projectDisplayName: string;
  sessionId: string;
  model: string;
  startTime: string;
  messageCount: number;
  totalInput: number;
  totalOutput: number;
  preview: string;
  continuedFrom: string | null;
}

type TimeFilter = 'today' | '7d' | '30d' | 'all';

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function RelativeTime({ date }: { date: string }) {
  return <time className="text-xs text-stone-400 dark:text-stone-500 tabular-nums whitespace-nowrap">{formatTimeAgo(date)}</time>;
}

function TimeFilterBar({ value, onChange }: { value: TimeFilter; onChange: (v: TimeFilter) => void }) {
  const options: { key: TimeFilter; label: string }[] = [
    { key: 'today', label: '今天' },
    { key: '7d', label: '近7天' },
    { key: '30d', label: '近30天' },
    { key: 'all', label: '全部' },
  ];

  return (
    <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-1">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
            value === opt.key ? 'bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function BookmarkButton({ sessionId, isBookmarked, onToggle }: { sessionId: string; isBookmarked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(); }}
      className={`shrink-0 transition-colors ${isBookmarked ? 'text-amber-500' : 'text-stone-300 dark:text-stone-600 hover:text-amber-400'}`}
      title={isBookmarked ? '取消收藏' : '收藏'}
    >
      <svg className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    </button>
  );
}

function ActivityPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30d');
  const { isBookmarked, toggle } = useBookmarks();

  const { data: sessions = [], isLoading, error } = useQuery<RecentSession[]>({
    queryKey: ['recent'],
    queryFn: () => fetch('/api/recent?limit=200').then((r) => r.json()),
  });

  const filtered = useMemo(() => {
    if (timeFilter === 'all') return sessions;
    const now = new Date();
    if (timeFilter === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return sessions.filter((s) => new Date(s.startTime) >= startOfDay);
    }
    const days = timeFilter === '7d' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return sessions.filter((s) => new Date(s.startTime) >= cutoff);
  }, [sessions, timeFilter]);

  return (
    <>
      <ResizablePanel>
        <Sidebar />
      </ResizablePanel>
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">最近活动</h2>
              <p className="text-stone-500 dark:text-stone-400 text-sm">跨项目的会话时间线 · {filtered.length} 条会话</p>
            </div>
            <TimeFilterBar value={timeFilter} onChange={setTimeFilter} />
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">加载失败，请检查后端服务</div>
          )}

          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="skeleton h-4 w-20" />
                    <div className="skeleton h-4 w-16" />
                    <div className="skeleton h-4 w-24" />
                  </div>
                  <div className="skeleton h-4 w-full mb-2" />
                  <div className="skeleton h-4 w-2/3" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-stone-600 dark:text-stone-300 font-medium">所选时间段内无会话</p>
              <p className="text-stone-400 text-sm mt-1">试试切换到更大的时间范围</p>
            </div>
          )}

          <div className="space-y-3">
            {filtered.map((session) => {
              const total = session.totalInput + session.totalOutput;
              const projectName = session.projectDisplayName.split(/[/\\]/).pop() || session.projectDisplayName;
              const bookmarked = isBookmarked(session.sessionId);

              return (
                <Link
                  key={session.sessionId}
                  to={`/project/${session.projectPath}/session/${session.sessionId}`}
                  className={`group block bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5 hover:border-stone-300 dark:hover:border-stone-600 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-stone-200/50 dark:hover:shadow-stone-900/50 ${bookmarked ? 'ring-1 ring-amber-300 dark:ring-amber-700' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                      {projectName}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                      {session.model}
                    </span>
                    <span className="text-xs text-stone-400 dark:text-stone-500">{session.messageCount} 条消息</span>
                    {total > 0 && <span className="text-xs text-stone-400 dark:text-stone-500">{formatTokens(total)} tokens</span>}
                    <RelativeTime date={session.startTime} />
                    <BookmarkButton sessionId={session.sessionId} isBookmarked={bookmarked} onToggle={() => toggle(session.sessionId)} />
                  </div>
                  {session.preview && (
                    <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 group-hover:text-stone-700 dark:group-hover:text-stone-300 transition-colors leading-relaxed">
                      {session.preview}
                    </p>
                  )}
                  {session.continuedFrom && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      续接自上一会话
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}

export default ActivityPage;
