import { useEffect, useRef, useState } from "react";
import { Modal, Button } from "../../common";
import {
  fetchProductImages,
  uploadProductImage,
  deleteProductImage,
  setProductImagePrimary,
} from "../../../services/productService";

export default function ManagePhotosModal({ isOpen, onClose, product, onChanged }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [busyImageId, setBusyImageId] = useState(null);
  const fileInputRef = useRef(null);

  const load = async () => {
    if (!product) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProductImages(product.id);
      setImages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load photos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && product) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !product) return;
    setUploading(true);
    setError(null);
    try {
      await uploadProductImage(product.id, file);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message || "Failed to upload photo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSetPrimary = async (imageId) => {
    setBusyImageId(imageId);
    try {
      await setProductImagePrimary(product.id, imageId);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message || "Failed to set primary photo");
    } finally {
      setBusyImageId(null);
    }
  };

  const handleDelete = async (imageId) => {
    setBusyImageId(imageId);
    try {
      await deleteProductImage(product.id, imageId);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message || "Failed to delete photo");
    } finally {
      setBusyImageId(null);
    }
  };

  if (!product) return null;

  return (
    <Modal isOpen={isOpen} title={`Photos — ${product.name}`} onClose={onClose} size="lg">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading photos...</p>
        ) : images.length === 0 ? (
          <p className="text-sm text-slate-500">No photos yet. Add the first one below.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((img) => (
              <div key={img.image_id} className="relative rounded-lg border border-slate-200 overflow-hidden">
                <img src={img.image_url} alt="" className="w-full h-28 object-cover" />
                {img.is_primary ? (
                  <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold bg-accent-600 text-white px-2 py-0.5 rounded-full">
                    Primary
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetPrimary(img.image_id)}
                    disabled={busyImageId === img.image_id}
                    className="absolute top-1.5 left-1.5 text-[10px] font-semibold bg-white/90 text-slate-700 px-2 py-0.5 rounded-full hover:bg-white transition disabled:opacity-50"
                  >
                    Make primary
                  </button>
                )}
                <button
                  onClick={() => handleDelete(img.image_id)}
                  disabled={busyImageId === img.image_id}
                  className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-red-600 text-white text-xs hover:bg-red-700 transition disabled:opacity-50"
                  title="Delete photo"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            isLoading={uploading}
          >
            + Add Photo
          </Button>
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}