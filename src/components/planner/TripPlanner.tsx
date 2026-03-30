import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Loader2, Send, Clock, Star, Save, Trash2, ChevronRight, Sparkles, Compass, Coffee, Utensils, Music, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, where, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { GoogleGenAI, Type } from '@google/genai';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface ItineraryDay {
  day: number;
  title: string;
  activities: {
    time: string;
    title: string;
    description: string;
    type: 'food' | 'activity' | 'relaxation' | 'party' | 'transport';
    location?: string;
  }[];
}

interface Itinerary {
  title: string;
  summary: string;
  days: ItineraryDay[];
}

export default function TripPlanner() {
  const { user } = useAuth();
  const [dates, setDates] = useState('');
  const [activities, setActivities] = useState('');
  const [accommodation, setAccommodation] = useState('');
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [myTrips, setMyTrips] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create');

  useEffect(() => {
    const eventsQuery = query(collection(db, 'events'));
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const servicesQuery = query(collection(db, 'bookingItems'));
    const unsubscribeServices = onSnapshot(servicesQuery, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    if (user) {
      const tripsQuery = query(
        collection(db, 'trips'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const unsubscribeTrips = onSnapshot(tripsQuery, (snapshot) => {
        setMyTrips(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => {
        unsubscribeEvents();
        unsubscribeServices();
        unsubscribeTrips();
      };
    }

    return () => {
      unsubscribeEvents();
      unsubscribeServices();
    };
  }, [user]);

  const handleGenerate = async () => {
    if (!process.env.GEMINI_API_KEY) {
      toast.error('Gemini API key is not configured.');
      return;
    }

    if (!dates.trim() || !activities.trim()) {
      toast.error('Please provide dates and desired activities.');
      return;
    }

    setLoading(true);
    try {
      const prompt = `
        Create a day-by-day trip itinerary for Gili Trawangan.
        Travel Dates: ${dates}
        Desired Activities: ${activities}
        Accommodation Preferences: ${accommodation}
        
        Available Events on the island: ${JSON.stringify(events.map(e => ({ title: e.title, date: e.date, time: e.time, category: e.category })))}
        Available Booking Services: ${JSON.stringify(services.map(s => ({ title: s.title, type: s.type, price: s.price })))}
        
        Please suggest a detailed itinerary integrating these events and services where they fit.
        Be creative and make it feel like a local expert is planning it.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              days: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.NUMBER },
                    title: { type: Type.STRING },
                    activities: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          time: { type: Type.STRING },
                          title: { type: Type.STRING },
                          description: { type: Type.STRING },
                          type: { type: Type.STRING, enum: ['food', 'activity', 'relaxation', 'party', 'transport'] },
                          location: { type: Type.STRING }
                        },
                        required: ['time', 'title', 'description', 'type']
                      }
                    }
                  },
                  required: ['day', 'title', 'activities']
                }
              }
            },
            required: ['title', 'summary', 'days']
          }
        }
      });

      const data = JSON.parse(response.text);
      setItinerary(data);
      toast.success('Itinerary generated!');
    } catch (error) {
      console.error('Error generating itinerary:', error);
      toast.error('Failed to generate itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTrip = async () => {
    if (!user || !itinerary) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'trips'), {
        userId: user.uid,
        title: itinerary.title,
        dates,
        activities,
        accommodation,
        itinerary,
        createdAt: new Date().toISOString()
      });
      toast.success('Trip saved to your profile!');
      setActiveTab('saved');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'trips');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    try {
      await deleteDoc(doc(db, 'trips', tripId));
      toast.success('Trip deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `trips/${tripId}`);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'food': return <Utensils size={14} />;
      case 'activity': return <Compass size={14} />;
      case 'relaxation': return <Waves size={14} />;
      case 'party': return <Music size={14} />;
      case 'transport': return <Clock size={14} />;
      default: return <Sparkles size={14} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'food': return 'text-amber-500 bg-amber-500/10';
      case 'activity': return 'text-electric-blue bg-electric-blue/10';
      case 'relaxation': return 'text-emerald-500 bg-emerald-500/10';
      case 'party': return 'text-rose-500 bg-rose-500/10';
      case 'transport': return 'text-slate-500 bg-slate-500/10';
      default: return 'text-purple-500 bg-purple-500/10';
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-mesh p-4 pb-32 relative transition-colors duration-300 no-scrollbar">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-slate-900 dark:text-white tracking-tight uppercase">Trip Planner</h2>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">AI-Powered Island Itineraries</p>
        </div>
        <div className="flex bg-white/20 dark:bg-slate-800/40 p-1 rounded-2xl backdrop-blur-md border border-white/10">
          <button 
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'create' ? 'bg-electric-blue text-white shadow-lg shadow-electric-blue/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
          >
            Create
          </button>
          <button 
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'saved' ? 'bg-electric-blue text-white shadow-lg shadow-electric-blue/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
          >
            Saved ({myTrips.length})
          </button>
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        {activeTab === 'create' ? (
          <motion.div 
            key="create"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="glass dark:glass-dark rounded-[2.5rem] p-8 border border-white/30 dark:border-white/10 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute -right-24 -top-24 w-64 h-64 bg-electric-blue/10 blur-[100px] rounded-full" />
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Travel Dates</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="e.g., March 30 - April 5" 
                      value={dates}
                      onChange={(e) => setDates(e.target.value)}
                      className="glass-input dark:glass-input-dark w-full rounded-2xl pl-12 pr-6 py-4 text-sm font-medium focus:outline-none dark:text-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">What do you love?</label>
                  <div className="relative">
                    <Compass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="e.g., snorkeling, diving, parties, sunsets" 
                      value={activities}
                      onChange={(e) => setActivities(e.target.value)}
                      className="glass-input dark:glass-input-dark w-full rounded-2xl pl-12 pr-6 py-4 text-sm font-medium focus:outline-none dark:text-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Accommodation (Optional)</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="e.g., Villa, Hostel, Beachfront" 
                      value={accommodation}
                      onChange={(e) => setAccommodation(e.target.value)}
                      className="glass-input dark:glass-input-dark w-full rounded-2xl pl-12 pr-6 py-4 text-sm font-medium focus:outline-none dark:text-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-electric-blue hover:bg-electric-blue-dark text-white py-5 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-electric-blue/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={20} /> Generate Itinerary</>}
              </button>
            </div>

            {itinerary && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-display font-semibold text-slate-900 dark:text-white tracking-tight">{itinerary.title}</h3>
                  <button 
                    onClick={handleSaveTrip}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="animate-spin" size={14} /> : <><Save size={14} /> Save Trip</>}
                  </button>
                </div>

                <div className="glass dark:glass-dark rounded-[2.5rem] p-8 border border-white/30 dark:border-white/10 shadow-2xl">
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic mb-8 leading-relaxed">"{itinerary.summary}"</p>
                  
                  <div className="space-y-12">
                    {itinerary.days.map((day) => (
                      <div key={day.day} className="relative pl-8 border-l-2 border-slate-200 dark:border-slate-800">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-electric-blue shadow-[0_0_10px_rgba(51,106,255,0.5)] border-4 border-white dark:border-slate-900" />
                        
                        <h4 className="text-sm font-bold text-electric-blue dark:text-electric-blue-light uppercase tracking-widest mb-6">Day {day.day}: {day.title}</h4>
                        
                        <div className="space-y-6">
                          {day.activities.map((act, idx) => (
                            <div key={idx} className="flex gap-4 group">
                              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-12 pt-1 uppercase tracking-tighter">{act.time}</div>
                              <div className="flex-1 glass dark:glass-dark p-4 rounded-2xl border border-white/20 dark:border-white/10 group-hover:border-electric-blue/30 transition-all">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className={`p-1.5 rounded-lg ${getActivityColor(act.type)}`}>
                                    {getActivityIcon(act.type)}
                                  </div>
                                  <h5 className="text-sm font-semibold text-slate-900 dark:text-white">{act.title}</h5>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{act.description}</p>
                                {act.location && (
                                  <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    <MapPin size={10} />
                                    {act.location}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="saved"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {myTrips.length === 0 ? (
              <div className="text-center py-20 glass dark:glass-dark rounded-[2.5rem] border border-dashed border-white/30 dark:border-white/10">
                <Compass size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                <h4 className="text-lg font-display font-semibold text-slate-900 dark:text-white uppercase tracking-tight">No saved trips</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Generate an itinerary and save it to see it here!</p>
              </div>
            ) : (
              myTrips.map((trip) => (
                <motion.div 
                  layout
                  key={trip.id}
                  className="glass dark:glass-dark rounded-[2.5rem] p-6 border border-white/30 dark:border-white/10 shadow-xl group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div onClick={() => { setItinerary(trip.itinerary); setActiveTab('create'); }} className="cursor-pointer">
                      <h4 className="text-lg font-display font-semibold text-slate-900 dark:text-white group-hover:text-electric-blue transition-colors">{trip.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Calendar size={12} /> {trip.dates}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteTrip(trip.id)}
                      className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {trip.activities.split(',').map((tag: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>

                  <button 
                    onClick={() => { setItinerary(trip.itinerary); setActiveTab('create'); }}
                    className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 group-hover:gap-4 transition-all"
                  >
                    View Full Itinerary <ChevronRight size={14} />
                  </button>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
