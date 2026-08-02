import { useEffect, useState } from 'react';
import { EmptyState, Skeleton } from '../components/common';
import { fetchSuppliers } from '../services/supplierService';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchSuppliers();
        if (!mounted) return;
        setSuppliers(data || []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load suppliers');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Suppliers</h1>
        <Skeleton count={4} height="h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Suppliers</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!suppliers || suppliers.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Suppliers</h1>
        <EmptyState
          title="No suppliers yet"
          description="Add suppliers to manage purchase orders, contact info, and lead times."
          action={<a href="/suppliers/new" className="inline-block" />}
        />
      </div>
    );
  }

  // Determine best-fit fields from returned objects
  const sample = suppliers[0] || {};
  const nameKey = sample.supplier_name ? 'supplier_name' : sample.name ? 'name' : Object.keys(sample).find(k => /name/i.test(k)) || 'id';
  const emailKey = Object.keys(sample).find(k => /email/i.test(k));
  const phoneKey = Object.keys(sample).find(k => /(phone|mobile)/i.test(k));
  const statusKey = Object.keys(sample).find(k => /status|active/i.test(k));
  const createdKey = Object.keys(sample).find(k => /created_at|createdAt|created|date/i.test(k));

  const getDate = (s) => s[createdKey] || s.created_at || s.createdAt || s.created || '';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Suppliers</h1>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Name</th>
              {emailKey && <th className="px-6 py-3 text-sm font-semibold text-slate-900">Email</th>}
              {phoneKey && <th className="px-6 py-3 text-sm font-semibold text-slate-900">Phone</th>}
              {statusKey && <th className="px-6 py-3 text-sm font-semibold text-slate-900">Status</th>}
              {createdKey && <th className="px-6 py-3 text-sm font-semibold text-slate-900">Created</th>}
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.supplier_id || s.id || s[nameKey]} className="border-b last:border-b-0">
                <td className="px-6 py-4">{s[nameKey] || '-'}</td>
                {emailKey && <td className="px-6 py-4">{s[emailKey] || '-'}</td>}
                {phoneKey && <td className="px-6 py-4">{s[phoneKey] || '-'}</td>}
                {statusKey && <td className="px-6 py-4">{String(s[statusKey])}</td>}
                {createdKey && <td className="px-6 py-4">{getDate(s) ? new Date(getDate(s)).toLocaleDateString() : '-'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

