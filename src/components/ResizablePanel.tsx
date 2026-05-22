import { useState, useCallback, useRef, useEffect } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

function ResizablePanel({
  children,
  defaultWidth = 256,
  minWidth = 180,
  maxWidth = 480,
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = e.clientX - startX.current;
      setWidth(Math.min(maxWidth, Math.max(minWidth, startWidth.current + delta)));
    };

    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [minWidth, maxWidth]);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-16 left-3 z-50 p-2 rounded-lg bg-stone-900 text-stone-300 shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {mobileOpen
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          }
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div className="w-72 h-full bg-stone-950" onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
        </div>
      )}

      {/* Desktop resizable panel */}
      <div style={{ width }} className="hidden md:block relative shrink-0 overflow-hidden">
        {children}
        <div
          onMouseDown={onMouseDown}
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-amber-500/60 active:bg-amber-500 transition-colors duration-200"
        />
      </div>
    </>
  );
}

export default ResizablePanel;
