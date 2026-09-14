import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar } from '../components/common/Snackbar';

export interface SnackbarOptions {
  message: string;
  icon?: string;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export interface SnackbarContextType {
  showSnackbar: (options: SnackbarOptions | string) => void;
  hideSnackbar: () => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<SnackbarOptions>({ message: '' });

  const showSnackbar = useCallback((opts: SnackbarOptions | string) => {
    const resolved: SnackbarOptions = typeof opts === 'string' ? { message: opts } : opts;
    setOptions(resolved);
    setOpen(true);
  }, []);

  const hideSnackbar = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar, hideSnackbar }}>
      {children}
      <Snackbar
        open={open}
        message={options.message}
        icon={options.icon}
        actionLabel={options.actionLabel}
        onAction={() => {
          options.onAction?.();
          hideSnackbar();
        }}
        onClose={hideSnackbar}
        duration={options.duration ?? 4000}
      />
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = (): SnackbarContextType => {
  const context = useContext(SnackbarContext);
  if (!context) {
    return {
      showSnackbar: () => {},
      hideSnackbar: () => {},
    };
  }
  return context;
};
