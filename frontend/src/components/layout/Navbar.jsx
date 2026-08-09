import { useState, useRef, useEffect } from 'react'
import { FaSearch, FaBell, FaBars, FaChevronDown, FaUserCircle, FaCog, FaSignOutAlt, FaBox, FaTruck, FaUserFriends } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { fetchProducts } from '../../services/productService'
import { fetchSuppliers } from '../../services/supplierService'
import { fetchCustomers } from '../../services/customerService'
import { fetchNotifications } from '../../services/notificationService'

export default function Navbar({ onOpenMobile }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // ---- Global search state ----
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [dataset, setDataset] = useState({ products: [], suppliers: [], customers: [] })
  const searchRef = useRef(null)

  // ---- Notification badge state ----
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load a searchable dataset once on mount (small dataset, cheap to cache client-side)
  useEffect(() => {
    let mounted = true
    Promise.allSettled([fetchProducts(), fetchSuppliers(), fetchCustomers()]).then((results) => {
      if (!mounted) return
      const [productsRes, suppliersRes, customersRes] = results
      setDataset({
        products: productsRes.status === 'fulfilled' ? productsRes.value || [] : [],
        suppliers: suppliersRes.status === 'fulfilled' ? suppliersRes.value || [] : [],
        customers: customersRes.status === 'fulfilled' ? customersRes.value || [] : [],
      })
    })
    return () => (mounted = false)
  }, [])

  // Load real unread notification count once on mount
  useEffect(() => {
    let mounted = true
    fetchNotifications()
      .then((data) => {
        if (!mounted) return
        const unread = Array.isArray(data) ? data.filter((n) => !n.is_read).length : 0
        setUnreadCount(unread)
      })
      .catch(() => {})
    return () => (mounted = false)
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

  const q = query.trim().toLowerCase()
  const matchedProducts = q
    ? dataset.products
        .filter((p) => (p.product_name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q))
        .slice(0, 4)
    : []
  const matchedSuppliers = q
    ? dataset.suppliers.filter((s) => (s.supplier_name || '').toLowerCase().includes(q)).slice(0, 3)
    : []
  const matchedCustomers = q
    ? dataset.customers
        .filter((c) => (c.customer_name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q))
        .slice(0, 3)
    : []
  const hasResults = matchedProducts.length + matchedSuppliers.length + matchedCustomers.length > 0

  const goToProduct = (product) => {
    setSearchOpen(false)
    setQuery('')
    navigate('/products', { state: { presetSearch: product.product_name } })
  }

  const goToSuppliers = () => {
    setSearchOpen(false)
    setQuery('')
    navigate('/suppliers')
  }

  const goToCustomers = () => {
    setSearchOpen(false)
    setQuery('')
    navigate('/customers')
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
        <div className="relative flex-1 max-w-md" ref={searchRef}>
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search products, suppliers, orders..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 border border-transparent rounded-lg focus:bg-white focus:border-accent-300 focus:ring-2 focus:ring-accent-100 outline-none transition-all placeholder:text-slate-400"
          />

          {searchOpen && q && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-soft-lg border border-slate-200 py-2 max-h-96 overflow-y-auto animate-in z-30">
              {!hasResults ? (
                <p className="px-4 py-3 text-sm text-slate-500">No matches for "{query}"</p>
              ) : (
                <>
                  {matchedProducts.length > 0 && (
                    <div className="py-1">
                      <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Products</p>
                      {matchedProducts.map((p) => (
                        <button
                          key={p.product_id}
                          onClick={() => goToProduct(p)}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                        >
                          <FaBox className="text-slate-400 shrink-0" />
                          <span className="truncate">
                            {p.product_name} <span className="text-slate-400">({p.sku})</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {matchedSuppliers.length > 0 && (
                    <div className="py-1 border-t border-slate-100">
                      <p className="px-4 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Suppliers</p>
                      {matchedSuppliers.map((s) => (
                        <button
                          key={s.supplier_id}
                          onClick={goToSuppliers}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                        >
                          <FaTruck className="text-slate-400 shrink-0" />
                          <span className="truncate">{s.supplier_name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {matchedCustomers.length > 0 && (
                    <div className="py-1 border-t border-slate-100">
                      <p className="px-4 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Customers</p>
                      {matchedCustomers.map((c) => (
                        <button
                          key={c.customer_id}
                          onClick={goToCustomers}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                        >
                          <FaUserFriends className="text-slate-400 shrink-0" />
                          <span className="truncate">{c.customer_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Notifications */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Notifications"
          >
            <FaBell className="text-lg" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
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
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      navigate('/settings')
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <FaUserCircle className="text-slate-400" /> My Profile
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      navigate('/settings')
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
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