import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import SeverityBadge from '../components/SeverityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { predictionAPI, reportAPI } from '../services/api';

export default function History() {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    predictionAPI.getAll()
      .then(({ data }) => setPredictions(data.data || []))
      .catch(() => setPredictions([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this prediction from your history?')) return;
    try {
      await predictionAPI.delete(id);
      setPredictions((prev) => prev.filter((p) => p._id !== id));
    } catch {
      alert('Failed to delete prediction. Please try again.');
    }
  };

  const handleDownload = async (p) => {
    setDownloadingId(p._id);
    try {
      let blobData;
      try {
        const response = await predictionAPI.downloadReport(p._id);
        blobData = response.data;
      } catch {
        const response = await reportAPI.download(p.reportId || p._id);
        blobData = response.data;
      }

      const url = window.URL.createObjectURL(new Blob([blobData], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-prediction-report-${p._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 150);
    } catch (err) {
      console.error('Failed to download report:', err);
      alert('Failed to download PDF report. Please try again later.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleAskAIAssistant = (p) => {
    const diseaseName = p.displayName || p.diseaseName || 'Oral Condition';
    const confidence = (p.confidence || 0).toFixed(1);
    const riskLevel = p.riskLevel || (p.confidence >= 80 ? 'HIGH' : p.confidence >= 60 ? 'MEDIUM' : 'LOW');

    const contextMessage = `Please help me understand my recent AI oral health prediction from history.

Predicted condition: ${diseaseName}
Confidence: ${confidence}%
Risk level: ${riskLevel}

Please explain:
• What this condition generally means
• Common symptoms
• General oral care recommendations
• When I should consult a dentist

Do not provide a definitive medical diagnosis.`;

    navigate('/chat', {
      state: {
        initialMessage: contextMessage,
        predictionId: p._id,
        predictionContext: {
          displayName: diseaseName,
          predictedClass: p.predictedClass || diseaseName,
          confidence: p.confidence,
          confidencePercentage: p.confidencePercentage || Math.round(p.confidence || 0),
          riskLevel: riskLevel,
          riskReason: p.riskReason,
          description: p.description,
          recommendation: p.recommendation,
        },
      },
    });
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-theme-heading">Prediction History</h1>
        <p className="mt-1 text-theme-muted">View and manage your past AI oral analyses</p>
      </motion.div>

      {loading ? (
        <LoadingSpinner />
      ) : predictions.length === 0 ? (
        <Card className="mt-8 text-center py-12">
          <p className="text-5xl">📋</p>
          <h3 className="mt-3 text-lg font-semibold text-theme-heading">No Predictions Found</h3>
          <p className="mt-1 text-sm text-theme-muted">You haven't run any oral disease predictions yet.</p>
          <Button onClick={() => navigate('/detect')} className="mt-4">
            🔬 Perform First Analysis
          </Button>
        </Card>
      ) : (
        <div className="mt-8 space-y-4">
          {predictions.map((p, i) => {
            const riskLevel = p.riskLevel || (p.confidence >= 80 ? 'HIGH' : p.confidence >= 60 ? 'MEDIUM' : 'LOW');
            const displayName = p.displayName || p.diseaseName;

            return (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="flex flex-col gap-4 md:flex-row md:items-center p-5">
                  {p.imageUrl && (
                    <img
                      src={p.imageUrl}
                      alt="Oral scan"
                      className="h-24 w-24 rounded-xl object-cover border border-theme-border/40 shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-lg text-theme-heading">{displayName}</h3>
                      <SeverityBadge severity={riskLevel === 'HIGH' ? 'High' : riskLevel === 'MEDIUM' ? 'Moderate' : 'Low'} />
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          riskLevel === 'HIGH'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : riskLevel === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}
                      >
                        Risk: {riskLevel}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-theme-muted">
                      Confidence: {(p.confidence || 0).toFixed(1)}% · {new Date(p.createdAt).toLocaleString()}
                    </p>
                    {p.riskReason && (
                      <p className="mt-1 text-xs text-amber-400 font-medium line-clamp-1">
                        ⚠️ {p.riskReason}
                      </p>
                    )}
                    <p className="mt-1 line-clamp-2 text-sm text-theme-text">{p.recommendation || p.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 md:flex-col shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAskAIAssistant(p)}
                      className="text-xs"
                    >
                      ✨ Discuss AI
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={downloadingId === p._id}
                      onClick={() => handleDownload(p)}
                      className="text-xs"
                    >
                      {downloadingId === p._id ? 'Generating...' : '📄 PDF'}
                    </Button>

                    {riskLevel === 'HIGH' && (
                      <Button
                        size="sm"
                        onClick={() => navigate('/consultation')}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                      >
                        👨‍⚕️ Book Doctor
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p._id)} className="text-xs text-red-400">
                      Delete
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
