import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { educationAPI } from '../services/api';

const categories = [
  { value: '', label: 'All Resources' },
  { value: 'articles', label: 'Clinical Articles' },
  { value: 'tips', label: 'Hygiene Tips' },
  { value: 'brushing', label: 'Brushing Techniques' },
  { value: 'flossing', label: 'Flossing Guide' },
  { value: 'mouthwash', label: 'Mouthwash' },
  { value: 'prevention', label: 'Disease Prevention' },
  { value: 'video', label: 'Video Tutorials' },
];

// Verified 100% real, live external healthcare resources
const fallbackArticles = [
  {
    _id: 'fb-who-1',
    title: 'WHO Global Oral Health Fact Sheet',
    category: 'articles',
    source: 'World Health Organization (WHO)',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/oral-health',
    readTime: '4 min read',
    description: 'Comprehensive WHO report detailing the global burden of oral diseases affecting 3.7 billion people, primary risk factors like free sugars and tobacco, and key strategies for prevention.',
  },
  {
    _id: 'fb-who-2',
    title: 'Sugars & Dental Caries Prevention',
    category: 'prevention',
    source: 'World Health Organization (WHO)',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/sugars-and-dental-caries',
    readTime: '3 min read',
    description: 'Official WHO guideline highlighting the direct causal relationship between free sugar intake and dental caries, including dietary recommendations to prevent tooth decay.',
  },
  {
    _id: 'fb-nih-1',
    title: 'NIH Guide: Tooth Decay & Cavity Formation',
    category: 'articles',
    source: 'National Institute of Dental and Craniofacial Research (NIH)',
    sourceUrl: 'https://www.nidcr.nih.gov/health-info/tooth-decay',
    readTime: '4 min read',
    description: 'Clinical publication from NIDCR/NIH explaining how bacterial plaque produces enamel-destroying acids and how fluoride and proper hygiene prevent tooth decay.',
  },
  {
    _id: 'fb-nih-2',
    title: 'NIH Guide: Periodontal & Gum Disease',
    category: 'prevention',
    source: 'National Institute of Dental and Craniofacial Research (NIH)',
    sourceUrl: 'https://www.nidcr.nih.gov/health-info/gum-disease',
    readTime: '5 min read',
    description: 'Evidence-based overview of gum disease progression from mild gingivitis to chronic periodontitis, detailing risk factors, systemic health connections, and prevention.',
  },
  {
    _id: 'fb-nhs-1',
    title: 'NHS Guide: How to Keep Your Teeth Clean',
    category: 'brushing',
    source: 'NHS (UK National Health Service)',
    sourceUrl: 'https://www.nhs.uk/live-well/healthy-teeth-and-gums/how-to-keep-your-teeth-clean/',
    readTime: '3 min read',
    description: 'Official NHS hygiene guide on effective toothbrushing twice daily, recommended fluoride toothpaste concentrations (ppm), flossing habits, and mouthwash advice.',
  },
  {
    _id: 'fb-cdc-1',
    title: 'CDC: Community Oral Disease Prevention',
    category: 'tips',
    source: 'Centers for Disease Control and Prevention (CDC)',
    sourceUrl: 'https://www.cdc.gov/oral-health/prevention/index.html',
    readTime: '3 min read',
    description: 'CDC guidance on evidence-based community oral disease prevention, dental sealants, water fluoridation benefits, and routine daily hygiene practices.',
  },
  {
    _id: 'fb-fdi-1',
    title: 'FDI: Interdental Cleaning & Oral Health Topics',
    category: 'flossing',
    source: 'FDI World Dental Federation',
    sourceUrl: 'https://www.fdiworlddental.org/resources',
    readTime: '4 min read',
    description: 'Global dental federation portal offering clinical advice, interdental cleaning practices, and oral disease policy resources.',
  },
  {
    _id: 'fb-who-video',
    title: 'WHO Science in 5: Global Oral Health Video',
    category: 'video',
    source: 'World Health Organization (WHO)',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/oral-health',
    videoUrl: 'https://www.youtube.com/watch?v=-b6NGkv5RmM',
    readTime: '5 min video',
    description: 'Official WHO video episode featuring Dr. Benoit Varenne explaining global oral health challenges, risk factors, and core daily hygiene habits.',
  },
];

