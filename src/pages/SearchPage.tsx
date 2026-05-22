import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ResizablePanel from '../components/ResizablePanel';

interface SearchResult {
  projectPath: string;
  projectDisplayName: string;
  sessionId: string;
  model: string;
  startTime: string;
  matches: string[];
}

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

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-200/70 dark:bg-amber-700/50 text-stone-900 dark:text-amber-200 rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [projectFilter, setProjectFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');

  const { data: results = [], isLoading, error } = useQuery<SearchResult[]>({
    queryKey: ['search', query],
    queryFn: () => fetch(`/api/search?q=${encodeURIComponent(query)}`).then((r) => r.json()),
    enabled: query.length >= 2,
  });

  const projects = useMemo(() => {
    const set = new Set(results.map((r) => r.projectPath));
    return Array.from(set).map((p) => {
      const r = results.find((x) => x.projectPath === p)!;
      return { path: p, name: r.projectDisplayName.split(/[/\\]/).pop() || r.projectDisplayName };
    });
  }, [results]);

  const models = useMemo(() => Array.from(new Set(results.map((r) => r.model))), [results]);

  const filtered = useMemo(() => {
    let data = results;
    if (projectFilter) data = data.filter((r) => r.projectPath === projectFilter);
    if (modelFilter) data = data.filter((r) => r.model === modelFilter);
    return data;
  }, [results, projectFilter, modelFilter]);

  return (
    <>
      <ResizablePanel>
        <Sidebar />
      </ResizablePanel>
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">搜索结果</h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">
            {query ? `搜索 "${query}" · ${filtered.length} 条结果` : '输入关键词开始搜索'}
          </p>

          {results.length > 0 && (
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              >
                <option value="">全部项目</option>
                {projects.map((p) => <option key={p.path} value={p.path}>{p.name}</option>)}
              </select>
              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              >
                <option value="">全部模型</option>
                {models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              {(projectFilter || modelFilter) && (
                <button
                  onClick={() => { setProjectFilter(''); setModelFilter(''); }}
                  className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                >
                  清除筛选
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">搜索失败</div>
          )}

          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="skeleton h-4 w-24" />
                    <div className="skeleton h-4 w-16" />
                    <div className="skeleton h-4 w-20" />
                  </div>
                  <div className="skeleton h-4 w-full mb-2" />
                  <div className="skeleton h-4 w-3/4" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && query.length >= 2 && filtered.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-stone-600 dark:text-stone-300 font-medium">未找到匹配的会话</p>
              <p className="text-stone-400 text-sm mt-1">试试其他关键词</p>
            </div>
          )}

          <div className="space-y-3">
            {filtered.map((result) => {
              const projectName = result.projectDisplayName.split(/[/\\]/).pop() || result.projectDisplayName;
              return (
                <Link
                  key={result.sessionId}
                  to={`/project/${result.projectPath}/session/${result.sessionId}`}
                  className="group block bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5 hover:border-stone-300 dark:hover:border-stone-600 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-stone-200/50 dark:hover:shadow-stone-900/50"
                >
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300">{projectName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">{result.model}</span>
                    <span className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">{formatTimeAgo(result.startTime)}</span>
                  </div>
                  <div className="space-y-1.5">
                    {result.matches.map((match, i) => (
                      <p key={i} className="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                        <HighlightedText text={match} query={query} />
                      </p>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}

export default SearchPage;
