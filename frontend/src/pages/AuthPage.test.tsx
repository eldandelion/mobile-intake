import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthPage } from './AuthPage';
import { AuthProvider } from '../contexts/AuthContext';

describe('AuthPage', () => {
  it('renders registration form by default and toggles between register and login', () => {
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );

    expect(screen.getByText('CSU')).toBeDefined();
    expect(screen.getByText('新生心理普查与档案采集')).toBeDefined();
    expect(screen.getByText('新同学登记')).toBeDefined();
    expect(screen.getByText('已有学号登录')).toBeDefined();

    // In registration mode, name and phone fields are visible
    expect(screen.getByPlaceholderText('请输入您的姓名')).toBeDefined();
    expect(screen.getByPlaceholderText('11位手机号码')).toBeDefined();

    // Click "已有学号登录"
    fireEvent.click(screen.getByText('已有学号登录'));

    // In login mode, name and phone are not rendered
    expect(screen.queryByPlaceholderText('请输入您的姓名')).toBeNull();
    expect(screen.queryByPlaceholderText('11位手机号码')).toBeNull();
    expect(screen.getByPlaceholderText('请输入密码')).toBeDefined();
    expect(screen.getByText('立即登录')).toBeDefined();
  });

  it('validates empty inputs on submit in register mode', async () => {
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );

    const submitBtn = screen.getByText('快速建档并进入');
    fireEvent.click(submitBtn);

    // Shows required validation error text on Material Web text field
    expect(document.querySelector('md-outlined-text-field[error-text="请输入您的学号"]')).not.toBeNull();
    expect(document.querySelector('md-outlined-text-field[label="学号"]')).not.toBeNull();
  });
});
