import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteStudentDialog } from './DeleteStudentDialog';

describe('DeleteStudentDialog', () => {
  let mockOnClose = vi.fn();
  let mockOnConfirm = vi.fn();

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnConfirm = vi.fn();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <DeleteStudentDialog
        isOpen={false}
        studentNumber="8209220533"
        studentName="李四"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders confirmation dialog with student info and destructive warning without icons or clutter', () => {
    render(
      <DeleteStudentDialog
        isOpen={true}
        studentNumber="8209220533"
        studentName="李四"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('确认删除学生登记？')).toBeDefined();
    expect(screen.getByText(/此操作不可撤销/)).toBeDefined();
    expect(screen.getByText('李四')).toBeDefined();
    expect(screen.getByText('8209220533')).toBeDefined();
    expect(screen.getByRole('button', { name: /取消/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /彻底删除/i })).toBeDefined();
  });

  it('calls onConfirm and onClose when 彻底删除 is clicked', async () => {
    mockOnConfirm.mockResolvedValue(undefined);

    render(
      <DeleteStudentDialog
        isOpen={true}
        studentNumber="8209220533"
        studentName="李四"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /彻底删除/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('8209220533');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('calls onClose when 取消 is clicked without calling onConfirm', () => {
    render(
      <DeleteStudentDialog
        isOpen={true}
        studentNumber="8209220533"
        studentName="李四"
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
