import type { FC } from 'react'
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu'
import { cn } from '../../lib/cn'

type PaginationProps = {
  page: number
  total: number
  onChange: (page: number) => void
  className?: string
  siblingCount?: number
}

function buildRange(
  page: number,
  total: number,
  siblingCount: number,
): Array<number | 'ellipsis'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: Array<number | 'ellipsis'> = []
  const leftSibling = Math.max(page - siblingCount, 2)
  const rightSibling = Math.min(page + siblingCount, total - 1)

  pages.push(1)
  if (leftSibling > 2) pages.push('ellipsis')
  for (let p = leftSibling; p <= rightSibling; p++) pages.push(p)
  if (rightSibling < total - 1) pages.push('ellipsis')
  pages.push(total)

  return pages
}

export const Pagination: FC<PaginationProps> = ({
  page,
  total,
  onChange,
  className,
  siblingCount = 1,
}) => {
  if (total <= 1) return null
  const items = buildRange(page, total, siblingCount)

  const btn =
    'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs text-riven-muted transition-colors hover:bg-white/5 hover:text-foreground disabled:pointer-events-none disabled:opacity-40'

  return (
    <nav
      className={cn('flex items-center gap-1', className)}
      aria-label="Pagination"
    >
      <button
        className={btn}
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <LuChevronLeft size={14} />
      </button>
      {items.map((it, i) =>
        it === 'ellipsis' ? (
          <span key={`e-${i}`} className="px-1 text-xs text-riven-muted">
            …
          </span>
        ) : (
          <button
            key={it}
            className={cn(
              btn,
              it === page && 'bg-white/[0.08] text-foreground',
            )}
            onClick={() => onChange(it)}
            aria-current={it === page ? 'page' : undefined}
          >
            {it}
          </button>
        ),
      )}
      <button
        className={btn}
        onClick={() => onChange(Math.min(total, page + 1))}
        disabled={page >= total}
        aria-label="Next page"
      >
        <LuChevronRight size={14} />
      </button>
    </nav>
  )
}
