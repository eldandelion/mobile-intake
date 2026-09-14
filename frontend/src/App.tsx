import { useState } from 'react';
import { PrimaryButton, OutlinedButton } from './components/common/Buttons';

export default function App() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="w-full min-h-[100dvh] bg-[var(--md-sys-color-surface)] flex justify-center">
      {/* Mobile-constrained viewport shell */}
      <div className="w-full max-w-md min-h-[100dvh] bg-[var(--md-sys-color-surface)] border-x border-[var(--md-sys-color-outline-variant)] border-opacity-30 flex flex-col relative shadow-xl">
        
        {/* Top App Header */}
        <header className="px-5 pt-6 pb-4 bg-[var(--md-sys-color-surface-container-low)] border-b border-[var(--md-sys-color-outline-variant)] border-opacity-40">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                中南大学 · 心理健康中心
              </span>
              <h1 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">
                新生心理普查与档案采集
              </h1>
            </div>
            <div className="w-9 h-9 rounded-full bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] flex items-center justify-center font-bold text-sm">
              学
            </div>
          </div>
        </header>

        {/* Main Body Content */}
        <main className="flex-1 p-5 pb-24 overflow-y-auto">
          {activeTab === 0 ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] border-opacity-40">
                <span className="text-xs font-medium text-[var(--md-sys-color-primary)]">普查进度</span>
                <h3 className="text-base font-semibold text-[var(--md-sys-color-on-surface)] mt-1">已完成 0 / 4 项测评任务</h3>
                <div className="w-full h-2 bg-[var(--md-sys-color-surface-variant)] rounded-full overflow-hidden mt-3">
                  <div className="h-full bg-[var(--md-sys-color-primary)] rounded-full transition-all duration-300 w-0"></div>
                </div>
              </div>

              {/* Sample Cards preview matching main system */}
              <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] border-opacity-60 bg-[var(--md-sys-color-surface-container-lowest)] p-5 flex flex-col gap-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-medium">
                    必填项
                  </span>
                  <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">约 3 分钟</span>
                </div>
                <h3 className="text-lg font-semibold text-[var(--md-sys-color-on-surface)]">个人基本信息核对</h3>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                  身份证号、民族、院系专业与紧急联系人档案采集
                </p>
                <div className="flex justify-end pt-2">
                  <PrimaryButton label="开始填报" icon="edit_note" className="w-full sm:w-auto h-11" />
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] border-opacity-60 bg-[var(--md-sys-color-surface-container-lowest)] p-5 flex flex-col gap-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] font-medium">
                    心理测评
                  </span>
                  <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">约 2 分钟</span>
                </div>
                <h3 className="text-lg font-semibold text-[var(--md-sys-color-on-surface)]">PHQ-9 抑郁健康问卷</h3>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                  评估过去两周内的心理健康状况与日常情绪体验
                </p>
                <div className="flex justify-end pt-2">
                  <PrimaryButton label="开始测评" icon="play_arrow" className="w-full sm:w-auto h-11" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-[var(--md-sys-color-surface-container)] flex items-center gap-4 border border-[var(--md-sys-color-outline-variant)] border-opacity-40">
                <div className="w-14 h-14 rounded-full bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] flex items-center justify-center font-bold text-xl">
                  李
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">李同学</h3>
                  <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">学号：2026001</p>
                  <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">手机：138****5678</p>
                </div>
              </div>

              <div className="pt-4">
                <OutlinedButton label="退出登录" icon="logout" className="w-full h-12 text-red-600" />
              </div>
            </div>
          )}
        </main>

        {/* MD3 Bottom Navigation Bar */}
        <nav className="absolute bottom-0 inset-x-0 bg-[var(--md-sys-color-surface-container)] border-t border-[var(--md-sys-color-outline-variant)] border-opacity-40 z-30">
          <md-navigation-bar active-index={activeTab}>
            <md-navigation-tab
              label="问卷测评"
              onClick={() => setActiveTab(0)}
            >
              <md-icon slot="active-icon">assignment</md-icon>
              <md-icon slot="inactive-icon">assignment</md-icon>
            </md-navigation-tab>
            <md-navigation-tab
              label="个人中心"
              onClick={() => setActiveTab(1)}
            >
              <md-icon slot="active-icon">account_circle</md-icon>
              <md-icon slot="inactive-icon">account_circle</md-icon>
            </md-navigation-tab>
          </md-navigation-bar>
        </nav>

      </div>
    </div>
  );
}
