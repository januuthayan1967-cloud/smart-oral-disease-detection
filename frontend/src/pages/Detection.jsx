import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import SeverityBadge from '../components/SeverityBadge';
import LoadingAnimation from '../components/LoadingAnimation';
import TeethCropModal from '../components/TeethCropModal';
import FirstAidTips from '../components/FirstAidTips';
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
function ResultSection({ icon, title, items }) {
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

/* ── Class Probabilities List ───────────────────────────────────── */
function ProbabilitiesList({ probabilities }) {
  if (!probabilities || Object.keys(probabilities).length === 0) return null;
  return (
    <div
      className="mt-4 rounded-xl p-4"
      style={{ background: 'color-mix(in srgb, var(--surface-2) 60%, transparent)', border: '1px solid var(--border-soft)' }}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
        Class Probabilities (MobileNetV3)
      </p>
      <div className="space-y-2">
        {Object.entries(probabilities).map(([className, prob]) => (
          <div key={className} className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--text)' }}>{className}</span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-700/30">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(100, prob)}%`, background: 'var(--accent)' }}
                />
              </div>
              <span className="w-12 text-right font-mono font-medium" style={{ color: 'var(--muted)' }}>
                {prob.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
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
  const navigate = useNavigate();
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [croppedFile, setCroppedFile] = useState(null);
  const [croppedPreview, setCroppedPreview] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const validateAndProcessFile = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setError('Invalid file type. Please upload an image (JPEG, PNG, WebP).');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum file size is 5MB.');
      return;
    }

    setError('');
    setResult(null);
    setDownloadError('');

    setCroppedFile(null);
    setCroppedPreview(null);

    const rawUrl = URL.createObjectURL(selectedFile);
    setRawImageSrc(rawUrl);
    setIsCropModalOpen(true);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    validateAndProcessFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    validateAndProcessFile(dropped);
  };

  const handleConfirmCrop = ({ file, previewUrl }) => {
    setCroppedFile(file);
    setCroppedPreview(previewUrl);
    setIsCropModalOpen(false);
    setError('');
  };

  const handleCancelCrop = () => {
    setIsCropModalOpen(false);
    if (!croppedFile) {
      setRawImageSrc(null);
    }
  };

  const handleRecrop = () => {
    if (!rawImageSrc) return;
    setCroppedFile(null);
    setCroppedPreview(null);
    setResult(null);
    setIsCropModalOpen(true);
  };

  const handlePredict = async () => {
    if (!croppedFile) {
      setError('Please crop and confirm the teeth area before starting analysis.');
      return;
    }

    setLoading(true);
    setError('');
    setDownloadError('');

    try {
      const formData = new FormData();
      formData.append('image', croppedFile);

      const { data } = await predictionAPI.predict(formData);
      if (data.success && data.data) {
        setResult(data.data);
      } else {
        throw new Error(data.message || 'Prediction service returned an invalid response.');
      }
    } catch (err) {
      const apiErrMsg = err.response?.data?.message || err.message || 'Prediction failed. Please try again.';
      setError(apiErrMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    const targetId = result?.predictionId || result?.prediction?._id || result?.reportId;
    if (!targetId) return;

    setDownloadingReport(true);
    setDownloadError('');

    try {
      let blobData;
      try {
        const response = await predictionAPI.downloadReport(targetId);
        blobData = response.data;
      } catch {
        const response = await reportAPI.download(result?.reportId || targetId);
        blobData = response.data;
      }

      const url = window.URL.createObjectURL(new Blob([blobData], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-prediction-report-${targetId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 150);
    } catch (err) {
      console.error('Failed to download report:', err);
      setDownloadError('Failed to generate or download PDF report. Please try again later.');
    } finally {
      setDownloadingReport(false);
    }
  };

  const handleAskAIAssistant = (predictionData, currentRiskLevel) => {
    const diseaseName = predictionData.displayName || predictionData.diseaseName || 'Oral Condition';
    const confidence = (predictionData.confidence || 0).toFixed(1);

    const contextMessage = `Please help me understand my recent AI oral health prediction.

Predicted condition: ${diseaseName}
Confidence: ${confidence}%
Risk level: ${currentRiskLevel}

Please explain:
• What this condition generally means
• Common symptoms
• General oral care recommendations
• When I should consult a dentist

Do not provide a definitive medical diagnosis.`;

    navigate('/chat', {
      state: {
        initialMessage: contextMessage,
        predictionId: result?.predictionId || predictionData._id,
        predictionContext: {
          displayName: diseaseName,
          predictedClass: predictionData.predictedClass || diseaseName,
          confidence: predictionData.confidence,
          confidencePercentage: Math.round(predictionData.confidence || 0),
          riskLevel: currentRiskLevel,
          riskReason: predictionData.riskReason || result?.riskReason,
          description: predictionData.description,
          recommendation: predictionData.recommendation,
        },
      },
    });
  };

  const pred = result?.prediction || result || {};
  const currentRiskLevel = result?.riskLevel || pred.riskLevel || (pred.confidence >= 80 ? 'HIGH' : pred.confidence >= 60 ? 'MEDIUM' : 'LOW');
  const currentRiskReason = result?.riskReason || pred.riskReason || '';

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
            <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
              Upload an oral image and crop the teeth area for AI-powered MobileNetV3 analysis
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* ── LEFT: Upload & Manual Crop Section ── */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <h2 className="mb-3 text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}>
              Upload & Crop Dental Image
            </h2>

            {/* Instruction Notice */}
            <div
              className="mb-4 flex items-start gap-2.5 rounded-xl p-3 text-xs leading-relaxed"
              style={{
                background: 'var(--accent-dim)',
                border: '1px solid rgba(6,182,212,0.25)',
                color: 'var(--text)',
              }}
            >
              <span className="text-base shrink-0">💡</span>
              <p>
                <strong>Important:</strong> For the best prediction results, please crop and select the teeth area before starting the analysis.
              </p>
            </div>

            {/* Drop zone / Cropped Preview Area */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                if (!croppedPreview) {
                  fileRef.current?.click();
                }
              }}
              onKeyDown={(e) => e.key === 'Enter' && !croppedPreview && fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`upload-zone ${dragging ? 'dragging' : ''}`}
            >
              <AnimatePresence mode="wait">
                {croppedPreview ? (
                  <motion.div
                    key="croppedPreview"
                    className="relative flex flex-col items-center gap-3"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                  >
                    <div className="relative">
                      <img
                        src={croppedPreview}
                        alt="Cropped Teeth Preview"
                        className="max-h-64 rounded-xl object-contain shadow-theme"
                      />
                      <span
                        className="absolute right-2 top-2 rounded-lg px-2.5 py-1 text-xs font-semibold text-white shadow"
                        style={{ background: 'var(--gradient-accent)' }}
                      >
                        ✓ Teeth Cropped
                      </span>
                    </div>

                    {/* Re-crop & Change Image Action Buttons */}
                    <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="secondary" onClick={handleRecrop}>
                        ✂️ Re-crop Teeth Area
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
                        📁 Upload Different Image
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="emptyUpload"
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
                        {dragging ? 'Drop oral image here' : 'Click or drag & drop oral image'}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                        JPEG, PNG, WebP — max 5MB
                      </p>
                      <p className="mt-2 text-xs font-medium" style={{ color: 'var(--accent)' }}>
                        Crop tool will open automatically after upload
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Analysis Button */}
            <Button
              onClick={handlePredict}
              disabled={!croppedFile || loading || isCropModalOpen}
              loading={loading}
              className="mt-5 w-full"
              size="lg"
            >
              {loading ? 'Analyzing Cropped Image...' : '🧠 Start Analysis'}
            </Button>

            {!croppedFile && (
              <p className="mt-2 text-center text-xs" style={{ color: 'var(--muted)' }}>
                * Analysis is disabled until teeth crop is confirmed.
              </p>
            )}

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

        {/* ── RIGHT: Results Section ── */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          {loading && <LoadingAnimation message="Analyzing cropped teeth area with MobileNetV3..." />}

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
                        AI Detection Result
                      </p>
                      <h2
                        className="mt-1 text-2xl font-bold"
                        style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}
                      >
                        {pred.displayName || pred.diseaseName}
                      </h2>
                    </div>
                    <SeverityBadge severity={currentRiskLevel === 'HIGH' ? 'High' : currentRiskLevel === 'MEDIUM' ? 'Moderate' : pred.severity || 'Low'} />
                  </div>

                  {/* Confidence bar */}
                  <ConfidenceBar value={pred.confidence || 0} />

                  {/* Description */}
                  {pred.description && (
                    <div
                      className="mt-5 rounded-xl p-4"
                      style={{ background: 'color-mix(in srgb, var(--surface-2) 60%, transparent)', border: '1px solid var(--border-soft)' }}
                    >
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                        Description
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                        {pred.description}
                      </p>
                    </div>
                  )}

                  {/* Sectioned details */}
                  <div className="mt-4 space-y-3">
                    <ResultSection
                      icon="⚠️"
                      title="Common Causes"
                      items={pred.causes}
                    />
                    <ResultSection
                      icon="💊"
                      title="Treatment Suggestions"
                      items={pred.treatmentSuggestions}
                    />
                    <ResultSection
                      icon="🛡️"
                      title="Prevention Tips"
                      items={pred.preventionTips}
                    />
                  </div>

                  {/* Class probabilities if available */}
                  <ProbabilitiesList probabilities={pred.probabilities} />

                  {/* Recommendation */}
                  {pred.recommendation && (
                    <div
                      className="mt-4 flex items-start gap-3 rounded-xl p-4"
                      style={{ background: 'var(--accent-dim)', border: '1px solid rgba(6,182,212,0.2)' }}
                    >
                      <span className="text-xl">💡</span>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                        {pred.recommendation}
                      </p>
                    </div>
                  )}

                  {/* First Aid Tips */}
                  <FirstAidTips predictedClass={pred.predictedClass || pred.rawClass || pred.displayName || pred.diseaseName} />

                  {/* ── HIGH RISK DETECTED ALERT SECTION ── */}
                  {currentRiskLevel === 'HIGH' && (
                    <div className="mt-5 rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-left shadow-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                          <h3 className="text-lg font-bold text-red-400">High Risk Detected</h3>
                          <p className="mt-0.5 text-xs text-red-300">
                            {currentRiskReason || 'This AI prediction indicates a condition that may require prompt professional dental evaluation.'}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-gray-200">
                        Please consult a qualified dentist for proper examination and diagnosis. This AI result is not a confirmed medical diagnosis.
                      </p>
                      <Button
                        onClick={() => navigate('/consultation')}
                        className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl shadow-lg transition"
                      >
                        👨‍⚕️ Book a Doctor Appointment
                      </Button>
                    </div>
                  )}

                  {/* ── ACTION BUTTONS ── */}
                  <div className="mt-5 space-y-3">
                    <Button
                      onClick={() => handleAskAIAssistant(pred, currentRiskLevel)}
                      className="w-full"
                      variant="primary"
                    >
                      ✨ Ask AI Assistant About This Result
                    </Button>

                    <Button
                      onClick={handleDownloadReport}
                      disabled={downloadingReport}
                      loading={downloadingReport}
                      className="w-full"
                      variant="secondary"
                    >
                      {downloadingReport ? 'Generating PDF Report...' : '📄 Download PDF Report'}
                    </Button>

                    {downloadError && (
                      <p className="text-center text-xs text-red-400 font-medium">
                        {downloadError}
                      </p>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {!result && !loading && (
              <motion.div
                key="emptyResult"
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
                    Upload an oral image, crop the teeth area, and click "Start Analysis" to view your AI results here.
                  </p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Manual Teeth Crop Modal */}
      <TeethCropModal
        isOpen={isCropModalOpen}
        imageSrc={rawImageSrc}
        onConfirmCrop={handleConfirmCrop}
        onCancel={handleCancelCrop}
      />
    </Layout>
  );
}
