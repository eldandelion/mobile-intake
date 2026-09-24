import * as React from 'react';
import { AccountMenu } from './AccountMenu';
import { GlobalSearch } from './GlobalSearch';
import { useTheme } from '../../contexts/ThemeContext';
import { useAdminAuth } from '../contexts/AdminAuthContext';

interface AdminHeaderProps {
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function AdminHeader({
  searchPlaceholder = '全局搜索学生与作答记录',
  searchQuery = '',
  onSearchChange,
}: AdminHeaderProps) {
  const { adminUser, logout } = useAdminAuth();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = React.useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = React.useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-16 flex items-center justify-between pr-1 bg-transparent relative z-50 select-none">
      <GlobalSearch
        placeholder={searchPlaceholder}
        value={searchQuery}
        onSearchChange={onSearchChange}
      />

      {/* Right Action Icons */}
      <div className="flex items-center ml-2">
        {/* Settings Menu */}
        <div className="relative flex items-center mx-1">
          <md-icon-button
            id="settings-anchor"
            aria-label="设置"
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            title="界面主题设置"
          >
            <md-icon>settings</md-icon>
          </md-icon-button>

          <md-menu
            anchor="settings-anchor"
            open={isThemeMenuOpen}
            onClosed={() => setIsThemeMenuOpen(false)}
            quick
            style={
              {
                minWidth: '180px',
                '--md-menu-item-focus-outline-width': '0',
                '--md-menu-item-selected-outline-width': '0',
              } as React.CSSProperties
            }
          >
            <div className="px-4 py-2 text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              主题模式
            </div>
            <md-menu-item
              onClick={() => {
                setTheme('light');
                setIsThemeMenuOpen(false);
              }}
              style={{ '--md-focus-ring-color': 'transparent' } as React.CSSProperties}
            >
              <md-icon slot="start">light_mode</md-icon>
              <div slot="headline" style={{ whiteSpace: 'nowrap' }}>
                浅色模式
              </div>
              {theme === 'light' && (
                <md-icon slot="end" style={{ color: 'var(--md-sys-color-primary)', fontSize: '20px' }}>
                  check
                </md-icon>
              )}
            </md-menu-item>
            <md-menu-item
              onClick={() => {
                setTheme('dark');
                setIsThemeMenuOpen(false);
              }}
              style={{ '--md-focus-ring-color': 'transparent' } as React.CSSProperties}
            >
              <md-icon slot="start">dark_mode</md-icon>
              <div slot="headline" style={{ whiteSpace: 'nowrap' }}>
                深色模式
              </div>
              {theme === 'dark' && (
                <md-icon slot="end" style={{ color: 'var(--md-sys-color-primary)', fontSize: '20px' }}>
                  check
                </md-icon>
              )}
            </md-menu-item>
          </md-menu>
        </div>

        {/* User Profile & Account Menu */}
        <div className="relative flex items-center w-10 h-10 justify-center mx-1">
          <div
            className="w-8 h-8 rounded-full bg-[#E47035] text-white flex items-center justify-center text-sm font-medium cursor-pointer shadow-sm hover:opacity-90 ring-2 ring-transparent hover:ring-[var(--md-sys-color-outline-variant)] transition-all shrink-0"
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
            title="系统管理员账号"
          >
            {adminUser?.username?.[0]?.toUpperCase() || 'A'}
          </div>

          <AccountMenu
            isOpen={isAccountMenuOpen}
            onClose={() => setIsAccountMenuOpen(false)}
            onLogout={logout}
            username={adminUser?.username || '系统管理员'}
            role={adminUser?.role || 'ROLE_INTAKE_ADMIN'}
          />
        </div>
      </div>
    </header>
  );
}
