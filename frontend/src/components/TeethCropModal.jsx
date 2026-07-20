import { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

function centerAspectCrop(mediaWidth, mediaHeight) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 80,
      },
      1, // 1:1 square crop or free crop
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export default function TeethCropModal({
  isOpen,
  imageSrc,
  onConfirmCrop,
  onCancel,
}) {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef(null);

  if (!isOpen || !imageSrc) return null;

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  };

  const getCroppedImgFile = async () => {
    if (!imgRef.current || !completedCrop || completedCrop.width === 0 || completedCrop.height === 0) {
      throw new Error('Please select a valid crop region on the image.');
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2D context available');
    }

    // Scale factor between displayed size and natural image resolution
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Calculate crop size in natural pixel dimensions
    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Set canvas dimensions to natural cropped size for maximum resolution quality
    canvas.width = Math.max(1, Math.round(cropWidth));
    canvas.height = Math.max(1, Math.round(cropHeight));

    // High quality scaling settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const file = new File([blob], `cropped-teeth-${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        const previewUrl = URL.createObjectURL(blob);
        resolve({ file, previewUrl });
      }, 'image/jpeg', 0.95);
    });
  };

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      const croppedData = await getCroppedImgFile();
      onConfirmCrop(croppedData);
    } catch (err) {
      alert(err.message || 'Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl rounded-2xl p-6 shadow-2xl"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-soft)',
          }}
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✂️</span>
              <div>
                <h3 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}>
                  Crop Teeth Area
                </h3>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Select the teeth region for AI disease detection
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              type="button"
              className="rounded-lg p-1.5 text-sm font-semibold transition-colors hover:bg-gray-500/10"
              style={{ color: 'var(--muted)' }}
            >
              ✕
            </button>
          </div>

          {/* User Instruction Banner */}
          <div
            className="mb-4 flex items-start gap-3 rounded-xl p-3.5 text-xs sm:text-sm font-medium leading-relaxed"
            style={{
              background: 'var(--accent-dim)',
              border: '1px solid rgba(6,182,212,0.3)',
              color: 'var(--text)',
            }}
          >
            <span className="text-lg shrink-0">📌</span>
            <div>
              <strong style={{ color: 'var(--accent)' }}>Important Instruction:</strong>
              <p className="mt-0.5">
                For the best prediction results, please crop and select the teeth area before starting the analysis.
              </p>
            </div>
          </div>

          {/* Crop Workspace */}
          <div className="flex max-h-[60vh] min-h-[250px] items-center justify-center overflow-auto rounded-xl bg-black/40 p-2">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              keepSelection
              className="max-h-full max-w-full"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Teeth area crop selection"
                onLoad={onImageLoad}
                style={{ maxHeight: '50vh', objectFit: 'contain' }}
              />
            </ReactCrop>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex items-center justify-end gap-3 border-t pt-4" style={{ borderColor: 'var(--border-soft)' }}>
            <Button variant="secondary" onClick={onCancel} disabled={isProcessing}>
              Cancel / Select Different Image
            </Button>
            <Button onClick={handleConfirm} loading={isProcessing}>
              ✓ Confirm Crop
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
