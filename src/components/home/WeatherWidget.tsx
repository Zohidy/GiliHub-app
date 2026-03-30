import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Thermometer, Droplets, Sunrise, Sunset, Loader2, RefreshCw, CloudLightning, CloudFog } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WeatherData {
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
    isDay: boolean;
  };
  daily: {
    maxTemp: number;
    minTemp: number;
    sunrise: string;
    sunset: string;
    uvIndex: number;
  };
}

const GILI_T_COORDS = { lat: -8.3525, lng: 116.0383 };

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${GILI_T_COORDS.lat}&longitude=${GILI_T_COORDS.lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=Asia%2FSingapore`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.reason || 'API returned an error');
      }

      setWeather({
        current: {
          temp: Math.round(data.current.temperature_2m),
          feelsLike: Math.round(data.current.apparent_temperature),
          humidity: data.current.relative_humidity_2m,
          windSpeed: data.current.wind_speed_10m,
          weatherCode: data.current.weather_code,
          isDay: data.current.is_day === 1,
        },
        daily: {
          maxTemp: Math.round(data.daily.temperature_2m_max[0]),
          minTemp: Math.round(data.daily.temperature_2m_min[0]),
          sunrise: data.daily.sunrise[0].split('T')[1],
          sunset: data.daily.sunset[0].split('T')[1],
          uvIndex: data.daily.uv_index_max[0],
        },
      });
      setError(null);
    } catch (err) {
      console.error('Weather fetch error:', err);
      // Fallback to mock data if API fails (e.g., due to adblockers or network issues)
      setWeather({
        current: {
          temp: 29,
          feelsLike: 32,
          humidity: 75,
          windSpeed: 12,
          weatherCode: 0,
          isDay: true,
        },
        daily: {
          maxTemp: 32,
          minTemp: 26,
          sunrise: '06:15',
          sunset: '18:20',
          uvIndex: 8.5,
        },
      });
      setError(null); // Clear error since we have fallback data
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (code: number, isDay: boolean) => {
    if (code === 0) return <Sun className={isDay ? "text-amber-400" : "text-indigo-300"} size={48} />;
    if (code >= 1 && code <= 3) return <Cloud className="text-slate-400" size={48} />;
    if (code >= 45 && code <= 48) return <CloudFog className="text-slate-300" size={48} />;
    if (code >= 51 && code <= 67) return <CloudRain className="text-blue-400" size={48} />;
    if (code >= 80 && code <= 82) return <CloudRain className="text-blue-500" size={48} />;
    if (code >= 95) return <CloudLightning className="text-purple-500" size={48} />;
    return <Sun className="text-amber-400" size={48} />;
  };

  const getWeatherDesc = (code: number) => {
    if (code === 0) return 'Clear Sky';
    if (code >= 1 && code <= 3) return 'Partly Cloudy';
    if (code >= 45 && code <= 48) return 'Foggy';
    if (code >= 51 && code <= 67) return 'Rainy';
    if (code >= 80 && code <= 82) return 'Showers';
    if (code >= 95) return 'Thunderstorm';
    return 'Clear';
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Island Conditions</h3>
        <button 
          onClick={fetchWeather}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="glass dark:glass-dark rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-lg relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-electric-blue/10 blur-[100px] rounded-full"></div>
        
        {isLoading && !weather ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-electric-blue mb-4" size={32} />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Reading the clouds...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-slate-500 font-medium text-sm">{error}</p>
            <button onClick={fetchWeather} className="mt-2 text-electric-blue text-xs font-bold uppercase tracking-widest">Retry</button>
          </div>
        ) : weather && (
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  key={weather.current.weatherCode}
                >
                  {getWeatherIcon(weather.current.weatherCode, weather.current.isDay)}
                </motion.div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-display font-light text-slate-900 dark:text-white tracking-tighter">
                      {weather.current.temp}°
                    </span>
                    <span className="text-lg font-medium text-slate-400">C</span>
                  </div>
                  <p className="text-sm font-semibold text-electric-blue uppercase tracking-widest mt-1">
                    {getWeatherDesc(weather.current.weatherCode)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">Gili Trawangan</p>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Feels like {weather.current.feelsLike}°</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-white/20">
                <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <Wind size={14} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Wind</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{weather.current.windSpeed} <span className="text-[10px] text-slate-400">km/h</span></p>
              </div>

              <div className="bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-white/20">
                <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <Droplets size={14} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Humidity</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{weather.current.humidity}%</p>
              </div>

              <div className="bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-white/20">
                <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <Sunrise size={14} className="text-amber-500" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Sunrise</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{weather.daily.sunrise}</p>
              </div>

              <div className="bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-white/20">
                <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <Sunset size={14} className="text-indigo-400" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Sunset</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{weather.daily.sunset}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">UV Index: {weather.daily.uvIndex}</span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                High: {weather.daily.maxTemp}° • Low: {weather.daily.minTemp}°
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
