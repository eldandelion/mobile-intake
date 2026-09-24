import React from 'react';
import { SidebarProvider } from '../contexts/SidebarContext';

export function AdminSidebar({
  children,
  composeButton,
}: {
  children?: React.ReactNode;
  composeButton?: React.ReactNode;
}) {
  const isCollapsed = true;
  const width = isCollapsed ? 80 : 256;

  return (
    <SidebarProvider isCollapsed={isCollapsed} sidebarWidth={width}>
      <aside
        style={{ width }}
        className="flex-shrink-0 flex flex-col gap-2 bg-transparent z-10 relative transition-[width] duration-200 ease-in-out select-none"
      >
        {/* Logo Area matching medical-system */}
        <div className="h-16 flex items-center justify-center px-2 overflow-hidden transition-all duration-200">
          <span className="text-[14px] font-bold text-[var(--md-sys-color-primary)]">CSU</span>
        </div>

        {/* Compose/Action Area if provided */}
        {composeButton && (
          <div
            className="px-2 flex justify-center mb-4"
            style={{
              '--md-fab-container-elevation': '0',
              '--md-fab-hover-container-elevation': '0',
              '--md-fab-focus-container-elevation': '0',
              '--md-fab-pressed-container-elevation': '0',
            } as React.CSSProperties}
          >
            {composeButton}
          </div>
        )}

        {/* Navigation Area */}
        <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar overflow-x-hidden flex flex-col gap-3">
          {children}
        </div>
      </aside>
    </SidebarProvider>
  );
}
