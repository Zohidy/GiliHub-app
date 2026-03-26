import React, { useState, useEffect } from 'react';
import { Ship, Bike, Fish, Clock, MapPin, ChevronRight, AlertCircle, Plus, X, Edit2, Loader2, Trash2, Home as HomeIcon, Users, Waves } from 'lucide-react';
import { collection, onSnapshot, addDoc, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { toast } from 'sonner';

// Mapping string icon name to actual Lucide component
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Ship': return Ship;
    case 'Bike': return Bike;
    case 'Fish': return Fish;
    case 'Diving': return Waves;
    case 'Home': return HomeIcon;
    default: return MapPin;
  }
};

export default function BookingList() {
  const { user, userData } = useAuth();
  const [bookingItems, setBookingItems] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [isBooking, setIsBooking] = useState<any | null>(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingGuests, setBookingGuests] = useState(1);
  const [bookingTime, setBookingTime] = useState('09:00');
  
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
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookingItems');
      setIsLoading(false);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'bookings'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((b: any) => b.userId === user.uid || b.providerId === user.uid);
      setMyBookings(bookings);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await deleteDoc(doc(db, 'bookingItems', id));
      toast.success('Service deleted successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `bookingItems/${id}`);
      toast.error('Failed to delete service');
    }
  };

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
        toast.success('Service updated successfully');
      } else {
        await addDoc(collection(db, 'bookingItems'), {
          ...formData,
          provider: user.displayName || 'Provider',
          providerId: user.uid,
        });
        toast.success('Service added successfully');
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
      toast.error(editingItem ? 'Failed to update service' : 'Failed to add service');
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

  const handleBookNow = async () => {
    if (!user || !isBooking) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'bookings'), {
        serviceId: isBooking.id,
        serviceTitle: isBooking.title,
        userId: user.uid,
        userName: user.displayName || 'User',
        date: bookingDate,
        time: bookingTime,
        guests: bookingGuests,
        status: 'pending',
        createdAt: new Date().toISOString(),
        providerId: isBooking.providerId
      });
      toast.success('Booking request sent successfully!');
      setIsBooking(null);
      setShowConfirmModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bookings');
      toast.error('Failed to send booking request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: newStatus
      });
      toast.success(`Booking ${newStatus}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
      toast.error('Failed to update booking status');
    }
  };

  const canAddService = userData?.role === 'admin' || userData?.role === 'provider';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
      case 'cancelled': return 'text-rose-600 bg-rose-50 dark:bg-rose-900/20';
      default: return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
    }
  };

  const featuredActivities = [
    {
      title: 'Subwinging Experience',
      desc: 'Fly underwater! A unique "Zen" experience being pulled by a boat.',
      price: 'Contact for Price',
      icon: Fish,
      color: 'bg-indigo-500'
    },
    {
      title: 'Ekajaya Fast Boat',
      desc: 'Reliable transport from Padang Bai to Gili T. Includes boarding pass.',
      price: '725k IDR',
      icon: Ship,
      color: 'bg-blue-600'
    },
    {
      title: 'Villa Amarik',
      desc: 'Luxury stay with private pool and beachfront access.',
      price: 'From 2M IDR',
      icon: HomeIcon,
      color: 'bg-emerald-500'
    },
    {
      title: 'Mad Monkey Hostel',
      desc: 'The ultimate party hostel with pool parties and social events.',
      price: 'From 250k IDR',
      icon: Users,
      color: 'bg-rose-500'
    },
    {
      title: 'Manta Dive Fun Dive',
      desc: 'Explore the underwater world with professional guides.',
      price: 'From 500k IDR',
      icon: Waves,
      color: 'bg-sky-500'
    },
    {
      title: 'Bicycle Rental',
      desc: 'The best way to get around the island. No engines allowed!',
      price: '50k IDR / Day',
      icon: Bike,
      color: 'bg-amber-500'
    }
  ];

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
            className="bg-sky-600 text-white p-2.5 rounded-2xl shadow-lg shadow-sky-600/20 hover:bg-sky-700 transition-all active:scale-90"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      {/* My Bookings Section */}
      {user && myBookings.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            My Bookings
          </h3>
          <div className="space-y-3">
            {myBookings.map((booking) => (
              <div key={booking.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{booking.serviceTitle}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{booking.date} at {booking.time} • {booking.guests} guests</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </div>
                  {booking.providerId === user.uid && booking.status === 'pending' && (
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                        className="text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-2 py-1 rounded-lg transition-colors"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                        className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2 py-1 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {booking.userId === user.uid && booking.status === 'pending' && (
                    <button 
                      onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                      className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-2 py-1 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Section */}
      <div className="mb-8">
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-sky-500 rounded-full"></span>
          Featured Activities
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {featuredActivities.map((activity, index) => (
            <div key={index} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex gap-4 mb-4">
                <div className={`${activity.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-current/20`}>
                  <activity.icon size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{activity.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{activity.desc}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-slate-900 dark:text-white">{activity.price}</span>
                <button className="text-sky-600 dark:text-sky-400 text-xs font-bold hover:underline">Learn More</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
        Available Services
      </h3>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-sky-600 mb-4" size={40} />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading services...</p>
        </div>
      ) : isOffline && bookingItems.length === 0 ? (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center">
          <AlertCircle className="mx-auto text-amber-500 mb-3" size={32} />
          <h4 className="text-amber-800 dark:text-amber-200 font-bold">You're Offline</h4>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">We couldn't load the services. Please check your connection.</p>
        </div>
      ) : bookingItems.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 flex flex-col items-center shadow-sm">
          <AlertCircle size={40} className="text-slate-300 dark:text-slate-700 mb-4" />
          <p className="font-bold text-slate-700 dark:text-slate-200">No services available</p>
          <p className="text-sm mt-1">Check back later for new bookings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookingItems.map((item) => {
            const Icon = getIconComponent(item.icon);
            const colorClass = item.color || 'bg-slate-500';
            const textColorClass = colorClass.replace('bg-', 'text-');
            
            return (
              <div 
                key={item.id} 
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between"
              >
                <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${colorClass} opacity-[0.03] blur-2xl group-hover:opacity-[0.08] transition-opacity`} />
                
                <div className="flex items-start gap-4">
                  <div className={`${colorClass} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-current/20 shrink-0 transform group-hover:scale-105 transition-transform duration-300`}>
                    <Icon size={28} strokeWidth={2.5} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${textColorClass} opacity-80`}>
                        {item.type}
                      </span>
                      {(userData?.role === 'admin' || (userData?.role === 'provider' && item.providerId === user?.uid)) && (
                        <div className="flex gap-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(item);
                            }}
                            className="p-2 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                            title="Edit Service"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                            title="Delete Service"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {item.title}
                    </h3>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Price</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">{item.price}</span>
                  </div>
                  
                  <button 
                    onClick={() => setIsBooking(item)}
                    className="bg-sky-600 hover:bg-sky-700 text-white py-3 px-6 rounded-2xl font-bold text-sm shadow-lg shadow-sky-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 group/btn"
                  >
                    Book
                    <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      {isBooking && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Book {isBooking.title}</h3>
              <button 
                onClick={() => setIsBooking(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); setShowConfirmModal(true); }}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input 
                    type="date" 
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time</label>
                    <input 
                      type="time" 
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Guests</label>
                    <input 
                      type="number" 
                      value={bookingGuests}
                      onChange={(e) => setBookingGuests(parseInt(e.target.value))}
                      min="1"
                      max="20"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-200"
                      required
                    />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500 dark:text-slate-400">Price per person</span>
                    <span className="font-bold text-slate-900 dark:text-white">{isBooking.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Provider</span>
                    <span className="font-bold text-slate-900 dark:text-white">{isBooking.provider}</span>
                  </div>
                </div>
              </div>
              
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-sky-600 text-white font-bold py-3 rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Review Booking
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && isBooking && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Confirm Your Booking</h3>
            
            <div className="space-y-3 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Service</span>
                <span className="font-bold text-slate-900 dark:text-white text-right">{isBooking.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Date</span>
                <span className="font-bold text-slate-900 dark:text-white">{bookingDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Time</span>
                <span className="font-bold text-slate-900 dark:text-white">{bookingTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Guests</span>
                <span className="font-bold text-slate-900 dark:text-white">{bookingGuests}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Price per person</span>
                <span className="font-bold text-slate-900 dark:text-white">{isBooking.price}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button 
                onClick={handleBookNow}
                disabled={isSubmitting}
                className="flex-1 bg-sky-600 text-white font-bold py-3 rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Confirm'}
              </button>
            </div>
          </div>
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
                      if (type === 'Diving') { icon = 'Diving'; color = 'bg-sky-500'; }
                      if (type === 'Stay') { icon = 'Home'; color = 'bg-indigo-500'; }
                      setFormData({...formData, type, icon, color});
                    }}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Fast Boat">Fast Boat</option>
                    <option value="Bike Rental">Bike Rental</option>
                    <option value="Snorkeling Trip">Snorkeling Trip</option>
                    <option value="Diving">Diving</option>
                    <option value="Stay">Stay</option>
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
                className="w-full bg-sky-600 text-white font-bold py-3 rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Saving...
                  </>
                ) : 'Save Service'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
