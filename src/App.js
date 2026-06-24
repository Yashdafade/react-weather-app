import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';
import WeatherCanvas from './components/Scene3D';
import LandingPage from './components/LandingPage';
import WeatherDashboard from './components/WeatherDashboard';
import './App.css';

const apiKey = process.env.REACT_APP_WEATHER_API_KEY;
const RECENT_KEY = 'nimbus_recent';
const MAX_RECENT = 8;

function getRecentSearches() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
  catch { return []; }
}

function saveRecentSearch(entry) {
  const recent = getRecentSearches();
  const filtered = recent.filter(
    (r) => !(Math.abs(r.lat - entry.lat) < 0.01 && Math.abs(r.lon - entry.lon) < 0.01)
  );
  filtered.unshift(entry);
  localStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, MAX_RECENT)));
}

function RedirectHome() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/', { replace: true }); }, [navigate]);
  return null;
}

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();

  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [unit, setUnit] = useState('metric');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weatherCondition, setWeatherCondition] = useState(null);
  const [userCountry, setUserCountry] = useState(null);
  const [recentSearches, setRecentSearches] = useState(getRecentSearches);

  const didAutoLocate = useRef(false);

  const fetchAirQuality = useCallback(async (lat, lon) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
      );
      if (res.ok) {
        const data = await res.json();
        return data.list?.[0] || null;
      }
    } catch (_) { /* best-effort */ }
    return null;
  }, []);

  const fetchWeather = useCallback(async (url, forecastUrl, coords) => {
    if (!apiKey) { setError('API key missing.'); return; }
    setLoading(true);
    setError(null);

    try {
      const [weatherRes, forecastRes] = await Promise.all([fetch(url), fetch(forecastUrl)]);

      if (!weatherRes.ok) {
        setError(weatherRes.status === 404 ? 'City not found.' : 'Something went wrong.');
        setLoading(false);
        return;
      }

      const weatherData = await weatherRes.json();
      const forecastData = forecastRes.ok ? await forecastRes.json() : null;

      const lat = coords?.lat ?? weatherData.coord?.lat;
      const lon = coords?.lon ?? weatherData.coord?.lon;
      const aqiData = await fetchAirQuality(lat, lon);

      if (weatherData.sys?.country && !userCountry) {
        setUserCountry(weatherData.sys.country);
      }

      setWeather(weatherData);
      setForecast(forecastData);
      setAirQuality(aqiData);
      setWeatherCondition(weatherData.weather?.[0]?.main || null);

      const entry = {
        name: weatherData.name,
        country: weatherData.sys?.country,
        lat: weatherData.coord?.lat,
        lon: weatherData.coord?.lon,
        temp: Math.round(weatherData.main?.temp),
        condition: weatherData.weather?.[0]?.main,
        description: weatherData.weather?.[0]?.description,
        timestamp: Date.now(),
      };
      saveRecentSearch(entry);
      setRecentSearches(getRecentSearches());

      navigate('/weather');
    } catch (_) {
      setError('Network error. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [userCountry, navigate, fetchAirQuality]);

  const handleSearch = useCallback((city) => {
    const w = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    const f = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    fetchWeather(w, f);
  }, [fetchWeather]);

  const handleSearchByCoords = useCallback((lat, lon) => {
    const w = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const f = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    fetchWeather(w, f, { lat, lon });
  }, [fetchWeather]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation || !apiKey) return;
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
        } catch (_) { /* best-effort */ }
        handleSearchByCoords(latitude, longitude);
      },
      () => { setLoading(false); },
      { timeout: 8000 }
    );
  }, [handleSearchByCoords]);

  useEffect(() => {
    if (didAutoLocate.current) return;
    didAutoLocate.current = true;
    detectLocation();
  }, [detectLocation]);

  useEffect(() => {
    if (location.pathname === '/') setWeatherCondition(null);
  }, [location.pathname]);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleToggleUnit = useCallback(() => {
    setUnit((u) => (u === 'metric' ? 'imperial' : 'metric'));
  }, []);

  const handleRecentClick = useCallback((entry) => {
    handleSearchByCoords(entry.lat, entry.lon);
  }, [handleSearchByCoords]);

  const bgClass = weatherCondition ? `bg-${weatherCondition.toLowerCase()}` : 'bg-default';

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
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <LandingPage
                  onSearch={handleSearch}
                  onSearchByCoords={handleSearchByCoords}
                  onLocationSearch={detectLocation}
                  loading={loading}
                  userCountry={userCountry}
                  recentSearches={recentSearches}
                  onRecentClick={handleRecentClick}
                />
              }
            />
            <Route
              path="/weather"
              element={
                weather ? (
                  <WeatherDashboard
                    weather={weather}
                    forecast={forecast}
                    airQuality={airQuality}
                    unit={unit}
                    onBack={handleBack}
                    onToggleUnit={handleToggleUnit}
                  />
                ) : (
                  <RedirectHome />
                )
              }
            />
            <Route path="*" element={<RedirectHome />} />
          </Routes>
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

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
