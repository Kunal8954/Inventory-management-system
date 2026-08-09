import { useEffect, useState } from 'react';
import { FiLoader, FiSave } from 'react-icons/fi';
import { EmptyState, Skeleton, Notification } from '../components/common';
import { fetchMyProfile, updateMyProfile } from '../services/shopService';

export default function ShopProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMyProfile();
        if (!mounted) return;
        setProfile(data);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load your profile');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const handleChange = (field) => (e) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile?.customer_name) {
      setNotification({ type: 'error', message: 'Name is required' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setSaving(true);
    try {
      await updateMyProfile({
        customer_name: profile.customer_name,
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        postal_code: profile.postal_code || '',
      });
      setNotification({ type: 'success', message: 'Profile updated' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to update profile' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const notificationBanner = notification && (
    <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
  );

  if (loading) {
    return (
      <div className="max-w-lg space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
        <Skeleton count={5} height="h-10" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-lg space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
        <EmptyState title="Couldn't load your profile" description={error || 'Something went wrong'} />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-soft-md p-6 space-y-4">
        <div>
          <label className="block text-slate-700 text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={profile.email || ''}
            disabled
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm cursor-not-allowed"
          />
          <p className="text-xs text-slate-400 mt-1">Email can't be changed here — contact the store if needed.</p>
        </div>

        <div>
          <label className="block text-slate-700 text-sm font-medium mb-1">Full Name *</label>
          <input
            type="text"
            value={profile.customer_name || ''}
            onChange={handleChange('customer_name')}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-300 transition"
          />
        </div>

        <div>
          <label className="block text-slate-700 text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            value={profile.phone || ''}
            onChange={handleChange('phone')}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-300 transition"
          />
        </div>

        <div>
          <label className="block text-slate-700 text-sm font-medium mb-1">Address</label>
          <textarea
            value={profile.address || ''}
            onChange={handleChange('address')}
            rows={2}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-300 transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 text-sm font-medium mb-1">City</label>
            <input
              type="text"
              value={profile.city || ''}
              onChange={handleChange('city')}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-300 transition"
            />
          </div>
          <div>
            <label className="block text-slate-700 text-sm font-medium mb-1">State</label>
            <input
              type="text"
              value={profile.state || ''}
              onChange={handleChange('state')}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-300 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 text-sm font-medium mb-1">Postal Code</label>
          <input
            type="text"
            value={profile.postal_code || ''}
            onChange={handleChange('postal_code')}
            className="w-full sm:w-1/2 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-300 transition"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-accent-600 hover:bg-accent-700 disabled:bg-slate-300 text-white font-semibold px-6 py-2.5 rounded-lg transition"
        >
          {saving ? (
            <>
              <FiLoader className="animate-spin" size={16} /> Saving...
            </>
          ) : (
            <>
              <FiSave size={16} /> Save Changes
            </>
          )}
        </button>
      </form>

      {notificationBanner}
    </div>
  );
}