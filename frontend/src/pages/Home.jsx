import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import ToothMascot from '../components/ToothMascot';
import './Home.css';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] },
});

/* 3 Concise Capability Highlights (Matching Reference Badges) */
const capabilityHighlights = [
  {
    icon: (
      <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    iconBg: 'rgba(6,182,212,0.18)',
    title: 'AI-Assisted',
    subtitle: 'Detection',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    iconBg: 'rgba(34,211,238,0.18)',
    title: 'Connected',
    subtitle: 'Dental Care',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-teal-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    ),
    iconBg: 'rgba(13,148,136,0.22)',
    title: 'Prescription-Based',
    subtitle: 'Services',
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const handleStartDetection = () => {
    if (isAuthenticated) {
      navigate('/detect');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="oral-home min-h-screen text-theme-text">
      <div className="oral-atmosphere" aria-hidden="true">
        <div className="oral-light-columns" />
        <div className="oral-floor" />
        <div className="oral-stars" />
      </div>
      <Navbar variant="public" />
      <main className="oral-main">
        <section className="oral-hero" aria-labelledby="oral-headline">
          <motion.div className="oral-copy" {...(shouldReduceMotion ? { initial: false } : fadeUp(0))}>
            <div className="oral-eyebrow"><span aria-hidden="true">&#10022;</span> AI-POWERED ORAL HEALTHCARE</div>
            <h1 id="oral-headline">Healthy Smiles<span>Brighter Lives</span></h1>
            <p className="oral-description">Explore AI-assisted oral disease detection, Gemini-powered health assistance, virtual dental consultations, and prescription-based pharmacy services &mdash; all in one intelligent platform.</p>
            <div className="oral-capabilities">
              {capabilityHighlights.map((item) => (
                <div className="oral-capability" key={item.title}>
                  <span className="oral-capability-icon">{item.icon}</span>
                  <span><strong>{item.title}</strong><span>{item.subtitle}</span></span>
                </div>
              ))}
            </div>
            <div className="oral-actions">
              <Button size="lg" onClick={handleStartDetection} className="oral-primary">
                <svg width="24" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M10 4C4 4 3 10 5 16c1 3 1 10 4 12 3 1 2-9 7-9s4 10 7 9c3-2 3-9 4-12 2-6 1-12-5-12-3 0-4 2-6 2s-3-2-6-2Z" fill="currentColor" /></svg>
                Start Detection <span aria-hidden="true">&rarr;</span>
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate(isAuthenticated ? '/education' : '/register')} className="oral-secondary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1Zm0 0v15" /></svg>
                Learn More <span className="oral-play" aria-hidden="true">&#9654;</span>
              </Button>
            </div>
            <div className="oral-care-note"><span className="oral-care-mark" aria-hidden="true">&#10023;</span><span>Intelligent assistance. Connected care.<small>Supporting your oral health journey.</small></span></div>
            <p className="oral-medical-note">AI screening supports, and does not replace, assessment by a qualified dental professional.</p>
          </motion.div>
          <div className="oral-visual"><ToothMascot size="xl" showDecorations={true} /></div>
        </section>
        <section className="oral-feature-strip" aria-label="Explore OralAI services">
          <Link to="/detect" className="oral-strip-item"><span className="oral-strip-icon">{capabilityHighlights[0].icon}</span><span><h2>AI Oral Disease Detection</h2><p>Oral image screening across six supported categories.</p></span><span className="oral-arrow" aria-hidden="true">&rarr;</span></Link>
          <Link to="/chat" className="oral-strip-item"><span className="oral-strip-icon oral-violet"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 1 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" /></svg></span><span><h2>Gemini AI Assistant</h2><p>Explore oral health information with AI assistance.</p></span><span className="oral-arrow" aria-hidden="true">&rarr;</span></Link>
          <Link to="/consultation" className="oral-strip-item"><span className="oral-strip-icon oral-blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="2" y="5" width="13" height="14" rx="3"/><path d="m15 10 7-4v12l-7-4"/></svg></span><span><h2>Doctor Video Consultation</h2><p>Connect with dental professionals through video care.</p></span><span className="oral-arrow" aria-hidden="true">&rarr;</span></Link>
          <Link to="/medicines" className="oral-strip-item"><span className="oral-strip-icon oral-teal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="6" y="1" width="12" height="22" rx="6" transform="rotate(38 12 12)"/><path d="m7 8 10 8"/></svg></span><span><h2>Prescription &amp; Pharmacy</h2><p>Medicine ordering through the prescription workflow.</p></span><span className="oral-arrow" aria-hidden="true">&rarr;</span></Link>
        </section>
        <section className="oral-categories" aria-label="Supported classification categories">
          <span>6 supported categories</span>
          <p>Dental Calculus &middot; Dental Caries &middot; Gingivitis &middot; Normal Teeth &middot; Mouth Ulcer &middot; Tooth Discoloration</p>
        </section>
      </main>
    </div>
  );
}
