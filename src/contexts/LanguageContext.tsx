import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  id: {
    'welcome': 'Selamat Datang',
    'welcome_back': 'Selamat Datang Kembali',
    'explore': 'Jelajahi Gili Trawangan hari ini?',
    'home': 'Beranda',
    'map': 'Peta & Lokasi',
    'booking': 'Pemesanan',
    'events': 'Acara',
    'forum': 'Forum',
    'planner': 'Rencana Perjalanan',
    'chat': 'Pesan',
    'profile': 'Profil',
    'settings': 'Pengaturan',
    'navigate': 'Navigasi ke Google Maps',
    'reviews': 'Ulasan',
    'add_review': 'Tambah Ulasan',
    'no_reviews': 'Belum ada ulasan.',
    'rating': 'Rating',
    'comment': 'Komentar',
    'submit': 'Kirim',
    'cancel': 'Batal',
    'loading': 'Memuat...',
    'search_placeholder': 'Cari diskusi...',
    'quick_guide': 'Panduan Cepat Pulau',
    'view_on_map': 'Lihat di Peta',
    'island_views': 'Pemandangan Pulau',
    'today_events': 'Acara Hari Ini',
    'weather': 'Cuaca',
    'tides': 'Pasang Surut',
    'language': 'Bahasa',
    'dark_mode': 'Mode Gelap',
    'light_mode': 'Mode Terang',
    'notifications': 'Notifikasi',
    'offline_mode': 'Mode Offline (Data Tersimpan)',
    'please_login': 'Silakan login terlebih dahulu.',
    'error_occurred': 'Terjadi kesalahan.',
    'favorites': 'Favorit',
    'gili_insights': 'Wawasan Gili',
    'island_activity': 'Metrik aktivitas pulau waktu nyata',
    'booking_trends': 'Tren Pemesanan',
    'forum_activity': 'Aktivitas Forum',
    'event_distribution': 'Distribusi Acara',
    'add_favorite': 'Tambah ke Favorit',
    'remove_favorite': 'Hapus dari Favorit',
    'no_favorites': 'Belum ada favorit.',
    'save_itinerary': 'Simpan Rencana Perjalanan',
    'itinerary_saved': 'Rencana perjalanan berhasil disimpan!',
    'itinerary_error': 'Gagal menyimpan rencana perjalanan.',
    'my_itineraries': 'Rencana Perjalanan Saya',
    'share': 'Bagikan',
    'directions': 'Petunjuk Arah',
    'filter_all': 'Semua',
    'filter_sunset': 'Matahari Terbenam',
    'filter_clinic': 'Klinik',
    'filter_police': 'Polisi',
    'filter_bike': 'Sewa Sepeda',
    'filter_snorkeling': 'Snorkeling',
    'filter_port': 'Pelabuhan',
    'filter_restaurant': 'Restoran',
    'filter_diving': 'Menyelam',
  },
  en: {
    'welcome': 'Welcome',
    'welcome_back': 'Welcome Back',
    'explore': 'Ready to explore Gili Trawangan today?',
    'home': 'Home',
    'map': 'Map & Locations',
    'booking': 'Booking',
    'events': 'Events',
    'forum': 'Forum',
    'planner': 'Trip Planner',
    'chat': 'Chat',
    'profile': 'Profile',
    'settings': 'Settings',
    'navigate': 'Navigate to Google Maps',
    'reviews': 'Reviews',
    'add_review': 'Add Review',
    'no_reviews': 'No reviews yet.',
    'rating': 'Rating',
    'comment': 'Comment',
    'submit': 'Submit',
    'cancel': 'Cancel',
    'loading': 'Loading...',
    'search_placeholder': 'Search discussions...',
    'quick_guide': 'Island Quick Guide',
    'view_on_map': 'View on Map',
    'island_views': 'Island Views',
    'today_events': 'Today\'s Events',
    'weather': 'Weather',
    'tides': 'Tides',
    'language': 'Language',
    'dark_mode': 'Dark Mode',
    'light_mode': 'Light Mode',
    'notifications': 'Notifications',
    'offline_mode': 'Offline Mode (Cached Data)',
    'please_login': 'Please login first.',
    'error_occurred': 'An error occurred.',
    'favorites': 'Favorites',
    'gili_insights': 'Gili Insights',
    'island_activity': 'Real-time island activity metrics',
    'booking_trends': 'Booking Trends',
    'forum_activity': 'Forum Activity',
    'event_distribution': 'Event Distribution',
    'add_favorite': 'Add to Favorites',
    'remove_favorite': 'Remove from Favorites',
    'no_favorites': 'No favorites yet.',
    'save_itinerary': 'Save Itinerary',
    'itinerary_saved': 'Itinerary saved successfully!',
    'itinerary_error': 'Failed to save itinerary.',
    'my_itineraries': 'My Itineraries',
    'share': 'Share',
    'directions': 'Directions',
    'filter_all': 'All',
    'filter_sunset': 'Sunset',
    'filter_clinic': 'Clinic',
    'filter_police': 'Police',
    'filter_bike': 'Bike Rental',
    'filter_snorkeling': 'Snorkeling',
    'filter_port': 'Port',
    'filter_restaurant': 'Restaurant',
    'filter_diving': 'Diving',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('gilihub_lang');
    return (saved as Language) || 'id';
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('gilihub_lang', lang);
  };

  const t = (key: string) => {
    return (translations[language] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
