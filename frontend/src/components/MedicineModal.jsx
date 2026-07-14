import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import Input from './Input';

const CATEGORIES = [
  'General', 'Antibiotics', 'Pain Relief', 'Antiseptic', 'Anti-inflammatory',
  'Vitamins & Supplements', 'Dental', 'Antifungal', 'Prescription', 'Other',
];

export default function MedicineModal({ isOpen, onClose, onSubmit, medicine = null }) {
  const [formData, setFormData] = useState({
    medicineName: '',
    category: 'General',
    description: '',
    price: '',
    quantity: '',
    expiryDate: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (medicine) {
      setFormData({
        medicineName: medicine.medicineName || '',
        category: medicine.category || 'General',
        description: medicine.description || '',
        price: medicine.price || '',
        quantity: medicine.quantity || '',
        expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().split('T')[0] : '',
      });
      setImagePreview(medicine.image ? `${import.meta.env.VITE_API_URL || ''}${medicine.image}` : '');
      setImageFile(null);
    } else {
      setFormData({
        medicineName: '',
        category: 'General',
        description: '',
        price: '',
        quantity: '',
        expiryDate: '',
      });
      setImagePreview('');
      setImageFile(null);
    }
    setError('');
  }, [medicine, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB.');
        return;
      }
      setImageFile(file);
      setError('');

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!formData.medicineName || !formData.price || formData.quantity === '') {
      setError('Medicine name, price, and stock quantity are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const submitData = new FormData();
      submitData.append('medicineName', formData.medicineName);
      submitData.append('category', formData.category);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price);
      submitData.append('quantity', formData.quantity);
      if (formData.expiryDate) {
        submitData.append('expiryDate', formData.expiryDate);
      }
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      await onSubmit(submitData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save medicine.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={medicine ? 'Edit Medicine' : 'Add New Medicine'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl p-3 text-sm" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
            ⚠️ {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {/* Medicine Name */}
          <div className="md:col-span-2">
            <Input
              label="Medicine Name"
              name="medicineName"
              placeholder="e.g. Paracetamol 500mg"
              value={formData.medicineName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-theme-text">Category</label>
            <select
              name="category"
              className="input-field w-full rounded-xl border border-theme-border bg-theme-surface/60 px-4 py-3 text-theme-text"
              value={formData.category}
              onChange={handleChange}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Expiry Date */}
          <div>
            <Input
              type="date"
              label="Expiry Date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
            />
          </div>

          {/* Price */}
          <div>
            <Input
              type="number"
              step="0.01"
              label="Price (Rs.)"
              name="price"
              placeholder="0.00"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
            />
          </div>

          {/* Stock Quantity */}
          <div>
            <Input
              type="number"
              label="Available Stock"
              name="quantity"
              placeholder="0"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="0"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-theme-text">Description</label>
            <textarea
              name="description"
              rows="3"
              placeholder="Enter instructions, usage, warnings or active ingredients..."
              className="input-field w-full"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* Image Upload */}
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-theme-text">Medicine Photo</label>
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-xl border border-dashed border-theme-border/60 bg-theme-surface/30 hover:bg-theme-surface/50 overflow-hidden"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl text-theme-muted">📸</span>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary py-2 px-3 text-xs"
                >
                  Choose Image
                </button>
                <p className="mt-1 text-xs text-theme-muted">Max file size: 5MB. Formats: JPG, PNG, WebP.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3 border-t border-theme-border/20 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-theme-text hover:bg-theme-surface/50 border border-theme-border/50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary px-6 py-2.5 text-sm font-semibold shadow-glow"
          >
            {submitting ? 'Saving...' : medicine ? 'Update Medicine' : 'Add Medicine'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
