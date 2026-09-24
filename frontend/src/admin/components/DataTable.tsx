import * as React from 'react';

export interface ColumnDefinition<T> {
  key: keyof T | string;
  label: string;
  width?: string;
  render?: (item: T, isSelected?: boolean) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: ColumnDefinition<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  selectedId?: string | number;
  minWidth?: string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  onRowClick,
  selectedId,
  minWidth,
}: DataTableProps<T>) {
  return (
    <div className="w-full h-full flex flex-col min-h-0 relative overflow-hidden select-none">
      <div className="w-full flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
        <div className="flex flex-col min-w-full w-max" style={minWidth ? { minWidth } : undefined}>
          {/* Table Headers */}
          <div className="flex shrink-0 items-center px-6 py-2.5 text-[14px] font-medium text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)] border-opacity-30 bg-[var(--md-sys-color-surface)] z-10 sticky top-0 min-w-full w-full">
            {columns.map((col, idx) => (
              <div key={idx} className={`${col.width || 'flex-1 min-w-0'} shrink-0 pr-4 last:pr-0`}>
                {col.label}
              </div>
            ))}
          </div>

          {/* List Items */}
          <div className="flex flex-col flex-1 pb-4 min-w-full w-full">
            {data.map((item, rowIdx) => {
              const isSelected = selectedId === item.id;
              return (
                <div
                  key={rowIdx}
                  onClick={() => onRowClick?.(item)}
                  className={`flex items-center px-6 py-3.5 border-b border-[var(--md-sys-color-outline-variant)] border-opacity-30 cursor-pointer transition-colors group min-w-full w-full ${
                    isSelected
                      ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
                      : 'hover:bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <div
                      key={colIdx}
                      className={`${col.width || 'flex-1 min-w-0'} shrink-0 pr-4 last:pr-0 truncate ${
                        isSelected ? 'text-[var(--md-sys-color-on-secondary-container)]' : ''
                      }`}
                    >
                      {col.render ? col.render(item, isSelected) : (item as any)[col.key]}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
