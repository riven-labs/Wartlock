import type { FC, ReactNode, TableHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Column<K extends string = string> = {
  key: K
  label: ReactNode
  align?: 'start' | 'center' | 'end'
  width?: string
}

type TableProps<T, K extends string> = {
  columns: Column<K>[]
  rows: T[]
  rowKey: (row: T) => string | number
  renderCell: (row: T, columnKey: K) => ReactNode
  isLoading?: boolean
  loadingContent?: ReactNode
  emptyContent?: ReactNode
  className?: string
  'aria-label'?: string
} & Omit<TableHTMLAttributes<HTMLTableElement>, 'className'>

export function Table<T, K extends string = string>({
  columns,
  rows,
  rowKey,
  renderCell,
  isLoading = false,
  loadingContent,
  emptyContent,
  className,
  ...props
}: TableProps<T, K>): JSX.Element {
  const alignClass: Record<NonNullable<Column['align']>, string> = {
    start: 'text-left',
    center: 'text-center',
    end: 'text-right',
  }

  const stateRow = (node: ReactNode): JSX.Element => (
    <tr>
      <td colSpan={columns.length} className="py-14 text-center">
        {node}
      </td>
    </tr>
  )

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-riven-border bg-riven-surface',
        className,
      )}
    >
      <table className="w-full border-collapse" {...props}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={col.width ? { width: col.width } : undefined}
                className={cn(
                  'h-11 border-b border-riven-border px-6 text-[11px] font-medium uppercase tracking-wider text-riven-muted',
                  alignClass[col.align || 'start'],
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? stateRow(
                loadingContent || (
                  <span className="text-sm text-riven-muted">Loading…</span>
                ),
              )
            : rows.length === 0
              ? stateRow(
                  emptyContent || (
                    <span className="text-sm text-riven-muted">No data</span>
                  ),
                )
              : rows.map((row, i) => (
                  <tr
                    key={rowKey(row)}
                    className="group transition-colors hover:bg-white/[0.02]"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'border-b border-riven-border px-6 py-4 align-middle',
                          i === rows.length - 1 && 'border-b-0',
                          alignClass[col.align || 'start'],
                        )}
                      >
                        {renderCell(row, col.key)}
                      </td>
                    ))}
                  </tr>
                ))}
        </tbody>
      </table>
    </div>
  )
}

export const EmptyState: FC<{ children: ReactNode }> = ({ children }) => (
  <span className="text-sm text-riven-muted">{children}</span>
)
