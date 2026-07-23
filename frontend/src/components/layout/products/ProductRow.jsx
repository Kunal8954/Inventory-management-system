import {
  FiEye,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";

const ProductRow = ({ product }) => {
  const statusClasses = {
    "In Stock":
      "bg-green-100 text-green-700",
    "Low Stock":
      "bg-yellow-100 text-yellow-700",
    "Out of Stock":
      "bg-red-100 text-red-700",
  };

  return (
    <tr className="border-b last:border-b-0 hover:bg-gray-50 transition">
      {/* Image */}
      <td className="px-6 py-4">
        <img
          src={product.image}
          alt={product.name}
          className="h-12 w-12 rounded-lg object-cover border"
        />
      </td>

      {/* Name */}
      <td className="px-6 py-4 font-medium text-gray-800 whitespace-nowrap">
        {product.name}
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
        ₹{product.price.toLocaleString()}
      </td>

      {/* Stock */}
      <td className="px-6 py-4 whitespace-nowrap">
        {product.stock}
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClasses[product.status]}`}
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