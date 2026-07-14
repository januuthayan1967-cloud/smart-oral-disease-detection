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
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatAPI.getHistory().then(({ data }) => {
      const history = data.data.map((log) => [
        { type: 'user', text: log.message, time: log.timestamp },
        { type: 'bot', text: log.response, time: log.timestamp },
      ]).flat();
      setMessages(history);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { type: 'user', text: userMsg, time: new Date() }]);
    setLoading(true);

    try {
      const { data } = await chatAPI.send(userMsg);
      setMessages((prev) => [...prev, { type: 'bot', text: data.data.response, time: data.data.timestamp }]);
    } catch {
      setMessages((prev) => [...prev, { type: 'bot', text: 'Sorry, something went wrong. Please try again.', time: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    'How often should I brush my teeth?',
    'What causes gingivitis?',
    'How to prevent dental caries?',
    'Tips for flossing correctly',
  ];

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-theme-heading">Dental Care Chat Assistant</h1>
        <p className="mt-1 text-theme-muted">Ask questions about oral health and dental care</p>
      </motion.div>

      <Card className="mt-6 flex h-[600px] flex-col" hover={false} padding={false}>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="text-center text-theme-muted">
              <p className="text-4xl">💬</p>
              <p className="mt-2">Start a conversation about oral health</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {faqs.map((faq) => (
                  <button
                    key={faq}
                    type="button"
                    onClick={() => setInput(faq)}
                    className="rounded-full border border-theme-border/50 bg-theme-surface/40 px-3 py-1.5 text-xs text-theme-muted transition hover:border-theme-accent/40 hover:text-theme-accent"
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
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  msg.type === 'user'
                    ? 'bg-theme-accent text-theme-primary'
                    : 'border border-theme-border/40 bg-theme-surface/60 text-theme-text'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-theme-border/40 bg-theme-surface/60 px-4 py-2 text-sm text-theme-muted">
                Typing...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={sendMessage} className="border-t border-theme-border/30 p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about oral health..."
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>Send</Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}
