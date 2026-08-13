import { useEffect, useState } from 'react';
import { FiPlus, FiStar } from 'react-icons/fi';
import { Modal } from '../common';
import { fetchProductImages, fetchProductReviews } from '../../services/productService';
import { submitProductReview } from '../../services/shopService';
import { useAuth } from '../../contexts/AuthContext';

export default function ProductDetailModal({ isOpen, onClose, product, onAddToCart }) {
  const { isAuthenticated } = useAuth();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

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

  const loadReviews = () => {
    if (!product) return;
    const id = product.product_id ?? product.id;
    setReviewsLoading(true);
    fetchProductReviews(id)
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  };

  useEffect(() => {
    if (!isOpen || !product) return;
    setReviewSuccess(false);
    setReviewError(null);
    setMyRating(0);
    setMyComment('');
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError(null);
    if (myRating < 1) {
      setReviewError('Pick a star rating first.');
      return;
    }
    setSubmittingReview(true);
    try {
      const id = product.product_id ?? product.id;
      await submitProductReview(id, myRating, myComment.trim());
      setReviewSuccess(true);
      setMyRating(0);
      setMyComment('');
      loadReviews();
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

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

      <div className="border-t border-slate-200 mt-6 pt-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">
          Reviews {reviews.length > 0 && <span className="text-slate-400 font-normal">({reviews.length})</span>}
        </h3>

        {reviewsLoading ? (
          <p className="text-sm text-slate-400">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-slate-400 mb-4">No reviews yet — be the first to leave one.</p>
        ) : (
          <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
            {reviews.map((r) => (
              <div key={r.review_id} className="border-b border-slate-100 pb-3 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-900">{r.customer_name}</span>
                  <span className="text-amber-500 text-xs">
                    {'\u2605'.repeat(r.rating)}
                    {'\u2606'.repeat(5 - r.rating)}
                  </span>
                </div>
                {r.comment && <p className="text-sm text-slate-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {isAuthenticated && !reviewSuccess && (
          <form onSubmit={handleSubmitReview} className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs font-medium text-slate-700 mb-2">Leave a review</p>
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMyRating(n)}
                  className="text-lg leading-none"
                  aria-label={`Rate ${n} stars`}
                >
                  <FiStar
                    className={n <= myRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                    size={20}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={myComment}
              onChange={(e) => setMyComment(e.target.value)}
              rows={2}
              placeholder="Optional — what did you think?"
              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 mb-2 focus:outline-none focus:border-accent-500"
            />
            {reviewError && <p className="text-xs text-red-600 mb-2">{reviewError}</p>}
            <button
              type="submit"
              disabled={submittingReview}
              className="text-sm font-medium bg-accent-600 hover:bg-accent-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {reviewSuccess && (
          <p className="text-sm text-green-600 bg-green-50 rounded-lg px-4 py-3">
            Thanks — your review has been posted.
          </p>
        )}
      </div>
    </Modal>
  );
}