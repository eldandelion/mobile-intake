interface AccountMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileClick?: () => void;
  onLogout?: () => void;
  username?: string;
  role?: string;
}

export function AccountMenu({
  isOpen,
  onClose,
  onProfileClick,
  onLogout,
  username = '系统管理员',
  role = 'ROLE_INTAKE_ADMIN',
}: AccountMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Click away listener overlay */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popup Container matching medical-system */}
      <div className="absolute top-12 right-0 w-[410px] bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] rounded-[32px] shadow-2xl z-50 flex flex-col pt-4 pb-2 border border-[var(--md-sys-color-outline-variant)] border-opacity-30">
        {/* Header */}
        <div className="flex justify-between items-center px-4 relative">
          <div className="w-full text-center text-[15px] font-medium truncate px-8">
            intake-admin@csu.edu.cn
          </div>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--md-sys-color-surface-variant)] transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="关闭"
          >
            <span className="material-symbols-outlined text-xl text-[var(--md-sys-color-on-surface-variant)]">close</span>
          </button>
        </div>

        {/* Profile Info */}
        <div className="flex flex-col items-center mt-4">
          <div className="relative">
            <div className="w-[84px] h-[84px] rounded-full bg-[#E47035] text-white flex items-center justify-center text-[40px] font-normal outline outline-4 outline-[var(--md-sys-color-surface-container-high)] ring-1 ring-[var(--md-sys-color-outline-variant)] shrink-0">
              {username.charAt(0) || 'A'}
            </div>
            <div className="absolute bottom-0 right-0 w-7 h-7 bg-[var(--md-sys-color-surface-container-lowest)] rounded-full flex items-center justify-center border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] shadow-sm">
              <span className="material-symbols-outlined text-[14px]">photo_camera</span>
            </div>
          </div>
          <h2 className="text-[22px] font-normal mt-3">你好, {username}!</h2>
          <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">{role}</span>
          {onProfileClick && (
            <button
              className="mt-3 px-6 py-2 rounded-full border border-[var(--md-sys-color-outline)] text-sm font-medium text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-variant)] transition-colors cursor-pointer"
              onClick={() => {
                onClose();
                onProfileClick();
              }}
            >
              管理您的账号
            </button>
          )}
        </div>

        {/* Inner Cards Wrapper */}
        <div className="px-3 mt-4 flex flex-col gap-1">
          {/* Accounts List Card */}
          <div className="bg-[var(--md-sys-color-surface-container-lowest)] rounded-[24px] overflow-hidden flex flex-col shadow-sm">
            <div className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--md-sys-color-surface-variant)] cursor-pointer transition-colors border-b border-[var(--md-sys-color-outline-variant)] border-opacity-30">
              <div className="w-8 h-8 rounded-full bg-[#E47035] text-white flex items-center justify-center text-[15px] font-medium">
                {username.charAt(0) || 'A'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-medium">{username}</span>
                <span className="text-[12px] text-[var(--md-sys-color-on-surface-variant)]">intake-admin@csu.edu.cn</span>
              </div>
            </div>
            <div
              className="px-5 py-[14px] flex items-center gap-4 hover:bg-[var(--md-sys-color-surface-variant)] cursor-pointer transition-colors"
              onClick={() => {
                onClose();
                onLogout?.();
              }}
            >
              <div className="w-5 h-5 flex items-center justify-center text-[var(--md-sys-color-on-surface)] ml-1">
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </div>
              <span className="text-[14px] font-medium">退出所有账号</span>
            </div>
          </div>

          {/* Storage Card */}
          <div className="bg-[var(--md-sys-color-surface-container-lowest)] rounded-full overflow-hidden shadow-sm mt-1">
            <div className="px-5 py-[14px] flex items-center gap-4 hover:bg-[var(--md-sys-color-surface-variant)] cursor-pointer transition-colors">
              <div className="w-5 h-5 flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] ml-1">
                <span className="material-symbols-outlined text-[20px]">cloud</span>
              </div>
              <span className="text-[14px] font-medium">已使用 5 TB 中的 0%</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center items-center gap-3 mt-4 text-[12px] text-[var(--md-sys-color-on-surface-variant)] pb-2">
          <span className="cursor-pointer hover:underline">隐私政策</span>
          <span>•</span>
          <span className="cursor-pointer hover:underline">服务条款</span>
        </div>
      </div>
    </>
  );
}
