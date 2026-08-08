import { useEffect, useState } from 'react';
import { EmptyState, Skeleton, Button, Modal, Notification } from '../components/common';
import { fetchOrders, createOrder } from '../services/salesService';
import { fetchCustomers } from '../services/customerService';
import { fetchProducts } from '../services/productService';
import { fetchOrders, createOrder, updateOrderPayment } from '../services/salesService';

const emptyItem = { product_id: '', quantity: '1', unit_price: '' };

export default function Sales() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isOpen, setIsOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [notification, setNotification] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [orderData, customerData, productData] = await Promise.all([
        fetchOrders(),
        fetchCustomers(),
        fetchProducts(),
      ]);
      setOrders(Array.isArray(orderData) ? orderData : []);
      setCustomers(Array.isArray(customerData) ? customerData : []);
      setProducts(Array.isArray(productData) ? productData : []);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [orderData, customerData, productData] = await Promise.all([
          fetchOrders(),
          fetchCustomers(),
          fetchProducts(),
        ]);
        if (!mounted) return;
        setOrders(Array.isArray(orderData) ? orderData : []);
        setCustomers(Array.isArray(customerData) ? customerData : []);
        setProducts(Array.isArray(productData) ? productData : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load orders');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setCustomerId('');
    setItems([{ ...emptyItem }]);
    setFormError(null);
  };

  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        const updated = { ...it, [field]: value };
        if (field === 'product_id') {
          const p = products.find((p) => String(p.product_id) === String(value));
          if (p) updated.unit_price = String(p.selling_price ?? '');
        }
        return updated;
      })
    );
  };

  const addItemRow = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItemRow = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const total = items.reduce((sum, it) => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unit_price) || 0;
    return sum + qty * price;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!customerId) {
      setFormError('Please select a customer.');
      return;
    }
    const validItems = items.filter((it) => it.product_id && Number(it.quantity) > 0 && Number(it.unit_price) >= 0);
    if (validItems.length === 0) {
      setFormError('Add at least one valid item (product, quantity, price).');
      return;
    }

    setSubmitting(true);
    try {
      await createOrder({
        customer_id: Number(customerId),
        total_amount: total,
        items: validItems.map((it) => ({
          product_id: Number(it.product_id),
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
        })),
      });
      handleClose();
      setNotification({ type: 'success', message: 'Sale recorded successfully' });
      setTimeout(() => setNotification(null), 3000);
      await load();
    } catch (err) {
      setFormError(err.message || 'Failed to create sale');
    } finally {
      setSubmitting(false);
    }
  };

  const createModal = (
    <Modal isOpen={isOpen} title="New Sale" onClose={handleClose} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {formError}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Customer *</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
          >
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.customer_id ?? c.id} value={c.customer_id ?? c.id}>
                {c.customer_name || c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Items *</label>
            <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
              + Add Item
            </Button>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <select
                  value={item.product_id}
                  onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                  className="col-span-6 rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-accent-500 focus:outline-none"
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.product_id ?? p.id} value={p.product_id ?? p.id}>
                      {p.product_name} ({p.sku}) &middot; stock: {p.stock_quantity}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  placeholder="Qty"
                  className="col-span-2 rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-accent-500 focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                  placeholder="Unit price"
                  className="col-span-3 rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-accent-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeItemRow(index)}
                  disabled={items.length === 1}
                  className="col-span-1 text-slate-400 hover:text-red-600 disabled:opacity-30"
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">Unit price auto-fills from the product's selling price — you can override it.</p>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-lg font-semibold text-slate-900">
            Total: {total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={submitting}>
              Record Sale
            </Button>
          </div>
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
        <h1 className="text-3xl font-bold text-slate-900">Sales</h1>
        <Skeleton count={3} height="h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Sales</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + (parseFloat(o.total_amount || o.total || 0) || 0), 0);
  const pendingCount = orders.filter((o) => (o.order_status || o.status || '').toString().toLowerCase() === 'pending').length;

  if (!orders.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Sales</h1>
          <Button variant="primary" onClick={() => setIsOpen(true)}>
            New Sale
          </Button>
        </div>
        <EmptyState
          title="No sales yet"
          description="Record a sale to see it appear here."
        />
        {createModal}
        {notificationBanner}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Sales</h1>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          New Sale
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-slate-500">Total Orders</div>
          <div className="text-2xl font-semibold">{totalOrders}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-slate-500">Total Revenue</div>
          <div className="text-2xl font-semibold">{totalRevenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-slate-500">Pending Orders</div>
          <div className="text-2xl font-semibold">{pendingCount}</div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Order ID</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Customer</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Total</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Payment</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Status</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.order_id || o.id} className="border-b last:border-b-0">
                <td className="px-6 py-4">{o.order_id || o.id}</td>
                <td className="px-6 py-4">{o.customer_name || o.customer || '-'}</td>
                <td className="px-6 py-4">{(o.total_amount || o.total || 0).toLocaleString ? (o.total_amount || o.total || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : o.total_amount || o.total || 0}</td>
                <td className="px-6 py-4">
  <div className="flex items-center gap-2">
    {o.payment_status || o.paymentStatus || '-'}
    {(o.payment_status || o.paymentStatus) === 'Pending' && (
      <button
        onClick={async () => {
          try {
            await updateOrderPayment(o.order_id || o.id, 'Paid');
            await load();
          } catch (err) {
            alert(err.message || 'Failed to update payment');
          }
        }}
        className="text-xs text-accent-600 hover:text-accent-700 font-medium underline"
      >
        Mark Paid
      </button>
    )}
  </div>
</td>
                <td className="px-6 py-4">{o.order_status || o.status || '-'}</td>
                <td className="px-6 py-4">{(o.order_date || o.created_at || o.createdAt) ? new Date(o.order_date || o.created_at || o.createdAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {createModal}
      {notificationBanner}
    </div>
  );
}