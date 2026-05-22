import { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SessionDetail } from '../types';
import Sidebar from '../components/Sidebar';
import ResizablePanel from '../components/ResizablePanel';

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function StatDiff({ a, b, label }: { a: number; b: number; label: string }) {
  const diff = a - b;
  return (
    <div className="text-center">
      <div className="text-xs text-stone-400 dark:text-stone-500 mb-1">{label}</div>
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm font-medium text-stone-800 dark:text-stone-200 tabular-nums">{formatTokens(a)}</span>
        {diff !== 0 && (
          <span className={`text-xs tabular-nums ${diff > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {diff > 0 ? '+' : ''}{formatTokens(diff)}
          </span>
        )}
        <span className="text-sm font-medium text-stone-800 dark:text-stone-200 tabular-nums">{formatTokens(b)}</span>
      </div>
    </div>
  );
}

function ComparePage() {
  const [searchParams] = useSearchParams();
  const s1 = searchParams.get('s1') || '';
  const s2 = searchParams.get('s2') || '';
  const p1 = searchParams.get('p1') || '';
  const p2 = searchParams.get('p2') || '';

  const { data: session1 } = useQuery<SessionDetail>({
    queryKey: ['session', p1, s1],
    queryFn: () => fetch(`/api/sessions/${p1}/${s1}`).then((r) => r.json()),
    enabled: !!p1 && !!s1,
  });

  const { data: session2 } = useQuery<SessionDetail>({
    queryKey: ['session', p2, s2],
    queryFn: () => fetch(`/api/sessions/${p2}/${s2}`).then((r) => r.json()),
    enabled: !!p2 && !!s2,
  });

  const comparison = useMemo(() => {
    if (!session1 || !session2) return null;

    const tools1: Record<string, number> = {};
    const tools2: Record<string, number> = {};
    for (const msg of session1.messages) {
      if (msg.toolCalls) for (const tc of msg.toolCalls) tools1[tc.name] = (tools1[tc.name] || 0) + 1;
    }
    for (const msg of session2.messages) {
      if (msg.toolCalls) for (const tc of msg.toolCalls) tools2[tc.name] = (tools2[tc.name] || 0) + 1;
    }

    const allTools = [...new Set([...Object.keys(tools1), ...Object.keys(tools2)])].sort();

    const filesOnly1 = session1.filesModified.filter(f => !session2.filesModified.includes(f));
    const filesOnly2 = session2.filesModified.filter(f => !session1.filesModified.includes(f));
    const filesCommon = session1.filesModified.filter(f => session2.filesModified.includes(f));

    return { tools1, tools2, allTools, filesOnly1, filesOnly2, filesCommon };
  }, [session1, session2]);

  if (!s1 || !s2) {
    return (
      <>
        <ResizablePanel><Sidebar /></ResizablePanel>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-stone-500 dark:text-stone-400">请通过侧边栏选择两个会话进行对比</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <ResizablePanel><Sidebar /></ResizablePanel>
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500 mb-6">
            <Link to="/projects" className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">项目</Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-stone-600 dark:text-stone-300">会话对比</span>
          </nav>

          {!session1 || !session2 ? (
            <div className="space-y-4">
              {[0, 1].map(i => (
                <div key={i} className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5">
                  <div className="skeleton h-4 w-48 mb-3" />
                  <div className="skeleton h-4 w-full mb-2" />
                  <div className="skeleton h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : comparison && (
            <>
              {/* Header comparison */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { session: session1, p: p1, s: s1, label: '会话 A' },
                  { session: session2, p: p2, s: s2, label: '会话 B' },
                ].map(({ session, p, s, label }) => (
                  <Link
                    key={label}
                    to={`/project/${p}/session/${s}`}
                    className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5 hover:border-stone-300 dark:hover:border-stone-600 transition-colors"
                  >
                    <div className="text-xs text-stone-400 dark:text-stone-500 mb-2">{label}</div>
                    <div className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">{session.model}</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                      {session.messages.length > 0 && new Date(session.messages[0].timestamp).toLocaleString('zh-CN')}
                      {' · '}{session.messages.length} 条消息
                    </div>
                  </Link>
                ))}
              </div>

              {/* Token comparison */}
              <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5 mb-6">
                <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">Token 对比 (A / B)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <StatDiff a={session1.totalTokens.input} b={session2.totalTokens.input} label="输入" />
                  <StatDiff a={session1.totalTokens.output} b={session2.totalTokens.output} label="输出" />
                  <StatDiff a={session1.totalTokens.input + session1.totalTokens.output} b={session2.totalTokens.input + session2.totalTokens.output} label="总计" />
                </div>
              </div>

              {/* Tool comparison */}
              <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5 mb-6">
                <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">工具调用对比</h3>
                <div className="space-y-2">
                  {comparison.allTools.map(tool => {
                    const c1 = comparison.tools1[tool] || 0;
                    const c2 = comparison.tools2[tool] || 0;
                    const max = Math.max(c1, c2, 1);
                    return (
                      <div key={tool} className="flex items-center gap-3">
                        <span className="text-xs text-stone-600 dark:text-stone-300 w-20 shrink-0">{tool}</span>
                        <div className="flex-1 flex gap-1">
                          <div className="flex-1 flex justify-end">
                            <div className="bg-amber-400 dark:bg-amber-500 rounded-sm h-4" style={{ width: `${(c1 / max) * 100}%`, minWidth: c1 > 0 ? '4px' : '0' }} />
                          </div>
                          <div className="flex-1">
                            <div className="bg-stone-400 dark:bg-stone-500 rounded-sm h-4" style={{ width: `${(c2 / max) * 100}%`, minWidth: c2 > 0 ? '4px' : '0' }} />
                          </div>
                        </div>
                        <span className="text-xs text-stone-400 dark:text-stone-500 w-16 text-right tabular-nums shrink-0">{c1} / {c2}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Files comparison */}
              <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 p-5">
                <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">文件修改对比</h3>
                {comparison.filesCommon.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-medium text-stone-400 dark:text-stone-500 mb-2">共同修改 ({comparison.filesCommon.length})</div>
                    <div className="flex flex-wrap gap-2">
                      {comparison.filesCommon.map(f => (
                        <span key={f} className="text-xs font-mono px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          {f.split(/[/\\]/).pop()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-stone-400 dark:text-stone-500 mb-2">仅 A 修改 ({comparison.filesOnly1.length})</div>
                    <div className="flex flex-wrap gap-2">
                      {comparison.filesOnly1.length === 0 && <span className="text-xs text-stone-400">无</span>}
                      {comparison.filesOnly1.map(f => (
                        <span key={f} className="text-xs font-mono px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                          {f.split(/[/\\]/).pop()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-stone-400 dark:text-stone-500 mb-2">仅 B 修改 ({comparison.filesOnly2.length})</div>
                    <div className="flex flex-wrap gap-2">
                      {comparison.filesOnly2.length === 0 && <span className="text-xs text-stone-400">无</span>}
                      {comparison.filesOnly2.map(f => (
                        <span key={f} className="text-xs font-mono px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                          {f.split(/[/\\]/).pop()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default ComparePage;
