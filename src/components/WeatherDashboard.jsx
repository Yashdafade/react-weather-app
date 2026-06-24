import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const weatherEmojis = {
  Clear: '☀️',
  Clouds: '☁️',
  Rain: '🌧️',
  Drizzle: '🌦️',
  Snow: '❄️',
  Thunderstorm: '⛈️',
  Mist: '🌫️',
  Smoke: '🌫️',
  Haze: '🌫️',
  Fog: '🌫️',
  Dust: '🌬️',
};

function AnimatedNumber({ value, suffix = '', duration = 0.8 }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const target = parseFloat(value) || 0;
    const startTime = Date.now();
    const startValue = prevRef.current;
    const dur = duration;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (dur * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (target - startValue) * eased;
      const rounded = Math.round(current * 10) / 10;
      setDisplay(rounded);
      prevRef.current = rounded;
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [value, duration]);

  return <span>{Math.round(display)}{suffix}</span>;
}

function WindDirectionArrow({ degree }) {
  return (
    <motion.div
      className="wind-arrow"
      style={{ transform: `rotate(${degree}deg)` }}
      initial={{ rotate: 0 }}
      animate={{ rotate: degree }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20" />
        <path d="m5 9 7-7 7 7" />
      </svg>
    </motion.div>
  );
}

function DetailCard({ icon, label, value, unit, delay = 0, children }) {
  return (
    <motion.div
      className="detail-card"
      initial={{ opacity: 0, y: 20, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.32, ease: 'easeOut' }}
      whileHover={{ scale: 1.03, y: -4 }}
    >
      <div className="detail-card-header">
        <span className="detail-icon">{icon}</span>
        <span className="detail-label">{label}</span>
      </div>
      <div className="detail-value">
        {value}
        {unit && <span className="detail-unit">{unit}</span>}
      </div>
      {children}
    </motion.div>
  );
}

function ForecastCard({ item, unit, index }) {
  const date = new Date(item.dt * 1000);
  const day = date.toLocaleDateString('en-US', { weekday: 'short' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
  const temp = unit === 'metric'
    ? Math.round(item.main.temp)
    : Math.round(item.main.temp * 9 / 5 + 32);
  const icon = weatherEmojis[item.weather[0].main] || '🌤️';

  return (
    <motion.div
      className="forecast-card"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.12 + index * 0.03, duration: 0.28 }}
      whileHover={{ scale: 1.05, y: -5 }}
    >
      <span className="forecast-day">{day}</span>
      <span className="forecast-time">{time}</span>
      <span className="forecast-emoji">{icon}</span>
      <span className="forecast-temp">{temp}°</span>
      <span className="forecast-desc">{item.weather[0].main}</span>
    </motion.div>
  );
}

function SunProgress({ sunrise, sunset, timezone }) {
  const now = Date.now() / 1000 + timezone;
  const sunriseLocal = sunrise + timezone;
  const sunsetLocal = sunset + timezone;
  const dayLength = sunsetLocal - sunriseLocal;
  const progress = Math.max(0, Math.min(1, (now - sunriseLocal) / dayLength));

  const sunriseTime = new Date(sunrise * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const sunsetTime = new Date(sunset * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="sun-progress">
      <div className="sun-arc">
        <svg viewBox="0 0 200 100" className="sun-arc-svg">
          <path
            d="M 10 90 Q 100 -10 190 90"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <circle
            cx={10 + progress * 180}
            cy={90 - Math.sin(progress * Math.PI) * 90}
            r="8"
            fill="#FDB813"
            className="sun-dot"
          />
        </svg>
      </div>
      <div className="sun-times">
        <span>{sunriseTime}</span>
        <span>{sunsetTime}</span>
      </div>
    </div>
  );
}

function WeatherDashboard({ weather, forecast, onBack, unit, onToggleUnit }) {
  if (!weather) return null;

  const temp = unit === 'metric'
    ? Math.round(weather.main.temp)
    : Math.round(weather.main.temp * 9 / 5 + 32);
  const feelsLike = unit === 'metric'
    ? Math.round(weather.main.feels_like)
    : Math.round(weather.main.feels_like * 9 / 5 + 32);
  const tempUnit = unit === 'metric' ? '°C' : '°F';
  const windSpeed = unit === 'metric'
    ? Math.round(weather.wind.speed * 3.6)
    : Math.round(weather.wind.speed * 2.237);
  const windUnit = unit === 'metric' ? 'km/h' : 'mph';
  const emoji = weatherEmojis[weather.weather[0].main] || '🌤️';
  const filteredForecast = forecast?.list?.filter((_, i) => i % 2 === 0).slice(0, 12) || [];

  const tempMin = unit === 'metric'
    ? Math.round(weather.main.temp_min)
    : Math.round(weather.main.temp_min * 9 / 5 + 32);
  const tempMax = unit === 'metric'
    ? Math.round(weather.main.temp_max)
    : Math.round(weather.main.temp_max * 9 / 5 + 32);

  return (
    <motion.div
      className="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.35 }}
    >
      <div className="dashboard-header">
        <motion.button
          className="back-btn"
          onClick={onBack}
          whileHover={{ scale: 1.1, x: -3 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08, duration: 0.3 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span>Search</span>
        </motion.button>

        <motion.button
          className="unit-toggle"
          onClick={onToggleUnit}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08, duration: 0.3 }}
        >
          <span className={unit === 'metric' ? 'active' : ''}>°C</span>
          <span className="toggle-divider">/</span>
          <span className={unit !== 'metric' ? 'active' : ''}>°F</span>
        </motion.button>
      </div>

      <div className="dashboard-content">
        <motion.div
          className="main-weather"
          initial={{ opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.05, duration: 0.45, ease: 'easeOut' }}
        >
          <div className="weather-location">
            <motion.h2
              className="city-name"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              {weather.name}
              {weather.sys.country && (
                <span className="country-code">{weather.sys.country}</span>
              )}
            </motion.h2>
            <motion.p
              className="weather-date"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.22, duration: 0.3 }}
            >
              {new Date(weather.dt * 1000).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </motion.p>
          </div>

          <div className="temp-display">
            <motion.span
              className="weather-emoji-large"
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              {emoji}
            </motion.span>
            <div className="temp-main">
              <span className="temp-number">
                <AnimatedNumber value={temp} suffix={tempUnit} />
              </span>
              <div className="temp-range">
                <span className="temp-high">H: {tempMax}°</span>
                <span className="temp-low">L: {tempMin}°</span>
              </div>
            </div>
          </div>

          <motion.div
            className="weather-description"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28, duration: 0.3 }}
          >
            <span className="description-text">
              {weather.weather[0].description.charAt(0).toUpperCase() + weather.weather[0].description.slice(1)}
            </span>
            <span className="feels-like">
              Feels like {feelsLike}{tempUnit}
            </span>
          </motion.div>
        </motion.div>

        <div className="details-grid">
          <DetailCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>}
            label="Wind"
            value={<><AnimatedNumber value={windSpeed} /> <span className="detail-unit">{windUnit}</span></>}
            delay={0.15}
          >
            {weather.wind.deg !== undefined && (
              <div className="wind-info">
                <WindDirectionArrow degree={weather.wind.deg} />
                <span className="wind-direction-text">
                  {getWindDirection(weather.wind.deg)}
                </span>
              </div>
            )}
          </DetailCard>

          <DetailCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>}
            label="Humidity"
            value={<AnimatedNumber value={weather.main.humidity} suffix="%" />}
            delay={0.2}
          >
            <div className="humidity-bar-container">
              <motion.div
                className="humidity-bar"
                initial={{ width: 0 }}
                animate={{ width: `${weather.main.humidity}%` }}
                transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
              />
            </div>
          </DetailCard>

          <DetailCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"/><path d="M12 2v20"/><circle cx="12" cy="12" r="10"/></svg>}
            label="Pressure"
            value={<AnimatedNumber value={weather.main.pressure} suffix=" hPa" />}
            delay={0.24}
          />

          <DetailCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>}
            label="Visibility"
            value={<>{(weather.visibility / 1000).toFixed(1)} <span className="detail-unit">km</span></>}
            delay={0.28}
          />

          <DetailCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>}
            label="Cloudiness"
            value={<AnimatedNumber value={weather.clouds.all} suffix="%" />}
            delay={0.32}
          />

          <DetailCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>}
            label="Sunrise & Sunset"
            delay={0.36}
            value=""
          >
            <SunProgress
              sunrise={weather.sys.sunrise}
              sunset={weather.sys.sunset}
              timezone={weather.timezone}
            />
          </DetailCard>
        </div>

        {filteredForecast.length > 0 && (
          <motion.div
            className="forecast-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.32 }}
          >
            <h3 className="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4" />
                <path d="M8 2v4" />
                <path d="M3 10h18" />
              </svg>
              <span>Forecast</span>
            </h3>
            <div className="forecast-scroll">
              {filteredForecast.map((item, i) => (
                <ForecastCard key={item.dt} item={item} unit={unit} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          className="footer-info"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          Last updated: {new Date(weather.dt * 1000).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}

function getWindDirection(deg) {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

export default WeatherDashboard;
