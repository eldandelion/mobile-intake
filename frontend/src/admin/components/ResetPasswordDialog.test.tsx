import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ResetPasswordDialog } from './ResetPasswordDialog';

function simulateInput(element: Element, value: string) {
  act(() => {
    (element as any).value = value;
    fireEvent(element, new Event('input', { bubbles: true, composed: true }));
  });
}

describe('ResetPasswordDialog', () => {
  let mockOnClose = vi.fn();
  let mockOnConfirm = vi.fn();

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnConfirm = vi.fn();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ResetPasswordDialog
        isOpen={false}
        studentNumber="8209220532"
        studentName="张三"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders Step 1 (input dialog with md-outlined-text-field) and supports default password flow', async () => {
    mockOnConfirm.mockResolvedValue(undefined);

    render(
      <ResetPasswordDialog
        isOpen={true}
        studentNumber="8209220532"
        studentName="张三"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    // Verify Step 1 headline and text field are visible without icons
    expect(screen.getByText('重置学生密码')).toBeDefined();
    expect(screen.getByText(/张三 · 学号: 8209220532/)).toBeDefined();
    const textField = document.querySelector('md-outlined-text-field');
    expect(textField).not.toBeNull();
    expect(textField?.getAttribute('label')).toBe('新密码');

    // Click "下一步" to move to Step 2 confirmation
    const nextBtn = screen.getByRole('button', { name: /下一步/i });
    fireEvent.click(nextBtn);

    // Verify Step 2 confirmation dialog is visible with clean text
    await waitFor(() => {
      expect(screen.getByText('确认重置密码？')).toBeDefined();
      expect(screen.getByText('123456')).toBeDefined();
    });

    // Click "确认重置"
    const confirmBtn = screen.getByRole('button', { name: /确认重置/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('8209220532', undefined);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('supports custom password and step back (返回修改)', async () => {
    mockOnConfirm.mockResolvedValue(undefined);

    render(
      <ResetPasswordDialog
        isOpen={true}
        studentNumber="8209220532"
        studentName="张三"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const textField = document.querySelector('md-outlined-text-field')!;
    simulateInput(textField, 'customPass99');

    // Click 下一步
    const nextBtn = screen.getByRole('button', { name: /下一步/i });
    fireEvent.click(nextBtn);

    // Verify Step 2 shows the custom password in clean summary
    await waitFor(() => {
      expect(screen.getByText('确认重置密码？')).toBeDefined();
      expect(screen.getByText('customPass99')).toBeDefined();
    });

    // Click "返回修改" to go back to Step 1
    const backBtn = screen.getByRole('button', { name: /返回修改/i });
    fireEvent.click(backBtn);

    // Verify Step 1 is shown again
    await waitFor(() => {
      expect(screen.getByText('重置学生密码')).toBeDefined();
    });

    // Proceed again and confirm
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));
    await waitFor(() => {
      expect(screen.getByText('确认重置密码？')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /确认重置/i }));
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('8209220532', 'customPass99');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('validates minimum password length when custom password is entered', async () => {
    render(
      <ResetPasswordDialog
        isOpen={true}
        studentNumber="8209220532"
        studentName="张三"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const textField = document.querySelector('md-outlined-text-field')!;
    simulateInput(textField, '123');

    // Material text field should have error attributes
    expect(textField.getAttribute('error-text')).toBe('新密码长度不能少于 6 位');

    // Next button should be disabled
    const nextBtn = screen.getByRole('button', { name: /下一步/i });
    expect(nextBtn.hasAttribute('disabled')).toBe(true);
  });

  it('calls onClose when cancel is clicked in Step 1', () => {
    render(
      <ResetPasswordDialog
        isOpen={true}
        studentNumber="8209220532"
        studentName="张三"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /取消/i });
    fireEvent.click(cancelBtn);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });
});
