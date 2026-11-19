import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/introduction', label: 'Introduction' },
  { to: '/part-1', label: 'Part 1 · MCQ' },
  { to: '/part-2a', label: 'Part 2A · Practical' },
  { to: '/part-2b', label: 'Part 2B · Oral' },
]

export default function AppShell() {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 bg-sidebar text-sidebar-foreground shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-4">
            <NavLink
              to="/"
              className="font-display text-lg font-semibold tracking-tight text-sidebar-foreground hover:text-white transition-colors"
            >
              CIPS <span className="text-sidebar-primary">Examination Preparation KIT</span>
            </NavLink>
            <nav aria-label="Primary" className="hidden md:flex items-center gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/80',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          {/* Mobile nav */}
          <nav
            aria-label="Primary"
            className="md:hidden flex gap-1 overflow-x-auto pb-2 -mx-1 px-1"
          >
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 text-sm text-muted-foreground">
          <p>
            Study aid for the Certified Interventional Pain Sonologist (CIPS) examination of the
            World Institute of Pain. Aligned with the official CIPS Examination Information
            Bulletin. Not affiliated with or endorsed by WIP.
          </p>
        </div>
      </footer>
    </div>
  )
}
