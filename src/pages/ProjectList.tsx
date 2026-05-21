import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ProjectSummary } from '../types';
import Sidebar from '../components/Sidebar';

function ProjectList() {
  const { data: projects = [], isLoading, error } = useQuery<ProjectSummary[]>({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then((r) => r.json()),
  });

  return (
    <>
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">所有项目</h2>

        {isLoading && <p className="text-gray-500">加载中...</p>}

        {error && (
          <p className="text-red-500">加载失败，请检查后端服务是否启动</p>
        )}

        {!isLoading && projects.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">未找到 Claude 数据目录</p>
            <p className="text-sm mt-2">请确保 ~/.claude/projects/ 目录存在</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.path}
              to={`/project/${project.path}`}
              className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-shadow"
            >
              <h3 className="font-medium text-gray-900 truncate">
                {project.displayName}
              </h3>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                <span>{project.sessionCount} 个会话</span>
                <span>
                  {new Date(project.lastActive).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

export default ProjectList;
