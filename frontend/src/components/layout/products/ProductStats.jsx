import {
  FiPackage,
  FiAlertTriangle,
  FiXCircle,
  FiGrid,
} from "react-icons/fi";

const ProductStats = ({ products }) => {
  const totalProducts = products.length;

  const lowStock = products.filter(
    (product) => product.status === "Low Stock"
  ).length;

  const outOfStock = products.filter(
    (product) => product.status === "Out of Stock"
  ).length;

  const categories = new Set(products.map((product) => product.category)).size;

  const stats = [
    {
      title: "Total Products",
      value: totalProducts,
      description: "Products in inventory",
      icon: <FiPackage size={22} />,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Low Stock",
      value: lowStock,
      description: "Needs restocking",
      icon: <FiAlertTriangle size={22} />,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      title: "Out of Stock",
      value: outOfStock,
      description: "Currently unavailable",
      icon: <FiXCircle size={22} />,
      color: "bg-red-100 text-red-600",
    },
    {
      title: "Categories",
      value: categories,
      description: "Available categories",
      icon: <FiGrid size={22} />,
      color: "bg-green-100 text-green-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => (
        <div
          key={item.title}
          className="rounded-xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {item.title}
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-800">
                {item.value}
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                {item.description}
              </p>
            </div>

            <div
              className={`flex h-12 w-12 items-center justify-center rounded-lg ${item.color}`}
            >
              {item.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductStats;