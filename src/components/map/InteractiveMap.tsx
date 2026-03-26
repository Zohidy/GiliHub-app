import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { Plus, X, MapPin, Navigation, Loader2, Trash2, Database, Search, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

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
  html: `<div class="w-4 h-4 bg-sky-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

L.Marker.prototype.options.icon = DefaultIcon;

const getCategoryIcon = (type: string, isActive: boolean) => {
  const colors: Record<string, string> = {
    sunset: 'bg-orange-500',
    clinic: 'bg-rose-500',
    police: 'bg-blue-600',
    bike: 'bg-emerald-500',
    snorkeling: 'bg-sky-400',
    port: 'bg-slate-700',
    restaurant: 'bg-amber-500',
    diving: 'bg-indigo-600'
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
      alert("Location access denied or unavailable.");
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
        className="bg-white p-2.5 rounded-xl shadow-md border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center text-sky-600"
        title="Locate Me"
      >
        <Navigation size={20} />
      </button>
    </div>
  );
}

export default function InteractiveMap() {
  const { user, userData } = useAuth();
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

  const handleDeleteLocation = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return;
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
          <Loader2 className="animate-spin text-sky-600" size={48} />
        </div>
      )}

      {/* Quick Jump Buttons */}
      <div className="absolute bottom-24 left-4 right-20 z-[1000] flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {quickJumps.map((jump, i) => (
          <button
            key={i}
            onClick={() => {
              const map = (window as any).leafletMap;
              if (map) map.flyTo(jump.pos, 17);
            }}
            className="bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-700 py-2 px-4 rounded-2xl shadow-lg hover:bg-sky-50 transition-all text-[10px] font-bold uppercase tracking-wider whitespace-nowrap active:scale-95"
          >
            {jump.name}
          </button>
        ))}
      </div>

      {/* Banner Mode Tambah Lokasi */}
      {isAddingMode && !newLocationCoords && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-sky-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-bounce">
          Click anywhere on the map to add a pin
        </div>
      )}

      {/* Search and Filter */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search locations..."
            className="w-full bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 py-2.5 pl-10 pr-4 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 py-2.5 px-3 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium cursor-pointer"
        >
          <option value="all">Categories</option>
          <option value="sunset">Sunset</option>
          <option value="clinic">Health</option>
          <option value="police">Police</option>
          <option value="bike">Bike</option>
          <option value="snorkeling">Snorkel</option>
          <option value="port">Port</option>
          <option value="restaurant">Food</option>
          <option value="diving">Diving</option>
        </select>
      </div>

      {/* Legend Toggle */}
      <div className="absolute top-20 right-4 z-[1000]">
        <button 
          onClick={() => setShowLegend(!showLegend)}
          className="bg-white p-2.5 rounded-xl shadow-md border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center text-sky-600"
          title="Map Legend"
        >
          <Info size={20} />
        </button>
      </div>

      {/* Legend Content */}
      <AnimatePresence>
        {showLegend && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-32 right-4 z-[1000] bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-xl w-48"
          >
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3">Map Legend</h4>
            <div className="space-y-2">
              {[
                { type: 'sunset', label: 'Sunset Point', color: 'bg-orange-500' },
                { type: 'clinic', label: 'Clinic / Health', color: 'bg-rose-500' },
                { type: 'police', label: 'Police Station', color: 'bg-blue-600' },
                { type: 'bike', label: 'Bike Rental', color: 'bg-emerald-500' },
                { type: 'snorkeling', label: 'Snorkeling', color: 'bg-sky-400' },
                { type: 'port', label: 'Harbor / Port', color: 'bg-slate-700' },
                { type: 'restaurant', label: 'Food / Cafe', color: 'bg-amber-500' },
                { type: 'diving', label: 'Diving Spot', color: 'bg-indigo-600' },
              ].map((item) => (
                <div key={item.type} className="flex items-center gap-3">
                  <div className={`w-3 h-3 ${item.color} rounded-full border border-white shadow-sm`}></div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
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
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                      required
                    />
                    <select 
                      value={editFormData.type}
                      onChange={(e) => setEditFormData({...editFormData, type: e.target.value})}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
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
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm h-16 resize-none focus:outline-none focus:ring-1 focus:ring-sky-500"
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
                        className="flex-1 bg-sky-600 hover:bg-sky-700 text-white py-1 px-2 rounded text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {isUpdating ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h3 className="font-bold text-lg text-slate-800">{loc.name}</h3>
                    <span className="inline-block bg-sky-100 text-sky-800 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider mb-2">
                      {loc.type}
                    </span>
                    <p className="text-sm text-slate-600 mb-3">{loc.desc}</p>
                    <div className="flex gap-2">
                      <button className="flex-1 bg-sky-600 hover:bg-sky-700 text-white py-1.5 px-3 rounded-md text-sm font-medium transition-colors">
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
        <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-3">
          <button 
            onClick={handleSeedData}
            disabled={isLoading}
            className="bg-white text-sky-600 p-3.5 rounded-full shadow-lg hover:bg-sky-50 transition-colors flex items-center justify-center border border-sky-100"
            title="Seed Map with Guide Data"
          >
            {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Database size={24} />}
          </button>
          <button 
            onClick={() => {
              setIsAddingMode(!isAddingMode);
              setNewLocationCoords(null);
            }}
            className={`${isAddingMode ? 'bg-rose-500 text-white' : 'bg-sky-600 text-white'} p-3.5 rounded-full shadow-lg hover:opacity-90 transition-colors flex items-center justify-center`}
            title={isAddingMode ? "Cancel Add" : "Add Location"}
          >
            {isAddingMode ? <X size={24} /> : <Plus size={24} />}
          </button>
        </div>
      )}

      {/* Modal Form Tambah Lokasi */}
      {newLocationCoords && (
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[1000] p-6 animate-in slide-in-from-bottom-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="text-sky-600" size={20} />
              New Location Details
            </h3>
            <button 
              onClick={() => setNewLocationCoords(null)}
              className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full"
            >
              <X size={18} />
            </button>
          </div>
          
          <form onSubmit={handleCreateLocation} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Place Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Example: North Sunset Point"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
                maxLength={100}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Short Description</label>
              <textarea 
                value={formData.desc}
                onChange={(e) => setFormData({...formData, desc: e.target.value})}
                placeholder="Describe this place..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
                maxLength={500}
              ></textarea>
            </div>
            
            <button 
              type="submit"
              disabled={isSubmitting || !formData.name.trim() || !formData.desc.trim()}
              className="w-full bg-sky-600 text-white font-bold py-3 rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? 'Saving...' : 'Save Location'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
