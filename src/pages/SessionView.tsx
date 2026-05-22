import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SessionDetail } from '../types';
import Sidebar from '../components/Sidebar';
import ResizablePanel from '../components/ResizablePanel';
import MessageBubble from '../components/MessageBubble';
import TokenStats from '../components/TokenStats';
import FilesPanel from '../components/FilesPanel';
import ToolTimeline from '../components/ToolTimeline';

function MessageSkeleton() {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
        <div className="space-y-2">
          <div className="skeleton h-4 w-64" />
          <div className="skeleton h-4 w-48" />
          <div className="skeleton h-4 w-56" />
        </div>
      </div>
    </div>
  );
}

function exportMarkdown(session: SessionDetail) {
  let md = `# ${session.model} 会话\n\n`;
  if (session.messages.length > 0) {
    md += `日期: ${new Date(session.messages[0].timestamp).toLocaleString('zh-CN')}\n`;
  }
  md += `消息数: ${session.messages.length}\n\n---\n\n`;

  for (const msg of session.messages) {
    md += `## ${msg.role === 'user' ? '用户' : '助手'}\n\n${msg.content}\n\n`;
    if (msg.thinking) {
      md += `<details>\n<summary>思考过程</summary>\n\n${msg.thinking}\n\n</details>\n\n`;
    }
    if (msg.toolCalls?.length) {
      for (const tc of msg.toolCalls) {
        md += `### 工具: ${tc.name}\n\n\`\`\`json\n${JSON.stringify(tc.input, null, 2)}\n\`\`\`\n\n`;
        if (tc.result) md += `**结果:**\n\`\`\`\n${tc.result.slice(0, 2000)}\n\`\`\`\n\n`;
      }
    }
    md += `*${new Date(msg.timestamp).toLocaleTimeString('zh-CN')}*\n\n---\n\n`;
  }

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${session.model}-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function SessionView() {
  const { projectPath, sessionId } = useParams<{ projectPath: string; sessionId: string }>();

  const { data: session, isLoading, error } = useQuery<SessionDetail>({
    queryKey: ['session', projectPath, sessionId],
    queryFn: () => fetch(`/api/sessions/${projectPath}/${sessionId}`).then((r) => r.json()),
    enabled: !!projectPath && !!sessionId,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  const projectName = projectPath?.replace(/--/g, ':').replace(/-/g, '\\').split('\\').pop() || '';

  return (
    <>
      <ResizablePanel>
        <Sidebar projectPath={projectPath} />
      </ResizablePanel>
      <main className="flex-1 flex flex-col overflow-hidden">
        {session && (
          <>
            <nav className="px-6 py-2 text-xs text-stone-400 dark:text-stone-500 flex items-center gap-1.5 border-b border-stone-200 dark:border-stone-700 bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm">
              <Link to="/projects" className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">项目</Link>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <Link to={`/project/${projectPath}`} className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">{projectName}</Link>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span className="text-stone-600 dark:text-stone-300">{session.model}</span>
            </nav>
            <div className="px-6 py-2 text-sm text-stone-500 dark:text-stone-400 flex items-center gap-4 border-b border-stone-200 dark:border-stone-700 bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm">
              <span className="font-medium text-stone-700 dark:text-stone-200">{session.model}</span>
              <span className="text-stone-300 dark:text-stone-600">|</span>
              <span>
                {session.messages.length > 0 && new Date(session.messages[0].timestamp).toLocaleString('zh-CN')}
              </span>
              {session.messages.length > 0 && (
                <>
                  <span className="text-stone-300 dark:text-stone-600">|</span>
                  <span>{session.messages.length} 条消息</span>
                </>
              )}
              <button
                onClick={() => exportMarkdown(session)}
                className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                title="导出为 Markdown"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                导出
              </button>
            </div>
          </>
        )}

        {session && <FilesPanel messages={session.messages} filesModified={session.filesModified} />}
        {session && <ToolTimeline messages={session.messages} />}

        <div className="flex-1 overflow-y-auto p-6 bg-stone-50 dark:bg-stone-900">
          {error && (
            <div className="max-w-3xl mx-auto">
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">加载会话失败</div>
            </div>
          )}

          {isLoading && (
            <div className="max-w-3xl mx-auto space-y-4">
              {Array.from({ length: 4 }).map((_, i) => <MessageSkeleton key={i} />)}
            </div>
          )}

          {!sessionId && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-stone-600 dark:text-stone-300 font-medium">选择一个会话查看对话内容</p>
                <p className="text-stone-400 text-sm mt-1">从左侧选择项目并点击会话</p>
              </div>
            </div>
          )}

          {session && session.messages.length === 0 && (
            <div className="text-center py-12 text-stone-500 dark:text-stone-400">此会话没有消息内容</div>
          )}

          <div className="max-w-3xl mx-auto">
            {session?.messages.map((message, i) => <MessageBubble key={i} message={message} />)}
          </div>
        </div>

        {session && <TokenStats input={session.totalTokens.input} output={session.totalTokens.output} />}
      </main>
    </>
  );
}

export default SessionView;
