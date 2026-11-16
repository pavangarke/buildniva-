import React, { useState } from 'react';
import { Sparkles, Send, X, Bot, ArrowRight, Compass, Shield } from 'lucide-react';
import { api } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  const { setActiveTab, showToast } = useApp();
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string; actionTab?: string }[]>([
    {
      sender: 'ai',
      text: 'Namaste! I am your BuildNiva Civil Engineering & Material Advisor. Ask me about Indian IS standard requirements, material quantity estimations, cement grades (OPC 53 vs PPC), or natural language search across our verified catalog.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    'What materials might I need for a small house?',
    'Help me compare cement products (OPC 53 vs PPC).',
    'What information should I provide when requesting a contractor quotation?',
    'Find concrete mixers available for rent.',
  ];

  const handleSend = async (userText: string) => {
    const textToSend = userText || input;
    if (!textToSend.trim()) return;

    setMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setInput('');
    setLoading(true);

    try {
      // Check if it's a natural language search query
      const lower = textToSend.toLowerCase();
      if (lower.startsWith('find') || lower.includes('search') || lower.includes('hire') || lower.includes('rent')) {
        const searchRes = await api.naturalSearchAi(textToSend);
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: `I understood your search! ${searchRes.message}. Click below to view available verified listings:`,
            actionTab: searchRes.targetTab,
          },
        ]);
      } else {
        const res = await api.askAiAssistant(textToSend);
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: res.answer,
          },
        ]);
      }
    } catch (err: any) {
      showToast('Advisor Error', err.message, 'error');
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Advisory: For structural design safety and precise BOQ, please consult our licensed structural engineers under the Engineers tab.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full h-[580px] shadow-2xl border border-slate-200 flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>BuildNiva Civil Assistant</span>
              </h3>
              <p className="text-[11px] text-slate-400">IS 456 & CPWD Technical Scope Guidance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Log */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs bg-slate-50">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] p-3 rounded-xl leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-amber-600 text-white font-medium rounded-br-none shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none shadow-xs space-y-2'
                }`}
              >
                <div>{m.text}</div>
                {m.actionTab && (
                  <button
                    onClick={() => {
                      setActiveTab(m.actionTab!);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-[11px] hover:bg-slate-800 transition-colors"
                  >
                    <span>View {m.actionTab.toUpperCase()} Listings</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-500 text-xs flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                <span>Consulting Indian Civil Engineering Norms...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts Bar */}
        <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSend(qp)}
              className="px-2.5 py-1 bg-stone-100 hover:bg-amber-50 hover:text-amber-900 text-slate-600 rounded-lg whitespace-nowrap transition-colors"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask a question or type 'Find cement suppliers'..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 bg-slate-900 hover:bg-amber-600 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-1 text-[10px] text-slate-400 text-center">
            Advisory estimates only. For structural safety certification, consult a licensed civil engineer.
          </div>
        </div>
      </div>
    </div>
  );
};
