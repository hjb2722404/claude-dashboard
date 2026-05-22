import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ProjectSummary } from '../types';
import Sidebar from '../components/Sidebar';
import ResizablePanel from '../components/ResizablePanel';

function ProjectCardSkeleton() {
  return (
    <div className="p-5 rounded-xl bg-white dark:bg-stone-800">
      <div className="skeleton h-5 w-3/4 mb-3" />
      <div className="flex items-center gap-4">
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-4 w-24" />
      </div>
    </div>
  );
}

function ProjectList() {
  const { data: projects = [], isLoading, error } = useQuery<ProjectSummary[]>({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then((r) => r.json()),
  });

  return (
    <>
      <ResizablePanel>
        <Sidebar />
      </ResizablePanel>
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">所有项目</h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm mb-8">浏览 Claude 会话记录</p>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">加载失败，请检查后端服务是否启动</div>
          )}

          {isLoading && (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => <ProjectCardSkeleton key={i} />)}
            </div>
          )}

          {!isLoading && projects.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <p className="text-stone-600 dark:text-stone-300 font-medium">未找到 Claude 数据目录</p>
              <p className="text-stone-400 text-sm mt-1">请确保 ~/.claude/projects/ 目录存在</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <Link
                key={project.path}
                to={`/project/${project.path}`}
                className="group block p-5 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-750 border border-stone-200/80 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-200/50 dark:hover:shadow-stone-900/50"
              >
                <h3 className="font-semibold text-stone-900 dark:text-stone-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">{project.displayName}</h3>
                <div className="mt-3 flex items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {project.sessionCount} 个会话
                  </span>
                  <span className="text-stone-400 dark:text-stone-500">{new Date(project.lastActive).toLocaleDateString('zh-CN')}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export default ProjectList;
