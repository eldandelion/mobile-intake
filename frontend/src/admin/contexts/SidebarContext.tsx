import React, { createContext, useContext } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  sidebarWidth: number;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({
  isCollapsed = true,
  sidebarWidth = 80,
  children,
}: Partial<SidebarContextType> & { children: React.ReactNode }) {
  return (
    <SidebarContext.Provider value={{ isCollapsed, sidebarWidth }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    return { isCollapsed: true, sidebarWidth: 80 };
  }
  return context;
}
