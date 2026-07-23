import { FiPackage } from "react-icons/fi";

const EmptyProducts = () => {
  return (
    <div className="rounded-xl bg-white p-12 shadow-sm">
      <div className="flex flex-col items-center justify-center text-center">

        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
          <FiPackage className="text-4xl text-blue-600" />
        </div>

        <h2 className="text-2xl font-semibold text-gray-800">
          No products found
        </h2>

        <p className="mt-2 max-w-md text-gray-500">
          Try changing your search or filters.
        </p>

      </div>
    </div>
  );
};

export default EmptyProducts;