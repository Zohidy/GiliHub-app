import React, { useState, useEffect } from 'react';
import { 
  MapPin, Search, Navigation, Info, X, Star, 
  ExternalLink, Loader2, Plus, Filter, Compass, Share2
} from 'lucide-react';
import { collection, onSnapshot, query, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import ConfirmModal from '../ui/ConfirmModal';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import FavoriteButton from '../ui/FavoriteButton';

export default function InteractiveMap() {
  const { user, userData } = useAuth();
  const { t } = useLanguage();
  const { setBottomNavVisible } = useUI();
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, id: '' });

  const CATEGORIES = [
    { id: 'sunset', label: t('filter_sunset'), color: 'bg-orange-500', icon: '🌅' },
    { id: 'clinic', label: t('filter_clinic'), color: 'bg-rose-500', icon: '🏥' },
    { id: 'police', label: t('filter_police'), color: 'bg-electric-blue', icon: '👮' },
    { id: 'bike', label: t('filter_bike'), color: 'bg-emerald-500', icon: '🚲' },
    { id: 'snorkeling', label: t('filter_snorkeling'), color: 'bg-electric-blue/60', icon: '🤿' },
    { id: 'port', label: t('filter_port'), color: 'bg-slate-700', icon: '🚢' },
    { id: 'restaurant', label: t('filter_restaurant'), color: 'bg-amber-500', icon: '🍽️' },
    { id: 'diving', label: t('filter_diving'), color: 'bg-electric-blue', icon: '🤿' },
  ];

  const [formData, setFormData] = useState({
    name: '',
    type: 'sunset',
    desc: '',
    lat: -8.3525,
    lng: 116.0383
  });

  useEffect(() => {
    const q = query(collection(db, 'locations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLocations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'locations');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenInGoogleMaps = (lat: number, lng: number, name: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const handleShare = (loc: any) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
    if (navigator.share) {
      navigator.share({
        title: loc.name,
        text: loc.desc,
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'locations'), {
        ...formData,
        createdBy: user.uid,
        createdAt: new Date().toISOString()
      });
      toast.success('Location added successfully');
      setIsAddingMode(false);
      setFormData({ name: '', type: 'sunset', desc: '', lat: -8.3525, lng: 116.0383 });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'locations');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, 'locations', deleteConfirmModal.id));
      toast.success('Location removed');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `locations/${deleteConfirmModal.id}`);
    } finally {
      setDeleteConfirmModal({ isOpen: false, id: '' });
    }
  };

  const filteredLocations = locations.filter(loc => {
    const matchesSearch = loc.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         loc.desc?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || loc.type === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-full w-full bg-mesh flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Header */}
      <div className="glass dark:glass-dark px-6 py-6 sticky top-0 z-10 shadow-lg border-b border-white/40 dark:border-white/10 backdrop-blur-xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-slate-900 dark:text-white tracking-tight uppercase">{t('map')}</h2>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Navigate Gili with Google Maps</p>
          </div>
          {userData?.role === 'admin' && (
            <button 
              onClick={() => setIsAddingMode(true)}
              className="bg-electric-blue hover:bg-electric-blue-dark text-white p-3 rounded-2xl transition-all shadow-lg shadow-electric-blue/20 active:scale-95"
            >
              <Plus size={20} />
            </button>
          )}
        </div>

        {/* Search & Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder={t('search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/50 dark:bg-slate-900/50 border border-white/40 dark:border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all dark:text-white"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button 
              onClick={() => setActiveCategory('all')}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
                activeCategory === 'all' 
                  ? 'bg-electric-blue text-white border-electric-blue shadow-md' 
                  : 'glass dark:glass-dark text-slate-500 dark:text-slate-400 border-white/40 dark:border-white/10'
              }`}
            >
              {t('filter_all')}
            </button>
            {CATEGORIES.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border flex items-center gap-2 ${
                  activeCategory === cat.id 
                    ? 'bg-electric-blue text-white border-electric-blue shadow-md' 
                    : 'glass dark:glass-dark text-slate-500 dark:text-slate-400 border-white/40 dark:border-white/10'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-electric-blue mb-4" size={40} />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('loading')}</p>
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Compass size={40} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-display font-semibold text-slate-900 dark:text-white tracking-tight">No spots found</h3>
            <p className="text-xs text-slate-500 mt-2 font-medium">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredLocations.map((loc, idx) => {
              const category = CATEGORIES.find(c => c.id === loc.type);
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={loc.id}
                  className="glass dark:glass-dark rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-lg flex flex-col gap-4 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${category?.color || 'bg-slate-500'} text-white shadow-md text-2xl`}>
                        {category?.icon || '📍'}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight leading-none mb-1">{loc.name}</h4>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{category?.label}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <FavoriteButton targetId={loc.id} targetType="location" className="!bg-transparent !p-1" />
                      <button 
                        onClick={() => handleShare(loc)}
                        className="p-2 text-slate-400 hover:text-electric-blue transition-all"
                      >
                        <Share2 size={18} />
                      </button>
                      {userData?.role === 'admin' && (
                        <button 
                          onClick={() => setDeleteConfirmModal({ isOpen: true, id: loc.id })}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{loc.desc}</p>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => handleOpenInGoogleMaps(loc.lat, loc.lng, loc.name)}
                      className="flex-1 bg-electric-blue hover:bg-electric-blue-dark text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-electric-blue/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Navigation size={14} />
                      {t('navigate')}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Location Modal */}
      <AnimatePresence>
        {isAddingMode && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass dark:glass-dark w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/40 dark:border-white/10"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-display font-semibold text-slate-900 dark:text-white tracking-tight uppercase">Add New Spot</h3>
                  <button onClick={() => setIsAddingMode(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X size={24} /></button>
                </div>

                <form onSubmit={handleAddLocation} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Name</label>
                    <input 
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white/50 dark:bg-slate-900/50 border border-white/40 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Category</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full bg-white/50 dark:bg-slate-900/50 border border-white/40 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                    >
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Latitude</label>
                      <input 
                        type="number" step="any"
                        value={formData.lat}
                        onChange={(e) => setFormData({...formData, lat: parseFloat(e.target.value)})}
                        className="w-full bg-white/50 dark:bg-slate-900/50 border border-white/40 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Longitude</label>
                      <input 
                        type="number" step="any"
                        value={formData.lng}
                        onChange={(e) => setFormData({...formData, lng: parseFloat(e.target.value)})}
                        className="w-full bg-white/50 dark:bg-slate-900/50 border border-white/40 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Description</label>
                    <textarea 
                      value={formData.desc}
                      onChange={(e) => setFormData({...formData, desc: e.target.value})}
                      className="w-full bg-white/50 dark:bg-slate-900/50 border border-white/40 dark:border-white/10 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all"
                      rows={3}
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-electric-blue hover:bg-electric-blue-dark text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-electric-blue/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Save Location'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={deleteConfirmModal.isOpen}
        title="Remove Location"
        message="Are you sure you want to remove this location?"
        confirmText="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmModal({ isOpen: false, id: '' })}
      />
    </div>
  );
}
