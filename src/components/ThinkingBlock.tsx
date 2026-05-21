import { useState } from 'react';

interface ThinkingBlockProps {
  thinking: string;
}

function ThinkingBlock({ thinking }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2 border border-purple-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 text-left text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 flex items-center justify-between"
      >
        <span>Thinking</span>
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="p-3 bg-gray-50 text-sm text-gray-700 whitespace-pre-wrap font-mono">
          {thinking}
        </div>
      )}
    </div>
  );
}

export default ThinkingBlock;
