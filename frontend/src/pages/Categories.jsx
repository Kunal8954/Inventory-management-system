import { useEffect, useState } from 'react';
import { EmptyState, Skeleton, Button } from '../components/common';
import { fetchCategories } from '../services/categoryService';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
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
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const getDate = (c) => c.created_at || c.createdAt || c.created || c.date || '';

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
            <a href="/categories/new">
              <Button variant="primary">Add Category</Button>
            </a>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Categories</h1>

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
    </div>
  );
}

