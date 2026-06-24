import React, { useState, useCallback } from 'react';
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

  const fetchWeather = useCallback(async (url, forecastUrl) => {
    if (!apiKey) {
      setError('Weather API key is missing. Please add REACT_APP_WEATHER_API_KEY to your .env file.');
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
        if (weatherRes.status === 404) {
          setError('City not found. Please try another city name.');
        } else {
          setError('Something went wrong. Please try again.');
        }
        setLoading(false);
        return;
      }

      const weatherData = await weatherRes.json();
      const forecastData = forecastRes.ok ? await forecastRes.json() : null;

      setWeather(weatherData);
      setForecast(forecastData);
      setWeatherCondition(weatherData.weather?.[0]?.main || null);
      setView('dashboard');
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((city) => {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    fetchWeather(weatherUrl, forecastUrl);
  }, [fetchWeather]);

  const handleLocationSearch = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
        fetchWeather(weatherUrl, forecastUrl);
      },
      () => {
        setError('Unable to get your location. Please allow location access.');
        setLoading(false);
      },
      { timeout: 10000 }
    );
  }, [fetchWeather]);

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
              onLocationSearch={handleLocationSearch}
              loading={loading}
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
