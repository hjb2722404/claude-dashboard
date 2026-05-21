import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SessionDetail } from '../types';
import Sidebar from '../components/Sidebar';
import MessageBubble from '../components/MessageBubble';
import TokenStats from '../components/TokenStats';

function SessionView() {
  const { projectPath, sessionId } = useParams<{
    projectPath: string;
    sessionId: string;
  }>();

  const { data: session, isLoading, error } = useQuery<SessionDetail>({
    queryKey: ['session', projectPath, sessionId],
    queryFn: () =>
      fetch(`/api/sessions/${projectPath}/${sessionId}`).then((r) => r.json()),
    enabled: !!projectPath && !!sessionId,
  });

  return (
    <>
      <Sidebar projectPath={projectPath} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部状态栏 */}
        {session && (
          <div className="bg-gray-100 px-6 py-2 text-sm text-gray-600 flex items-center gap-4 border-b">
            <span>模型: {session.model}</span>
            <span>
              {session.messages.length > 0 &&
                new Date(session.messages[0].timestamp).toLocaleString('zh-CN')}
            </span>
            {session.filesModified.length > 0 && (
              <span>修改文件: {session.filesModified.length} 个</span>
            )}
          </div>
        )}

        {/* 对话区域 */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {isLoading && <p className="text-gray-500">加载中...</p>}

          {error && (
            <p className="text-red-500">加载会话失败</p>
          )}

          {!sessionId && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">选择一个会话查看对话内容</p>
            </div>
          )}

          {session && session.messages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>此会话没有消息内容</p>
            </div>
          )}

          {session?.messages.map((message, i) => (
            <MessageBubble key={i} message={message} />
          ))}
        </div>

        {/* 底部 Token 统计 */}
        {session && (
          <TokenStats
            input={session.totalTokens.input}
            output={session.totalTokens.output}
          />
        )}
      </main>
    </>
  );
}

export default SessionView;
