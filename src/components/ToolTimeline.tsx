import { useState } from 'react';
import { Message } from '../types';

interface ToolTimelineProps {
  messages: Message[];
}

const TOOL_COLORS: Record<string, string> = {
  Edit: 'bg-amber-400',
  Write: 'bg-emerald-400',
  Read: 'bg-blue-400',
  Bash: 'bg-purple-400',
  Glob: 'bg-cyan-400',
  Grep: 'bg-pink-400',
  TodoWrite: 'bg-orange-400',
  TodoRead: 'bg-orange-300',
  WebFetch: 'bg-teal-400',
  WebSearch: 'bg-teal-400',
};

function ToolTimeline({ messages }: ToolTimelineProps) {
  const [expanded, setExpanded] = useState(false);

  const tools: { name: string; timestamp: string; filePath?: string }[] = [];
  for (const msg of messages) {
    if (!msg.toolCalls) continue;
    for (const tc of msg.toolCalls) {
      const filePath = (tc.input.file_path || tc.input.path) as string | undefined;
      tools.push({
        name: tc.name,
        timestamp: msg.timestamp,
        filePath: filePath?.split(/[/\\]/).pop(),
      });
    }
  }

  if (tools.length === 0) return null;

  const toolCounts: Record<string, number> = {};
  for (const t of tools) toolCounts[t.name] = (toolCounts[t.name] || 0) + 1;

  return (
    <div className="border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-2 text-xs flex items-center gap-2 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors text-stone-500 dark:text-stone-400"
      >
        <svg className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <svg className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="font-medium text-stone-600 dark:text-stone-300">{tools.length} 次工具调用</span>
        <span className="ml-1 flex flex-wrap gap-1.5">
          {Object.entries(toolCounts).map(([name, count]) => (
            <span key={name} className="inline-flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${TOOL_COLORS[name] || 'bg-stone-400'}`} />
              <span>{name}({count})</span>
            </span>
          ))}
        </span>
      </button>

      {expanded && (
        <div className="px-6 pb-4 max-h-[320px] overflow-y-auto">
          <div className="relative ml-2 pl-4 border-l-2 border-stone-200 dark:border-stone-700 space-y-1">
            {tools.map((tool, i) => (
              <div key={i} className="relative flex items-center gap-2 py-1">
                <span className={`absolute -left-[21px] w-2.5 h-2.5 rounded-full border-2 border-white dark:border-stone-800 ${TOOL_COLORS[tool.name] || 'bg-stone-400'}`} />
                <span className="text-[10px] text-stone-400 dark:text-stone-500 w-12 tabular-nums">
                  {new Date(tool.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-xs font-medium text-stone-600 dark:text-stone-300">{tool.name}</span>
                {tool.filePath && (
                  <span className="text-xs font-mono text-stone-400 dark:text-stone-500 truncate">{tool.filePath}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ToolTimeline;
