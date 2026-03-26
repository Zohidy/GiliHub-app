import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { Calendar as CalendarIcon, Plus, X, Clock, MapPin, User, Tag, Trash2, Image as ImageIcon, Map as MapIcon, List, Share2, RefreshCw, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { toast } from 'sonner';

// Fix Leaflet icons
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

const GILI_T_CENTER: [number, number] = [-8.3525, 116.0383];

function MapPicker({ onPick }: { onPick: (latlng: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function EventCalendar() {
  const { user, userData } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

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

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
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
    { id: 'sports', label: 'Sports', color: 'bg-blue-100 text-blue-600' },
    { id: 'diving', label: 'Diving', color: 'bg-sky-100 text-sky-600' },
    { id: 'snorkeling', label: 'Snorkeling', color: 'bg-cyan-100 text-cyan-600' },
    { id: 'stay', label: 'Stay', color: 'bg-indigo-100 text-indigo-600' },
    { id: 'other', label: 'Other', color: 'bg-slate-100 text-slate-600' }
  ];

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-slate-950 flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 px-4 py-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Event Calendar</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Discover what's happening in Gili</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-2.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
              title={viewMode === 'list' ? 'Switch to Map' : 'Switch to List'}
            >
              {viewMode === 'list' ? <MapIcon size={20} /> : <List size={20} />}
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-sky-600 text-white p-2.5 rounded-full hover:bg-sky-700 transition-all shadow-md active:scale-95"
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
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filterCategory === cat.id 
                  ? 'bg-sky-600 text-white shadow-sm' 
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700'
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
              className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full mb-4"
            />
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading events...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
          {viewMode === 'list' ? (
            <motion.div 
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full overflow-y-auto p-4 pb-24"
            >
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
                      className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col"
                    >
                      {event.imageUrl && (
                        <div className="h-40 w-full overflow-hidden relative">
                          <img 
                            src={event.imageUrl} 
                            alt={event.title} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-3 right-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                              categories.find(c => c.id === event.category)?.color || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {event.category}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="p-4">
                        {!event.imageUrl && (
                          <div className="flex justify-between items-start mb-2">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                              categories.find(c => c.id === event.category)?.color || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {event.category}
                            </span>
                          </div>
                        )}
                        
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{event.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">{event.description}</p>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <CalendarIcon size={14} className="text-sky-500" />
                            <span className="text-xs font-medium">{new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Clock size={14} className="text-sky-500" />
                            <span className="text-xs font-medium">{event.time}</span>
                          </div>
                          {event.recurring && event.recurring.type !== 'none' && (
                            <div className="flex flex-col gap-1 col-span-2 mt-1">
                              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                <RefreshCw size={14} className="animate-spin-slow" />
                                <span className="text-xs font-bold uppercase tracking-wider">
                                  Recurring: {event.recurring.type}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 ml-6 italic">
                                {event.recurring.type === 'weekly' && `Every ${event.recurring.weeklyDays?.join(', ')}`}
                                {event.recurring.type === 'monthly' && (
                                  event.recurring.monthlyOption === 'date' 
                                    ? `Every ${event.recurring.monthlyDate}${getOrdinal(event.recurring.monthlyDate)} of the month`
                                    : `Every ${WEEKS.find(w => w.value === event.recurring.monthlyWeek)?.label} ${event.recurring.monthlyDay} of the month`
                                )}
                                {event.recurring.type === 'yearly' && `Every year on ${MONTHS[event.recurring.yearlyMonth - 1]} ${event.recurring.yearlyDay}`}
                                {event.recurring.endType !== 'never' && (
                                  <>
                                    {' • '}
                                    Ends {event.recurring.endType === 'date' ? `on ${new Date(event.recurring.endDate).toLocaleDateString()}` : `after ${event.recurring.endCount} times`}
                                  </>
                                )}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 col-span-2">
                            <MapPin size={14} className="text-sky-500" />
                            <span className="text-xs font-medium truncate">{event.location}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                              <User size={12} className="text-sky-600 dark:text-sky-400" />
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">By {event.organizerName}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleShare(event)}
                              className="p-2 text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-full transition-colors"
                              title="Share Event"
                            >
                              <Share2 size={16} />
                            </button>
                            
                            {(user?.uid === event.organizerId || userData?.role === 'admin') && (
                              <>
                                <button 
                                  onClick={() => handleEditEvent(event)}
                                  className="p-2 text-amber-400 dark:text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-full transition-colors"
                                  title="Edit Event"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteEvent(event.id)}
                                  className="p-2 text-rose-400 dark:text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors"
                                  title="Delete Event"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="map"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full w-full"
            >
              <MapContainer 
                center={GILI_T_CENTER} 
                zoom={15} 
                className="w-full h-full z-0"
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredEvents.map(event => event.position && (
                  <Marker 
                    key={event.id} 
                    position={event.position as [number, number]}
                    icon={DefaultIcon}
                  >
                    <Popup>
                      <div className="p-1 min-w-[150px] dark:bg-slate-900 dark:text-white">
                        <h4 className="font-bold text-slate-800 dark:text-white">{event.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{event.date} at {event.time}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-2">{event.description}</p>
                        <button 
                          onClick={() => handleShare(event)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-lg text-[10px] font-bold hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
                        >
                          <Share2 size={12} /> Share Event
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>

    {/* Add Event Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 bg-white dark:bg-slate-900 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center z-10">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{editingEvent ? 'Edit Event' : 'Create New Event'}</h3>
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
              </div>

              <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Event Title</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Beach Clean Up"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:focus:border-sky-500 transition-all dark:text-white dark:placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="What's happening?"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:focus:border-sky-500 transition-all resize-none dark:text-white dark:placeholder-slate-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Date</label>
                    <input
                      required
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:focus:border-sky-500 transition-all dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Time</label>
                    <input
                      required
                      type="text"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      placeholder="e.g. 17:00 - End"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:focus:border-sky-500 transition-all dark:text-white dark:placeholder-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Location Name</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      required
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="e.g. North Beach"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:focus:border-sky-500 transition-all dark:text-white dark:placeholder-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Pin on Map (Click to set)</label>
                  <div className="h-40 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                    <MapContainer 
                      center={formData.position} 
                      zoom={14} 
                      className="h-full w-full z-0"
                      zoomControl={false}
                    >
                      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <MapPicker onPick={(pos) => setFormData({...formData, position: pos})} />
                      <Marker position={formData.position} icon={DefaultIcon} />
                    </MapContainer>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Category</label>
                  <div className="relative">
                    <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:focus:border-sky-500 transition-all appearance-none dark:text-white"
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
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">Recurring Event</label>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {/* Recurrence Type Selector */}
                    <div className="flex p-1 bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      {['none', 'weekly', 'monthly', 'yearly'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({
                            ...formData, 
                            recurring: { ...formData.recurring, type: type as any }
                          })}
                          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${
                            formData.recurring.type === type
                              ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                          }`}
                        >
                          {type === 'none' ? 'One-time' : type}
                        </button>
                      ))}
                    </div>

                    <div className="p-4 space-y-4">
                      <AnimatePresence mode="wait">
                        {formData.recurring.type === 'weekly' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            key="weekly"
                            className="space-y-3"
                          >
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Repeat on</label>
                            <div className="flex flex-wrap gap-2">
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
                                  className={`w-10 h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                                    formData.recurring.weeklyDays.includes(day)
                                      ? 'bg-sky-600 text-white shadow-md'
                                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700'
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
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, recurring: { ...formData.recurring, monthlyOption: 'date' } })}
                                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                  formData.recurring.monthlyOption === 'date'
                                    ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                              >
                                Specific Date
                              </button>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, recurring: { ...formData.recurring, monthlyOption: 'dayOfWeek' } })}
                                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                  formData.recurring.monthlyOption === 'dayOfWeek'
                                    ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                              >
                                Specific Day
                              </button>
                            </div>

                            {formData.recurring.monthlyOption === 'date' ? (
                              <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Day</span>
                                <input 
                                  type="number" 
                                  min="1" 
                                  max="31"
                                  value={formData.recurring.monthlyDate}
                                  onChange={(e) => setFormData({ ...formData, recurring: { ...formData.recurring, monthlyDate: parseInt(e.target.value) } })}
                                  className="w-16 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                />
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">of the month</span>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                <select
                                  value={formData.recurring.monthlyWeek}
                                  onChange={(e) => setFormData({ ...formData, recurring: { ...formData.recurring, monthlyWeek: parseInt(e.target.value) } })}
                                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 dark:text-white focus:outline-none"
                                >
                                  {WEEKS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                                </select>
                                <select
                                  value={formData.recurring.monthlyDay}
                                  onChange={(e) => setFormData({ ...formData, recurring: { ...formData.recurring, monthlyDay: e.target.value } })}
                                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 dark:text-white focus:outline-none"
                                >
                                  {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">of the month</span>
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
                            className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700"
                          >
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Every</span>
                            <select
                              value={formData.recurring.yearlyMonth}
                              onChange={(e) => setFormData({ ...formData, recurring: { ...formData.recurring, yearlyMonth: parseInt(e.target.value) } })}
                              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 dark:text-white focus:outline-none"
                            >
                              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                            </select>
                            <input 
                              type="number" 
                              min="1" 
                              max="31"
                              value={formData.recurring.yearlyDay}
                              onChange={(e) => setFormData({ ...formData, recurring: { ...formData.recurring, yearlyDay: parseInt(e.target.value) } })}
                              className="w-16 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {formData.recurring.type !== 'none' && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">End Recurrence</label>
                          <div className="grid grid-cols-1 gap-2">
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, recurring: { ...formData.recurring, endType: 'never' } })}
                              className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                                formData.recurring.endType === 'never'
                                  ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400'
                                  : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-600'
                              }`}
                            >
                              <span className="text-xs font-bold">Never Ends</span>
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                formData.recurring.endType === 'never' ? 'border-sky-500 bg-sky-500' : 'border-slate-200 dark:border-slate-600'
                              }`}>
                                {formData.recurring.endType === 'never' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </button>

                            <div className={`flex flex-col gap-3 px-4 py-3 rounded-xl border transition-all ${
                              formData.recurring.endType === 'date'
                                ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400'
                                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-600'
                            }`}>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, recurring: { ...formData.recurring, endType: 'date' } })}
                                className="flex items-center justify-between w-full"
                              >
                                <span className="text-xs font-bold">Ends on Date</span>
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  formData.recurring.endType === 'date' ? 'border-sky-500 bg-sky-500' : 'border-slate-200 dark:border-slate-600'
                                }`}>
                                  {formData.recurring.endType === 'date' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                              </button>
                              {formData.recurring.endType === 'date' && (
                                <input 
                                  type="date"
                                  value={formData.recurring.endDate}
                                  onChange={(e) => setFormData({ ...formData, recurring: { ...formData.recurring, endDate: e.target.value } })}
                                  className="w-full bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-lg px-3 py-2 text-xs font-bold text-sky-700 dark:text-sky-400 focus:outline-none dark:color-scheme-dark"
                                />
                              )}
                            </div>

                            <div className={`flex flex-col gap-3 px-4 py-3 rounded-xl border transition-all ${
                              formData.recurring.endType === 'count'
                                ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400'
                                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-600'
                            }`}>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, recurring: { ...formData.recurring, endType: 'count' } })}
                                className="flex items-center justify-between w-full"
                              >
                                <span className="text-xs font-bold">Ends after occurrences</span>
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  formData.recurring.endType === 'count' ? 'border-sky-500 bg-sky-500' : 'border-slate-200 dark:border-slate-600'
                                }`}>
                                  {formData.recurring.endType === 'count' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                              </button>
                              {formData.recurring.endType === 'count' && (
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="number"
                                    min="1"
                                    value={formData.recurring.endCount}
                                    onChange={(e) => setFormData({ ...formData, recurring: { ...formData.recurring, endCount: parseInt(e.target.value) } })}
                                    className="w-20 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-lg px-3 py-2 text-xs font-bold text-sky-700 dark:text-sky-400 focus:outline-none"
                                  />
                                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Times</span>
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
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Image URL (Optional)</label>
                  <div className="relative">
                    <ImageIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      placeholder="https://..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:focus:border-sky-500 transition-all dark:text-white dark:placeholder-slate-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-sky-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-sky-200 dark:shadow-none hover:bg-sky-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] mt-4"
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
    </div>
  );
}
