import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Mengambil alih kontrol klien segera setelah SW aktif
clientsClaim();

// Precache semua aset statis yang dihasilkan oleh Vite
// Self.__WB_MANIFEST akan diganti dengan daftar file saat build
precacheAndRoute((self as any).__WB_MANIFEST || []);

// Fallback untuk navigasi SPA (Single Page Application)
// Mengarahkan semua permintaan navigasi ke index.html
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler, {
  // Jangan gunakan fallback untuk URL yang spesifik (misal: API)
  denylist: [/^\/api/, /^\/firebase/],
});
registerRoute(navigationRoute);

// Strategi Caching: Stale-While-Revalidate untuk API atau data dinamis (non-Firestore)
// Cocok untuk jadwal boat atau cuaca yang sering berubah tapi butuh akses cepat
registerRoute(
  ({ url }) => url.origin === 'https://api.gilihub.com' || url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 1 Hari
      }),
    ],
  })
);

// Strategi Caching: Cache-First untuk Map Tiles (Leaflet/OpenStreetMap)
// Sangat penting untuk peta offline di Gili Trawangan
registerRoute(
  ({ url }) => url.origin.includes('tile.openstreetmap.org') || url.pathname.endsWith('.png'),
  new CacheFirst({
    cacheName: 'map-tiles-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 1000, // Simpan banyak tile peta
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Hari
        purgeOnQuotaError: true, // Hapus jika penyimpanan penuh
      }),
    ],
  })
);

// Mendengarkan pesan dari aplikasi untuk memaksa pembaruan SW
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    (self as any).skipWaiting();
  }
});
