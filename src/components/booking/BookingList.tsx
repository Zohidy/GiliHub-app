import React, { useState, useEffect } from 'react';
import { Ship, Bike, Fish, Clock, MapPin, ChevronRight, AlertCircle, Plus, X, Edit2 } from 'lucide-react';
import { collection, onSnapshot, addDoc, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';

// Mapping string icon name to actual Lucide component
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Ship': return Ship;
    case 'Bike': return Bike;
    case 'Fish': return Fish;
    default: return MapPin;
  }
};

export default function BookingList() {
  const { user, userData } = useAuth();
  const [bookingItems, setBookingItems] = useState<any[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'Fast Boat',
    title: '',
    time: '',
    price: '',
    icon: 'Ship',
    color: 'bg-blue-500'
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const q = query(collection(db, 'bookingItems'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookingItems(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookingItems');
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      if (editingItem) {
        const itemRef = doc(db, 'bookingItems', editingItem.id);
        await updateDoc(itemRef, {
          ...formData
        });
      } else {
        await addDoc(collection(db, 'bookingItems'), {
          ...formData,
          provider: user.displayName || 'Provider',
          providerId: user.uid,
        });
      }
      setIsCreating(false);
      setEditingItem(null);
      setFormData({
        type: 'Fast Boat',
        title: '',
        time: '',
        price: '',
        icon: 'Ship',
        color: 'bg-blue-500'
      });
    } catch (error) {
      handleFirestoreError(error, editingItem ? OperationType.UPDATE : OperationType.CREATE, 'bookingItems');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      title: item.title,
      time: item.time,
      price: item.price,
      icon: item.icon,
      color: item.color
    });
    setIsCreating(true);
  };

  const canAddService = userData?.role === 'admin' || userData?.role === 'provider';

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 pb-24 relative transition-colors duration-300">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Booking</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Book tickets and activities directly from your phone.</p>
        </div>
        {canAddService && (
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-sky-600 text-white p-2 rounded-full shadow-md hover:bg-sky-700 transition-colors"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      {/* Offline Warning Banner */}
      {isOffline && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-6 flex items-start gap-3">
          <div className="bg-amber-100 dark:bg-amber-800 p-1.5 rounded-full text-amber-600 dark:text-amber-400 mt-0.5">
            <Clock size={16} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">Offline Mode Active</h4>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">The schedule below is the last cached version. Bookings will be sent automatically when the signal returns.</p>
          </div>
        </div>
      )}

      {bookingItems.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 flex flex-col items-center">
          <AlertCircle size={32} className="text-slate-300 dark:text-slate-700 mb-2" />
          <p>No services available at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookingItems.map((item) => {
            const Icon = getIconComponent(item.icon);
            const colorClass = item.color || 'bg-slate-500';
            const textColorClass = colorClass.replace('bg-', 'text-');

            return (
              <div 
                key={item.id} 
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all group relative overflow-hidden"
              >
                {/* Subtle background pattern/glow */}
                <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${colorClass} opacity-[0.03] blur-2xl group-hover:opacity-[0.08] transition-opacity`} />
                
                <div className="flex items-start gap-5">
                  <div className={`${colorClass} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-current/20 shrink-0 transform group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={28} strokeWidth={2.5} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${textColorClass} opacity-80`}>
                        {item.type}
                      </span>
                      {(userData?.role === 'admin' || (userData?.role === 'provider' && item.providerId === user?.uid)) && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(item);
                          }}
                          className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-full transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-extrabold text-slate-800 dark:text-white leading-tight mb-2 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {item.title}
                    </h3>
                    
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        <Clock size={14} className="text-slate-400 dark:text-slate-500" />
                        <span>{item.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        <MapPin size={14} className="text-slate-400 dark:text-slate-500" />
                        <span className="truncate max-w-[120px]">{item.provider}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Price</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">{item.price}</span>
                  </div>
                  
                  <button className="flex-1 bg-sky-600 hover:bg-sky-700 text-white py-3 px-6 rounded-2xl font-bold text-sm shadow-lg shadow-sky-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 group/btn">
                    Book Now
                    <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Booking Item Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 animate-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingItem ? 'Edit Service' : 'Add Service'}</h3>
              <button 
                onClick={() => {
                  setIsCreating(false);
                  setEditingItem(null);
                  setFormData({
                    type: 'Fast Boat',
                    title: '',
                    time: '',
                    price: '',
                    icon: 'Ship',
                    color: 'bg-blue-500'
                  });
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreate}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => {
                      const type = e.target.value;
                      let icon = 'Ship';
                      let color = 'bg-blue-500';
                      if (type === 'Bike Rental') { icon = 'Bike'; color = 'bg-emerald-500'; }
                      if (type === 'Snorkeling Trip') { icon = 'Fish'; color = 'bg-orange-500'; }
                      setFormData({...formData, type, icon, color});
                    }}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Fast Boat">Fast Boat</option>
                    <option value="Bike Rental">Bike Rental</option>
                    <option value="Snorkeling Trip">Snorkeling Trip</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Service Name</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Example: Mountain Bike Rental"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time / Duration</label>
                  <input 
                    type="text" 
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    placeholder="Example: 24 Hours or 09:00 AM"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price</label>
                  <input 
                    type="text" 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="Example: $50"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>
              </div>
              
              <button 
                type="submit"
                disabled={isSubmitting || !formData.title || !formData.time || !formData.price}
                className="w-full bg-sky-600 text-white font-bold py-3 rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save Service'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
