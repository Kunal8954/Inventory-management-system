import { Outlet, Link, useLocation } from 'react-router-dom';
import { FiShoppingBag, FiClipboard, FiLogOut, FiLogIn } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

export default function ShopLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const navLink = (to, label, Icon) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={[
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition',
          active ? 'bg-accent-50 text-accent-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
        ].join(' ')}
      >
        <Icon size={16} />
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent-600 text-white shrink-0 shadow-soft-md">
              <span className="text-lg">📦</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900">StockPilot</p>
              <p className="text-[11px] text-slate-400">Shop</p>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-1">
            {navLink('/shop', 'Browse', FiShoppingBag)}
            {navLink('/shop/orders', 'My Orders', FiClipboard)}
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="hidden sm:inline text-sm text-slate-500">{user?.name}</span>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition"
                >
                  <FiLogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/shop/login"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent-600 hover:bg-accent-700 text-white transition"
              >
                <FiLogIn size={16} />
                Sign In
              </Link>
            )}
          </div>
        </div>

        <nav className="sm:hidden flex items-center gap-1 px-4 pb-3">
          {navLink('/shop', 'Browse', FiShoppingBag)}
          {navLink('/shop/orders', 'My Orders', FiClipboard)}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}