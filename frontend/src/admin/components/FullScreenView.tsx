import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

interface FullScreenTab {
  id: string;
  label: string;
  icon: string;
}

interface FullScreenViewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  avatar?: React.ReactNode;
  tabs?: FullScreenTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  actions?: React.ReactNode;
  progress?: number;
}

export function FullScreenView({
  isOpen,
  onClose,
  title,
  subtitle,
  avatar,
  tabs = [],
  activeTab = '',
  onTabChange,
  children,
  sidebar,
  actions,
  progress,
}: FullScreenViewProps) {
  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-[150] bg-[var(--md-sys-color-surface)] flex flex-col overflow-hidden select-none"
        >
          {/* Header with back button and title */}
          <header className="h-16 flex items-center border-b border-[var(--md-sys-color-outline-variant)] border-opacity-30 shrink-0 px-4 gap-3 relative">
            <md-icon-button onClick={onClose} aria-label="返回">
              <md-icon>arrow_back</md-icon>
            </md-icon-button>

            {avatar && <div className="shrink-0">{avatar}</div>}

            <div className="flex flex-col min-w-0 flex-1">
              <h1 className="text-[18px] font-medium text-[var(--md-sys-color-on-surface)] truncate leading-tight">
                {title}
              </h1>
              {subtitle && (
                <span className="text-[12px] text-[var(--md-sys-color-on-surface-variant)] truncate leading-tight opacity-70">
                  {subtitle}
                </span>
              )}
            </div>

            <div id="fullscreen-header-actions" className="flex items-center gap-2 ml-auto shrink-0 px-2">
              {actions}
            </div>

            {progress !== undefined && (
              <div className="absolute bottom-0 left-0 right-0">
                <md-linear-progress
                  value={progress}
                  style={
                    {
                      width: '100%',
                      '--md-linear-progress-track-height': '3px',
                      '--md-linear-progress-active-indicator-height': '3px',
                    } as React.CSSProperties
                  }
                />
              </div>
            )}
          </header>

          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Navigation if provided */}
            {sidebar ? (
              <aside className="w-80 flex flex-col shrink-0 overflow-y-auto border-r border-[var(--md-sys-color-outline-variant)] border-opacity-30 bg-[var(--md-sys-color-surface-container-low)] custom-scrollbar">
                {sidebar}
              </aside>
            ) : tabs && tabs.length > 0 ? (
              <aside className="w-72 flex flex-col gap-1 p-4 shrink-0 overflow-y-auto custom-scrollbar">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange?.(tab.id)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-full transition-all relative group cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] font-medium'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)] hover:bg-opacity-30'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[22px] transition-transform duration-200 group-hover:scale-110 ${
                        activeTab === tab.id ? 'filled-icon' : ''
                      }`}
                      style={activeTab === tab.id ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {tab.icon}
                    </span>
                    <span className="text-[14px]">{tab.label}</span>
                  </button>
                ))}
              </aside>
            ) : null}

            {/* Main content - Centered layout */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--md-sys-color-surface)]">
              <div className="max-w-4xl w-full mx-auto h-full p-6 sm:p-8">{children}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}
