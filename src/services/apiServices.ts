/**
 * API Services for GiliHub
 * Handles external API calls for Weather, Currency, Tides, and Images.
 */

// Open-Meteo API (Free, no key required)
const GILI_TRAWANGAN_COORDS = { lat: -8.3507, lon: 116.0375 };

export async function getWeatherData() {
  try {
    // Using Open-Meteo (Completely free, no API key required)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${GILI_TRAWANGAN_COORDS.lat}&longitude=${GILI_TRAWANGAN_COORDS.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`
    );
    if (!response.ok) throw new Error('Weather data fetch failed');
    const data = await response.json();
    if (data.error) throw new Error(data.reason || 'API returned an error');

    // Map WMO weather codes to standard UI format
    const code = data.current.weather_code;
    let main = 'Clear', desc = 'Clear sky', icon = '01d';
    if (code >= 1 && code <= 3) { main = 'Clouds'; desc = 'Partly cloudy'; icon = '02d'; }
    else if (code >= 51 && code <= 65) { main = 'Rain'; desc = 'Rain'; icon = '10d'; }
    else if (code >= 95) { main = 'Thunderstorm'; desc = 'Thunderstorm'; icon = '11d'; }

    return {
      main: { temp: data.current.temperature_2m, humidity: data.current.relative_humidity_2m, feels_like: data.current.apparent_temperature },
      weather: [{ main, description: desc, icon }],
      wind: { speed: data.current.wind_speed_10m },
      name: 'Gili Trawangan'
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    // Return mock data on error
    return {
      main: { temp: 28.5, humidity: 75, feels_like: 31.2 },
      weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
      wind: { speed: 4.5 },
      name: 'Gili Trawangan'
    };
  }
}

// ExchangeRate-API (Free tier, no key required for basic rates)
export async function getExchangeRates(baseCurrency = 'IDR') {
  try {
    // Using ExchangeRate-API free tier (No API key required, supports CORS)
    const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
    if (!response.ok) throw new Error('Exchange rate fetch failed');
    const data = await response.json();
    return {
      conversion_rates: {
        [baseCurrency]: 1,
        ...data.rates
      }
    };
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // Return mock data on error
    return {
      conversion_rates: {
        IDR: 1,
        USD: 0.000063,
        EUR: 0.000058,
        AUD: 0.000096,
        GBP: 0.000050,
      }
    };
  }
}

// Unsplash API
const UNSPLASH_ACCESS_KEY = (import.meta as any).env.VITE_UNSPLASH_ACCESS_KEY;

export async function getIslandImages(query = 'Gili Trawangan', count = 5) {
  if (!UNSPLASH_ACCESS_KEY) {
    // Return mock data if no API key
    return Array(count).fill(null).map((_, i) => ({
      id: `mock-${i}`,
      urls: { 
        regular: `https://picsum.photos/seed/gili${i}/800/600`,
        small: `https://picsum.photos/seed/gili${i}/400/300`
      },
      alt_description: 'Gili Trawangan scenery',
      user: { name: 'GiliHub Explorer' }
    }));
  }
  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${query}&count=${count}&client_id=${UNSPLASH_ACCESS_KEY}`
    );
    if (!response.ok) throw new Error('Unsplash images fetch failed');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Unsplash images:', error);
    // Return mock data on error
    return Array(count).fill(null).map((_, i) => ({
      id: `mock-${i}`,
      urls: { 
        regular: `https://picsum.photos/seed/gili${i}/800/600`,
        small: `https://picsum.photos/seed/gili${i}/400/300`
      },
      alt_description: 'Gili Trawangan scenery',
      user: { name: 'GiliHub Explorer' }
    }));
  }
}

// YouTube API
const YOUTUBE_API_KEY = (import.meta as any).env.VITE_YOUTUBE_API_KEY;

export const fetchYouTubeVideos = async (query: string = 'Gili Trawangan') => {
  if (!YOUTUBE_API_KEY) {
    // Return mock data if no API key
    return [
      { id: { videoId: 'mock1' }, snippet: { title: 'Gili Trawangan Guide', channelTitle: 'GiliHub', thumbnails: { high: { url: 'https://picsum.photos/seed/yt1/320/180' }, medium: { url: 'https://picsum.photos/seed/yt1/320/180' } } } },
      { id: { videoId: 'mock2' }, snippet: { title: 'Snorkeling with Turtles', channelTitle: 'GiliHub', thumbnails: { high: { url: 'https://picsum.photos/seed/yt2/320/180' }, medium: { url: 'https://picsum.photos/seed/yt2/320/180' } } } },
      { id: { videoId: 'mock3' }, snippet: { title: 'Best Beaches in Gili', channelTitle: 'GiliHub', thumbnails: { high: { url: 'https://picsum.photos/seed/yt3/320/180' }, medium: { url: 'https://picsum.photos/seed/yt3/320/180' } } } },
    ];
  }
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&q=${query}&type=video&key=${YOUTUBE_API_KEY}`
    );
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('YouTube API error:', error);
    // Return mock data on error
    return [
      { id: { videoId: 'mock1' }, snippet: { title: 'Gili Trawangan Guide', channelTitle: 'GiliHub', thumbnails: { high: { url: 'https://picsum.photos/seed/yt1/320/180' }, medium: { url: 'https://picsum.photos/seed/yt1/320/180' } } } },
      { id: { videoId: 'mock2' }, snippet: { title: 'Snorkeling with Turtles', channelTitle: 'GiliHub', thumbnails: { high: { url: 'https://picsum.photos/seed/yt2/320/180' }, medium: { url: 'https://picsum.photos/seed/yt2/320/180' } } } },
      { id: { videoId: 'mock3' }, snippet: { title: 'Best Beaches in Gili', channelTitle: 'GiliHub', thumbnails: { high: { url: 'https://picsum.photos/seed/yt3/320/180' }, medium: { url: 'https://picsum.photos/seed/yt3/320/180' } } } },
    ];
  }
};

// World Tides API
const WORLDTIDES_API_KEY = (import.meta as any).env.VITE_WORLDTIDES_API_KEY;

export async function getTideData() {
  if (!WORLDTIDES_API_KEY) {
    // Return mock data if no API key
    return {
      extremes: [
        { type: 'High', date: new Date().toISOString(), height: 1.5 },
        { type: 'Low', date: new Date(Date.now() + 6 * 3600 * 1000).toISOString(), height: 0.2 },
        { type: 'High', date: new Date(Date.now() + 12 * 3600 * 1000).toISOString(), height: 1.4 },
        { type: 'Low', date: new Date(Date.now() + 18 * 3600 * 1000).toISOString(), height: 0.3 },
      ]
    };
  }
  try {
    // Using Gili Trawangan coordinates
    const response = await fetch(
      `https://www.worldtides.info/api/v3?heights&extremes&lat=${GILI_TRAWANGAN_COORDS.lat}&lon=${GILI_TRAWANGAN_COORDS.lon}&key=${WORLDTIDES_API_KEY}`
    );
    if (!response.ok) throw new Error('Tide data fetch failed');
    return await response.json();
  } catch (error) {
    console.error('Error fetching tide data:', error);
    // Return mock data on error
    return {
      extremes: [
        { type: 'High', date: new Date().toISOString(), height: 1.5 },
        { type: 'Low', date: new Date(Date.now() + 6 * 3600 * 1000).toISOString(), height: 0.2 },
        { type: 'High', date: new Date(Date.now() + 12 * 3600 * 1000).toISOString(), height: 1.4 },
        { type: 'Low', date: new Date(Date.now() + 18 * 3600 * 1000).toISOString(), height: 0.3 },
      ]
    };
  }
}
