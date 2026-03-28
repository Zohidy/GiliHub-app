import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Map, 
  Calendar, 
  MessageSquare, 
  User, 
  LayoutGrid, 
  MessageCircle, 
  ChevronRight, 
  Cloud, 
  Sun, 
  Thermometer, 
  Droplets, 
  Wind, 
  Clock, 
  MapPin,
  Waves,
  RefreshCw,
  Loader2,
  CloudRain,
  Image as ImageIcon,
  Play,
  ArrowRight
} from 'lucide-react';

import { collection, query, onSnapshot, where, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getWeatherData, getTideData, getIslandImages, fetchYouTubeVideos } from '../../services/apiServices';
import { useUI } from '../../contexts/UIContext';

// Island Gallery Component
const IslandGallery = () => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showImageViewer } = useUI();

  useEffect(() => {
    const fetchImages = async () => {
      const data = await getIslandImages('Gili Trawangan', 6);
      if (data) {
        setImages(data);
      }
      setLoading(false);
    };
    fetchImages();
  }, []);

  if (loading && images.length === 0) {
    return (
      <div className="mb-10 flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-[60vw] sm:w-[200px] flex-shrink-0 h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <ImageIcon size={20} className="text-electric-blue" />
          Island Views
        </h3>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {images.map((img, index) => (
          <motion.div 
            key={img.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="w-[75vw] sm:w-[240px] flex-shrink-0 h-40 rounded-3xl overflow-hidden relative group shadow-lg cursor-pointer glass dark:glass-dark border-none"
            onClick={() => showImageViewer(img.urls.regular)}
          >
            <img 
              src={img.urls.small} 
              alt={img.alt_description} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <p className="text-[10px] text-white font-medium truncate">by {img.user.name}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// YouTube Gallery Component
const YouTubeGallery = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getVideos = async () => {
      const data = await fetchYouTubeVideos();
      setVideos(data);
      setLoading(false);
    };
    getVideos();
  }, []);

  if (loading) return (
    <div className="h-48 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-electric-blue border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (videos.length === 0) return null;

  return (
    <div className="mt-12 px-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Island Videos</h2>
          <p className="text-sm text-slate-500 font-medium">Experience Gili through video</p>
        </div>
        <a 
          href="https://www.youtube.com/results?search_query=Gili+Trawangan" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-electric-blue dark:text-electric-blue-light font-bold text-xs uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
        >
          Watch More <ArrowRight size={14} />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {videos.map((video, index) => (
          <motion.div
            key={video.id.videoId}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className="group relative glass dark:glass-dark rounded-3xl overflow-hidden shadow-xl border-none"
          >
            <div className="aspect-video relative overflow-hidden">
              <img 
                src={video.snippet.thumbnails.high.url} 
                alt={video.snippet.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <div className="w-12 h-12 glass dark:glass-dark rounded-full flex items-center justify-center text-electric-blue dark:text-electric-blue-light shadow-xl group-hover:scale-110 transition-transform border-white/20">
                  <Play size={20} fill="currentColor" />
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 mb-1 group-hover:text-electric-blue dark:group-hover:text-electric-blue-light transition-colors">
                {video.snippet.title}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                {video.snippet.channelTitle}
              </p>
              <a 
                href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 z-10"
              >
                <span className="sr-only">Watch video</span>
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

interface HomeProps {
  setActiveTab: (tab: 'home' | 'map' | 'booking' | 'events' | 'forum' | 'chat' | 'profile') => void;
}

function TodayEvents() {
  const [todayEvents, setTodayEvents] = React.useState<any[]>([]);

  React.useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'events'),
      where('date', '==', today),
      limit(3)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTodayEvents(docs);
    }, (error) => {
      console.error("Error fetching today's events:", error);
    });

    return () => unsubscribe();
  }, []);

  if (todayEvents.length === 0) return null;

  return (
    <div className="mb-10">
      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Happening Today</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {todayEvents.map((event, index) => (
          <div key={index} className="w-[85vw] sm:w-[280px] flex-shrink-0 glass dark:glass-dark rounded-3xl p-5 shadow-xl border-none">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-electric-blue dark:text-electric-blue-light bg-electric-blue/10 px-2 py-1 rounded-lg">
                {event.category}
              </span>
              <div className="flex items-center gap-1 text-slate-400">
                <Clock size={12} />
                <span className="text-[10px] font-bold">{event.time}</span>
              </div>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-1">{event.title}</h4>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-4">
              <MapPin size={12} />
              <span className="text-[10px] font-medium">{event.location}</span>
            </div>
            <button className="w-full glass-input dark:glass-input-dark text-slate-700 dark:text-slate-300 py-2 rounded-xl text-xs font-bold hover:bg-electric-blue hover:text-white transition-all border-none">
              Join Event
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);
  const [tide, setTide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [weatherData, tideData] = await Promise.all([
        getWeatherData(),
        getTideData()
      ]);
      
      if (weatherData) setWeather(weatherData);
      if (tideData) setTide(tideData);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (code: string) => {
    if (code.includes('01')) return <Sun className="text-amber-300" size={32} />;
    if (code.includes('02') || code.includes('03') || code.includes('04')) return <Cloud className="text-electric-blue/40" size={32} />;
    if (code.includes('09') || code.includes('10')) return <CloudRain className="text-electric-blue/60" size={32} />;
    return <Sun className="text-amber-300" size={32} />;
  };

  if (loading && !weather) {
    return (
      <div className="bg-gradient-to-br from-electric-blue to-electric-blue-dark rounded-3xl p-6 text-white shadow-xl shadow-electric-blue/20 mb-10 flex items-center justify-center h-48">
        <Loader2 className="animate-spin text-white/50" size={32} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass dark:glass-dark rounded-[2rem] p-6 text-slate-900 dark:text-white shadow-xl mb-10 relative overflow-hidden group border-none"
    >
      {/* Decorative background elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-electric-blue/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-electric-blue/10 rounded-full blur-3xl" />
      
      <div className="absolute -right-4 -top-4 opacity-10 dark:opacity-20 group-hover:scale-110 transition-transform duration-700 text-electric-blue">
        <Sun size={120} />
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-electric-blue dark:text-electric-blue-light font-bold text-xs uppercase tracking-widest">Island Weather</h3>
              <button 
                onClick={fetchAllData}
                className="p-1 hover:bg-electric-blue/10 rounded-lg transition-colors"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
            {weather ? (
              <>
                <div className="flex items-center gap-3">
                  {getWeatherIcon(weather.weather[0].icon)}
                  <span className="text-4xl font-black">{Math.round(weather.main.temp)}°C</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1 capitalize">{weather.weather[0].description}</p>
              </>
            ) : (
              <p className="text-slate-400 text-xs italic">Weather data unavailable</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-slate-900 dark:text-white font-bold text-sm">Gili Trawangan</p>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Lombok, Indonesia</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 border-t border-slate-200 dark:border-white/10 pt-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
              <Droplets size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Humidity</span>
            </div>
            <p className="text-sm font-black">{weather?.main?.humidity || '--'}%</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
              <Wind size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Wind</span>
            </div>
            <p className="text-sm font-black">{weather ? Math.round(weather.wind.speed * 3.6) : '--'} km/h</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
              <Thermometer size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Feels Like</span>
            </div>
            <p className="text-sm font-black">{weather ? Math.round(weather.main.feels_like) : '--'}°C</p>
          </div>
        </div>

        {tide && tide.extremes && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Waves size={12} className="text-electric-blue dark:text-electric-blue-light" />
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tide Extremes</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
              {tide.extremes.slice(0, 3).map((ext: any, i: number) => (
                <div key={i} className="flex flex-col min-w-[70px]">
                  <span className="text-[8px] font-bold text-electric-blue dark:text-electric-blue-light uppercase">{ext.type}</span>
                  <span className="text-[11px] font-black text-slate-900 dark:text-white">
                    {new Date(ext.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Home({ setActiveTab }: HomeProps) {
  const navItems = [
    { title: 'Explore Map', icon: Map, desc: 'Find locations and services', tab: 'map' },
    { title: 'My Bookings', icon: LayoutGrid, desc: 'Manage your reservations', tab: 'booking' },
    { title: 'Events', icon: Calendar, desc: 'Upcoming island events', tab: 'events' },
    { title: 'Forum', icon: MessageSquare, desc: 'Community discussions', tab: 'forum' },
    { title: 'Chat', icon: MessageCircle, desc: 'Connect with others', tab: 'chat' },
    { title: 'My Profile', icon: User, desc: 'Manage your account', tab: 'profile' },
  ];

  const guideSections = [
    {
      title: 'How to Get There',
      content: 'Most travelers take a fast boat from Padang Bai, Bali. Recommended: Ekajaya (approx. 725k IDR return). Other reliable operators: Austina, Freebird, Golden Queen, and Samaya.',
      icon: '🚢',
      pos: [-8.3525, 116.0383] // Harbor
    },
    {
      title: 'Island Transport',
      content: 'There are no motorized vehicles on the Gili Islands. The best way to get around is by renting a bicycle (approx. 60k-80k IDR/day). Avoid horse carts (cidomo) for animal welfare reasons.',
      icon: '🚲',
      category: 'bike'
    },
    {
      title: 'Snorkeling & Diving',
      content: 'Gili T is famous for its sea turtles. Popular spots include Turtle Point and the Underwater Statues. You can join a group tour or rent a private boat for more flexibility.',
      icon: '🤿',
      category: 'snorkeling'
    },
    {
      title: 'Nightlife & Dining',
      content: 'The Night Market opens at sunset near the harbor for fresh seafood. For parties, different bars host events on specific nights (e.g., Blue Marlin on Mondays, Irish Bar on Wednesdays).',
      icon: '🍹',
      pos: [-8.3535, 116.0393] // Night Market
    },
    {
      title: 'Inter-Island Boats',
      content: 'Public boats run between Gili T, Meno, and Air. Gili T to Air: 08:30 & 15:00 (45k IDR). Gili Air to T: 09:30 & 16:00 (45k IDR). Local boats to Lombok run from 07:00-17:00 (20k IDR).',
      icon: '🚤',
      pos: [-8.3525, 116.0383] // Harbor
    }
  ];

  const mustVisitPlaces = [
    { name: 'Night Market', desc: 'Fresh seafood buffet at sunset.', icon: '🌙', pos: [-8.3535, 116.0393] },
    { name: 'Turtle Point', desc: 'Best spot to swim with sea turtles.', icon: '🐢', pos: [-8.3445, 116.0443] },
    { name: 'Underwater Statues', desc: 'Famous Gili Meno statues (Nest).', icon: '🗿', pos: [-8.3515, 116.0523] },
    { name: 'West Coast Sunset', desc: 'Best bars for bean bag sunsets.', icon: '🌅', pos: [-8.3585, 116.0283] },
  ];

  const handleViewOnMap = (pos?: number[], category?: string) => {
    setActiveTab('map');
    if (pos) {
      setTimeout(() => {
        const map = (window as any).leafletMap;
        if (map) map.flyTo(pos, 17);
      }, 500);
    }
  };

  const foodRecommendations = [
    { name: 'Banyan Tree', desc: 'Famous for Zucchini Lasagna.', type: 'Cafe' },
    { name: 'Regina Pizza', desc: 'Authentic Italian wood-fired pizza.', type: 'Dinner' },
    { name: 'Tiki Grove', desc: 'Top-rated Mexican food.', type: 'Dinner' },
    { name: 'Fat Cats', desc: 'Great burgers and beach vibes.', type: 'Beach Club' },
    { name: 'Hello Capitano', desc: 'Best smoothie bowls on the island.', type: 'Breakfast' },
    { name: 'Sasak Bistro', desc: 'Authentic local Lombok cuisine.', type: 'Local' },
  ];

  const travelTips = [
    { title: 'Keep Your Tickets', content: 'Always keep your hardcopy boat tickets. There is no electronic system, and losing them means buying new ones.', icon: '🎫' },
    { title: 'Arrive Early', content: 'Check-in at the harbor at least 1 hour before departure to avoid losing your seat due to overselling.', icon: '⏰' },
    { title: 'Go Barefoot', content: 'Embrace the "island life" by leaving your shoes at your villa. Most places are sand-friendly!', icon: '👣' },
    { title: 'Cash is King', content: 'While many places take cards, smaller warungs and local boats only accept IDR cash.', icon: '💵' },
  ];

  const emergencyContacts = [
    { name: 'Medical Clinic', phone: '+62 819 9773 5335', desc: 'Gili T Medical Center (24/7)' },
    { name: 'Local Police', phone: '+62 370 613 1110', desc: 'Harbor Police Post' },
    { name: 'Ekajaya Boat', phone: '+62 812 3770 000', desc: 'Fast boat support' },
  ];

  const islandRules = [
    { title: 'No Motors', content: 'Only bicycles and horse carts (cidomo) are allowed. Enjoy the silence!', icon: '🚫🏍️' },
    { title: 'Reef Protection', content: 'Do not touch turtles or coral. Use reef-safe sunscreen.', icon: '🪸🐢' },
    { title: 'Modest Dress', content: 'When walking through the village area, please cover your shoulders and knees.', icon: '👕👖' },
    { title: 'Strict Drug Laws', content: 'Indonesia has extremely strict drug laws. Stay safe and stay clean.', icon: '⚖️🚫' },
  ];

  const divingSpots = [
    { name: 'Shark Point', desc: 'See reef sharks and large turtles.', depth: '18-30m' },
    { name: 'Manta Point', desc: 'Seasonal manta rays and vibrant coral.', depth: '10-25m' },
    { name: 'Hans Reef', desc: 'Great for macro photography and frogfish.', depth: '5-20m' },
    { name: 'Deep Turbo', desc: 'Advanced drift dive with sea fans.', depth: '25-40m' },
  ];

  const accommodations = [
    { name: 'Manta Dive', desc: 'Best for divers, central location.', price: 'Mid-Range' },
    { name: 'Villa Rumorinda', desc: 'Private villas with pools.', price: 'Luxury' },
    { name: 'Havana Hideaway', desc: 'Boutique stay with great vibes.', price: 'Boutique' },
    { name: 'Gili La Boheme', desc: 'Social atmosphere, budget friendly.', price: 'Budget' },
  ];

  const nightlifeSchedule = [
    { day: 'Monday', place: 'Blue Marlin Dive Center', icon: '🦈' },
    { day: 'Tuesday', place: 'Gili Bar Crawl', icon: '🍻' },
    { day: 'Wednesday', place: 'Irish Bar & Boat Party', icon: '☘️' },
    { day: 'Friday', place: 'Jungle Club (Summer Summer)', icon: '🌴' },
  ];

  return (
    <div className="p-6 pb-32 h-full overflow-y-auto bg-mesh no-scrollbar">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 mt-2"
      >
        <h2 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-electric-blue to-electric-blue-dark dark:from-electric-blue-light dark:to-electric-blue bg-clip-text text-transparent tracking-tight">
          Welcome back!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">What would you like to do today?</p>
      </motion.div>

      <WeatherWidget />

      <IslandGallery />

      <TodayEvents />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {navItems.map((item, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(item.tab as any)}
            className="w-full glass-card dark:glass-card-dark border-none rounded-[1.5rem] p-5 flex items-center gap-5 shadow-lg group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-electric-blue/0 via-electric-blue/0 to-electric-blue/5 dark:to-electric-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl text-electric-blue shadow-sm group-hover:bg-electric-blue group-hover:text-white group-hover:shadow-electric-blue/25 transition-all duration-300 z-10">
              <item.icon size={24} strokeWidth={2.5} />
            </div>
            <div className="flex-1 text-left z-10">
              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-0.5">{item.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.desc}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors z-10">
              <ChevronRight className="text-slate-400 group-hover:text-electric-blue transition-colors" size={18} strokeWidth={3} />
            </div>
          </motion.button>
        ))}
      </div>

      <div className="mb-10">
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Island Quick Guide</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {guideSections.map((section, index) => (
            <div key={index} className="glass dark:glass-dark rounded-2xl p-5 shadow-xl border-none flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{section.icon}</span>
                <h4 className="font-bold text-slate-900 dark:text-white">{section.title}</h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 flex-1">
                {section.content}
              </p>
              <button 
                onClick={() => handleViewOnMap(section.pos, section.category)}
                className="text-[10px] font-black uppercase tracking-widest text-electric-blue dark:text-electric-blue-light flex items-center gap-2 hover:gap-3 transition-all"
              >
                View on Map <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Must Visit</h3>
          <div className="space-y-3">
            {mustVisitPlaces.map((place, index) => (
              <motion.div 
                key={index} 
                whileHover={{ x: 4 }}
                onClick={() => handleViewOnMap(place.pos)}
                className="flex items-center gap-4 glass-card dark:glass-card-dark p-3.5 rounded-[1.25rem] border-none shadow-sm cursor-pointer group"
              >
                <div className="text-2xl w-12 h-12 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-xl shadow-sm group-hover:bg-electric-blue group-hover:text-white transition-all">
                  {place.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{place.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{place.desc}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-electric-blue transition-colors" />
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Top Food</h3>
          <div className="space-y-3">
            {foodRecommendations.map((food, index) => (
              <motion.div 
                key={index} 
                whileHover={{ x: 4 }}
                className="flex items-center justify-between glass-card dark:glass-card-dark p-3.5 rounded-[1.25rem] border-none shadow-sm cursor-default"
              >
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{food.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{food.desc}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-electric-blue dark:text-electric-blue-light bg-white/50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg shadow-sm">
                  {food.type}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Top Diving Spots</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {divingSpots.map((spot, index) => (
            <div key={index} className="glass dark:glass-dark rounded-2xl p-4 shadow-lg border-none">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">{spot.name}</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mb-2">{spot.desc}</p>
              <span className="text-[9px] font-bold text-electric-blue dark:text-electric-blue-light bg-electric-blue/10 px-1.5 py-0.5 rounded-md">
                {spot.depth}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-10">
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Where to Stay</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {accommodations.map((acc, index) => (
            <div key={index} className="glass dark:glass-dark rounded-2xl p-4 shadow-lg flex items-center justify-between border-none">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{acc.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{acc.desc}</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                {acc.price}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-10">
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Weekly Party Schedule</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {nightlifeSchedule.map((party, index) => (
            <div key={index} className="glass dark:glass-dark rounded-2xl p-4 shadow-lg text-center border-none">
              <span className="text-2xl mb-2 block">{party.icon}</span>
              <h4 className="font-bold text-slate-900 dark:text-white text-[10px] uppercase tracking-wider mb-1">{party.day}</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">{party.place}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-10">
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Pro Travel Tips</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {travelTips.map((tip, index) => (
            <div key={index} className="glass dark:glass-dark rounded-2xl p-5 shadow-lg border-none">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{tip.icon}</span>
                <h4 className="font-bold text-electric-blue dark:text-electric-blue-light text-sm">{tip.title}</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {tip.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Island Rules</h3>
          <div className="space-y-3">
            {islandRules.map((rule, index) => (
              <div key={index} className="glass dark:glass-dark p-4 rounded-2xl border-none shadow-lg">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-lg">{rule.icon}</span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{rule.title}</h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{rule.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Emergency Contacts</h3>
          <div className="space-y-3">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="glass dark:glass-dark p-4 rounded-2xl border-none shadow-lg">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-rose-600 dark:text-rose-400 text-sm">{contact.name}</h4>
                  <a href={`tel:${contact.phone}`} className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline">
                    {contact.phone}
                  </a>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{contact.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <YouTubeGallery />
    </div>
  );
}
