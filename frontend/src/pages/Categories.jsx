import { useEffect, useState } from 'react';
import { EmptyState, Skeleton, Button, Modal, Notification } from '../components/common';
import { fetchCategories, createCategory } from '../services/categoryService';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [notification, setNotification] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchCategories();
      setCategories(data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchCategories();
        if (!mounted) return;
        setCategories(data || []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load categories');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const getDate = (c) => c.created_at || c.createdAt || c.created || c.date || '';

  const handleClose = () => {
    setIsOpen(false);
    setName('');
    setDescription('');
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Category name is required.');
      return;
    }

    setSubmitting(true);
    try {
      await createCategory({ category_name: name.trim(), description: description.trim() });
      handleClose();
      setNotification({ type: 'success', message: 'Category created successfully' });
      setTimeout(() => setNotification(null), 3000);
      await load();
    } catch (err) {
      setFormError(err.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const addModal = (
    <Modal isOpen={isOpen} title="Add Category" onClose={handleClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {formError}
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            placeholder="e.g. Electronics"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            placeholder="Optional description"
          />
        </div>
        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="secondary" type="button" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={submitting}>
            Create Category
          </Button>
        </div>
      </form>
    </Modal>
  );

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
        <h1 className="text-3xl font-bold text-slate-900">Categories</h1>
        <Skeleton count={4} height="h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Categories</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Categories</h1>
        <EmptyState
          title="No categories yet"
          description="Organize products by categories to make filtering and reporting easier."
          action={
            <Button variant="primary" onClick={() => setIsOpen(true)}>
              Add Category
            </Button>
          }
        />
        {addModal}
        {notificationBanner}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Categories</h1>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Add Category
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Name</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Description</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Status</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Created</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.category_id || c.id || c.name} className="border-b last:border-b-0">
                <td className="px-6 py-4">{c.category_name || c.name || c.label || '-'}</td>
                <td className="px-6 py-4">{c.description || c.desc || '-'}</td>
                <td className="px-6 py-4">{c.status || c.active ? (c.status || (c.active ? 'Active' : 'Inactive')) : '-'}</td>
                <td className="px-6 py-4">{getDate(c) ? new Date(getDate(c)).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addModal}
      {notificationBanner}
    </div>
  );
}