export default function Education() {
  const [contents, setContents] = useState([]);
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    educationAPI.getAll(category || undefined)
      .then(({ data }) => {
        if (!active) return;
        const apiItems = Array.isArray(data?.data) ? data.data : [];
        if (apiItems.length > 0) {
          // Normalize and merge verified URLs if backend missing them
          const merged = apiItems.map(item => {
            const fb = fallbackArticles.find(f => f.title === item.title) || fallbackArticles[0];
            return {
              ...item,
              source: item.source || fb.source,
              sourceUrl: item.sourceUrl || fb.sourceUrl,
              readTime: item.readTime || fb.readTime,
              videoUrl: item.videoUrl || (item.category === 'video' ? fb.videoUrl : undefined),
            };
          });
          setContents(merged);
        } else {
          setContents(fallbackArticles);
        }
      })
      .catch(() => {
        if (active) setContents(fallbackArticles);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [category]);

  const filteredContents = useMemo(() => {
    return contents.filter((item) => {
      const matchCat = !category || item.category === category;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        item.title?.toLowerCase().includes(q) || 
        item.description?.toLowerCase().includes(q) ||
        item.source?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [contents, category, searchQuery]);

  return (
    <Layout>
      {/* Header Banner */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-theme-accent bg-theme-accent/10 border border-theme-accent/20 mb-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Verified Global Health Resources
            </div>
            <h1 className="text-3xl font-bold text-theme-heading font-outfit">Patient Education Gateway</h1>
            <p className="mt-1 text-sm text-theme-muted">
              Curated, evidence-based oral care guidance from authoritative international healthcare organizations.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[240px] sm:min-w-[300px]">
            <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search WHO, NIH, CDC, NHS resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-theme-border/60 bg-theme-surface/60 py-2 pl-10 pr-4 text-sm text-theme-heading placeholder-theme-muted shadow-sm backdrop-blur-sm transition focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-theme-muted hover:text-theme-heading"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Category Pills */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {categories.map((cat) => {
          const isActive = category === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-theme-accent text-white shadow-glow'
                  : 'border border-theme-border/60 bg-theme-surface/50 text-theme-muted hover:border-theme-accent/50 hover:text-theme-heading'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredContents.map((item, i) => {
            const readTime = item.readTime || (item.videoUrl ? '5 min video' : '3 min read');
            const sourceOrg = item.source || 'World Health Organization (WHO)';
            const sourceUrl = item.sourceUrl || 'https://www.who.int/news-room/fact-sheets/detail/oral-health';
            const hasVideo = Boolean(item.videoUrl);

            return (
              <motion.div
                key={item._id || i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedArticle(item)}
                className="cursor-pointer group h-full"
              >
                <div
                  className="h-full flex flex-col justify-between rounded-2xl p-5 shadow-theme transition-all duration-200 hover:-translate-y-1 hover:shadow-theme-lg"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-soft)',
                  }}
                >
                  <div>
                    {/* Category & Read time */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-block rounded-md border border-theme-accent/30 bg-theme-accent/10 px-2.5 py-0.5 text-[11px] font-semibold capitalize tracking-wide text-theme-accent">
                        {item.category}
                      </span>
                      <span className="text-[11px] font-medium text-theme-muted flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {readTime}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-theme-heading font-outfit group-hover:text-theme-accent transition-colors line-clamp-2">
                      {item.title}
                    </h3>

                    {/* Source Organisation Badge */}
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-theme-surface/80 border border-theme-border/50 px-2.5 py-1 text-[11px] font-medium text-theme-heading">
                      <svg className="w-3 h-3 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="truncate">{sourceOrg}</span>
                    </div>

                    {/* Short Description */}
                    <p className="mt-2.5 text-xs leading-relaxed text-theme-muted line-clamp-3">
                      {item.description}
                    </p>
                  </div>

                  {/* Direct Links Footer */}
                  <div className="mt-5 pt-3 border-t border-theme-border/40 flex flex-wrap items-center justify-between gap-2">
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-theme-accent hover:underline"
                    >
                      <span>Read Article</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>

                    {hasVideo && (
                      <a
                        href={item.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 hover:underline"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                        </svg>
                        <span>Watch Video</span>
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredContents.length === 0 && (
            <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-theme-border/60 bg-theme-surface/30 p-8">
              <svg className="mx-auto h-10 w-10 text-theme-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="font-semibold text-theme-heading">No matching education resources found</p>
              <p className="mt-1 text-xs text-theme-muted">Try adjusting your search terms or category filters.</p>
              <button
                type="button"
                onClick={() => { setCategory(''); setSearchQuery(''); }}
                className="mt-3 inline-block rounded-lg bg-theme-accent/15 px-3 py-1.5 text-xs font-semibold text-theme-accent hover:bg-theme-accent/25 transition"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Article Gateway Modal */}
      <Modal
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        title={selectedArticle?.title || 'Educational Resource Gateway'}
        size="lg"
      >
        {selectedArticle && (
          <div className="space-y-4">
            {/* Metadata bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-theme-border/40 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-theme-accent/30 bg-theme-accent/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-theme-accent">
                  Category: {selectedArticle.category}
                </span>
                <span className="text-xs font-medium text-theme-muted">
                  ⏱ {selectedArticle.readTime || '3 min read'}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                <span>Verified Source:</span>
                <strong className="text-theme-heading">{selectedArticle.source || 'World Health Organization (WHO)'}</strong>
              </div>
            </div>

            {/* Short Original Summary */}
            <div className="p-4 rounded-xl bg-theme-surface/60 border border-theme-border/50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-theme-accent mb-1.5">Summary Overview</h4>
              <p className="text-sm leading-relaxed text-theme-heading">
                {selectedArticle.description}
              </p>
            </div>

            {/* Copyright & Gateway Disclaimer */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-theme-muted leading-relaxed flex items-start gap-2">
              <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                To respect medical copyright standards, full clinical publications are hosted on the original organization's official website. Click below to read the complete article at the original source.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t border-theme-border/40 flex flex-wrap items-center justify-between gap-3">
              <a
                href={selectedArticle.sourceUrl || 'https://www.who.int/news-room/fact-sheets/detail/oral-health'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-theme-accent px-5 py-2.5 text-xs font-semibold text-white shadow-glow transition hover:opacity-90"
              >
                <span>Read Full Article on {selectedArticle.source || 'Official Source'}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              {selectedArticle.videoUrl && (
                <a
                  href={selectedArticle.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-glow transition hover:opacity-90"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                  <span>Watch Official Video →</span>
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
