/**
 * API Services for GiliHub
 * Handles external API calls for Weather, Currency, Tides, and Images.
 */

// OpenWeatherMap API
const OPENWEATHER_API_KEY = (import.meta as any).env.VITE_OPENWEATHER_API_KEY;
const GILI_TRAWANGAN_COORDS = { lat: -8.3507, lon: 116.0375 };

export async function getWeatherData() {
  if (!OPENWEATHER_API_KEY) return null;
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${GILI_TRAWANGAN_COORDS.lat}&lon=${GILI_TRAWANGAN_COORDS.lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    if (!response.ok) throw new Error('Weather data fetch failed');
    return await response.json();
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

// ExchangeRate-API
const EXCHANGERATE_API_KEY = (import.meta as any).env.VITE_EXCHANGERATE_API_KEY;

export async function getExchangeRates(baseCurrency = 'IDR') {
  if (!EXCHANGERATE_API_KEY) return null;
  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/${baseCurrency}`
    );
    if (!response.ok) throw new Error('Exchange rate fetch failed');
    return await response.json();
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return null;
  }
}

// Unsplash API
const UNSPLASH_ACCESS_KEY = (import.meta as any).env.VITE_UNSPLASH_ACCESS_KEY;

export async function getIslandImages(query = 'Gili Trawangan', count = 5) {
  if (!UNSPLASH_ACCESS_KEY) return null;
  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${query}&count=${count}&client_id=${UNSPLASH_ACCESS_KEY}`
    );
    if (!response.ok) throw new Error('Unsplash images fetch failed');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Unsplash images:', error);
    return null;
  }
}

// YouTube API
const YOUTUBE_API_KEY = (import.meta as any).env.VITE_YOUTUBE_API_KEY;

export const fetchYouTubeVideos = async (query: string = 'Gili Trawangan') => {
  if (!YOUTUBE_API_KEY) return [];
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&q=${query}&type=video&key=${YOUTUBE_API_KEY}`
    );
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('YouTube API error:', error);
    return [];
  }
};

// World Tides API
const WORLDTIDES_API_KEY = (import.meta as any).env.VITE_WORLDTIDES_API_KEY;

export async function getTideData() {
  if (!WORLDTIDES_API_KEY) return null;
  try {
    // Using Gili Trawangan coordinates
    const response = await fetch(
      `https://www.worldtides.info/api/v3?heights&extremes&lat=${GILI_TRAWANGAN_COORDS.lat}&lon=${GILI_TRAWANGAN_COORDS.lon}&key=${WORLDTIDES_API_KEY}`
    );
    if (!response.ok) throw new Error('Tide data fetch failed');
    return await response.json();
  } catch (error) {
    console.error('Error fetching tide data:', error);
    return null;
  }
}
