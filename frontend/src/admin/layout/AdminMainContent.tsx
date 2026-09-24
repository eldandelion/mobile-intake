import React, { useState, useRef, useCallback, useEffect } from 'react';
import { LAYOUT_CONSTANTS } from '../config/layoutConstants';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface AdminMainContentProps {
  children?: React.ReactNode;
  sidePanel?: React.ReactNode;
  isSidePanelOpen?: boolean;
}

export function AdminMainContent({ children, sidePanel, isSidePanelOpen }: AdminMainContentProps) {
  const isOverlayMode = useMediaQuery(`(max-width: ${LAYOUT_CONSTANTS.RESPONSIVE_OVERLAY_BREAKPOINT - 1}px)`);
  const [sideWidth, setSideWidth] = useState<number>(LAYOUT_CONSTANTS.SIDE_PANEL_DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = containerRect.right - e.clientX;

    const minWidth = LAYOUT_CONSTANTS.SIDE_PANEL_MIN_WIDTH;
    const maxWidth = Math.min(LAYOUT_CONSTANTS.SIDE_PANEL_MAX_WIDTH, containerRect.width * 0.6);

    setSideWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const showSide = sidePanel && isSidePanelOpen;

  return (
    <div ref={containerRef} className="flex-1 pr-2 pb-2 flex h-full overflow-hidden relative">
      {/* Main Container strict boundary */}
      <main className="flex-1 h-full relative bg-[var(--md-sys-color-surface)] rounded-3xl overflow-hidden outline-none border-none ring-0">
        <div className="absolute inset-0 w-full h-full flex flex-col overflow-hidden">
          {children}
        </div>

        {/* In-Canvas Overlay for smaller screens */}
        {showSide && isOverlayMode && (
          <div
            id={LAYOUT_CONSTANTS.SIDE_PANEL_WRAPPER_ID}
            className="absolute inset-0 z-30 w-full h-full overflow-hidden flex flex-col bg-[var(--md-sys-color-surface)]"
          >
            {React.isValidElement(sidePanel)
              ? React.cloneElement(sidePanel as React.ReactElement<any>, { width: '100%' })
              : sidePanel}
          </div>
        )}
      </main>

      {/* Side-by-Side Split View for desktop screens */}
      {showSide && !isOverlayMode && (
        <>
          {/* Resize Handle Area */}
          <div
            onMouseDown={startResizing}
            className="w-3.5 h-full group cursor-col-resize flex items-center justify-center z-40 relative shrink-0"
            title="拖动调整面板宽度"
          >
            <div
              className={`w-1 h-12 rounded-full transition-colors ${
                isResizing
                  ? 'bg-[var(--md-sys-color-primary)]'
                  : 'bg-[var(--md-sys-color-outline-variant)] group-hover:bg-[var(--md-sys-color-primary)]'
              }`}
            />
          </div>

          {/* Side Panel Container */}
          <div
            id={LAYOUT_CONSTANTS.SIDE_PANEL_WRAPPER_ID}
            style={{ width: sideWidth }}
            className="h-full flex flex-col shrink-0 overflow-hidden bg-[var(--md-sys-color-surface)] rounded-3xl shadow-xs border border-[var(--md-sys-color-outline-variant)]/30"
          >
            {React.isValidElement(sidePanel)
              ? React.cloneElement(sidePanel as React.ReactElement<any>, { width: sideWidth })
              : sidePanel}
          </div>
        </>
      )}
    </div>
  );
}
