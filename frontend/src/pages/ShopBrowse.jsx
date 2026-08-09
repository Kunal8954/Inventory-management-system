import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiPlus, FiMinus, FiTrash2, FiLoader, FiCheck, FiSearch } from 'react-icons/fi';
import { fetchProducts } from '../services/productService';
import { fetchCategories } from '../services/categoryService';
import { placeOrder } from '../services/shopService';
import { EmptyState, Skeleton, Notification } from '../components/common';
import { useAuth } from '../contexts/AuthContext';

export default function ShopBrowse() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [cart, setCart] = useState([]); // [{ product_id, product_name, unit_price, quantity, stock_quantity }]
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');

  const [placing, setPlacing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [justOrdered, setJustOrdered] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [productData, categoryData] = await Promise.all([fetchProducts(), fetchCategories()]);
        if (!mounted) return;
        setProducts(Array.isArray(productData) ? productData : []);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Failed to load products');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const categoryNameById = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.category_id] = c.category_name || c.name;
    });
    return map;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => (p.product_name || p.name || '').toLowerCase().includes(q));
  }, [products, search]);

  const groupedByCategory = useMemo(() => {
    const groups = {};
    filteredProducts.forEach((p) => {
      const label = categoryNameById[p.category_id] || 'Other';
      if (!groups[label]) groups[label] = [];
      groups[label].push(p);
    });
    return groups;
  }, [filteredProducts, categoryNameById]);

  const addToCart = (product) => {
    const id = product.product_id ?? product.id;
    setCart((prev) => {
      const existing = prev.find((line) => line.product_id === id);
      if (existing) {
        return prev.map((line) =>
          line.product_id === id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [
        ...prev,
        {
          product_id: id,
          product_name: product.product_name || product.name,
          unit_price: Number(product.selling_price ?? product.price ?? 0),
          quantity: 1,
          stock_quantity: product.stock_quantity ?? product.quantity ?? 0,
        },
      ];
    });
    setJustOrdered(false);
  };

  const changeQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((line) =>
          line.product_id === productId ? { ...line, quantity: line.quantity + delta } : line
        )
        .filter((line) => line.quantity > 0)
    );
  };

  const removeLine = (productId) => {
    setCart((prev) => prev.filter((line) => line.product_id !== productId));
  };

  const cartTotal = cart.reduce((sum, line) => sum + line.unit_price * line.quantity, 0);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (!isAuthenticated) {
      navigate('/shop/login');
      return;
    }

    setPlacing(true);
    try {
      await placeOrder(
        cart.map((line) => ({
          product_id: line.product_id,
          quantity: line.quantity,
          unit_price: line.unit_price,
        })),
        {
          payment_method: paymentMethod,
          delivery_address: deliveryAddress,
          delivery_city: deliveryCity,
          delivery_phone: deliveryPhone,
        }
      );
      setCart([]);
      setDeliveryAddress('');
      setDeliveryCity('');
      setDeliveryPhone('');
      setJustOrdered(true);
      setNotification({ type: 'success', message: 'Order request submitted! Track it under My Orders.' });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to place order' });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setPlacing(false);
    }
  };

  const notificationBanner = notification && (
    <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Browse Products</h1>
        <Skeleton count={4} height="h-32" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Browse Products</h1>
        <EmptyState title="Couldn't load products" description={error} />
      </div>
    );
  }

  const renderProductCard = (product) => {
    const id = product.product_id ?? product.id;
    const stock = product.stock_quantity ?? product.quantity ?? 0;
    const outOfStock = stock <= 0;
    return (
      <div key={id} className="bg-white rounded-xl border border-slate-200 shadow-soft-md p-4 flex flex-col">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.product_name || product.name}
            className="w-full h-32 object-cover rounded-lg mb-3"
          />
        ) : (
          <div className="w-full h-32 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
            <span className="text-2xl font-semibold text-slate-400">
              {(product.product_name || product.name || 'P').trim().charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <p className="font-semibold text-slate-900">{product.product_name || product.name}</p>
        <p className="text-xs text-slate-500 mb-1">{product.sku}</p>
        {product.description && (
          <p className="text-xs text-slate-500 mb-2 line-clamp-2">{product.description}</p>
        )}
        <p className="text-lg font-bold text-slate-900 mb-1">
          {Number(product.selling_price ?? product.price ?? 0).toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
          })}
        </p>
        <p className={`text-xs mb-3 ${outOfStock ? 'text-red-600' : 'text-slate-500'}`}>
          {outOfStock ? 'Out of stock' : `${stock} in stock`}
        </p>
        <button
          onClick={() => addToCart(product)}
          disabled={outOfStock}
          className="mt-auto w-full flex items-center justify-center gap-2 bg-accent-600 hover:bg-accent-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium text-sm py-2 rounded-lg transition"
        >
          <FiPlus size={14} /> Add to cart
        </button>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-3xl font-bold text-slate-900">Browse Products</h1>
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:border-accent-300 focus:ring-2 focus:ring-accent-100 outline-none transition"
            />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <EmptyState title="No products found" description="Try a different search, or check back later." />
        ) : search.trim() ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map(renderProductCard)}
          </div>
        ) : (
          Object.entries(groupedByCategory).map(([label, items]) => (
            <div key={label} className="space-y-3">
              <h2 className="text-lg font-bold text-slate-800">{label}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map(renderProductCard)}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl border border-slate-200 shadow-soft-md p-5 sticky top-24">
          <div className="flex items-center gap-2 mb-4">
            <FiShoppingCart className="text-accent-600" />
            <h2 className="text-lg font-bold text-slate-900">Your Cart</h2>
            {cartCount > 0 && (
              <span className="ml-auto text-xs font-semibold bg-accent-100 text-accent-700 px-2 py-1 rounded-full">
                {cartCount}
              </span>
            )}
          </div>

          {justOrdered && cart.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-3">
                <FiCheck className="text-green-600 text-xl" />
              </div>
              <p className="text-sm text-slate-600">Order submitted. Check My Orders to track it.</p>
            </div>
          ) : cart.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">Your cart is empty. Add a product to get started.</p>
          ) : (
            <>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cart.map((line) => (
                  <div key={line.product_id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{line.product_name}</p>
                      <p className="text-xs text-slate-500">
                        {line.unit_price.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} each
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => changeQuantity(line.product_id, -1)}
                        className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50"
                      >
                        <FiMinus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm">{line.quantity}</span>
                      <button
                        onClick={() => changeQuantity(line.product_id, 1)}
                        disabled={line.quantity >= line.stock_quantity}
                        className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                      >
                        <FiPlus size={12} />
                      </button>
                      <button
                        onClick={() => removeLine(line.product_id)}
                        className="ml-1 text-slate-400 hover:text-red-600"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-3 mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Total</span>
                <span className="text-lg font-bold text-slate-900">
                  {cartTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                </span>
              </div>

              {isAuthenticated && (
                <div className="space-y-2 mb-4 border-t border-slate-200 pt-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Payment Method</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('COD')}
                        className={`flex-1 text-xs font-medium py-2 rounded-lg border transition ${
                          paymentMethod === 'COD'
                            ? 'bg-accent-600 text-white border-accent-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Cash on Delivery
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('Online')}
                        className={`flex-1 text-xs font-medium py-2 rounded-lg border transition ${
                          paymentMethod === 'Online'
                            ? 'bg-accent-600 text-white border-accent-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Online Transfer
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Delivery address"
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:border-accent-300 focus:ring-2 focus:ring-accent-100 outline-none transition"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                      placeholder="City"
                      className="w-1/2 text-sm px-3 py-2 border border-slate-200 rounded-lg focus:border-accent-300 focus:ring-2 focus:ring-accent-100 outline-none transition"
                    />
                    <input
                      type="tel"
                      value={deliveryPhone}
                      onChange={(e) => setDeliveryPhone(e.target.value)}
                      placeholder="Phone"
                      className="w-1/2 text-sm px-3 py-2 border border-slate-200 rounded-lg focus:border-accent-300 focus:ring-2 focus:ring-accent-100 outline-none transition"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={placing}
                className="w-full flex items-center justify-center gap-2 bg-accent-600 hover:bg-accent-700 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-lg transition"
              >
                {placing ? (
                  <>
                    <FiLoader className="animate-spin" size={16} /> Placing order...
                  </>
                ) : isAuthenticated ? (
                  'Place Order Request'
                ) : (
                  'Sign In to Checkout'
                )}
              </button>
              <p className="text-xs text-slate-400 mt-2 text-center">
                This sends a request — the store will review and confirm it.
              </p>
            </>
          )}
        </div>
      </div>

      {notificationBanner}
    </div>
  );
}