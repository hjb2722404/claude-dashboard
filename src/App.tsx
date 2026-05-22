import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import SessionView from './pages/SessionView';
import ActivityPage from './pages/ActivityPage';
import SearchPage from './pages/SearchPage';
import ComparePage from './pages/ComparePage';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';

const StatsPage = lazy(() => import('./pages/StatsPage'));

function useTheme() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return [dark, setDark] as const;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function SearchBar() {
  const [value, setValue] = useState('');
  const navigate = useNavigate();
  const debounced = useDebounce(value, 400);

  useEffect(() => {
    if (debounced.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(debounced.trim())}`, { replace: true });
    }
  }, [debounced, navigate]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(value.trim())}`);
    }
  }, [value, navigate]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="搜索对话内容..."
        className="w-56 pl-9 pr-3 py-1.5 rounded-lg text-sm bg-stone-800 text-stone-200 placeholder-stone-500 border border-stone-700 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors"
      />
    </form>
  );
}

function SettingsPopup({ onClose }: { onClose: () => void }) {
  const { data: config } = useQuery<{ projectsDir: string; platform: string }>({
    queryKey: ['config'],
    queryFn: () => fetch('/api/config').then((r) => r.json()),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6 w-[420px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-4">数据路径配置</h3>

        <div className="mb-4">
          <label className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5 block">当前数据目录</label>
          <div className="px-3 py-2 rounded-lg bg-stone-100 dark:bg-stone-900 font-mono text-xs text-stone-700 dark:text-stone-300 break-all">
            {config?.projectsDir || '加载中...'}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5 block">如何修改数据路径</label>
          <div className="text-xs text-stone-500 dark:text-stone-400 space-y-2 leading-relaxed">
            <p>设置环境变量 <code className="px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-amber-700 dark:text-amber-400 font-mono">CLAUDE_DATA_DIR</code> 指向你的 Claude 数据目录（包含 <code className="px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-700 font-mono">projects/</code> 子目录的那个目录）。</p>
            <div className="px-3 py-2 rounded-lg bg-stone-100 dark:bg-stone-900 font-mono text-[11px] text-stone-600 dark:text-stone-400">
              <div># macOS / Linux</div>
              <div>export CLAUDE_DATA_DIR=/path/to/.claude</div>
              <div className="mt-1"># Windows (PowerShell)</div>
              <div>$env:CLAUDE_DATA_DIR = &quot;D:\custom\.claude&quot;</div>
              <div className="mt-1"># 然后启动</div>
              <div>claude-dashboard</div>
            </div>
            <p>默认路径：<code className="px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-700 font-mono">~/.claude</code></p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 rounded-lg text-sm bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
        >
          关闭
        </button>
      </div>
    </div>
  );
}

function Nav() {
  const location = useLocation();
  const path = location.pathname;
  const [dark, setDark] = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const isStats = path === '/stats';
  const isProjects = path === '/projects';
  const isActive = path === '/';

  return (
    <header className="bg-stone-900 text-stone-100 px-6 py-3 flex items-center justify-between border-b border-stone-800">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-amber-500" />
        <h1 className="text-lg font-semibold tracking-tight">Claude Dashboard</h1>
      </div>
      <div className="flex items-center gap-3">
        <SearchBar />
        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              isActive ? 'text-stone-50 bg-stone-800' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            活动
          </Link>
          <Link
            to="/projects"
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              isProjects ? 'text-stone-50 bg-stone-800' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            项目
          </Link>
          <Link
            to="/stats"
            className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1.5 ${
              isStats ? 'text-stone-50 bg-stone-800' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            统计
          </Link>
        </nav>
        <button
          onClick={() => setShowSettings(true)}
          className="ml-1 p-1.5 rounded-md text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          title="数据路径设置"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        {showSettings && <SettingsPopup onClose={() => setShowSettings(false)} />}
        <button
          onClick={() => setDark(!dark)}
          className="ml-1 p-1.5 rounded-md text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          title={dark ? '切换浅色模式' : '切换深色模式'}
        >
          {dark ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col bg-stone-50 dark:bg-stone-900">
        <Nav />
        <ErrorBoundary>
          <div className="flex-1 flex overflow-hidden">
            <Routes>
              <Route path="/" element={<ActivityPage />} />
              <Route path="/projects" element={<ProjectList />} />
              <Route path="/project/:projectPath" element={<ProjectDetail />} />
              <Route path="/project/:projectPath/session/:sessionId" element={<SessionView />} />
              <Route path="/stats" element={<Suspense fallback={<div className="flex-1 flex items-center justify-center text-stone-400 text-sm">加载中...</div>}><StatsPage /></Suspense>} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </ErrorBoundary>
      </div>
    </BrowserRouter>
  );
}

export default App;
