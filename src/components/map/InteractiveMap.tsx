import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { Plus, X, MapPin, Navigation, Loader2, Trash2, Database, Search, Info, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import ConfirmModal from '../ui/ConfirmModal';

const GOOGLE_MAPS_API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY;

// Fix untuk masalah default icon Leaflet di React
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'marker-default'
});

const ActiveIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [28, 44],
  iconAnchor: [14, 44],
  popupAnchor: [1, -34],
  className: 'marker-active-effect'
});

const UserIcon = L.divIcon({
  className: 'user-position-marker',
  html: `<div class="w-4 h-4 bg-electric-blue rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

L.Marker.prototype.options.icon = DefaultIcon;

const getCategoryIcon = (type: string, isActive: boolean) => {
  const colors: Record<string, string> = {
    sunset: 'bg-orange-500',
    clinic: 'bg-rose-500',
    police: 'bg-electric-blue',
    bike: 'bg-emerald-500',
    snorkeling: 'bg-electric-blue/60',
    port: 'bg-slate-700',
    restaurant: 'bg-amber-500',
    diving: 'bg-electric-blue'
  };
  
  const color = colors[type] || 'bg-slate-400';
  const size = isActive ? 'w-8 h-8' : 'w-6 h-6';
  const innerSize = isActive ? 'w-4 h-4' : 'w-3 h-3';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="flex items-center justify-center ${size} ${color} rounded-full border-2 border-white shadow-lg transition-all transform ${isActive ? 'scale-125' : ''}">
        <div class="${innerSize} bg-white rounded-full opacity-50"></div>
      </div>
    `,
    iconSize: isActive ? [32, 32] : [24, 24],
    iconAnchor: isActive ? [16, 16] : [12, 12]
  });
};

// Koordinat Pusat Gili Trawangan
const GILI_T_CENTER: [number, number] = [-8.3525, 116.0383];

