import { useEffect, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { Modal } from '../common';
import { fetchProductImages } from '../../services/productService';

export default function ProductDetailModal({ isOpen, onClose, product, onAddToCart }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    if (!isOpen || !product) return;
    let mounted = true;
    setLoading(true);
    const id = product.product_id ?? product.id;

    fetchProductImages(id)
      .then((data) => {
        if (!mounted) return;
        const imgs = Array.isArray(data) ? data : [];
        setImages(imgs);
        const primary = imgs.find((i) => i.is_primary) || imgs[0];
        setActiveImage(primary?.image_url || null);
      })
      .catch(() => {
        if (!mounted) return;
        setImages([]);
        setActiveImage(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => (mounted = false);
  }, [isOpen, product]);

  if (!product) return null;

  const stock = product.stock_quantity ?? product.quantity ?? 0;
  const outOfStock = stock <= 0;
  const displayName = product.product_name || product.name || 'Product';

  return (
    <Modal isOpen={isOpen} title={displayName} onClose={onClose} size="lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          {loading ? (
            <div className="w-full h-64 rounded-lg bg-slate-100 animate-pulse" />
          ) : activeImage ? (
            <>
              <img
                src={activeImage}
                alt={displayName}
                className="w-full h-64 object-contain bg-slate-50 rounded-lg mb-3"
              />
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img) => (
                    <button
                      key={img.image_id}
                      type="button"
                      onClick={() => setActiveImage(img.image_url)}
                      className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition ${
                        activeImage === img.image_url ? 'border-accent-600' : 'border-transparent'
                      }`}
                    >
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-64 rounded-lg bg-slate-100 flex items-center justify-center">
              <span className="text-4xl font-semibold text-slate-300">
                {displayName.trim().charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <p className="text-xs text-slate-500 mb-1">{product.sku}</p>
          {product.description && (
            <p className="text-sm text-slate-600 mb-4">{product.description}</p>
          )}
          <p className="text-2xl font-bold text-slate-900 mb-1">
            {Number(product.selling_price ?? product.price ?? 0).toLocaleString('en-IN', {
              style: 'currency',
              currency: 'INR',
            })}
          </p>
          <p className={`text-sm mb-6 ${outOfStock ? 'text-red-600' : 'text-slate-500'}`}>
            {outOfStock ? 'Out of stock' : `${stock} in stock`}
          </p>
          <button
            type="button"
            onClick={() => {
              onAddToCart(product);
              onClose();
            }}
            disabled={outOfStock}
            className="mt-auto flex items-center justify-center gap-2 bg-accent-600 hover:bg-accent-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium py-2.5 rounded-lg transition"
          >
            <FiPlus size={16} /> Add to cart
          </button>
        </div>
      </div>
    </Modal>
  );
}