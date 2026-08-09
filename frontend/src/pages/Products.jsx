import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom";
import { FiPlus } from "react-icons/fi";

import { EmptyState, Skeleton, Button, Notification } from "../components/common";
import { fetchProducts } from "../services/productService";
import { fetchCategories } from "../services/categoryService";
import { fetchSuppliers } from "../services/supplierService";
import { formatDate, getStockStatus } from "../utils/formatters";

import ProductStats from "../components/layout/products/ProductStats";
import ProductFilters from "../components/layout/products/ProductFilters";
import ProductTable from "../components/layout/products/ProductTable";
import ProductPagination from "../components/layout/products/ProductPagination";
import AddProductModal from "../components/layout/products/AddProductModal";

const ITEMS_PER_PAGE = 10;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const location = useLocation();
  useEffect(() => {
    if (location.state?.presetSearch) {
      setSearch(location.state.presetSearch);
    }
  }, [location.state]);
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const [productsResult, categoriesResult, suppliersResult] = await Promise.allSettled([
          fetchProducts(),
          fetchCategories(),
          fetchSuppliers(),
        ]);

        if (productsResult.status === "rejected") {
          throw productsResult.reason;
        }

        const rawCategories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
        const rawSuppliers = suppliersResult.status === "fulfilled" ? suppliersResult.value : [];

        const categoryLookup = new Map(
          rawCategories.map((item) => [
            String(item.category_id ?? item.id),
            item.category_name || item.name || item.label || "Uncategorized",
          ])
        );

        const supplierLookup = new Map(
          rawSuppliers.map((item) => [
            String(item.supplier_id ?? item.id),
            item.supplier_name || item.name || item.label || "Unassigned",
          ])
        );

        const normalizedProducts = (productsResult.value || []).map((product) => {
          const stock = Number(product.stock_quantity ?? 0);
          const reorderLevel = Number(product.reorder_level ?? 0);
          const updatedAt = product.updated_at || product.updatedAt || product.created_at || product.createdAt || "";

          return {
            id: product.product_id ?? product.id,
            name: product.product_name || product.name || "Unnamed Product",
            sku: product.sku || "-",
            category:
              categoryLookup.get(String(product.category_id ?? "")) ||
              product.category_name ||
              product.category ||
              (product.category_id != null ? `Category ${product.category_id}` : "Uncategorized"),
            supplier:
              supplierLookup.get(String(product.supplier_id ?? "")) ||
              product.supplier_name ||
              product.supplier ||
              (product.supplier_id != null ? `Supplier ${product.supplier_id}` : "Unassigned"),
            price: Number(product.selling_price ?? 0),
            stock,
            status: getStockStatus(stock, reorderLevel),
            updatedAt: updatedAt ? formatDate(updatedAt) : "-",
            image: null,
            description: product.description || "",
          };
        });

        if (!mounted) {
          return;
        }

        setProducts(normalizedProducts);
        setCategoryList(rawCategories);
        setSupplierList(rawSuppliers);
      } catch (err) {
        if (!mounted) {
          return;
        }

        setError(err.message || "Failed to load products");
      } finally {
        if (mounted) {
          setLoading(false);
          setCurrentPage(1);
        }
      }
    };

    loadProducts();

    return () => {
      mounted = false;
    };
  }, [reloadToken]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, category, status]);

  const handleReset = () => {
    setSearch("");
    setCategory("All");
    setStatus("All");
    setCurrentPage(1);
  };

  const handleProductCreated = () => {
    setNotification({ type: "success", message: "Product created successfully" });
    setReloadToken((prev) => prev + 1);
    setTimeout(() => setNotification(null), 3000);
  };

  const categoryOptions = useMemo(() => {
    return [...new Set(products.map((product) => product.category).filter(Boolean))].sort();
  }, [products]);

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
  }, [products, search, category, status]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  );

  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const addProductModal = (
    <AddProductModal
      isOpen={showAddModal}
      onClose={() => setShowAddModal(false)}
      categories={categoryList}
      suppliers={supplierList}
      onSuccess={handleProductCreated}
    />
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">Dashboard &gt; Products</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Products</h1>
          </div>
          <Button variant="primary" disabled>
            Add Product
          </Button>
        </div>
        <Skeleton count={4} height="h-20" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">Dashboard &gt; Products</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Products</h1>
          </div>
          <Button variant="primary" disabled>
            Add Product
          </Button>
        </div>
        <EmptyState
          title="Failed to load products"
          description={error}
          action={
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">Dashboard &gt; Products</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Products</h1>
          </div>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            Add Product
          </Button>
        </div>
        <EmptyState
          title="No products yet"
          description="Product records will appear here once the backend has entries."
        />
        {addProductModal}
        {notificationBanner}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <p className="text-sm text-slate-500">
            Dashboard &gt; Products
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Products
          </h1>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700"
        >
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
        categories={categoryOptions}
      />

      <ProductTable products={currentProducts} />

      <ProductPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {addProductModal}
      {notificationBanner}

    </div>
  );
}