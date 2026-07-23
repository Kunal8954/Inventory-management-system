import { useMemo, useState } from "react";
import { FiPlus } from "react-icons/fi";

import { products } from "../data/product";

import ProductStats from "../components/layout/products/ProductStats";
import ProductFilters from "../components/layout/products/ProductFilters";
import ProductTable from "../components/layout/products/ProductTable";
import ProductPagination from "../components/layout/products/ProductPagination";

const ITEMS_PER_PAGE = 10;

export default function Products() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const handleReset = () => {
    setSearch("");
    setCategory("All");
    setStatus("All");
    setCurrentPage(1);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.sku.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || product.category === category;

      const matchesStatus =
        status === "All" || product.status === status;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [search, category, status]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  );

  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <p className="text-sm text-slate-500">
            Dashboard &gt; Products
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Products
          </h1>
        </div>

        <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700">
          <FiPlus />
          Add Product
        </button>

      </div>

      <ProductStats products={products} />

      <ProductFilters
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        status={status}
        setStatus={setStatus}
        onReset={handleReset}
      />

      <ProductTable products={currentProducts} />

      <ProductPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

    </div>
  );
}