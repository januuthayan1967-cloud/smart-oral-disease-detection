import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { educationAPI } from '../services/api';

const categories = [
  { value: '', label: 'All' },
  { value: 'articles', label: 'Articles' },
  { value: 'tips', label: 'Tips' },
  { value: 'brushing', label: 'Brushing' },
  { value: 'flossing', label: 'Flossing' },
  { value: 'mouthwash', label: 'Mouthwash' },
  { value: 'prevention', label: 'Prevention' },
  { value: 'video', label: 'Videos' },
];

export default function Education() {
  const [contents, setContents] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    educationAPI.getAll(category || undefined)
      .then(({ data }) => setContents(data.data))
      .catch(() => setContents([]))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-theme-heading">Oral Hygiene Learning</h1>
        <p className="mt-1 text-theme-muted">Educational resources for better oral health</p>
      </motion.div>

      <div className="mt-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setCategory(cat.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              category === cat.value
                ? 'bg-theme-accent text-theme-primary shadow-glow'
                : 'border border-theme-border/50 bg-theme-surface/40 text-theme-muted hover:border-theme-accent/40 hover:text-theme-accent'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {contents.map((item, i) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <span className="inline-block rounded-full border border-theme-accent/30 bg-theme-accent/10 px-2.5 py-0.5 text-xs font-medium capitalize text-theme-accent">
                  {item.category}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-theme-heading">{item.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-theme-muted">{item.description}</p>
                {item.videoUrl && (
                  <a
                    href={item.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm text-theme-accent hover:underline"
                  >
                    Watch Video →
                  </a>
                )}
              </Card>
            </motion.div>
          ))}
          {contents.length === 0 && (
            <p className="col-span-full text-center text-theme-muted">No content available yet.</p>
          )}
        </div>
      )}
    </Layout>
  );
}
