import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';
import { Button, Badge } from '../components/common';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const accountRows = useMemo(
    () => [
      {
        label: 'Name',
        value: user?.name || user?.username || user?.full_name || 'Not available',
      },
      {
        label: 'Email',
        value: user?.email || 'Not available',
      },
      {
        label: 'Role',
        value: user?.role_name || user?.role || user?.roleName || 'Not available',
      },
    ],
    [user]
  );

  const sessionRows = useMemo(
    () => [
      {
        label: 'Authenticated',
        value: user ? 'Yes' : 'No',
      },
      {
        label: 'Session source',
        value: 'Local storage authToken',
      },
      {
        label: 'Profile sync',
        value: 'Read from AuthContext',
      },
    ],
    [user]
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Dashboard &gt; Settings</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Settings</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Account</h2>
          <p className="mt-1 text-sm text-slate-500">Read-only profile details from the current session.</p>

          <div className="mt-6 space-y-4">
            {accountRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-medium text-slate-600">{row.label}</span>
                <span className="text-sm font-semibold text-slate-900">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Session</h2>
            <p className="text-sm text-slate-500">Current login details and backend sync status.</p>
          </div>

          <div className="space-y-3">
            {sessionRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm font-medium text-slate-600">{row.label}</span>
                <span className="text-sm font-semibold text-slate-900">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Preferences</p>
                <p className="text-sm text-slate-500">Notification preferences and theme settings are not connected to the backend yet.</p>
              </div>
              <Badge label="Read only" variant="info" />
            </div>
            <div className="mt-4">
              <Button variant="outline" disabled>
                Disabled until backend support
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Sign out</p>
                <p className="text-sm text-slate-500">End your current session on this device.</p>
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="danger"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <FiLogOut size={16} /> Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}