import { useEffect, useState } from 'react';
import { EmptyState, Skeleton, Button, Modal, Notification } from '../components/common';
import { fetchSuppliers, createSupplier } from '../services/supplierService';

const emptyForm = {
  supplier_name: '',
  contact_person: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  country: 'India',
  gst_number: '',
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [notification, setNotification] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchSuppliers();
      setSuppliers(data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
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
    })();
    return () => (mounted = false);
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleClose = () => {
    setIsOpen(false);
    setForm(emptyForm);
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.supplier_name.trim()) {
      setFormError('Supplier name is required.');
      return;
    }

    setSubmitting(true);
    try {
      await createSupplier(form);
      handleClose();
      setNotification({ type: 'success', message: 'Supplier created successfully' });
      setTimeout(() => setNotification(null), 3000);
      await load();
    } catch (err) {
      setFormError(err.message || 'Failed to create supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const addModal = (
    <Modal isOpen={isOpen} title="Add Supplier" onClose={handleClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {formError}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Supplier Name *</label>
            <input
              type="text"
              value={form.supplier_name}
              onChange={handleChange('supplier_name')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
              placeholder="e.g. Dell India"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Contact Person</label>
            <input
              type="text"
              value={form.contact_person}
              onChange={handleChange('contact_person')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
              placeholder="e.g. Rahul Sharma"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
              placeholder="sales@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={handleChange('phone')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
              placeholder="9876543210"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">City</label>
            <input
              type="text"
              value={form.city}
              onChange={handleChange('city')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">State</label>
            <input
              type="text"
              value={form.state}
              onChange={handleChange('state')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Country</label>
            <input
              type="text"
              value={form.country}
              onChange={handleChange('country')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">GST Number</label>
            <input
              type="text"
              value={form.gst_number}
              onChange={handleChange('gst_number')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
              placeholder="29ABCDE1234F1Z5"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="secondary" type="button" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={submitting}>
            Create Supplier
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
          action={
            <Button variant="primary" onClick={() => setIsOpen(true)}>
              Add Supplier
            </Button>
          }
        />
        {addModal}
        {notificationBanner}
      </div>
    );
  }

  const sample = suppliers[0] || {};
  const nameKey = sample.supplier_name ? 'supplier_name' : sample.name ? 'name' : Object.keys(sample).find(k => /name/i.test(k)) || 'id';
  const emailKey = Object.keys(sample).find(k => /email/i.test(k));
  const phoneKey = Object.keys(sample).find(k => /(phone|mobile)/i.test(k));
  const statusKey = Object.keys(sample).find(k => /status|active/i.test(k));
  const createdKey = Object.keys(sample).find(k => /created_at|createdAt|created|date/i.test(k));

  const getDate = (s) => s[createdKey] || s.created_at || s.createdAt || s.created || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Suppliers</h1>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Add Supplier
        </Button>
      </div>

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

      {addModal}
      {notificationBanner}
    </div>
  );
}