import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';
import WeatherCanvas from './components/Scene3D';
import LandingPage from './components/LandingPage';
import WeatherDashboard from './components/WeatherDashboard';
import './App.css';

const apiKey = process.env.REACT_APP_WEATHER_API_KEY;

function App() {
  const [view, setView] = useState('landing');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [unit, setUnit] = useState('metric');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weatherCondition, setWeatherCondition] = useState(null);
  const [userCountry, setUserCountry] = useState(null);

  const didAutoLocate = useRef(false);

  const fetchWeather = useCallback(async (url, forecastUrl) => {
    if (!apiKey) {
      setError('API key missing. Add REACT_APP_WEATHER_API_KEY to .env');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [weatherRes, forecastRes] = await Promise.all([
        fetch(url),
        fetch(forecastUrl),
      ]);

      if (!weatherRes.ok) {
        setError(weatherRes.status === 404 ? 'City not found.' : 'Something went wrong.');
        setLoading(false);
        return;
      }

      const weatherData = await weatherRes.json();
      const forecastData = forecastRes.ok ? await forecastRes.json() : null;

      if (weatherData.sys?.country && !userCountry) {
        setUserCountry(weatherData.sys.country);
      }

      setWeather(weatherData);
      setForecast(forecastData);
      setWeatherCondition(weatherData.weather?.[0]?.main || null);
      setView('dashboard');
    } catch (err) {
      setError('Network error. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [userCountry]);

  const handleSearch = useCallback((city) => {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    fetchWeather(weatherUrl, forecastUrl);
  }, [fetchWeather]);

  const handleSearchByCoords = useCallback((lat, lon) => {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    fetchWeather(weatherUrl, forecastUrl);
  }, [fetchWeather]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation || !apiKey) {
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data[0]?.country) setUserCountry(data[0].country);
          }
        } catch (_) { /* ignore — country detection is best-effort */ }

        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
        fetchWeather(weatherUrl, forecastUrl);
      },
      () => {
        setLoading(false);
      },
      { timeout: 8000 }
    );
  }, [fetchWeather]);

  useEffect(() => {
    if (didAutoLocate.current) return;
    didAutoLocate.current = true;
    detectLocation();
  }, [detectLocation]);

  const handleBack = useCallback(() => {
    setView('landing');
    setWeatherCondition(null);
  }, []);

  const handleToggleUnit = useCallback(() => {
    setUnit((u) => (u === 'metric' ? 'imperial' : 'metric'));
  }, []);

  const bgClass = weatherCondition
    ? `bg-${weatherCondition.toLowerCase()}`
    : 'bg-default';

  return (
    <div className={`app ${bgClass}`}>
      <div className="bg-gradient" />
      <WeatherCanvas weatherCondition={weatherCondition} />

      <div className="app-content">
        <AnimatePresence mode="wait">
          {error && (
            <div className="error-toast" key="error" onClick={() => setError(null)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6" />
                <path d="m9 9 6 6" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {view === 'landing' ? (
            <LandingPage
              key="landing"
              onSearch={handleSearch}
              onSearchByCoords={handleSearchByCoords}
              onLocationSearch={detectLocation}
              loading={loading}
              userCountry={userCountry}
            />
          ) : (
            <WeatherDashboard
              key="dashboard"
              weather={weather}
              forecast={forecast}
              unit={unit}
              onBack={handleBack}
              onToggleUnit={handleToggleUnit}
            />
          )}
        </AnimatePresence>
      </div>

      {loading && (
        <div className="global-loader">
          <div className="loader-bar" />
        </div>
      )}

      <Analytics />
    </div>
  );
}

export default App;
