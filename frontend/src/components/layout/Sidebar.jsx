import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { FaBoxes, FaTimes, FaChevronLeft, FaSearch } from 'react-icons/fa'
import { navGroups } from '../../config/navigation'
import { useAuth } from '../../contexts/AuthContext'

export default function Sidebar({ collapsed, mobileOpen, onToggleCollapse, onCloseMobile }) {
  const { user } = useAuth()
  const [expandedGroups, setExpandedGroups] = useState(new Set(['dashboard']))
  const [searchQuery, setSearchQuery] = useState('')

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  // Hide admin-only groups (e.g. Users) from anyone who isn't an admin,
  // and hide staff-hidden groups (e.g. Reports/financials) from Staff specifically
  const visibleGroups = navGroups.filter((group) => {
    if (group.adminOnly && user?.role !== 'admin') return false
    if (group.staffHidden && user?.role === 'staff') return false
    return true
  })

  // Filter groups and items based on search
  const filteredGroups = searchQuery
    ? visibleGroups
        .map((group) => ({
          ...group,
          items: group.items.filter(
            (item) =>
              item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
              group.label.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((group) => group.items.length > 0)
    : visibleGroups

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
                <span className="text-[11px] text-slate-400">Inventory</span>
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

        {/* Search bar - only show if not collapsed */}
        {!collapsed && (
          <div className="px-3 py-3 border-b border-slate-200">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-accent-300 focus:ring-2 focus:ring-accent-100 outline-none transition-all"
              />
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredGroups.map((group) => (
            <div key={group.id}>
              {/* Group header - clickable to expand/collapse */}
              <button
                onClick={() => toggleGroup(group.id)}
                className={[
                  'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full',
                  'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                ].join(' ')}
                title={collapsed ? group.label : undefined}
              >
                <group.icon className="text-base shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left whitespace-nowrap">{group.label}</span>
                    {group.items.length > 0 && (
                      <FaChevronLeft
                        className={`text-xs transition-transform ${
                          expandedGroups.has(group.id) ? '-rotate-90' : ''
                        }`}
                      />
                    )}
                  </>
                )}
              </button>

              {/* Group items - show if expanded and not collapsed */}
              {!collapsed && expandedGroups.has(group.id) && (
                <div className="ml-6 mt-1 space-y-1 border-l border-slate-200 pl-0">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        [
                          'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                          'pl-3',
                          isActive
                            ? 'bg-accent-50 text-accent-700'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                        ].join(' ')
                      }
                    >
                      <item.icon className="text-sm shrink-0" />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className="hidden lg:flex items-center justify-center border-t border-slate-200 p-3 shrink-0">
          <button
            onClick={onToggleCollapse}
            className={[
              'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
              'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
            ].join(' ')}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <FaChevronLeft className={`text-sm transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>
    </>
  )
}