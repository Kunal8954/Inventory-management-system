import { useEffect, useState } from 'react';
import { EmptyState, Skeleton, Button, Modal, Notification } from '../components/common';
import { fetchPurchaseOrders, createPurchaseOrder, receivePurchaseOrder } from '../services/purchaseService';
import { fetchSuppliers } from '../services/supplierService';
import { fetchProducts } from '../services/productService';

const emptyItem = { product_id: '', quantity: '1', unit_cost: '' };

export default function Purchases() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isOpen, setIsOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [receivingId, setReceivingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [poData, supplierData, productData] = await Promise.all([
        fetchPurchaseOrders(),
        fetchSuppliers(),
        fetchProducts(),
      ]);
      setOrders(Array.isArray(poData) ? poData : []);
      setSuppliers(Array.isArray(supplierData) ? supplierData : []);
      setProducts(Array.isArray(productData) ? productData : []);
    } catch (err) {
      setError(err.message || 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [poData, supplierData, productData] = await Promise.all([
          fetchPurchaseOrders(),
          fetchSuppliers(),
          fetchProducts(),
        ]);
        if (!mounted) return;
        setOrders(Array.isArray(poData) ? poData : []);
        setSuppliers(Array.isArray(supplierData) ? supplierData : []);
        setProducts(Array.isArray(productData) ? productData : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load purchases');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setSupplierId('');
    setItems([{ ...emptyItem }]);
    setFormError(null);
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const addItemRow = () => setItems((prev) => [...prev, { ...emptyItem }]);

  const removeItemRow = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const total = items.reduce((sum, it) => {
    const qty = Number(it.quantity) || 0;
    const cost = Number(it.unit_cost) || 0;
    return sum + qty * cost;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!supplierId) {
      setFormError('Please select a supplier.');
      return;
    }
    const validItems = items.filter((it) => it.product_id && Number(it.quantity) > 0 && Number(it.unit_cost) >= 0);
    if (validItems.length === 0) {
      setFormError('Add at least one valid item (product, quantity, unit cost).');
      return;
    }

    setSubmitting(true);
    try {
      await createPurchaseOrder({
        supplier_id: Number(supplierId),
        total_amount: total,
        items: validItems.map((it) => ({
          product_id: Number(it.product_id),
          quantity: Number(it.quantity),
          unit_cost: Number(it.unit_cost),
        })),
      });
      handleClose();
      setNotification({ type: 'success', message: 'Purchase order created successfully' });
      setTimeout(() => setNotification(null), 3000);
      await load();
    } catch (err) {
      setFormError(err.message || 'Failed to create purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceive = async (purchaseOrderId) => {
    const confirmed = window.confirm(
      `Mark purchase order #${purchaseOrderId} as received? This adds the ordered quantities to stock.`
    );
    if (!confirmed) return;
    setReceivingId(purchaseOrderId);
    try {
      await receivePurchaseOrder(purchaseOrderId);
      setNotification({ type: 'success', message: 'Purchase order received — stock updated' });
      setTimeout(() => setNotification(null), 3000);
      await load();
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to mark received' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setReceivingId(null);
    }
  };

  const createModal = (
    <Modal isOpen={isOpen} title="New Purchase Order" onClose={handleClose} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {formError}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Supplier *</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
          >
            <option value="">Select supplier</option>
            {suppliers.map((s) => (
              <option key={s.supplier_id ?? s.id} value={s.supplier_id ?? s.id}>
                {s.supplier_name || s.name}
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
                      {p.product_name} ({p.sku})
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
                  value={item.unit_cost}
                  onChange={(e) => updateItem(index, 'unit_cost', e.target.value)}
                  placeholder="Unit cost"
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
              Create Purchase Order
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
        <div>
          <p className="text-sm text-slate-500">Dashboard &gt; Purchases</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Purchases</h1>
        </div>
        <Skeleton count={4} height="h-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-500">Dashboard &gt; Purchases</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Purchases</h1>
        </div>
        <EmptyState title="Failed to load purchases" description={error} />
      </div>
    );
  }

  const totalPurchases = orders.length;
  const pendingPurchases = orders.filter((o) => String(o.purchase_status || '').toLowerCase() === 'pending').length;

  if (!orders.length) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">Dashboard &gt; Purchases</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Purchases</h1>
          </div>
          <Button variant="primary" onClick={() => setIsOpen(true)}>
            New Purchase Order
          </Button>
        </div>
        <EmptyState
          title="No purchase orders yet"
          description="Create a purchase order to restock from your suppliers."
        />
        {createModal}
        {notificationBanner}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">Dashboard &gt; Purchases</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Purchases</h1>
        </div>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          New Purchase Order
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-slate-500">Total Purchase Records</div>
          <div className="text-2xl font-semibold text-slate-900">{totalPurchases}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-slate-500">Pending</div>
          <div className="text-2xl font-semibold text-slate-900">{pendingPurchases}</div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">PO ID</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Supplier</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Total</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Payment</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Status</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Date</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.purchase_order_id} className="border-b last:border-b-0">
                <td className="px-6 py-4">{order.purchase_order_id}</td>
                <td className="px-6 py-4">{order.supplier_name || '-'}</td>
                <td className="px-6 py-4">
                  {Number(order.total_amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                </td>
                <td className="px-6 py-4">{order.payment_status || '-'}</td>
                <td className="px-6 py-4">{order.purchase_status || '-'}</td>
                <td className="px-6 py-4">
                  {order.order_date ? new Date(order.order_date).toLocaleString() : '-'}
                </td>
                <td className="px-6 py-4">
                  {String(order.purchase_status || '').toLowerCase() === 'pending' && (
                    <button
                      onClick={() => handleReceive(order.purchase_order_id)}
                      disabled={receivingId === order.purchase_order_id}
                      className="text-xs font-semibold text-white bg-accent-600 hover:bg-accent-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
                    >
                      {receivingId === order.purchase_order_id ? 'Receiving...' : 'Mark Received'}
                    </button>
                  )}
                </td>
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