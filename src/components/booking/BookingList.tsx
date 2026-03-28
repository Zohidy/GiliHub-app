import React, { useState, useEffect } from 'react';
import { Ship, Bike, Fish, Clock, MapPin, ChevronRight, AlertCircle, Plus, X, Edit2, Loader2, Trash2, Home as HomeIcon, Users, Waves, DollarSign, CreditCard, Star, Calendar, ArrowRight } from 'lucide-react';
import { collection, onSnapshot, addDoc, query, orderBy, doc, updateDoc, deleteDoc, where, or } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { toast } from 'sonner';
import { useUI } from '../../contexts/UIContext';
import ConfirmModal from '../ui/ConfirmModal';
import { getExchangeRates } from '../../services/apiServices';

// Stripe Publishable Key
const STRIPE_KEY = (import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY;

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

// Currency Converter Component
const CurrencyConverter = () => {
  const [rates, setRates] = useState<any>(null);
  const [amount, setAmount] = useState<number>(100000);
  const [targetCurrency, setTargetCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      const data = await getExchangeRates('IDR');
      if (data && data.conversion_rates) {
        setRates(data.conversion_rates);
      }
      setLoading(false);
    };
    fetchRates();
  }, []);

  const convert = () => {
    if (!rates || !rates[targetCurrency]) return 0;
    return (amount * rates[targetCurrency]).toFixed(2);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass dark:glass-dark rounded-[2.5rem] p-8 border-0 shadow-2xl mb-12 overflow-hidden relative group"
    >
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full group-hover:bg-emerald-500/20 transition-all duration-1000" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-electric-blue/10 blur-[100px] rounded-full group-hover:bg-electric-blue/20 transition-all duration-1000" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner border border-emerald-500/20">
            <DollarSign size={24} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-widest">Currency Hub</h3>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mt-0.5">Real-time IDR conversion</p>
          </div>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest animate-pulse">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Amount (IDR)</label>
          <div className="relative">
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="glass-input dark:glass-input-dark w-full rounded-2xl px-6 py-4 text-sm font-black focus:outline-none dark:text-white transition-all hover:bg-white/40 dark:hover:bg-slate-900/40"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">IDR</div>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Target Currency</label>
          <div className="relative">
            <select 
              value={targetCurrency}
              onChange={(e) => setTargetCurrency(e.target.value)}
              className="glass-input dark:glass-input-dark w-full rounded-2xl px-6 py-4 text-sm font-black focus:outline-none dark:text-white appearance-none cursor-pointer transition-all hover:bg-white/40 dark:hover:bg-slate-900/40"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="SGD">SGD - Singapore Dollar</option>
              <option value="MYR">MYR - Malaysian Ringgit</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ChevronRight size={16} className="rotate-90" />
            </div>
          </div>
        </div>
      </div>

      <motion.div 
        layout
        className="mt-8 p-6 bg-gradient-to-r from-emerald-500/10 to-electric-blue/10 dark:from-emerald-500/5 dark:to-electric-blue/5 rounded-[2rem] flex items-center justify-between border border-white/20 dark:border-white/10 relative z-10 shadow-inner"
      >
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">Estimated Value</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
            {loading ? <Loader2 size={24} className="animate-spin text-emerald-500" /> : `${convert()} ${targetCurrency}`}
          </span>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/50 dark:bg-black/20 flex items-center justify-center text-emerald-500 shadow-sm border border-white/20">
          <DollarSign size={24} />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function BookingList() {
  const { user, userData } = useAuth();
  const { setBottomNavVisible } = useUI();
  const [bookingItems, setBookingItems] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{isOpen: boolean, id: string}>({ isOpen: false, id: '' });
  
  const [isBooking, setIsBooking] = useState<any | null>(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingGuests, setBookingGuests] = useState(1);
  const [bookingTime, setBookingTime] = useState('09:00');
  const [paymentStep, setPaymentStep] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'Fast Boat',
    title: '',
    time: '',
    price: '',
    icon: 'Ship',
    color: 'bg-electric-blue'
  });

  useEffect(() => {
    if (isBooking || isCreating || showConfirmModal) {
      setBottomNavVisible(false);
    } else {
      setBottomNavVisible(true);
    }
    return () => setBottomNavVisible(true);
  }, [isBooking, isCreating, showConfirmModal]);

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

    // If admin, can see all bookings. Otherwise, only their own or their provided services.
    if (userData?.role === 'admin') {
      const q = query(
        collection(db, 'bookings'),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMyBookings(bookings);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'bookings');
      });
      return () => unsubscribe();
    } else {
      // Use two separate queries to avoid Firestore security rules issues with OR queries
      const qUser = query(
        collection(db, 'bookings'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const qProvider = query(
        collection(db, 'bookings'),
        where('providerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      let userBookings: any[] = [];
      let providerBookings: any[] = [];

      const updateBookings = () => {
        // Merge and sort by createdAt desc
        const merged = [...userBookings, ...providerBookings];
        // Remove duplicates (in case user is both customer and provider for the same booking)
        const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
        unique.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        setMyBookings(unique);
      };

      const unsubUser = onSnapshot(qUser, (snapshot) => {
        userBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateBookings();
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'bookings/user');
      });

      const unsubProvider = onSnapshot(qProvider, (snapshot) => {
        providerBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateBookings();
      }, (error) => {
        // It's okay if provider query fails for non-providers, but we log it just in case
        console.error("Provider bookings fetch error:", error);
      });

      return () => {
        unsubUser();
        unsubProvider();
      };
    }
  }, [user, userData]);

  const handleDelete = (id: string) => {
    setDeleteConfirmModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    const id = deleteConfirmModal.id;
    setDeleteConfirmModal({ isOpen: false, id: '' });
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
        color: 'bg-electric-blue'
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

    setIsPaying(true);
    // Simulate Stripe Payment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
        status: 'confirmed', // Auto-confirm after payment
        paymentStatus: 'paid',
        amount: isBooking.price,
        createdAt: new Date().toISOString(),
        providerId: isBooking.providerId
      });
      toast.success('Payment successful! Booking confirmed.');
      setIsBooking(null);
      setShowConfirmModal(false);
      setPaymentStep(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bookings');
      toast.error('Failed to process booking');
    } finally {
      setIsSubmitting(false);
      setIsPaying(false);
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
      color: 'bg-electric-blue'
    },
    {
      title: 'Ekajaya Fast Boat',
      desc: 'Reliable transport from Padang Bai to Gili T. Includes boarding pass.',
      price: '725k IDR',
      icon: Ship,
      color: 'bg-electric-blue'
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
      color: 'bg-electric-blue'
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
    <div className="h-full w-full overflow-y-auto bg-mesh p-4 pb-32 relative transition-colors duration-300 no-scrollbar">
      <div className="mb-10 flex justify-between items-end relative z-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Booking</h2>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Direct tickets & activities</p>
        </div>
        {canAddService && (
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-electric-blue/90 hover:bg-electric-blue text-white p-3.5 rounded-[1.5rem] shadow-xl shadow-electric-blue/20 transition-all active:scale-90 border border-white/20 backdrop-blur-md"
          >
            <Plus size={24} />
          </button>
        )}
      </div>

      {/* My Bookings Section */}
      {user && myBookings.length > 0 && (
        <div className="mb-14 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-2 h-8 bg-electric-blue rounded-full shadow-[0_0_20px_rgba(51,106,255,0.8)]"></div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-[0.25em]">
                  My Bookings
                </h3>
                <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Your upcoming island adventures</p>
              </div>
            </div>
          </div>
          <div className="space-y-5">
            <AnimatePresence mode="popLayout">
              {myBookings.map((booking, idx) => (
                <motion.div 
                  key={booking.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass dark:glass-dark rounded-[2.5rem] p-6 border border-white/30 dark:border-white/10 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between group hover:shadow-electric-blue/10 transition-all duration-500 relative overflow-hidden"
                >
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-electric-blue/5 blur-3xl rounded-full group-hover:bg-electric-blue/10 transition-all duration-700" />
                  
                  <div className="flex items-center gap-6 relative z-10 w-full sm:w-auto">
                    <div className="w-16 h-16 rounded-[1.75rem] bg-electric-blue/10 dark:bg-electric-blue/20 flex items-center justify-center text-electric-blue dark:text-electric-blue-light shadow-inner border border-electric-blue/20 group-hover:scale-110 transition-transform duration-500">
                      <Calendar size={28} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="font-black text-slate-900 dark:text-white text-base tracking-tight">{booking.serviceTitle}</h4>
                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/20 ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          <Calendar size={12} className="text-electric-blue" />
                          <span>{booking.date}</span>
                        </div>
                        <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          <Clock size={12} className="text-electric-blue" />
                          <span>{booking.time}</span>
                        </div>
                        <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          <Users size={12} className="text-electric-blue" />
                          <span>{booking.guests} Guests</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-6 sm:mt-0 gap-4 relative z-10 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/10">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Total Paid</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">{booking.amount}</p>
                    </div>
                    
                    {booking.providerId === user.uid && booking.status === 'pending' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                          className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-5 py-2.5 rounded-2xl transition-all uppercase tracking-widest border border-emerald-500/20 active:scale-95"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                          className="text-[9px] font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-5 py-2.5 rounded-2xl transition-all uppercase tracking-widest border border-rose-500/20 active:scale-95"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    
                    {booking.status === 'confirmed' && (
                      <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400">
                        <span className="text-[9px] font-black uppercase tracking-widest">Ready to go</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Currency Converter */}
      <CurrencyConverter />

      {/* Featured Section */}
      <div className="mb-16 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-2 h-8 bg-electric-blue rounded-full shadow-[0_0_20px_rgba(1,69,242,0.8)]"></div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-[0.25em]">
                Featured Activities
              </h3>
              <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Handpicked experiences for you</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredActivities.map((activity, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass dark:glass-dark rounded-[3rem] p-8 border border-white/30 dark:border-white/10 shadow-2xl flex flex-col justify-between group hover:scale-[1.03] transition-all duration-700 overflow-hidden relative"
            >
              <div className={`absolute -right-16 -top-16 w-48 h-48 ${activity.color} opacity-[0.05] blur-[80px] rounded-full group-hover:opacity-[0.15] transition-all duration-1000`} />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className={`${activity.color} w-16 h-16 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-current/30 group-hover:rotate-[15deg] group-hover:scale-110 transition-all duration-700 border border-white/30`}>
                    <activity.icon size={32} strokeWidth={2.5} />
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star size={14} fill="currentColor" />
                    <span className="text-[10px] font-black">4.9</span>
                  </div>
                </div>
                
                <h4 className="font-black text-slate-900 dark:text-white text-xl tracking-tight mb-3 group-hover:text-electric-blue dark:group-hover:text-electric-blue-light transition-colors duration-500">{activity.title}</h4>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-8 line-clamp-3 opacity-80 group-hover:opacity-100 transition-opacity">
                  {activity.desc}
                </p>
              </div>

              <div className="flex items-center justify-between relative z-10 pt-6 border-t border-white/10">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Price</span>
                  <span className="text-base font-black text-slate-900 dark:text-white tracking-tight">{activity.price}</span>
                </div>
                <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/10 dark:shadow-white/5 flex items-center gap-2 group/btn">
                  Explore
                  <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Available Services Section */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-2 h-8 bg-slate-400 rounded-full shadow-[0_0_20px_rgba(148,163,184,0.6)]"></div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-[0.25em]">
              Available Services
            </h3>
            <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Browse all available island services</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 relative z-10">
          <div className="w-24 h-24 rounded-[3rem] glass dark:glass-dark flex items-center justify-center mb-8 shadow-2xl border border-white/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-electric-blue/10 animate-pulse" />
            <Loader2 className="animate-spin text-electric-blue dark:text-electric-blue-light relative z-10" size={40} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-slate-900 dark:text-white text-sm font-black uppercase tracking-[0.3em]">Syncing Data</p>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">Connecting to island servers...</p>
          </div>
        </div>
      ) : isOffline && bookingItems.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass dark:glass-dark border border-amber-500/40 rounded-[3rem] p-12 text-center relative z-10 shadow-2xl overflow-hidden"
        >
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full" />
          <div className="w-20 h-20 rounded-[2.5rem] bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto mb-8 shadow-inner border border-amber-500/20">
            <AlertCircle size={40} />
          </div>
          <h4 className="text-amber-800 dark:text-amber-200 font-black uppercase tracking-tight text-xl mb-3">Connection Lost</h4>
          <p className="text-sm text-amber-700/70 dark:text-amber-400/70 max-w-xs mx-auto font-medium leading-relaxed">We're having trouble reaching the island. Please check your internet connection and try again.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 px-8 py-3.5 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
          >
            Retry Connection
          </button>
        </motion.div>
      ) : bookingItems.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24 glass dark:glass-dark rounded-[3rem] border border-white/30 dark:border-white/10 text-slate-500 dark:text-slate-400 flex flex-col items-center shadow-2xl relative z-10 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-500/5 to-transparent" />
          <div className="w-24 h-24 rounded-[3rem] bg-slate-500/5 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-8 shadow-inner border border-white/10 relative z-10">
            <MapPin size={48} strokeWidth={1.5} />
          </div>
          <div className="relative z-10">
            <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xl mb-2">Quiet on the Island</p>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto">No services are currently listed. Check back soon for new island adventures!</p>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <AnimatePresence mode="popLayout">
            {bookingItems.map((item, idx) => {
              const Icon = getIconComponent(item.icon);
              const colorClass = item.color || 'bg-slate-500';
              const textColorClass = colorClass.replace('bg-', 'text-');
              
              return (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass dark:glass-dark rounded-[3rem] p-8 shadow-2xl border border-white/30 dark:border-white/10 hover:shadow-electric-blue/20 transition-all duration-700 group relative overflow-hidden flex flex-col justify-between h-full"
                >
                  <div className={`absolute -right-12 -top-12 w-48 h-48 rounded-full ${colorClass} opacity-[0.03] blur-[80px] group-hover:opacity-[0.12] transition-all duration-1000`} />
                  
                  <div>
                    <div className="flex items-start justify-between mb-8">
                      <div className={`${colorClass} w-20 h-20 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-current/30 shrink-0 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 border border-white/30`}>
                        <Icon size={40} strokeWidth={2.5} />
                      </div>
                      
                      {(userData?.role === 'admin' || (userData?.role === 'provider' && item.providerId === user?.uid)) && (
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(item);
                            }}
                            className="p-3 text-slate-400 hover:text-electric-blue dark:hover:text-electric-blue-light hover:bg-white/20 dark:hover:bg-slate-800/60 rounded-2xl transition-all border border-transparent hover:border-white/20"
                            title="Edit Service"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            className="p-3 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white/20 dark:hover:bg-slate-800/60 rounded-2xl transition-all border border-transparent hover:border-white/20"
                            title="Delete Service"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-6">
                      <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${textColorClass} opacity-80 mb-2 block`}>
                        {item.type}
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight group-hover:text-electric-blue dark:group-hover:text-electric-blue-light transition-colors duration-500 tracking-tight">
                        {item.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-4 mb-10">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-500/5 px-3 py-1.5 rounded-full border border-slate-500/10">
                        <Clock size={12} />
                        <span>{item.time || 'Flexible'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-500/5 px-3 py-1.5 rounded-full border border-slate-500/10">
                        <Users size={12} />
                        <span>Instant Booking</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-6 pt-8 border-t border-white/10">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Price per person</span>
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{item.price}</span>
                    </div>
                    
                    <button 
                      onClick={() => setIsBooking(item)}
                      className="bg-electric-blue hover:bg-electric-blue-dark text-white py-5 px-10 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-electric-blue/30 active:scale-95 transition-all flex items-center justify-center gap-3 group/btn border border-white/30"
                    >
                      Book Now
                      <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Booking Modal */}
      <AnimatePresence>
        {isBooking && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBooking(null)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="glass dark:glass-dark rounded-t-[3rem] sm:rounded-[3rem] w-full max-w-md p-8 border border-white/30 dark:border-white/10 shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-electric-blue/10 blur-[100px] rounded-full" />
              
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Reserve Spot</h3>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">{isBooking.title}</p>
                </div>
                <button 
                  onClick={() => setIsBooking(null)}
                  className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-white/20 dark:bg-slate-800/50 rounded-2xl transition-all border border-white/10"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); setShowConfirmModal(true); }} className="relative z-10">
                <div className="space-y-6 mb-10">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Select Date</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="glass-input dark:glass-input-dark w-full rounded-2xl px-6 py-4 text-sm font-black focus:outline-none dark:text-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Arrival Time</label>
                      <input 
                        type="time" 
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="glass-input dark:glass-input-dark w-full rounded-2xl px-6 py-4 text-sm font-black focus:outline-none dark:text-white transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Total Guests</label>
                      <input 
                        type="number" 
                        value={bookingGuests}
                        onChange={(e) => setBookingGuests(parseInt(e.target.value))}
                        min="1"
                        max="20"
                        className="glass-input dark:glass-input-dark w-full rounded-2xl px-6 py-4 text-sm font-black focus:outline-none dark:text-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-white/40 dark:bg-white/5 p-6 rounded-3xl border border-white/30 dark:border-white/10 backdrop-blur-md shadow-inner">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Base Rate</span>
                      <span className="font-black text-slate-900 dark:text-white">{isBooking.price}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Provider</span>
                      <span className="font-black text-slate-900 dark:text-white">{isBooking.provider}</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-electric-blue hover:bg-electric-blue-dark text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-electric-blue/20 active:scale-95 transition-all flex items-center justify-center gap-3 group uppercase tracking-widest text-xs"
                >
                  Confirm Details
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && isBooking && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass dark:glass-dark rounded-[3rem] w-full max-w-sm p-10 border border-white/30 dark:border-white/10 shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-electric-blue to-electric-blue-dark" />
              
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8 uppercase tracking-tight">
                {paymentStep ? 'Checkout' : 'Final Review'}
              </h3>
              
              {!paymentStep ? (
                <>
                  <div className="space-y-5 mb-10 bg-white/40 dark:bg-white/5 p-6 rounded-[2rem] border border-white/30 dark:border-white/10 text-sm backdrop-blur-md shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Service</span>
                      <span className="font-black text-slate-900 dark:text-white text-right tracking-tight">{isBooking.title}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Date</span>
                      <span className="font-black text-slate-900 dark:text-white tracking-tight">{bookingDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Time</span>
                      <span className="font-black text-slate-900 dark:text-white tracking-tight">{bookingTime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Guests</span>
                      <span className="font-black text-slate-900 dark:text-white tracking-tight">{bookingGuests}</span>
                    </div>
                    <div className="flex justify-between items-center pt-5 border-t border-slate-200/50 dark:border-white/10">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Amount</span>
                      <span className="text-2xl font-black text-electric-blue dark:text-electric-blue-light tracking-tighter">{isBooking.price}</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowConfirmModal(false)}
                      className="flex-1 glass-input dark:glass-input-dark text-slate-600 dark:text-slate-300 font-black py-4 rounded-2xl hover:bg-white/50 dark:hover:bg-white/10 transition-all uppercase tracking-widest text-[10px] border border-white/20"
                    >
                      Back
                    </button>
                    <button 
                      onClick={() => setPaymentStep(true)}
                      className="flex-1 bg-electric-blue hover:bg-electric-blue-dark text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] shadow-xl shadow-electric-blue/20 active:scale-95 border border-white/20"
                    >
                      Pay Now
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-10">
                  <div className="p-8 bg-white/40 dark:bg-white/5 rounded-[2.5rem] border border-white/30 dark:border-white/10 backdrop-blur-md shadow-inner">
                    <div className="flex items-center gap-5 mb-8">
                      <div className="w-14 h-14 rounded-[1.5rem] bg-electric-blue/20 flex items-center justify-center text-electric-blue dark:text-electric-blue-light shadow-inner border border-electric-blue/20">
                        <CreditCard size={28} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Amount Due</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{isBooking.price}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="glass-input dark:glass-input-dark h-14 rounded-2xl px-6 flex items-center text-slate-900 dark:text-white text-xs font-black tracking-[0.3em] border border-white/20">
                        •••• •••• •••• 4242
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="glass-input dark:glass-input-dark h-14 rounded-2xl px-6 flex items-center text-slate-900 dark:text-white text-xs font-black tracking-[0.3em] border border-white/20">
                          12 / 26
                        </div>
                        <div className="glass-input dark:glass-input-dark h-14 rounded-2xl px-6 flex items-center text-slate-900 dark:text-white text-xs font-black tracking-[0.3em] border border-white/20">
                          ***
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setPaymentStep(false)}
                      disabled={isPaying}
                      className="flex-1 glass-input dark:glass-input-dark text-slate-600 dark:text-slate-300 font-black py-4 rounded-2xl hover:bg-white/50 dark:hover:bg-white/10 transition-all disabled:opacity-50 uppercase tracking-widest text-[10px] border border-white/20"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleBookNow}
                      disabled={isPaying}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-600/20 active:scale-95 border border-white/20"
                    >
                      {isPaying ? <Loader2 className="animate-spin" size={20} /> : 'Confirm Pay'}
                    </button>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      <CreditCard size={10} />
                      <span>Secure SSL Encryption</span>
                    </div>
                    <p className="text-[8px] font-bold text-center text-slate-400/60 dark:text-slate-500/60 uppercase tracking-widest leading-relaxed">
                      Powered by Stripe. Your data is protected.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Booking Item Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsCreating(false);
                setEditingItem(null);
              }}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="glass dark:glass-dark rounded-t-[3rem] sm:rounded-[3rem] w-full max-w-md p-10 border border-white/30 dark:border-white/10 shadow-2xl relative z-10 overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="absolute -left-20 -top-20 w-64 h-64 bg-electric-blue/10 blur-[100px] rounded-full" />
              
              <div className="flex justify-between items-center mb-10 relative z-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingItem ? 'Update Service' : 'New Service'}</h3>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Configure island offering</p>
                </div>
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
                      color: 'bg-electric-blue'
                    });
                  }}
                  className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-white/20 dark:bg-slate-800/50 rounded-2xl transition-all border border-white/10"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreate} className="relative z-10">
                <div className="space-y-8 mb-12">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Service Category</label>
                    <div className="relative">
                      <select 
                        value={formData.type}
                        onChange={(e) => {
                          const type = e.target.value;
                          let icon = 'Ship';
                          let color = 'bg-electric-blue';
                          if (type === 'Bike Rental') { icon = 'Bike'; color = 'bg-emerald-500'; }
                          if (type === 'Snorkeling Trip') { icon = 'Fish'; color = 'bg-orange-500'; }
                          if (type === 'Diving') { icon = 'Diving'; color = 'bg-electric-blue'; }
                          if (type === 'Stay') { icon = 'Home'; color = 'bg-electric-blue'; }
                          setFormData({...formData, type, icon, color});
                        }}
                        className="glass-input dark:glass-input-dark w-full rounded-2xl px-6 py-4 text-sm font-black focus:outline-none dark:text-white appearance-none cursor-pointer"
                      >
                        <option value="Fast Boat">Fast Boat</option>
                        <option value="Bike Rental">Bike Rental</option>
                        <option value="Snorkeling Trip">Snorkeling Trip</option>
                        <option value="Diving">Diving</option>
                        <option value="Stay">Stay</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight size={16} className="rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Display Title</label>
                    <input 
                      type="text" 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g. Premium Snorkeling Gear"
                      className="glass-input dark:glass-input-dark w-full rounded-2xl px-6 py-4 text-sm font-black focus:outline-none dark:text-white transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Duration</label>
                      <input 
                        type="text" 
                        value={formData.time}
                        onChange={(e) => setFormData({...formData, time: e.target.value})}
                        placeholder="e.g. 24 Hours"
                        className="glass-input dark:glass-input-dark w-full rounded-2xl px-6 py-4 text-sm font-black focus:outline-none dark:text-white transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Price (IDR)</label>
                      <input 
                        type="text" 
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        placeholder="e.g. 50k IDR"
                        className="glass-input dark:glass-input-dark w-full rounded-2xl px-6 py-4 text-sm font-black focus:outline-none dark:text-white transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <button 
                  type="submit"
                  disabled={isSubmitting || !formData.title || !formData.time || !formData.price}
                  className="w-full bg-electric-blue hover:bg-electric-blue-dark text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-electric-blue/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Processing...
                    </>
                  ) : (
                    <>
                      {editingItem ? 'Update Offering' : 'Publish Offering'}
                      <ArrowRight size={18} />
                    </>
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
        title="Delete Service"
        message="Are you sure you want to delete this service? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmModal({ isOpen: false, id: '' })}
      />
    </div>
  );
}
