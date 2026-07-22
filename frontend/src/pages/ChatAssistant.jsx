import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { chatAPI } from '../services/api';

export default function ChatAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatAPI
      .getHistory()
      .then(({ data }) => {
        if (data && Array.isArray(data.data)) {
          const history = data.data
            .map((log) => [
              { type: 'user', text: log.message, time: log.timestamp },
              { type: 'bot', text: log.response, time: log.timestamp },
            ])
            .flat();
          setMessages(history);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const clearChat = () => {
    setMessages([]);
    setErrorMsg('');
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setErrorMsg('');

    // Prepare active conversation history for Gemini multi-turn context
    const conversationHistory = messages.map((msg) => ({
      role: msg.type === 'user' ? 'user' : 'model',
      text: msg.text,
    }));

    setMessages((prev) => [...prev, { type: 'user', text: userMsg, time: new Date() }]);
    setLoading(true);

    try {
      const { data } = await chatAPI.send(userMsg, conversationHistory);
      const botReply = data?.response || data?.data?.response || 'Response received.';
      setMessages((prev) => [
        ...prev,
        { type: 'bot', text: botReply, time: data?.data?.timestamp || new Date() },
      ]);
    } catch (err) {
      console.error('Gemini chat error:', err);
      const errText = err.response?.data?.message || 'Could not retrieve response from AI Assistant.';
      setErrorMsg(errText);
      setMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          text: 'I apologize, but I encountered an error connecting to the AI Assistant. Please try again.',
          time: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    'What is gingivitis and how can I prevent it?',
    'How often should I brush and floss?',
    'பல் சொத்தை எவ்வாறு தடுப்பது?', // How to prevent tooth decay in Tamil
    'What to do if my gums are bleeding?',
  ];

  // Helper to render message text preserving newlines and basic markdown bold tags
  const renderFormattedText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => (
      <span key={idx} className="block">
        {line}
      </span>
    ));
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-theme-heading flex items-[#00D1FF] items-center gap-2">
            <span>✨ Gemini AI Dental Assistant</span>
          </h1>
          <p className="mt-1 text-theme-muted">
            Ask questions about oral hygiene, symptoms, prevention, or AI disease predictions (English & தமிழ்)
          </p>
        </motion.div>
        {messages.length > 0 && (
          <Button variant="secondary" onClick={clearChat} className="self-start md:self-auto text-xs py-1.5 px-3">
            Clear Chat
          </Button>
        )}
      </div>

      {errorMsg && (
        <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
          {errorMsg}
        </div>
      )}

      <Card className="mt-6 flex h-[600px] flex-col overflow-hidden" hover={false} padding={false}>
        <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-theme-muted py-8">
              <div className="rounded-full bg-theme-accent/10 p-4 text-4xl mb-3">🦷</div>
              <h3 className="text-lg font-semibold text-theme-heading">Welcome to Dental Care AI</h3>
              <p className="mt-1 max-w-md text-sm text-theme-muted">
                Your AI assistant for oral health advice, hygiene guidance, and disease explanations in English or Tamil.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg">
                {faqs.map((faq) => (
                  <button
                    key={faq}
                    type="button"
                    onClick={() => setInput(faq)}
                    className="rounded-full border border-theme-border/50 bg-theme-surface/40 px-3.5 py-1.5 text-xs text-theme-muted transition hover:border-theme-accent hover:text-theme-accent hover:bg-theme-surface"
                  >
                    {faq}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.type === 'user'
                    ? 'bg-theme-accent text-theme-primary font-medium shadow-sm'
                    : 'border border-theme-border/40 bg-theme-surface/70 text-theme-text shadow-sm'
                }`}
              >
                {msg.type === 'bot' && (
                  <div className="text-[10px] uppercase font-bold text-theme-accent mb-1 tracking-wider">
                    Gemini AI Assistant
                  </div>
                )}
                {renderFormattedText(msg.text)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-theme-border/40 bg-theme-surface/60 px-4 py-3 text-sm text-theme-muted flex items-center gap-2">
                <span className="inline-block animate-bounce text-theme-accent">●</span>
                <span className="inline-block animate-bounce delay-100 text-theme-accent">●</span>
                <span className="inline-block animate-bounce delay-200 text-theme-accent">●</span>
                <span className="ml-1 text-xs">Gemini is thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={sendMessage} className="border-t border-theme-border/30 bg-theme-surface/30 p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your oral health question in English or தமிழ்..."
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              {loading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}

