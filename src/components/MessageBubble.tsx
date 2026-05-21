import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { Message } from '../types';
import ThinkingBlock from './ThinkingBlock';

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-gray-800 text-white'
            : 'bg-white border border-gray-200 text-gray-900'
        }`}
      >
        {/* 消息内容 */}
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Thinking 区域 */}
        {message.thinking && <ThinkingBlock thinking={message.thinking} />}

        {/* 工具调用 */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.toolCalls.map((tool, i) => (
              <details key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                <summary className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 cursor-pointer hover:bg-gray-100">
                  <span className="text-blue-600">{tool.name}</span>
                  {tool.input.file_path && (
                    <span className="ml-2 text-gray-500 font-mono text-xs">
                      {(tool.input.file_path as string).split('/').pop()}
                    </span>
                  )}
                </summary>
                <div className="p-3 bg-gray-50">
                  <div className="text-xs font-medium text-gray-500 mb-1">输入:</div>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(tool.input, null, 2)}
                  </pre>
                  {tool.result && (
                    <>
                      <div className="text-xs font-medium text-gray-500 mt-2 mb-1">结果:</div>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-48">
                        {tool.result}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}

        {/* 时间戳 */}
        <div
          className={`text-xs mt-2 ${
            isUser ? 'text-gray-400' : 'text-gray-400'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString('zh-CN')}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
