import { useState, useRef, useEffect } from 'react'
import { FaSearch, FaBell, FaBars, FaChevronDown, FaUserCircle, FaCog, FaSignOutAlt } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Navbar({ onOpenMobile }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
    setProfileOpen(false)
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center h-full px-4 sm:px-6 gap-3 sm:gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobile}
          className="lg:hidden text-slate-600 hover:text-slate-900 p-2 -ml-2"
          aria-label="Open sidebar"
        >
          <FaBars className="text-lg" />
        </button>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search products, suppliers, orders..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 border border-transparent rounded-lg focus:bg-white focus:border-accent-300 focus:ring-2 focus:ring-accent-100 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Notifications */}
          <button
            className="relative p-2.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Notifications"
          >
            <FaBell className="text-lg" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                alt={user?.name}
                className="w-8 h-8 rounded-full"
              />
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-sm font-semibold text-slate-900">{user?.name || 'User'}</span>
                <span className="text-[11px] text-slate-400 capitalize">{user?.role || 'User'}</span>
              </div>
              <FaChevronDown className="hidden sm:block text-xs text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-soft-lg border border-slate-200 py-2 animate-in">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-400">{user?.email || 'user@example.com'}</p>
                </div>
                <div className="py-1">
                  <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                    <FaUserCircle className="text-slate-400" /> My Profile
                  </button>
                  <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                    <FaCog className="text-slate-400" /> Settings
                  </button>
                </div>
                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FaSignOutAlt /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
