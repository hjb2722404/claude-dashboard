import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { Message } from '../types';
import ThinkingBlock from './ThinkingBlock';

interface MessageBubbleProps {
  message: Message;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors opacity-0 group-hover:opacity-100"
      title="复制代码"
    >
      {copied ? (
        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const usage = message.usage;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-5`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-stone-800 dark:bg-stone-700 text-stone-50 rounded-br-md'
            : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 rounded-bl-md shadow-sm'
        }`}
      >
        <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'dark:prose-invert'} [&_pre]:relative [&_pre]:group/code`}>
          <ReactMarkdown
            rehypePlugins={[rehypeHighlight]}
            components={{
              pre: ({ children }) => {
                const codeEl = children as React.ReactElement;
                const codeText = codeEl?.props?.children || '';
                return (
                  <div className="relative group">
                    <pre>{children}</pre>
                    <CopyButton text={typeof codeText === 'string' ? codeText : String(codeText)} />
                  </div>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {message.thinking && <ThinkingBlock thinking={message.thinking} />}

        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.toolCalls.map((tool, i) => (
              <details key={i} className="group rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700">
                <summary className="px-3 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/50 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-700/50 transition-colors flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-amber-700 dark:text-amber-400">{tool.name}</span>
                  {typeof tool.input.file_path === 'string' && (
                    <span className="text-stone-400 dark:text-stone-500 font-mono text-xs">
                      {tool.input.file_path.split('/').pop()}
                    </span>
                  )}
                </summary>
                <div className="p-3 bg-stone-50/50 dark:bg-stone-900/50">
                  <div className="text-xs font-medium text-stone-400 dark:text-stone-500 mb-1">输入</div>
                  <div className="relative group">
                    <pre className="text-xs bg-stone-100 dark:bg-stone-800 p-2.5 rounded-lg overflow-x-auto font-mono text-stone-700 dark:text-stone-300">
                      {JSON.stringify(tool.input, null, 2)}
                    </pre>
                    <CopyButton text={JSON.stringify(tool.input, null, 2)} />
                  </div>
                  {tool.result && (
                    <>
                      <div className="text-xs font-medium text-stone-400 dark:text-stone-500 mt-2.5 mb-1">结果</div>
                      <div className="relative group">
                        <pre className="text-xs bg-stone-100 dark:bg-stone-800 p-2.5 rounded-lg overflow-x-auto max-h-48 font-mono text-stone-700 dark:text-stone-300">
                          {tool.result}
                        </pre>
                        <CopyButton text={tool.result} />
                      </div>
                    </>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-2.5 text-xs text-stone-400 dark:text-stone-500">
          <span>{new Date(message.timestamp).toLocaleTimeString('zh-CN')}</span>
          {usage && (usage.input_tokens > 0 || usage.output_tokens > 0) && (
            <>
              <span className="text-stone-300 dark:text-stone-600">·</span>
              <span className="tabular-nums">
                {usage.input_tokens > 0 && <span>↑{formatTokens(usage.input_tokens)}</span>}
                {usage.input_tokens > 0 && usage.output_tokens > 0 && <span> </span>}
                {usage.output_tokens > 0 && <span>↓{formatTokens(usage.output_tokens)}</span>}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
