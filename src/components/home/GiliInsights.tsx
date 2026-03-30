import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion } from 'motion/react';
import { TrendingUp, MessageSquare, Calendar, BarChart3 } from 'lucide-react';
import { format, subDays, isSameDay, parseISO } from 'date-fns';

const COLORS = ['#00C2FF', '#FF6321', '#10B981', '#F59E0B', '#8B5CF6'];

export default function GiliInsights() {
  const { t } = useLanguage();
  const [bookingData, setBookingData] = useState<any[]>([]);
  const [forumData, setForumData] = useState<any[]>([]);
  const [eventData, setEventData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate last 7 days labels
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date,
        label: format(date, 'MMM dd'),
        bookings: 0,
        comments: 0
      };
    });

    // Fetch Bookings
    const bookingsQuery = query(
      collection(db, 'bookings'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const counts = [...last7Days].map(day => ({ ...day, bookings: 0 }));
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const createdAt = parseISO(data.createdAt);
        counts.forEach(day => {
          if (isSameDay(day.date, createdAt)) {
            day.bookings++;
          }
        });
      });
      setBookingData(counts);
    });

    // Fetch Forum Comments
    const commentsQuery = query(
      collection(db, 'comments'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubComments = onSnapshot(commentsQuery, (snapshot) => {
      const counts = [...last7Days].map(day => ({ ...day, comments: 0 }));
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const createdAt = parseISO(data.createdAt);
        counts.forEach(day => {
          if (isSameDay(day.date, createdAt)) {
            day.comments++;
          }
        });
      });
      setForumData(counts);
    });

    // Fetch Events for Category Distribution
    const eventsQuery = query(collection(db, 'events'));
    const unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
      const categories: { [key: string]: number } = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const cat = data.category || 'other';
        categories[cat] = (categories[cat] || 0) + 1;
      });

      const formattedData = Object.keys(categories).map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: categories[key]
      }));
      setEventData(formattedData);
      setLoading(false);
    });

    return () => {
      unsubBookings();
      unsubComments();
      unsubEvents();
    };
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-electric-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="mt-12 mb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-electric-blue/10 flex items-center justify-center text-electric-blue">
          <BarChart3 size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-display font-semibold text-slate-900 dark:text-white uppercase tracking-tight">{t('gili_insights')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('island_activity')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Trends */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass dark:glass-dark rounded-3xl p-8 border border-white/40 dark:border-white/10 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-electric-blue" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-widest">{t('booking_trends')}</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bookingData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="bookings" 
                  stroke="#00C2FF" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#00C2FF', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Forum Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="glass dark:glass-dark rounded-3xl p-8 border border-white/40 dark:border-white/10 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare size={18} className="text-orange-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-widest">{t('forum_activity')}</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forumData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)'
                  }}
                />
                <Bar dataKey="comments" fill="#FF6321" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Event Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="glass dark:glass-dark rounded-3xl p-8 border border-white/40 dark:border-white/10 shadow-lg lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-6">
            <Calendar size={18} className="text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-widest">{t('event_distribution')}</h3>
          </div>
          <div className="h-[300px] w-full flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={eventData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {eventData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(8px)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 flex flex-wrap justify-center gap-4 p-4">
              {eventData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
