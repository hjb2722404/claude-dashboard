import { useState } from 'react';

interface ThinkingBlockProps {
  thinking: string;
}

function ThinkingBlock({ thinking }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-3 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 text-left text-sm font-medium text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          思考过程
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="p-3 bg-stone-50 dark:bg-stone-900/50 text-sm text-stone-600 dark:text-stone-300 whitespace-pre-wrap font-mono leading-relaxed">
          {thinking}
        </div>
      )}
    </div>
  );
}

export default ThinkingBlock;
