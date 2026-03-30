import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { TrendingUp, Users, Calendar, BarChart3, Loader2 } from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../config/firebase';

const COLORS = ['#00E5FF', '#00B8D4', '#0097A7', '#006064', '#004D40', '#80DEEA'];

export default function IslandAnalytics() {
  const [eventStats, setEventStats] = useState<{name: string, count: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'events'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        const category = doc.data().category || 'other';
        counts[category] = (counts[category] || 0) + 1;
      });

      const formattedData = Object.entries(counts).map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count
      })).sort((a, b) => b.count - a.count);

      setEventStats(formattedData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const visitorTrend = [
    { day: 'Mon', count: 1200 },
    { day: 'Tue', count: 1350 },
    { day: 'Wed', count: 1100 },
    { day: 'Thu', count: 1500 },
    { day: 'Fri', count: 2100 },
    { day: 'Sat', count: 2500 },
    { day: 'Sun', count: 2300 },
  ];

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className="bg-electric-blue/10 p-2 rounded-xl">
          <BarChart3 className="text-electric-blue" size={20} />
        </div>
        <div>
          <h3 className="text-xl font-display font-semibold text-slate-900 dark:text-white tracking-tight">Island Insights</h3>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Real-time Activity Trends</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visitor Trend */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass dark:glass-dark rounded-3xl p-6 shadow-lg border border-white/40 dark:border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Users size={16} className="text-electric-blue" />
              Weekly Visitor Traffic
            </h4>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">+12% vs last week</span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visitorTrend}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }} 
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#00E5FF" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Event Categories */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="glass dark:glass-dark rounded-3xl p-6 shadow-lg border border-white/40 dark:border-white/10"
        >
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
            <Calendar size={16} className="text-electric-blue" />
            Event Popularity
          </h4>
          <div className="h-48 w-full flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="animate-spin text-electric-blue/30" size={32} />
            ) : eventStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }} 
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0, 229, 255, 0.05)' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }} 
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#00E5FF" 
                    radius={[6, 6, 0, 0]} 
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400 italic">No event data yet</p>
            )}
          </div>
        </motion.div>

        {/* Category Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="glass dark:glass-dark rounded-3xl p-6 shadow-lg border border-white/40 dark:border-white/10 md:col-span-2"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={eventStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {eventStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4 w-full">
              {eventStats.slice(0, 6).map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{item.count} events</p>
                  </div>
                </div>
              ))}
              {eventStats.length === 0 && (
                <p className="text-xs text-slate-400 italic col-span-2 text-center">Waiting for island activity...</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
