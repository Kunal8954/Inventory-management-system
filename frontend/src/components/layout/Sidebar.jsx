import { NavLink } from 'react-router-dom'
import { FaBoxes, FaTimes, FaChevronLeft } from 'react-icons/fa'
import { navItems } from '../../config/navigation'

export default function Sidebar({ collapsed, mobileOpen, onToggleCollapse, onCloseMobile }) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={[
          'fixed lg:sticky top-0 z-40 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Logo header */}
        <div className="flex items-center h-16 px-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent-600 text-white shrink-0 shadow-soft-md">
              <FaBoxes className="text-lg" />
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-tight whitespace-nowrap">
                <span className="text-sm font-bold text-slate-900">StockPilot</span>
                <span className="text-[11px] text-slate-400">Inventory System</span>
              </div>
            )}
          </div>
          <button
            onClick={onCloseMobile}
            className="ml-auto lg:hidden text-slate-400 hover:text-slate-600 p-1"
            aria-label="Close sidebar"
          >
            <FaTimes />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  collapsed ? 'justify-center' : '',
                  isActive
                    ? 'bg-accent-50 text-accent-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                ].join(' ')
              }
              title={collapsed ? label : undefined}
            >
              <Icon className="text-base shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className="hidden lg:flex items-center border-t border-slate-200 p-3 shrink-0">
          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <FaChevronLeft className={`text-sm transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