// Komponen untuk menangani klik pada peta
function MapEvents({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

// Komponen untuk tombol Locate Me
function LocateControl({ onLocationFound }: { onLocationFound: (latlng: L.LatLng) => void }) {
  const map = useMapEvents({
    locationfound(e) {
      onLocationFound(e.latlng);
      map.flyTo(e.latlng, 16);
    },
    locationerror() {
      toast.error("Location access denied or unavailable.");
    }
  });

  // Set map to window for quick jumps
  useEffect(() => {
    (window as any).leafletMap = map;
    return () => { (window as any).leafletMap = null; };
  }, [map]);

  const handleLocate = (e: React.MouseEvent) => {
    e.stopPropagation();
    map.locate();
  };
  
  return (
    <div className="absolute top-20 left-4 z-[1000]">
      <button 
        onClick={handleLocate}
        className="glass dark:glass-dark p-3 rounded-2xl shadow-2xl hover:bg-white/20 dark:hover:bg-slate-800/40 transition-all flex items-center justify-center text-electric-blue active:scale-95 border border-white/20"
        title="Locate Me"
      >
        <Navigation size={20} />
      </button>
    </div>
  );
}

// Island Search Component (using Nominatim)
const IslandSearch = ({ onPlaceSelect }: { onPlaceSelect: (place: any) => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const performSearch = async (val: string) => {
    if (val.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val + ' Gili Trawangan')}&format=json&limit=5`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const mappedResults = data.map((item: any) => ({
          place_id: item.place_id,
          name: item.name || item.display_name.split(',')[0],
          formatted_address: item.display_name,
          geometry: {
            location: {
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon)
            }
          }
        }));
        setResults(mappedResults);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Places search error:', error);
      setResults([
        { place_id: '1', name: 'Gili Trawangan Harbor', formatted_address: 'Gili Trawangan, Pemenang, North Lombok Regency, West Nusa Tenggara', rating: 4.5, geometry: { location: { lat: -8.3525, lng: 116.0383 } } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (val: string) => {
    setQuery(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      performSearch(val);
    }, 500);
  };

  return (
    <div ref={searchRef} className="flex-1 relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
      <input 
        type="text"
        value={query}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="Search Gili Trawangan..."
        className="w-full glass dark:glass-dark text-slate-900 dark:text-white py-3.5 pl-12 pr-4 rounded-[2rem] shadow-2xl focus:outline-none focus:ring-2 focus:ring-electric-blue/50 text-sm font-black tracking-tight border border-white/20"
      />
      
      {loading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Loader2 className="animate-spin text-electric-blue" size={18} />
        </div>
      )}
      
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-3 glass dark:glass-dark rounded-[2rem] shadow-2xl overflow-hidden z-[2000] border border-white/20"
          >
            {results.map((place) => (
              <button
                key={place.place_id}
                onClick={() => {
                  onPlaceSelect(place);
                  setResults([]);
                  setQuery(place.name);
                }}
                className="w-full p-4 hover:bg-white/10 dark:hover:bg-slate-800/40 flex items-start gap-4 border-b border-white/10 last:border-0 text-left transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-electric-blue/10 flex items-center justify-center text-electric-blue shrink-0 border border-electric-blue/20">
                  <MapPin size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">{place.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate uppercase tracking-widest font-bold">{place.formatted_address}</p>
                  {place.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={10} className="text-amber-400 fill-amber-400" />
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">{place.rating}</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Map Controller to expose map instance
const MapController = () => {
  const map = useMapEvents({});
  useEffect(() => {
    (window as any).leafletMap = map;
  }, [map]);
  return null;
};

import { useUI } from '../../contexts/UIContext';

export default function InteractiveMap() {
  const { user, userData } = useAuth();
  const { setBottomNavVisible } = useUI();
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [newLocationCoords, setNewLocationCoords] = useState<[number, number] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'sunset',
    desc: ''
  });

  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    type: 'sunset',
    desc: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{isOpen: boolean, id: string}>({ isOpen: false, id: '' });
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLegend, setShowLegend] = useState(false);

  const isAdmin = userData?.role === 'admin';

  const filteredLocations = locations.filter(loc => {
    const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         loc.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || loc.type === filterCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (isAddingMode || newLocationCoords || editingLocationId) {
      setBottomNavVisible(false);
    } else {
      setBottomNavVisible(true);
    }
    return () => setBottomNavVisible(true);
  }, [isAddingMode, newLocationCoords, editingLocationId, setBottomNavVisible]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'locations'), (snapshot) => {
      const locs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLocations(locs);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'locations');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleMapClick = (latlng: L.LatLng) => {
    if (isAddingMode) {
      setNewLocationCoords([latlng.lat, latlng.lng]);
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newLocationCoords) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'locations'), {
        name: formData.name,
        type: formData.type,
        position: newLocationCoords,
        desc: formData.desc,
        createdBy: user.uid
      });
      
      // Reset form
      setIsAddingMode(false);
      setNewLocationCoords(null);
      setFormData({ name: '', type: 'sunset', desc: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'locations');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedData = async () => {
    if (!isAdmin || !user) return;
    setIsLoading(true);
    const seedLocations = [
      { name: 'Harbor', type: 'port', position: [-8.3525, 116.0383], desc: 'Main arrival point for fast boats.' },
      { name: 'Turtle Point', type: 'snorkeling', position: [-8.3445, 116.0443], desc: 'Best spot to swim with sea turtles.' },
      { name: 'Sunset Point', type: 'sunset', position: [-8.3585, 116.0283], desc: 'Famous spot for sunset views and swings.' },
      { name: 'Night Market', type: 'restaurant', position: [-8.3535, 116.0393], desc: 'Fresh seafood buffet every night.' },
      { name: 'Shark Point', type: 'diving', position: [-8.3485, 116.0323], desc: 'See reef sharks and large turtles.' },
      { name: 'Manta Point', type: 'diving', position: [-8.3625, 116.0353], desc: 'Seasonal manta rays and vibrant coral.' },
      { name: 'Mad Monkey', type: 'restaurant', position: [-8.3565, 116.0253], desc: 'Famous party hostel and social hub.' },
      { name: 'Police Station', type: 'police', position: [-8.3515, 116.0388], desc: 'Local police station.' },
      { name: 'Clinic', type: 'clinic', position: [-8.3505, 116.0398], desc: 'Medical clinic for emergencies.' },
    ];

    try {
      for (const loc of seedLocations) {
        await addDoc(collection(db, 'locations'), {
          ...loc,
          createdBy: 'system'
        });
      }
      toast.success('Map seeded with guide locations!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'locations');
      toast.error('Failed to seed map');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (loc: any) => {
    setEditingLocationId(loc.id);
    setEditFormData({
      name: loc.name,
      type: loc.type,
      desc: loc.desc
    });
  };

  const handleUpdateLocation = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'locations', id), {
        name: editFormData.name,
        type: editFormData.type,
        desc: editFormData.desc
      });
      setEditingLocationId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `locations/${id}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteLocation = (id: string) => {
    setDeleteConfirmModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    const id = deleteConfirmModal.id;
    setDeleteConfirmModal({ isOpen: false, id: '' });
    try {
      await deleteDoc(doc(db, 'locations', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `locations/${id}`);
    }
  };

  const quickJumps = [
    { name: 'Harbor', pos: [-8.3525, 116.0383] },
    { name: 'Turtle Point', pos: [-8.3445, 116.0443] },
    { name: 'Sunset Point', pos: [-8.3585, 116.0283] },
    { name: 'Night Market', pos: [-8.3535, 116.0393] },
    { name: 'Shark Point', pos: [-8.3485, 116.0323] },
    { name: 'Manta Point', pos: [-8.3625, 116.0353] },
    { name: 'Mad Monkey', pos: [-8.3565, 116.0253] },
    { name: 'Underwater Statues', pos: [-8.3515, 116.0523] },
    { name: 'Clinic', pos: [-8.3505, 116.0413] },
  ];

  return (
    <div className="w-full h-full relative z-0">
      {isLoading && (
        <div className="absolute inset-0 z-[2000] bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <Loader2 className="animate-spin text-electric-blue" size={48} />
        </div>
      )}

      {/* Quick Jump Buttons */}
      <div className="absolute bottom-32 left-4 right-20 z-[1000] flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {quickJumps.map((jump, i) => (
          <button
            key={i}
            onClick={() => {
              const map = (window as any).leafletMap;
              if (map) map.flyTo(jump.pos, 17);
            }}
            className="glass dark:glass-dark text-slate-900 dark:text-white py-3 px-5 rounded-2xl shadow-2xl hover:bg-electric-blue hover:text-white transition-all text-[10px] font-black uppercase tracking-widest whitespace-nowrap active:scale-95 border border-white/20"
          >
            {jump.name}
          </button>
        ))}
      </div>

      {/* Banner Mode Tambah Lokasi */}
      <AnimatePresence>
        {isAddingMode && !newLocationCoords && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] glass dark:glass-dark px-8 py-4 rounded-[2rem] shadow-2xl border border-electric-blue/30 flex items-center gap-4 whitespace-nowrap"
          >
            <div className="w-10 h-10 rounded-full bg-electric-blue/20 flex items-center justify-center text-electric-blue animate-pulse">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Add New Location</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tap anywhere on the map to place a marker</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filter */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-3">
        <div className="flex gap-2 w-full">
          {isAdmin && (
            <IslandSearch 
              onPlaceSelect={(place) => {
                const map = (window as any).leafletMap;
                if (map && place.geometry && place.geometry.location) {
                  const pos: [number, number] = [place.geometry.location.lat, place.geometry.location.lng];
                  map.flyTo(pos, 17);
                  
                  // Optionally add a temporary marker or highlight
                  setNewLocationCoords(pos);
                  setFormData({
                    name: place.name,
                    type: 'restaurant', // Default to restaurant or try to map from place.types
                    desc: place.formatted_address || ''
                  });
                  setIsAddingMode(true);
                }
              }} 
            />
          )}
        </div>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2">
          {['all', 'sunset', 'clinic', 'police', 'bike', 'snorkeling', 'port', 'restaurant', 'diving'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                filterCategory === cat 
                  ? 'bg-electric-blue text-white border-electric-blue shadow-lg shadow-electric-blue/25 scale-105' 
                  : 'glass dark:glass-dark text-slate-600 dark:text-slate-400 border-white/20 hover:bg-white/10'
              }`}
            >
              {cat === 'all' ? 'All' : cat === 'clinic' ? 'Health' : cat === 'restaurant' ? 'Food' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Legend Toggle */}
      <div className="absolute top-20 right-4 z-[1000]">
        <button 
          onClick={() => setShowLegend(!showLegend)}
          className="glass dark:glass-dark p-3 rounded-2xl shadow-2xl hover:bg-white/20 dark:hover:bg-slate-800/40 transition-all flex items-center justify-center text-electric-blue active:scale-95 border border-white/20"
          title="Map Legend"
        >
          <Info size={20} />
        </button>
      </div>

      {/* Legend Content */}
      <AnimatePresence>
        {showLegend && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass dark:glass-dark w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">MAP LEGEND</h3>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mt-1">Icon identification guide</p>
                  </div>
                  <button 
                    onClick={() => setShowLegend(false)}
                    className="p-3 rounded-2xl hover:bg-white/10 dark:hover:bg-slate-800/40 text-slate-400 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { type: 'sunset', label: 'Sunset Point', color: 'bg-orange-500' },
                    { type: 'clinic', label: 'Clinic / Health', color: 'bg-rose-500' },
                    { type: 'police', label: 'Police Station', color: 'bg-electric-blue' },
                    { type: 'bike', label: 'Bike Rental', color: 'bg-emerald-500' },
                    { type: 'snorkeling', label: 'Snorkeling', color: 'bg-electric-blue/60' },
                    { type: 'port', label: 'Harbor / Port', color: 'bg-slate-700' },
                    { type: 'restaurant', label: 'Food / Cafe', color: 'bg-amber-500' },
                    { type: 'diving', label: 'Diving Spot', color: 'bg-electric-blue' },
                  ].map((item) => (
                    <div key={item.type} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 dark:bg-slate-900/50 border border-white/10 dark:border-slate-800">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color} text-white shadow-lg`}>
                        <MapPin size={18} />
                      </div>
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <MapContainer 
        center={GILI_T_CENTER} 
        zoom={15} 
        className="w-full h-full z-0"
        zoomControl={false}
        touchZoom={true}
        bounceAtZoomLimits={true}
      >
        <MapController />
        <MapEvents onMapClick={handleMapClick} />
        <LocateControl onLocationFound={(latlng) => setUserPosition([latlng.lat, latlng.lng])} />
        
        {/* Menggunakan OpenStreetMap yang gratis dan mudah di-cache oleh Service Worker */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Position Marker */}
        {userPosition && (
          <Marker position={userPosition} icon={UserIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}
        
        {/* Render Saved Locations */}
        {filteredLocations.map((loc) => (
          <Marker 
            key={loc.id} 
            position={loc.position as [number, number]}
            icon={getCategoryIcon(loc.type, activeMarkerId === loc.id)}
            eventHandlers={{
              mouseover: () => setHoveredMarkerId(loc.id),
              mouseout: () => setHoveredMarkerId(null),
              click: () => setActiveMarkerId(loc.id),
              popupclose: () => setActiveMarkerId(null)
            }}
          >
            <Popup>
              <div className="p-1 min-w-[200px]">
                {editingLocationId === loc.id ? (
                  <form onSubmit={(e) => handleUpdateLocation(e, loc.id)} className="space-y-2">
                    <input 
                      type="text" 
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-electric-blue"
                      required
                    />
                    <select 
                      value={editFormData.type}
                      onChange={(e) => setEditFormData({...editFormData, type: e.target.value})}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-electric-blue"
                    >
                      <option value="sunset">Sunset Point</option>
                      <option value="clinic">Clinic / Health</option>
                      <option value="police">Police Station</option>
                      <option value="bike">Bike Rental</option>
                      <option value="snorkeling">Snorkeling Spot</option>
                      <option value="port">Port</option>
                      <option value="restaurant">Restaurant / Cafe</option>
                      <option value="diving">Diving Spot</option>
                    </select>
                    <textarea 
                      value={editFormData.desc}
                      onChange={(e) => setEditFormData({...editFormData, desc: e.target.value})}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm h-16 resize-none focus:outline-none focus:ring-1 focus:ring-electric-blue"
                      required
                    />
                    <div className="flex gap-2 pt-1">
                      <button 
                        type="button"
                        onClick={() => setEditingLocationId(null)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 px-2 rounded text-xs font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={isUpdating}
                        className="flex-1 bg-electric-blue hover:bg-electric-blue-dark text-white py-1 px-2 rounded text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {isUpdating ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h3 className="font-bold text-lg text-slate-800">{loc.name}</h3>
                    <span className="inline-block bg-electric-blue/10 text-electric-blue text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider mb-2">
                      {loc.type}
                    </span>
                    <p className="text-sm text-slate-600 mb-3">{loc.desc}</p>
                    <div className="flex gap-2">
                      <button className="flex-1 bg-electric-blue hover:bg-electric-blue-dark text-white py-1.5 px-3 rounded-md text-sm font-medium transition-colors">
                        View Details
                      </button>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => startEditing(loc)}
                            className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-700 py-1.5 px-3 rounded-md text-sm font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteLocation(loc.id)}
                            className="bg-rose-100 hover:bg-rose-200 text-rose-700 py-1.5 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
                            title="Delete Location"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render New Location Preview */}
        {newLocationCoords && (
          <Marker position={newLocationCoords}>
            <Popup>New Location</Popup>
          </Marker>
        )}
      </MapContainer>
      
      {/* Floating Action Buttons */}
      {isAdmin && (
        <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-4">
          <button 
            onClick={handleSeedData}
            disabled={isLoading}
            className="glass dark:glass-dark text-electric-blue p-4 rounded-[2rem] shadow-2xl hover:bg-white/20 dark:hover:bg-slate-800/40 transition-all flex items-center justify-center border border-white/20 active:scale-90"
            title="Seed Map with Guide Data"
          >
            {isLoading ? <Loader2 className="animate-spin" size={28} /> : <Database size={28} />}
          </button>
          <button 
            onClick={() => {
              setIsAddingMode(!isAddingMode);
              setNewLocationCoords(null);
            }}
            className={`${isAddingMode ? 'bg-rose-600' : 'bg-electric-blue'} text-white p-4 rounded-[2rem] shadow-2xl hover:opacity-90 transition-all flex items-center justify-center active:scale-90 border border-white/20`}
            title={isAddingMode ? "Cancel Add" : "Add Location"}
          >
            {isAddingMode ? <X size={28} /> : <Plus size={28} />}
          </button>
        </div>
      )}

      {/* Modal Form Tambah Lokasi */}
      <AnimatePresence>
        {newLocationCoords && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass dark:glass-dark w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">NEW LOCATION</h3>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mt-1">Configure point of interest</p>
                  </div>
                  <button 
                    onClick={() => setNewLocationCoords(null)}
                    className="p-3 rounded-2xl hover:bg-white/10 dark:hover:bg-slate-800/40 text-slate-400 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleCreateLocation} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Location Name</label>
                    <input 
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Sunset Bar"
                      className="w-full bg-white/5 dark:bg-slate-900/50 border border-white/10 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Category</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full bg-white/5 dark:bg-slate-900/50 border border-white/10 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all font-bold appearance-none"
                    >
                      <option value="sunset" className="dark:bg-slate-900">Sunset Point</option>
                      <option value="clinic" className="dark:bg-slate-900">Health / Clinic</option>
                      <option value="police" className="dark:bg-slate-900">Police Station</option>
                      <option value="bike" className="dark:bg-slate-900">Bike Rental</option>
                      <option value="snorkeling" className="dark:bg-slate-900">Snorkeling Spot</option>
                      <option value="port" className="dark:bg-slate-900">Port / Harbor</option>
                      <option value="restaurant" className="dark:bg-slate-900">Restaurant / Cafe</option>
                      <option value="diving" className="dark:bg-slate-900">Diving Center</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Description</label>
                    <textarea 
                      value={formData.desc}
                      onChange={(e) => setFormData({...formData, desc: e.target.value})}
                      placeholder="Tell us about this place..."
                      rows={3}
                      className="w-full bg-white/5 dark:bg-slate-900/50 border border-white/10 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-blue/50 transition-all font-bold resize-none"
                      required
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setNewLocationCoords(null)}
                      className="flex-1 py-4 rounded-2xl border border-white/10 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting || !formData.name.trim() || !formData.desc.trim()}
                      className="flex-1 bg-electric-blue hover:bg-electric-blue-dark text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-electric-blue/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                      Save Location
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmModal.isOpen}
        title="Delete Location"
        message="Are you sure you want to delete this location? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmModal({ isOpen: false, id: '' })}
      />
    </div>
  );
}
