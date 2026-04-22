import { RIVEN_MARK } from '@renderer/constants/images'
import { LuArrowUpRight } from 'react-icons/lu'

/**
 * Sidebar footer: "Built by Riven Labs" brand block. Always shows the mark
 * (even when the sidebar is collapsed); expands into a richer attribution
 * with version and an external-link indicator on hover.
 */
export function RivenBrand(): JSX.Element {
  return (
    <a
      href="https://www.riven-labs.com/"
      target="_blank"
      rel="noreferrer"
      title="Built by Riven Labs — click to visit riven-labs.com"
      className="group/brand flex items-center gap-3 rounded-lg border border-riven-border bg-[linear-gradient(180deg,rgba(47,111,235,0.06),rgba(47,111,235,0)_65%)] px-2.5 py-2 transition-colors hover:border-riven-border-strong hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <img
        src={RIVEN_MARK}
        width={24}
        height={24}
        alt=""
        draggable={false}
        className="h-6 w-6 shrink-0 transition-transform group-hover/brand:scale-105"
      />
      <div className="hidden min-w-0 flex-1 items-start group-hover/sidebar:flex">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[11px] font-semibold tracking-tight text-foreground">
            Riven Labs
            <LuArrowUpRight
              size={10}
              className="text-riven-muted opacity-0 transition-opacity group-hover/brand:opacity-100"
            />
          </p>
          <p className="font-mono text-[10px] tabular-nums text-riven-muted">
            Wartlock · v{__APP_VERSION__}
          </p>
        </div>
      </div>
    </a>
  )
}
