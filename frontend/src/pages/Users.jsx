import { useEffect, useState } from 'react';
import { EmptyState, Skeleton, Badge, Notification } from '../components/common';
import { fetchUsers, updateUserRole } from '../services/usersService';
import { useAuth } from '../contexts/AuthContext';

const roleVariant = (role) => {
  const r = (role || '').toLowerCase();
  if (r === 'admin') return 'danger';
  if (r === 'manager') return 'warning';
  return 'info';
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [notification, setNotification] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchUsers();
        if (!mounted) return;
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load users');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      await updateUserRole(userId, newRole);
      setNotification({ type: 'success', message: 'Role updated successfully' });
      setTimeout(() => setNotification(null), 3000);
      await load();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to update role' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setUpdatingId(null);
    }
  };

  const notificationBanner = notification && (
    <Notification
      message={notification.message}
      type={notification.type}
      onClose={() => setNotification(null)}
    />
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-500">Dashboard &gt; Users</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Users</h1>
        </div>
        <Skeleton count={4} height="h-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-500">Dashboard &gt; Users</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Users</h1>
        </div>
        <EmptyState title="Failed to load users" description={error} />
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-500">Dashboard &gt; Users</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Users</h1>
        </div>
        <EmptyState title="No users yet" description="Registered users will appear here." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Dashboard &gt; Users</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-500">Manage roles for everyone registered in StockPilot.</p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Name</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Email</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Role</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Status</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Change Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = String(u.user_id) === String(currentUser?.id);
              return (
                <tr key={u.user_id} className="border-b last:border-b-0">
                  <td className="px-6 py-4">
                    {u.first_name} {u.last_name}
                    {isSelf && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                  </td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">
                    <Badge label={u.role || 'Staff'} variant={roleVariant(u.role)} />
                  </td>
                  <td className="px-6 py-4">{u.status || 'Active'}</td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role || 'Staff'}
                      onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                      disabled={isSelf || updatingId === u.user_id}
                      className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-accent-500 focus:outline-none disabled:opacity-50"
                      title={isSelf ? "You can't change your own role" : undefined}
                    >
                      <option value="Staff">Staff</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {notificationBanner}
    </div>
  );
}