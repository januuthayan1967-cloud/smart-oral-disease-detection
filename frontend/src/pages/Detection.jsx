import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import SeverityBadge from '../components/SeverityBadge';
import LoadingAnimation from '../components/LoadingAnimation';
import { predictionAPI, reportAPI } from '../services/api';

/* ── Animated confidence bar ─────────────────────────────────────── */
function ConfidenceBar({ value }) {
  const pct = Math.min(100, Math.max(0, value));
  const color =
    pct >= 80 ? 'var(--error)' :
    pct >= 60 ? '#F97316' :
    pct >= 40 ? '#F59E0B' :
    'var(--success)';

  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between">
        <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Confidence Score</span>
        <motion.span
          className="text-2xl font-extrabold"
          style={{ color, fontFamily: 'Outfit, sans-serif' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {pct.toFixed(1)}%
        </motion.span>
      </div>
      <div className="confidence-track">
        <motion.div
          className="confidence-fill"
          style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.15 }}
        />
      </div>
    </div>
  );
}

/* ── Section block in results ────────────────────────────────────── */
function ResultSection({ icon, title, items, type = 'list' }) {
  if (!items || items.length === 0) return null;
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'color-mix(in srgb, var(--surface-2) 60%, transparent)', border: '1px solid var(--border-soft)' }}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--heading)' }}>{title}</h3>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--muted)' }}>
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--accent)', marginTop: 6 }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Upload zone icon ────────────────────────────────────────────── */
function CameraIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" style={{ width: 56, height: 56 }} xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="12" width="40" height="30" rx="5" fill="var(--accent-dim)" stroke="var(--accent)" strokeWidth="1.5" />
      <circle cx="24" cy="27" r="8" fill="var(--accent-dim)" stroke="var(--accent)" strokeWidth="1.5" />
      <circle cx="24" cy="27" r="4.5" fill="var(--accent)" opacity="0.7" />
      <rect x="16" y="6" width="16" height="8" rx="3" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5" />
      <circle cx="36" cy="18" r="2" fill="var(--accent)" />
    </svg>
  );
}

export default function Detection() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith('image/')) {
      setFile(dropped);
      setPreview(URL.createObjectURL(dropped));
      setResult(null);
    }
  };

  const handlePredict = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await predictionAPI.predict(formData);
      setResult(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!result?.reportId) return;
    const { data } = await reportAPI.download(result.reportId);
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'oral-health-report.pdf';
    link.click();
  };

  return (
    <Layout>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-xl shadow-glow-sm"
            style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
          >
            🔬
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}>
              Oral Disease Detection
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>Upload an oral image for AI-powered analysis</p>
          </div>
        </div>
      </motion.div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* ── LEFT: Upload ── */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <h2 className="mb-5 text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}>
              Upload Dental Image
            </h2>

            {/* Drop zone */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`upload-zone ${dragging ? 'dragging' : ''}`}
            >
              <AnimatePresence mode="wait">
                {preview ? (
                  <motion.div
                    key="preview"
                    className="relative"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                  >
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-64 rounded-xl object-contain shadow-theme"
                    />
                    <span
                      className="absolute right-2 top-2 rounded-lg px-2.5 py-1 text-xs font-semibold text-white"
                      style={{ background: 'var(--gradient-accent)' }}
                    >
                      Click to change
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    className="flex flex-col items-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      animate={dragging ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <CameraIcon />
                    </motion.div>
                    <div className="text-center">
                      <p className="font-semibold" style={{ color: 'var(--heading)' }}>
                        {dragging ? 'Drop your image here' : 'Click or drag & drop'}
                      </p>
                      <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
                        JPEG, PNG, WebP — max 5MB
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            <Button
              onClick={handlePredict}
              disabled={!file}
              loading={loading}
              className="mt-5 w-full"
              size="lg"
            >
              {loading ? 'Analyzing...' : '🧠 Analyze Image'}
            </Button>

            <AnimatePresence>
              {error && (
                <motion.p
                  className="mt-3 rounded-xl p-3 text-sm"
                  style={{ background: 'var(--error-bg)', color: 'var(--error)' }}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* ── RIGHT: Results ── */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          {loading && <LoadingAnimation message="Analyzing your image..." />}

          <AnimatePresence mode="wait">
            {result && !loading && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.4 }}
              >
                <Card variant="result">
                  {/* Result header */}
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                        Detection Result
                      </p>
                      <h2
                        className="mt-1 text-2xl font-bold"
                        style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}
                      >
                        {result.prediction.diseaseName}
                      </h2>
                    </div>
                    <SeverityBadge severity={result.prediction.severity} />
                  </div>

                  {/* Confidence bar */}
                  <ConfidenceBar value={result.prediction.confidence} />

                  {/* Description */}
                  {result.prediction.description && (
                    <div
                      className="mt-5 rounded-xl p-4"
                      style={{ background: 'color-mix(in srgb, var(--surface-2) 60%, transparent)', border: '1px solid var(--border-soft)' }}
                    >
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                        Description
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                        {result.prediction.description}
                      </p>
                    </div>
                  )}

                  {/* Sectioned details */}
                  <div className="mt-4 space-y-3">
                    <ResultSection
                      icon="⚠️"
                      title="Common Causes"
                      items={result.prediction.causes}
                    />
                    <ResultSection
                      icon="💊"
                      title="Treatment Suggestions"
                      items={result.prediction.treatmentSuggestions}
                    />
                    <ResultSection
                      icon="🛡️"
                      title="Prevention Tips"
                      items={result.prediction.preventionTips}
                    />
                  </div>

                  {/* Recommendation */}
                  {result.prediction.recommendation && (
                    <div
                      className="mt-4 flex items-start gap-3 rounded-xl p-4"
                      style={{ background: 'var(--accent-dim)', border: '1px solid rgba(6,182,212,0.2)' }}
                    >
                      <span className="text-xl">💡</span>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                        {result.prediction.recommendation}
                      </p>
                    </div>
                  )}

                  {/* Download */}
                  <Button onClick={handleDownloadReport} className="mt-5 w-full" variant="secondary">
                    📄 Download PDF Report
                  </Button>
                </Card>
              </motion.div>
            )}

            {!result && !loading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="flex min-h-[360px] flex-col items-center justify-center text-center">
                  <div
                    className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl text-4xl"
                    style={{ background: 'var(--accent-dim)' }}
                  >
                    🔬
                  </div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--heading)' }}>Awaiting Analysis</h3>
                  <p className="mt-2 max-w-xs text-sm" style={{ color: 'var(--muted)' }}>
                    Upload an oral image and click "Analyze Image" to see your AI-powered results here.
                  </p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </Layout>
  );
}
