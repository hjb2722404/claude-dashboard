import { useState, useMemo } from 'react';
import { Message } from '../types';

interface FilesPanelProps {
  messages: Message[];
  filesModified: string[];
}

interface FileOp {
  type: string;
  oldString?: string;
  newString?: string;
  content?: string;
}

interface LineStats {
  added: number;
  removed: number;
}

function countLines(text: string | undefined): number {
  if (!text) return 0;
  return text.split('\n').length;
}

function DiffBlock({ op, stats }: { op: FileOp; stats: LineStats }) {
  if (op.type === 'Edit') {
    return (
      <div className="text-xs font-mono leading-relaxed">
        {op.oldString && (
          <div className="px-3 py-2 bg-red-50/80 dark:bg-red-950/40 text-red-900 dark:text-red-300 whitespace-pre-wrap overflow-x-auto border-b border-red-100/60 dark:border-red-900/40">
            {op.oldString.split('\n').map((line, i) => (
              <div key={i}><span className="text-red-400 dark:text-red-500 select-none mr-2">-</span>{line}</div>
            ))}
          </div>
        )}
        {op.newString && (
          <div className="px-3 py-2 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 whitespace-pre-wrap overflow-x-auto">
            {op.newString.split('\n').map((line, i) => (
              <div key={i}><span className="text-emerald-400 dark:text-emerald-500 select-none mr-2">+</span>{line}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-3 py-2 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-48 leading-relaxed">
      {op.content && op.content.split('\n').map((line, i) => (
        <div key={i}><span className="text-emerald-400 dark:text-emerald-500 select-none mr-2">+</span>{line}</div>
      ))}
    </div>
  );
}

function FilesPanel({ messages, filesModified }: FilesPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  const fileOps = useMemo(() => {
    const map = new Map<string, FileOp[]>();
    for (const msg of messages) {
      if (!msg.toolCalls) continue;
      for (const tool of msg.toolCalls) {
        if (tool.name !== 'Edit' && tool.name !== 'Write') continue;
        const filePath = (tool.input.file_path || tool.input.path) as string;
        if (!filePath) continue;
        const ops = map.get(filePath) || [];
        ops.push({
          type: tool.name,
          oldString: tool.input.old_string as string | undefined,
          newString: tool.input.new_string as string | undefined,
          content: tool.input.content as string | undefined,
        });
        map.set(filePath, ops);
      }
    }
    return map;
  }, [messages]);

  const fileLineStats = useMemo(() => {
    const stats = new Map<string, LineStats>();
    for (const [filePath, ops] of fileOps) {
      let added = 0;
      let removed = 0;
      for (const op of ops) {
        if (op.type === 'Edit') {
          removed += countLines(op.oldString);
          added += countLines(op.newString);
        } else {
          added += countLines(op.content);
        }
      }
      stats.set(filePath, { added, removed });
    }
    return stats;
  }, [fileOps]);

  const totalStats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const s of fileLineStats.values()) {
      added += s.added;
      removed += s.removed;
    }
    return { added, removed };
  }, [fileLineStats]);

  if (filesModified.length === 0) return null;

  return (
    <div className="border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-2.5 text-sm flex items-center gap-2 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors text-stone-600 dark:text-stone-300"
      >
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium text-stone-700 dark:text-stone-200">修改 {filesModified.length} 个文件</span>
        <span className="text-xs ml-auto flex items-center gap-2.5">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">+{totalStats.added}</span>
          <span className="text-red-500 dark:text-red-400 font-medium">-{totalStats.removed}</span>
        </span>
      </button>

      {expanded && (
        <div className="px-6 pb-4 max-h-[420px] overflow-y-auto">
          {filesModified.map((filePath) => {
            const ops = fileOps.get(filePath) || [];
            const fileName = filePath.split(/[/\\]/).pop() || filePath;
            const isOpen = expandedFile === filePath;
            const stats = fileLineStats.get(filePath) || { added: 0, removed: 0 };

            return (
              <div key={filePath} className="mb-1.5">
                <button
                  onClick={() => setExpandedFile(isOpen ? null : filePath)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors text-left group"
                >
                  <svg
                    className={`w-3 h-3 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-mono text-xs text-stone-800 dark:text-stone-200 truncate group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    {fileName}
                  </span>
                  <span className="text-xs flex items-center gap-2 ml-auto shrink-0">
                    <span className="text-emerald-600 dark:text-emerald-400">+{stats.added}</span>
                    <span className="text-red-500 dark:text-red-400">-{stats.removed}</span>
                  </span>
                </button>

                {isOpen && (
                  <div className="ml-5 mt-1 space-y-2">
                    {ops.map((op, i) => {
                      const opStats: LineStats = op.type === 'Edit'
                        ? { added: countLines(op.newString), removed: countLines(op.oldString) }
                        : { added: countLines(op.content), removed: 0 };

                      return (
                        <div key={i} className="rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
                          <div className="px-3 py-1.5 text-xs font-medium text-stone-500 dark:text-stone-400 bg-stone-50/80 dark:bg-stone-900/50 flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              op.type === 'Edit'
                                ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400'
                                : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                            }`}>
                              {op.type}
                            </span>
                            <span className="font-mono text-stone-400 dark:text-stone-500 truncate text-[11px]">{fileName}</span>
                            <span className="ml-auto text-[11px] flex items-center gap-1.5">
                              {opStats.added > 0 && <span className="text-emerald-600 dark:text-emerald-400">+{opStats.added}</span>}
                              {opStats.removed > 0 && <span className="text-red-500 dark:text-red-400">-{opStats.removed}</span>}
                            </span>
                          </div>
                          <DiffBlock op={op} stats={opStats} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FilesPanel;
