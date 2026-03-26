import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, Loader2, Sparkles, HelpCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are GiliBot, the ultimate AI travel expert for Gili Trawangan, Indonesia. 🌴
Your goal is to provide accurate, helpful, and "island-vibey" advice to travelers.

Key Knowledge Base:
- Transport: Fast boats from Bali (Padang Bai) take ~1.5-2h. Top operators: Ekajaya, Blue Water Express, Austina. Prices ~700k-900k IDR return. 
- Island Rules: NO motorized vehicles. Only bicycles (60k-80k/day) and horse carts (cidomo). Respect local culture: cover shoulders/knees in the village.
- Snorkeling: Turtle Point (NE coast) is best for turtles. Underwater Statues (Nest) are off Gili Meno.
- Diving: Gili T is the "Turtle Capital". Top spots: Shark Point, Manta Point, Deep Turbo, Hans Reef (macro).
- Food: Night Market (seafood), Regina Pizza (Italian), Banyan Tree (healthy), Sasak Bistro (local Sasak food).
- Nightlife: Monday (Blue Marlin), Wednesday (Irish Bar), Friday (Jungle/Summer Summer), Saturday (Sama Sama Reggae).
- Emergency: Gili T Medical Center is 24/7 (+62 819 9773 5335).
- Inter-island: Public boats to Meno/Air at 08:30 & 15:00 (~45k IDR).

Tone: Friendly, enthusiastic, and helpful. Use emojis like 🐢, 🏝️, 🌊, 🍹.
Constraints: Keep responses concise (under 100 words) unless a detailed guide is requested. If unsure, refer to the Map or Forum.`;

export default function GiliBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: "Hi! I'm GiliBot. 🌴 Need help with boat schedules, snorkeling spots, or the best party tonight? Ask me anything!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage = text.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: `Context: ${SYSTEM_INSTRUCTION}\n\nUser: ${userMessage}` }] }
        ],
      });

      const botText = response.text || "Sorry, I'm having a bit of island brain fog. Can you try again? 🥥";
      setMessages(prev => [...prev, { role: 'bot', text: botText }]);
    } catch (error) {
      console.error('GiliBot Error:', error);
      setMessages(prev => [...prev, { role: 'bot', text: "Oops! My connection to the mainland is a bit spotty. Try again in a second! 🌊" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    "Next boat to Bali?",
    "Best sunset spot?",
    "Where to see turtles?",
    "Party tonight?",
  ];

  return (
    <div className="fixed bottom-24 right-6 z-[1000] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-white dark:bg-slate-900 w-[320px] sm:w-[380px] h-[500px] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="bg-sky-600 p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Bot className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">GiliBot</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-sky-100 font-medium">Island Guide AI</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50"
            >
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-sky-600 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    <Loader2 className="animate-spin text-sky-600" size={16} />
                    <span className="text-xs text-slate-500">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Questions */}
            {messages.length < 3 && (
              <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="whitespace-nowrap bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-full text-[10px] font-bold hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:text-sky-600 transition-all border border-transparent hover:border-sky-200"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2"
            >
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Gili T..."
                className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-sky-500 transition-all dark:text-white"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-sky-600 text-white p-2 rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all ${
          isOpen ? 'bg-rose-500 rotate-90' : 'bg-sky-600'
        }`}
      >
        {isOpen ? <X className="text-white" size={24} /> : <Sparkles className="text-white" size={24} />}
      </motion.button>
    </div>
  );
}
