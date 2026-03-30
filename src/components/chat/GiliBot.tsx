import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, Loader2, Sparkles, HelpCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { getWeatherData } from '../../services/apiServices';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../config/firebase';

const BASE_SYSTEM_INSTRUCTION = `You are GiliBot, the ultimate AI travel expert for Gili Trawangan, Indonesia. 🌴
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
  const [context, setContext] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatRef = useRef<any>(null);

  const fetchContext = async () => {
    try {
      const [weather, eventsSnapshot] = await Promise.all([
        getWeatherData(),
        getDocs(query(collection(db, 'events'), where('date', '==', new Date().toISOString().split('T')[0])))
      ]);

      const events = eventsSnapshot.docs.map(doc => doc.data().title).join(', ');
      const weatherInfo = weather ? `${weather.main.temp}°C, ${weather.weather[0].description}` : 'Unknown';
      
      setContext(`
CURRENT ISLAND CONTEXT:
- Weather Today: ${weatherInfo}
- Events Today: ${events || 'No major events scheduled yet'}
- Time: ${new Date().toLocaleTimeString()}
`);
    } catch (err) {
      console.error('Context fetch error:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchContext();
    }
  }, [isOpen]);

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
      const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        setMessages(prev => [...prev, { role: 'bot', text: "I'm sorry, my AI brain isn't fully connected yet. Please make sure the GEMINI_API_KEY is set in the environment! 🏝️" }]);
        setIsLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Re-create chat with updated context
      const fullInstruction = `${BASE_SYSTEM_INSTRUCTION}\n\n${context}`;
      
      chatRef.current = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: fullInstruction,
        }
      });

      const response = await chatRef.current.sendMessage({ message: userMessage });
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
            className="glass dark:glass-dark w-[calc(100vw-2rem)] sm:w-[380px] h-[500px] max-h-[80vh] rounded-3xl shadow-2xl border-none flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="bg-electric-blue/80 backdrop-blur-md p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Bot className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">GiliBot</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-white/80 font-medium">Island Guide AI</span>
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
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent"
            >
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-electric-blue/90 text-white rounded-tr-none shadow-lg' 
                      : 'glass dark:glass-dark text-slate-800 dark:text-slate-200 border-none rounded-tl-none shadow-md'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="glass dark:glass-dark p-3 rounded-2xl rounded-tl-none border-none flex items-center gap-2">
                    <Loader2 className="animate-spin text-electric-blue" size={16} />
                    <span className="text-xs text-slate-500">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Questions */}
            {messages.length < 3 && (
              <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-white/10 bg-transparent">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="whitespace-nowrap glass-input dark:glass-input-dark text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-full text-[10px] font-bold hover:bg-electric-blue/10 hover:text-electric-blue transition-all border-none"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="p-4 bg-transparent border-t border-white/10 flex gap-2"
            >
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Gili T..."
                className="flex-1 glass-input dark:glass-input-dark border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-electric-blue transition-all dark:text-white"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-electric-blue text-white p-2 rounded-xl hover:bg-electric-blue-dark transition-colors disabled:opacity-50 shadow-lg"
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
          isOpen ? 'bg-rose-500 rotate-90' : 'bg-electric-blue'
        }`}
      >
        {isOpen ? <X className="text-white" size={24} /> : <Sparkles className="text-white" size={24} />}
      </motion.button>
    </div>
  );
}
