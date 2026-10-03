import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SnackbarProvider, useSnackbar } from './SnackbarContext';

function TestComponent() {
  const { showSnackbar, hideSnackbar } = useSnackbar();
  return (
    <div>
      <button onClick={() => showSnackbar('测试普通消息')}>Show Default</button>
      <button onClick={() => showSnackbar({ message: '测试错误消息', variant: 'error' })}>Show Error</button>
      <button onClick={hideSnackbar}>Hide</button>
    </div>
  );
}

describe('SnackbarContext', () => {
  it('displays snackbar with string message', () => {
    render(
      <SnackbarProvider>
        <TestComponent />
      </SnackbarProvider>
    );

    act(() => {
      screen.getByText('Show Default').click();
    });

    expect(screen.getByText('测试普通消息')).toBeDefined();
  });

  it('displays snackbar with error options and custom variant', () => {
    render(
      <SnackbarProvider>
        <TestComponent />
      </SnackbarProvider>
    );

    act(() => {
      screen.getByText('Show Error').click();
    });

    expect(screen.getByText('测试错误消息')).toBeDefined();
  });

  it('hides snackbar when hideSnackbar is called', () => {
    render(
      <SnackbarProvider>
        <TestComponent />
      </SnackbarProvider>
    );

    act(() => {
      screen.getByText('Show Default').click();
    });
    expect(screen.getByText('测试普通消息')).toBeDefined();

    act(() => {
      screen.getByText('Hide').click();
    });
  });

  it('returns no-op functions when useSnackbar is called outside provider', () => {
    function Standalone() {
      const { showSnackbar, hideSnackbar } = useSnackbar();
      return (
        <button onClick={() => { showSnackbar('msg'); hideSnackbar(); }}>
          Outside
        </button>
      );
    }

    render(<Standalone />);
    // Should not throw
    act(() => {
      screen.getByText('Outside').click();
    });
  });
});
