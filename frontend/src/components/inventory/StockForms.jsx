import { useState } from 'react';
import { Button } from '../common/index';
import { useForm } from '../../hooks/useInventory';

const StockInForm = ({ products, onSubmit, onCancel }) => {
  const { values, handleChange, resetForm } = useForm({
    productId: '',
    quantity: '',
    batchNumber: '',
    expiryDate: '',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
    resetForm();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Product Select */}
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">
          Product <span className="text-red-500">*</span>
        </label>
        <select
          name="productId"
          value={values.productId}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          <option value="">Select a product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.productName} ({product.sku})
            </option>
          ))}
        </select>
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">
          Quantity <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="quantity"
          value={values.quantity}
          onChange={handleChange}
          required
          min="1"
          placeholder="Enter quantity"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
      </div>

      {/* Batch Number */}
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">
          Batch Number (Optional)
        </label>
        <input
          type="text"
          name="batchNumber"
          value={values.batchNumber}
          onChange={handleChange}
          placeholder="e.g., BATCH-001"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
      </div>

      {/* Expiry Date */}
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">
          Expiry Date (Optional)
        </label>
        <input
          type="date"
          name="expiryDate"
          value={values.expiryDate}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">
          Notes
        </label>
        <textarea
          name="notes"
          value={values.notes}
          onChange={handleChange}
          placeholder="Add any notes or reference..."
          rows="3"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="primary" className="flex-1">
          Record Stock In
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

const StockOutForm = ({ products, onSubmit, onCancel }) => {
  const { values, handleChange, resetForm } = useForm({
    productId: '',
    quantity: '',
    reason: 'Sales',
    notes: '',
  });

  const reasons = ['Sales', 'Loss', 'Damage', 'Adjustment', 'Return', 'Other'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
    resetForm();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Product Select */}
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">
          Product <span className="text-red-500">*</span>
        </label>
        <select
          name="productId"
          value={values.productId}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          <option value="">Select a product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.productName} ({product.sku}) - Available: {product.availableQuantity}
            </option>
          ))}
        </select>
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">
          Quantity <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="quantity"
          value={values.quantity}
          onChange={handleChange}
          required
          min="1"
          placeholder="Enter quantity"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">
          Reason <span className="text-red-500">*</span>
        </label>
        <select
          name="reason"
          value={values.reason}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          {reasons.map((reason) => (
            <option key={reason} value={reason}>
              {reason}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">
          Notes
        </label>
        <textarea
          name="notes"
          value={values.notes}
          onChange={handleChange}
          placeholder="Add any notes or reference..."
          rows="3"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" variant="primary" className="flex-1">
          Record Stock Out
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export { StockInForm, StockOutForm };
export default StockInForm;
