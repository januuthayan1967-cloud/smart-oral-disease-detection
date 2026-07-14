import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import SeverityBadge from '../components/SeverityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { predictionAPI, reportAPI } from '../services/api';

export default function History() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    predictionAPI.getAll()
      .then(({ data }) => setPredictions(data.data))
      .catch(() => setPredictions([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this prediction?')) return;
    await predictionAPI.delete(id);
    setPredictions((prev) => prev.filter((p) => p._id !== id));
  };

  const handleDownload = async (reportId) => {
    const { data } = await reportAPI.download(reportId);
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'oral-health-report.pdf';
    link.click();
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-theme-heading">Prediction History</h1>
        <p className="mt-1 text-theme-muted">View and manage your past analyses</p>
      </motion.div>

      {loading ? (
        <LoadingSpinner />
      ) : predictions.length === 0 ? (
        <Card className="mt-8 text-center">
          <p className="text-4xl">📋</p>
          <p className="mt-2 text-theme-muted">No predictions yet. Try the detection module!</p>
        </Card>
      ) : (
        <div className="mt-8 space-y-4">
          {predictions.map((p, i) => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="flex flex-col gap-4 md:flex-row md:items-center">
                {p.imageUrl && (
                  <img src={p.imageUrl} alt="Oral scan" className="h-24 w-24 rounded-xl object-cover" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-theme-heading">{p.diseaseName}</h3>
                    <SeverityBadge severity={p.severity} />
                  </div>
                  <p className="mt-1 text-sm text-theme-muted">
                    Confidence: {p.confidence.toFixed(1)}% · {new Date(p.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-1 line-clamp-1 text-sm text-theme-text">{p.recommendation}</p>
                </div>
                <div className="flex gap-2">
                  {p.reportId && (
                    <Button variant="secondary" size="sm" onClick={() => handleDownload(p.reportId)}>
                      PDF
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(p._id)}>
                    Delete
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </Layout>
  );
}
