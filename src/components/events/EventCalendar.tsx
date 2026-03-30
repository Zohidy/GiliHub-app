import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { Calendar as CalendarIcon, Plus, X, Clock, MapPin, User, Tag, Trash2, Image as ImageIcon, Share2, RefreshCw, Edit2, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { toast } from 'sonner';
import ConfirmModal from '../ui/ConfirmModal';

const GILI_T_CENTER: [number, number] = [-8.3525, 116.0383];

export default function EventCalendar() {
  const { user, userData } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{isOpen: boolean, id: string}>({ isOpen: false, id: '' });
  const [isLoading, setIsLoading] = useState(true);

  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    position: GILI_T_CENTER,
    category: 'community',
    recurring: {
      type: 'none',
      weeklyDays: [] as string[],
      monthlyOption: 'date',
      monthlyDate: 1,
      monthlyWeek: 1,
      monthlyDay: 'Monday',
      yearlyMonth: 1,
      yearlyDay: 1,
      endType: 'never',
      endDate: '',
      endCount: 1
    },
    imageUrl: ''
  });

  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const WEEKS = [
    { value: 1, label: 'First' },
    { value: 2, label: 'Second' },
    { value: 3, label: 'Third' },
    { value: 4, label: 'Fourth' },
    { value: -1, label: 'Last' }
  ];

  useEffect(() => {
    const eventsQuery = query(
      collection(db, 'events'),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Add weekly recurring nightlife events if they don't exist in the data
      const nightlifeEvents = [
        {
          id: 'nightlife-mon',
          title: 'Monday Night Party @ Blue Marlin',
          description: 'The legendary Monday night party at Blue Marlin Dive Center. Live music and great vibes.',
          date: new Date().toISOString().split('T')[0],
          time: '21:00 - Late',
          location: 'Blue Marlin Dive Center',
          category: 'party',
          recurring: { type: 'weekly', weeklyDays: ['Monday'], endType: 'never' },
          organizerName: 'System',
          isSystem: true
        },
        {
          id: 'nightlife-tue',
          title: 'Gili Bar Crawl',
          description: 'Join the famous Gili Bar Crawl starting from Blue Marlin. Meet new people and explore the best bars.',
          date: new Date().toISOString().split('T')[0],
          time: '19:00 - Late',
          location: 'Blue Marlin',
          category: 'party',
          recurring: { type: 'weekly', weeklyDays: ['Tuesday'], endType: 'never' },
          organizerName: 'System',
          isSystem: true
        },
        {
          id: 'nightlife-wed',
          title: 'Irish Bar & Boat Party',
          description: 'Wednesday nights are for the Irish Bar and the Gili Boat Party. Don\'t miss out!',
          date: new Date().toISOString().split('T')[0],
          time: '20:00 - Late',
          location: 'Tir Na Nog (Irish Bar)',
          category: 'party',
          recurring: { type: 'weekly', weeklyDays: ['Wednesday'], endType: 'never' },
          organizerName: 'System',
          isSystem: true
        },
        {
          id: 'nightlife-fri',
          title: 'Jungle Club Friday',
          description: 'Start with live music at Summer Summer, then head to Jungle Club for the ultimate Friday night.',
          date: new Date().toISOString().split('T')[0],
          time: '22:00 - Late',
          location: 'Jungle Club',
          category: 'party',
          recurring: { type: 'weekly', weeklyDays: ['Friday'], endType: 'never' },
          organizerName: 'System',
          isSystem: true
        },
        {
          id: 'nightlife-sat',
          title: 'Sama Sama Reggae Night',
          description: 'The best reggae vibes on the island every Saturday night.',
          date: new Date().toISOString().split('T')[0],
          time: '21:00 - Late',
          location: 'Sama Sama Reggae Bar',
          category: 'party',
          recurring: { type: 'weekly', weeklyDays: ['Saturday'], endType: 'never' },
          organizerName: 'System',
          isSystem: true
        },
        {
          id: 'diving-sun',
          title: 'Sunday Morning Fun Dive',
          description: 'Join us for a morning fun dive at Shark Point. All levels welcome!',
          date: new Date().toISOString().split('T')[0],
          time: '08:30 - 11:00',
          location: 'Manta Dive Center',
          category: 'diving',
          recurring: { type: 'weekly', weeklyDays: ['Sunday'], endType: 'never' },
          organizerName: 'System',
          isSystem: true
        }
      ];

      setEvents([...nightlifeEvents, ...eventsData]);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'events');
      setIsLoading(false);
      toast.error('Failed to load events');
    });

    return () => unsubscribe();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) return;

    setIsSubmitting(true);
    try {
      if (editingEvent) {
        await updateDoc(doc(db, 'events', editingEvent.id), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        toast.success('Event updated successfully');
      } else {
        await addDoc(collection(db, 'events'), {
          ...formData,
          organizerId: user.uid,
          organizerName: userData.displayName,
          createdAt: new Date().toISOString()
        });
        toast.success('Event published successfully');
      }
      
      setIsModalOpen(false);
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        position: GILI_T_CENTER,
        category: 'community',
        recurring: {
          type: 'none',
          weeklyDays: [],
          monthlyOption: 'date',
          monthlyDate: 1,
          monthlyWeek: 1,
          monthlyDay: 'Monday',
          yearlyMonth: 1,
          yearlyDay: 1,
          endType: 'never',
          endDate: '',
          endCount: 1
        },
        imageUrl: ''
      });
    } catch (error) {
      handleFirestoreError(error, editingEvent ? OperationType.UPDATE : OperationType.CREATE, 'events');
      toast.error(editingEvent ? 'Failed to update event' : 'Failed to publish event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      position: event.position || GILI_T_CENTER,
      category: event.category,
      recurring: event.recurring || {
        type: 'none',
        weeklyDays: [],
        monthlyOption: 'date',
        monthlyDate: 1,
        monthlyWeek: 1,
        monthlyDay: 'Monday',
        yearlyMonth: 1,
        yearlyDay: 1,
        endType: 'never',
        endDate: '',
        endCount: 1
      },
      imageUrl: event.imageUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (id: string) => {
    setDeleteConfirmModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    const id = deleteConfirmModal.id;
    setDeleteConfirmModal({ isOpen: false, id: '' });
    try {
      await deleteDoc(doc(db, 'events', id));
      toast.success('Event deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `events/${id}`);
      toast.error('Failed to delete event');
    }
  };

  const handleShare = async (event: any) => {
    const shareData = {
      title: event.title,
      text: `Check out this event in Gili Trawangan: ${event.title} on ${new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} at ${event.time}. Location: ${event.location}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        toast.success('Event details copied to clipboard!');
      }
    } catch (error) {
      // Ignore abort errors
      if ((error as any).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleOpenInGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  const filteredEvents = filterCategory === 'all' 
    ? events 
    : events.filter(event => event.category === filterCategory);

  const categories = [
    { id: 'all', label: 'All', color: 'bg-slate-100 text-slate-600' },
    { id: 'party', label: 'Party', color: 'bg-purple-100 text-purple-600' },
    { id: 'workshop', label: 'Workshop', color: 'bg-amber-100 text-amber-600' },
    { id: 'community', label: 'Community', color: 'bg-emerald-100 text-emerald-600' },
    { id: 'sports', label: 'Sports', color: 'bg-electric-blue/10 text-electric-blue' },
    { id: 'diving', label: 'Diving', color: 'bg-electric-blue/10 text-electric-blue' },
    { id: 'snorkeling', label: 'Snorkeling', color: 'bg-cyan-100 text-cyan-600' },
    { id: 'stay', label: 'Stay', color: 'bg-electric-blue/10 text-electric-blue' },
    { id: 'other', label: 'Other', color: 'bg-slate-100 text-slate-600' }
  ];

  return (
    <div className="h-full w-full bg-mesh flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Header */}
      <div className="glass dark:glass-dark px-4 py-4 sticky top-0 z-10 shadow-xl border-b border-white/20 dark:border-white/10 backdrop-blur-xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">Event Calendar</h2>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Discover what's happening in Gili</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-electric-blue hover:bg-electric-blue-dark text-white p-3 rounded-2xl transition-all shadow-xl shadow-electric-blue/20 active:scale-95 border border-white/20"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Categories Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
                filterCategory === cat.id 
                  ? 'bg-electric-blue text-white border-electric-blue-dark shadow-xl shadow-electric-blue/20' 
                  : 'glass dark:glass-dark text-slate-500 dark:text-slate-400 border-white/20 dark:border-white/10 hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading ? (
          <div className="h-full w-full flex flex-col items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 border-4 border-electric-blue border-t-transparent rounded-full mb-4"
            />
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading events...</p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4 pb-32 no-scrollbar">
            {filteredEvents.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon size={32} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No events found</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Be the first to organize an event in Gili Trawangan!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredEvents.map(event => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={event.id}
                      className="glass dark:glass-dark rounded-[2.5rem] overflow-hidden flex flex-col border border-white/20 dark:border-white/10 shadow-2xl"
                    >
                      {event.imageUrl && (
                        <div className="h-48 w-full overflow-hidden relative group/eventimg">
                          <img 
                            src={event.imageUrl} 
                            alt={event.title} 
                            className="w-full h-full object-cover group-hover/eventimg:scale-110 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-4 right-4">
                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg backdrop-blur-md border border-white/20 ${
                              categories.find(c => c.id === event.category)?.color || 'bg-slate-100/80 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300'
                            }`}>
                              {event.category}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="p-6">
                        {!event.imageUrl && (
                          <div className="flex justify-between items-start mb-3">
                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/10 ${
                              categories.find(c => c.id === event.category)?.color || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {event.category}
                            </span>
                          </div>
                        )}
                        
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{event.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 line-clamp-2 font-medium leading-relaxed">{event.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                            <div className="w-8 h-8 rounded-xl bg-electric-blue/10 flex items-center justify-center">
                              <CalendarIcon size={16} className="text-electric-blue" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest">{new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                            <div className="w-8 h-8 rounded-xl bg-electric-blue/10 flex items-center justify-center">
                              <Clock size={16} className="text-electric-blue" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest">{event.time}</span>
                          </div>
                          {event.recurring && event.recurring.type !== 'none' && (
                            <div className="flex flex-col gap-1 col-span-2 mt-1">
                              <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                  <RefreshCw size={16} className="animate-spin-slow" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                  Recurring: {event.recurring.type}
                                </span>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 col-span-2">
                            <div className="w-8 h-8 rounded-xl bg-electric-blue/10 flex items-center justify-center">
                              <MapPin size={16} className="text-electric-blue" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest truncate">{event.location}</span>
                          </div>
                        </div>

                      <div className="flex flex-col gap-3">
                        {event.position && (
                          <button 
                            onClick={() => handleOpenInGoogleMaps(event.position[0], event.position[1])}
                            className="w-full bg-electric-blue hover:bg-electric-blue-dark text-white py-3 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-electric-blue/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                          >
                            <Navigation size={14} />
                            Navigate to Google Maps
                          </button>
                        )}
                        
                        <div className="flex items-center justify-between pt-4 border-t border-white/10 dark:border-white/5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-electric-blue/10 dark:bg-electric-blue/20 flex items-center justify-center border border-white/20">
                              <User size={14} className="text-electric-blue dark:text-electric-blue-light" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">By {event.organizerName}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => handleShare(event)}
                              className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-electric-blue dark:hover:text-electric-blue-light hover:bg-white/10 rounded-xl transition-all active:scale-90"
                              title="Share Event"
                            >
                              <Share2 size={18} />
                            </button>
                            
                            {(user?.uid === event.organizerId || userData?.role === 'admin') && (
                              <>
                                <button 
                                  onClick={() => handleEditEvent(event)}
                                  className="p-2.5 text-amber-400 dark:text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white/10 rounded-xl transition-all active:scale-90"
                                  title="Edit Event"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteEvent(event.id)}
                                  className="p-2.5 text-rose-400 dark:text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white/10 rounded-xl transition-all active:scale-90"
                                  title="Delete Event"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  ))}
                </div>
              )}
          </div>
        )}
      </div>

    {/* Add Event Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass dark:glass-dark w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 dark:border-white/10"
            >
              <div className="sticky top-0 glass dark:glass-dark px-6 py-5 border-b border-white/10 flex justify-between items-center z-10">
                <h3 className="font-bold text-xl text-slate-900 dark:text-white uppercase tracking-tight">{editingEvent ? 'Edit Event' : 'Create Event'}</h3>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingEvent(null);
                    setFormData({
                      title: '',
                      description: '',
                      date: '',
                      time: '',
                      location: '',
                      position: GILI_T_CENTER,
                      category: 'community',
                      recurring: {
                        type: 'none',
                        weeklyDays: [],
                        monthlyOption: 'date',
                        monthlyDate: 1,
                        monthlyWeek: 1,
                        monthlyDay: 'Monday',
                        yearlyMonth: 1,
                        yearlyDay: 1,
                        endType: 'never',
                        endDate: '',
                        endCount: 1
                      },
                      imageUrl: ''
                    });
                  }}
                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>              <form onSubmit={handleCreateEvent} className="p-6 space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Event Title</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Beach Clean Up"
                    className="glass-input dark:glass-input-dark w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all dark:text-white dark:placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="What's happening?"
                    className="glass-input dark:glass-input-dark w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all resize-none dark:text-white dark:placeholder-slate-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Date</label>
                    <input
                      required
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="glass-input dark:glass-input-dark w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Time</label>
                    <input
                      required
                      type="text"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      placeholder="e.g. 17:00 - End"
                      className="glass-input dark:glass-input-dark w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all dark:text-white dark:placeholder-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Location Name</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      required
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="e.g. North Beach"
                      className="glass-input dark:glass-input-dark w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all dark:text-white dark:placeholder-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Coordinates (Lat, Lng)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      step="any"
                      value={formData.position[0]}
                      onChange={(e) => setFormData({...formData, position: [parseFloat(e.target.value), formData.position[1]]})}
                      placeholder="Latitude"
                      className="glass-input dark:glass-input-dark w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all dark:text-white"
                    />
                    <input
                      type="number"
                      step="any"
                      value={formData.position[1]}
                      onChange={(e) => setFormData({...formData, position: [formData.position[0], parseFloat(e.target.value)]})}
                      placeholder="Longitude"
                      className="glass-input dark:glass-input-dark w-full rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all dark:text-white"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2 ml-1">Tip: Get coordinates from Google Maps by right-clicking a location.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                  <div className="relative">
                    <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="glass-input dark:glass-input-dark w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all appearance-none dark:text-white"
                    >
                      <option value="party">Party</option>
                      <option value="workshop">Workshop</option>
                      <option value="community">Community</option>
                      <option value="sports">Sports</option>
                      <option value="diving">Diving</option>
                      <option value="snorkeling">Snorkeling</option>
                      <option value="stay">Stay</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1">Recurring Event</label>
                  <div className="bg-white/30 dark:bg-white/5 rounded-[2rem] border border-white/20 dark:border-white/10 overflow-hidden backdrop-blur-sm">
                    {/* Recurrence Type Selector */}
                    <div className="flex p-1.5 bg-white/20 dark:bg-black/20 border-b border-white/10">
                      {['none', 'weekly', 'monthly', 'yearly'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({
                            ...formData, 
                            recurring: { ...formData.recurring, type: type as any }
                          })}
                          className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all ${
                            formData.recurring.type === type
                              ? 'bg-white dark:bg-slate-700 text-electric-blue dark:text-electric-blue-light shadow-lg'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}
                        >
                          {type === 'none' ? 'One-time' : type}
                        </button>
                      ))}
                    </div>

                    <div className="p-5 space-y-5">
                      <AnimatePresence mode="wait">
                        {formData.recurring.type === 'weekly' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            key="weekly"
                            className="space-y-3"
                          >
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Repeat on</label>
                            <div className="flex flex-wrap gap-2.5">
                              {DAYS_OF_WEEK.map(day => (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => {
                                    const days = formData.recurring.weeklyDays.includes(day)
                                      ? formData.recurring.weeklyDays.filter(d => d !== day)
                                      : [...formData.recurring.weeklyDays, day];
                                    setFormData({ ...formData, recurring: { ...formData.recurring, weeklyDays: days } });
                                  }}
                                  className={`w-11 h-11 rounded-2xl text-[10px] font-bold transition-all flex items-center justify-center ${
                                    formData.recurring.weeklyDays.includes(day)
                                      ? 'bg-electric-blue text-white shadow-lg shadow-electric-blue/20'
                                      : 'glass-card dark:glass-card-dark text-slate-500 dark:text-slate-400 border-white/20 dark:border-white/10'
                                  }`}
                                >
                                  {day.slice(0, 1)}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {formData.recurring.type === 'monthly' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            key="monthly"
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, recurring: { ...formData.recurring, monthlyOption: 'date' } })}
                                className={`py-3 px-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                  formData.recurring.monthlyOption === 'date'
                                    ? 'bg-electric-blue/10 border-electric-blue/50 text-electric-blue dark:text-electric-blue-light shadow-sm'
                                    : 'glass-card dark:glass-card-dark text-slate-500 dark:text-slate-400 border-white/20 dark:border-white/10'
                                }`}
                              >
                                Specific Date
                              </button>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, recurring: { ...formData.recurring, monthlyOption: 'dayOfWeek' } })}
                                className={`py-3 px-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                  formData.recurring.monthlyOption === 'dayOfWeek'
                                    ? 'bg-electric-blue/10 border-electric-blue/50 text-electric-blue dark:text-electric-blue-light shadow-sm'
                                    : 'glass-card dark:glass-card-dark text-slate-500 dark:text-slate-400 border-white/20 dark:border-white/10'
                                }`}
                              >
                                Day of Week
                              </button>
                            </div>

                            {formData.recurring.monthlyOption === 'date' ? (
                              <div className="flex items-center gap-3 bg-white/20 dark:bg-black/20 p-4 rounded-2xl border border-white/10">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Day</span>
                                <input 
                                  type="number" 
                                  min="1" 
                                  max="31"
                                  value={formData.recurring.monthlyDate}
                                  onChange={(e) => setFormData({ ...formData, recurring: { ...formData.recurring, monthlyDate: parseInt(e.target.value) } })}
                                  className="w-20 glass-input dark:glass-input-dark border-white/20 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 dark:text-white focus:outline-none"
                                />
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">of the month</span>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-2.5 bg-white/20 dark:bg-black/20 p-4 rounded-2xl border border-white/10">
                                <select
                                  value={formData.recurring.monthlyWeek}
                                  onChange={(e) => setFormData({ ...formData, recurring: { ...formData.recurring, monthlyWeek: parseInt(e.target.value) } })}
                                  className="glass-input dark:glass-input-dark border-white/20 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-white focus:outline-none"
                                >
                                  {WEEKS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                                </select>
                                <select
                                  value={formData.recurring.monthlyDay}
                                  onChange={(e) => setFormData({ ...formData, recurring: { ...formData.recurring, monthlyDay: e.target.value } })}
                                  className="glass-input dark:glass-input-dark border-white/20 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-white focus:outline-none"
                                >
                                  {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">of the month</span>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {formData.recurring.type === 'yearly' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            key="yearly"
                            className="flex items-center gap-3 bg-white/20 dark:bg-black/20 p-4 rounded-2xl border border-white/10"
                          >
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Every</span>
                            <select
                              value={formData.recurring.yearlyMonth}
                              onChange={(e) => setFormData({ ...formData, recurring: { ...formData.recurring, yearlyMonth: parseInt(e.target.value) } })}
                              className="glass-input dark:glass-input-dark border-white/20 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-white focus:outline-none"
                            >
                              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                            </select>
                            <input 
                              type="number" 
                              min="1" 
                              max="31"
                              value={formData.recurring.yearlyDay}
                              onChange={(e) => setFormData({ ...formData, recurring: { ...formData.recurring, yearlyDay: parseInt(e.target.value) } })}
                              className="w-20 glass-input dark:glass-input-dark border-white/20 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 dark:text-white focus:outline-none"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {formData.recurring.type !== 'none' && (
                        <div className="pt-5 border-t border-white/10 space-y-4">
                          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">End Recurrence</label>
                          <div className="grid grid-cols-1 gap-3">
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, recurring: { ...formData.recurring, endType: 'never' } })}
                              className={`flex items-center justify-between px-5 py-4 rounded-2xl border transition-all ${
                                formData.recurring.endType === 'never'
                                  ? 'bg-electric-blue/10 border-electric-blue/50 text-electric-blue dark:text-electric-blue-light shadow-sm'
                                  : 'bg-white/10 border-white/10 text-slate-600 dark:text-slate-400 hover:bg-white/20'
                              }`}
                            >
                              <span className="text-[10px] font-bold uppercase tracking-widest">Never Ends</span>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                formData.recurring.endType === 'never' ? 'border-electric-blue bg-electric-blue' : 'border-white/20'
                              }`}>
                                {formData.recurring.endType === 'never' && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                            </button>

                            <div className={`flex flex-col gap-4 px-5 py-4 rounded-2xl border transition-all ${
                              formData.recurring.endType === 'date'
                                ? 'bg-electric-blue/10 border-electric-blue/50 text-electric-blue dark:text-electric-blue-light shadow-sm'
                                : 'bg-white/10 border-white/10 text-slate-600 dark:text-slate-400 hover:bg-white/20'
                            }`}>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, recurring: { ...formData.recurring, endType: 'date' } })}
                                className="flex items-center justify-between w-full"
                              >
                                <span className="text-[10px] font-bold uppercase tracking-widest">Ends on Date</span>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  formData.recurring.endType === 'date' ? 'border-electric-blue bg-electric-blue' : 'border-white/20'
                                }`}>
                                  {formData.recurring.endType === 'date' && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </button>
                              {formData.recurring.endType === 'date' && (
                                <input 
                                  type="date"
                                  value={formData.recurring.endDate}
                                  onChange={(e) => setFormData({ ...formData, recurring: { ...formData.recurring, endDate: e.target.value } })}
                                  className="w-full glass-input dark:glass-input-dark border-electric-blue/30 rounded-xl px-4 py-2.5 text-xs font-bold text-electric-blue dark:text-electric-blue-light focus:outline-none dark:color-scheme-dark"
                                />
                              )}
                            </div>

                            <div className={`flex flex-col gap-4 px-5 py-4 rounded-2xl border transition-all ${
                              formData.recurring.endType === 'count'
                                ? 'bg-electric-blue/10 border-electric-blue/50 text-electric-blue dark:text-electric-blue-light shadow-sm'
                                : 'bg-white/10 border-white/10 text-slate-600 dark:text-slate-400 hover:bg-white/20'
                            }`}>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, recurring: { ...formData.recurring, endType: 'count' } })}
                                className="flex items-center justify-between w-full"
                              >
                                <span className="text-[10px] font-bold uppercase tracking-widest">Ends after occurrences</span>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  formData.recurring.endType === 'count' ? 'border-electric-blue bg-electric-blue' : 'border-white/20'
                                }`}>
                                  {formData.recurring.endType === 'count' && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              </button>
                              {formData.recurring.endType === 'count' && (
                                <div className="flex items-center gap-3">
                                  <input 
                                    type="number"
                                    min="1"
                                    value={formData.recurring.endCount}
                                    onChange={(e) => setFormData({ ...formData, recurring: { ...formData.recurring, endCount: parseInt(e.target.value) } })}
                                    className="w-24 glass-input dark:glass-input-dark border-electric-blue/30 rounded-xl px-4 py-2.5 text-sm font-bold text-electric-blue dark:text-electric-blue-light focus:outline-none"
                                  />
                                  <span className="text-[10px] font-bold text-electric-blue dark:text-electric-blue-light uppercase tracking-widest">Times</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Image URL (Optional)</label>
                  <div className="relative">
                    <ImageIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      placeholder="https://..."
                      className="glass-input dark:glass-input-dark w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all dark:text-white dark:placeholder-slate-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-electric-blue hover:bg-electric-blue-dark text-white font-bold py-4.5 rounded-[2rem] shadow-xl shadow-electric-blue/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] mt-6 border border-white/20 backdrop-blur-md uppercase tracking-widest text-xs"
                >
                  {isSubmitting ? (
                    editingEvent ? 'Updating Event...' : 'Creating Event...'
                  ) : (
                    editingEvent ? 'Update Event' : 'Publish Event'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmModal.isOpen}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmModal({ isOpen: false, id: '' })}
      />
    </div>
  );
}
