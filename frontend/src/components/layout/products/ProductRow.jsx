import { useRef, useState } from "react";
import {
  FiEye,
  FiEdit2,
  FiTrash2,
  FiCamera,
} from "react-icons/fi";
import { uploadProductImage } from "../../../services/productService";

const ProductRow = ({ product, onImageUploaded }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const displayName = product.name || product.productName || 'Product';
  const displayInitial = displayName.trim().charAt(0).toUpperCase() || 'P';
  const statusClasses = {
    "In Stock":
      "bg-green-100 text-green-700",
    "Low Stock":
      "bg-yellow-100 text-yellow-700",
    "Out of Stock":
      "bg-red-100 text-red-700",
    default: "bg-slate-100 text-slate-700",
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadProductImage(product.id, file);
      onImageUploaded?.();
    } catch (err) {
      alert(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <tr className="border-b last:border-b-0 hover:bg-gray-50 transition">
      {/* Image */}
      <td className="px-6 py-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="relative block h-12 w-12 group"
          title="Click to upload a photo"
        >
          {product.image ? (
            <img
              src={product.image}
              alt={displayName}
              className="h-12 w-12 rounded-lg object-cover border"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-600">
              {displayInitial}
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 group-hover:bg-black/40 transition">
            <FiCamera className="text-white text-sm opacity-0 group-hover:opacity-100 transition" />
          </div>

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </td>

      {/* Name */}
      <td className="px-6 py-4 font-medium text-gray-800 max-w-xs">
        <p className="whitespace-nowrap">{displayName}</p>
        {product.description && (
          <p className="mt-0.5 text-xs font-normal text-gray-400 truncate" title={product.description}>
            {product.description}
          </p>
        )}
      </td>

      {/* SKU */}
      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
        {product.sku}
      </td>

      {/* Category */}
      <td className="px-6 py-4 whitespace-nowrap">
        {product.category}
      </td>

      {/* Supplier */}
      <td className="px-6 py-4 whitespace-nowrap">
        {product.supplier}
      </td>

      {/* Price */}
      <td className="px-6 py-4 whitespace-nowrap font-medium">
        ₹{Number(product.price || 0).toLocaleString('en-IN')}
      </td>

      {/* Stock */}
      <td className="px-6 py-4 whitespace-nowrap">
        {product.stock}
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClasses[product.status] || statusClasses.default}`}
        >
          {product.status}
        </span>
      </td>

      {/* Updated */}
      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
        {product.updatedAt}
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">

          <button
            className="rounded-lg p-2 text-blue-600 hover:bg-blue-100 transition"
            aria-label="View Product"
          >
            <FiEye size={18} />
          </button>

          <button
            className="rounded-lg p-2 text-green-600 hover:bg-green-100 transition"
            aria-label="Edit Product"
          >
            <FiEdit2 size={18} />
          </button>

          <button
            className="rounded-lg p-2 text-red-600 hover:bg-red-100 transition"
            aria-label="Delete Product"
          >
            <FiTrash2 size={18} />
          </button>

        </div>
      </td>
    </tr>
  );
};

export default ProductRow;