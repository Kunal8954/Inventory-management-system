import { useEffect, useState } from "react";
import { Modal, Button } from "../../common";
import { updateProduct } from "../../../services/productService";

export default function EditProductModal({ isOpen, onClose, product, categories, suppliers, onSuccess }) {
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (product) {
      setForm({
        product_name: product.name || "",
        sku: product.sku || "",
        category_id: product.categoryId ?? "",
        supplier_id: product.supplierId ?? "",
        cost_price: product.costPrice ?? "",
        selling_price: product.price ?? "",
        description: product.description || "",
      });
      setError(null);
    }
  }, [product]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleClose = () => {
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
      await updateProduct(product.id, {
        product_name: form.product_name,
        sku: form.sku,
        category_id: Number(form.category_id),
        supplier_id: Number(form.supplier_id),
        cost_price: Number(form.cost_price) || 0,
        selling_price: Number(form.selling_price) || 0,
        description: form.description,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  if (!form) return null;

  return (
    <Modal isOpen={isOpen} title={`Edit ${product?.name || "Product"}`} onClose={handleClose} size="lg">
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
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Product Name *</label>
            <input
              type="text"
              value={form.product_name}
              onChange={handleChange("product_name")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
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
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={form.description}
            onChange={handleChange("description")}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            placeholder="Optional — shown to customers browsing the shop"
          />
        </div>

        <p className="text-xs text-slate-400">
          Stock quantity isn't edited here — use Stock In / Stock Out on the Inventory page so every change stays logged.
        </p>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="secondary" type="button" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={submitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}