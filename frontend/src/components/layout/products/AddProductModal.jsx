import { useState } from "react";
import { Modal, Button } from "../../common";
import { createProduct } from "../../../services/productService";

const emptyForm = {
  sku: "",
  product_name: "",
  category_id: "",
  supplier_id: "",
  cost_price: "",
  selling_price: "",
  stock_quantity: "0",
};

export default function AddProductModal({ isOpen, onClose, categories, suppliers, onSuccess }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleClose = () => {
    setForm(emptyForm);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.sku || !form.product_name || !form.category_id || !form.supplier_id) {
      setError("SKU, product name, category, and supplier are required.");
      return;
    }

    setSubmitting(true);
    try {
      await createProduct({
        sku: form.sku,
        product_name: form.product_name,
        category_id: Number(form.category_id),
        supplier_id: Number(form.supplier_id),
        cost_price: Number(form.cost_price) || 0,
        selling_price: Number(form.selling_price) || 0,
        stock_quantity: Number(form.stock_quantity) || 0,
      });
      setForm(emptyForm);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} title="Add Product" onClose={handleClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">SKU *</label>
            <input
              type="text"
              value={form.sku}
              onChange={handleChange("sku")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
              placeholder="e.g. PROD-001"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Product Name *</label>
            <input
              type="text"
              value={form.product_name}
              onChange={handleChange("product_name")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
              placeholder="e.g. Wireless Mouse"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Category *</label>
            <select
              value={form.category_id}
              onChange={handleChange("category_id")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.category_id ?? c.id} value={c.category_id ?? c.id}>
                  {c.category_name || c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Supplier *</label>
            <select
              value={form.supplier_id}
              onChange={handleChange("supplier_id")}
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
            <label className="mb-1 block text-sm font-medium text-slate-700">Cost Price</label>
            <input
              type="number"
              step="0.01"
              value={form.cost_price}
              onChange={handleChange("cost_price")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Selling Price</label>
            <input
              type="number"
              step="0.01"
              value={form.selling_price}
              onChange={handleChange("selling_price")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Opening Stock</label>
            <input
              type="number"
              value={form.stock_quantity}
              onChange={handleChange("stock_quantity")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="secondary" type="button" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={submitting}>
            Create Product
          </Button>
        </div>
      </form>
    </Modal>
  );
}