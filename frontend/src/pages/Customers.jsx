import { useEffect, useState } from 'react';
import { EmptyState, Skeleton, Button, Modal } from '../components/common';
import { fetchCustomers, createCustomer } from '../services/customerService';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ customer_name: '', email: '', phone: '', customer_type: 'Individual' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomers();
      setCustomers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createCustomer(form);
      setIsOpen(false);
      setForm({ customer_name: '', email: '', phone: '', customer_type: 'Individual' });
      await load();
    } catch (err) {
      alert(err.message || 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
        <Skeleton count={4} height="h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
        <EmptyState
          title="No customers yet"
          description="Add customers to track purchases, contact details, and sales history."
          action={<Button variant="primary" onClick={() => setIsOpen(true)}>Add Customer</Button>}
        />

        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Customer">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <input name="customer_name" value={form.customer_name} onChange={handleChange} required className="w-full mt-1 p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input name="email" value={form.email} onChange={handleChange} type="email" className="w-full mt-1 p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full mt-1 p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Type</label>
              <select name="customer_type" value={form.customer_type} onChange={handleChange} className="w-full mt-1 p-2 border rounded">
                <option>Individual</option>
                <option>Business</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" isLoading={saving}>Save</Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
        <Button variant="primary" onClick={() => setIsOpen(true)}>Add Customer</Button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Name</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Email</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Phone</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Type</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.customer_id || c.id || c.email} className="border-b last:border-b-0">
                <td className="px-6 py-4">{c.customer_name || c.name || '-'}</td>
                <td className="px-6 py-4">{c.email || '-'}</td>
                <td className="px-6 py-4">{c.phone || '-'}</td>
                <td className="px-6 py-4">{c.customer_type || c.type || '-'}</td>
                <td className="px-6 py-4">{c.status || (c.active ? 'Active' : '—')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Customer">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input name="customer_name" value={form.customer_name} onChange={handleChange} required className="w-full mt-1 p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input name="email" value={form.email} onChange={handleChange} type="email" className="w-full mt-1 p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="w-full mt-1 p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Type</label>
            <select name="customer_type" value={form.customer_type} onChange={handleChange} className="w-full mt-1 p-2 border rounded">
              <option>Individual</option>
              <option>Business</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={saving}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}