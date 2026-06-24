import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const weatherEmojis = {
  Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
  Snow: '❄️', Thunderstorm: '⛈️', Mist: '🌫️', Smoke: '🌫️',
  Haze: '🌫️', Fog: '🌫️', Dust: '🌬️',
};

const AQI_LEVELS = [
  { label: 'Good', color: '#4CAF50', bg: 'rgba(76,175,80,0.15)' },
  { label: 'Fair', color: '#FFEB3B', bg: 'rgba(255,235,59,0.15)' },
  { label: 'Moderate', color: '#FF9800', bg: 'rgba(255,152,0,0.15)' },
  { label: 'Poor', color: '#F44336', bg: 'rgba(244,67,54,0.15)' },
  { label: 'Very Poor', color: '#9C27B0', bg: 'rgba(156,39,176,0.15)' },
];

const stagger = { animate: { transition: { staggerChildren: 0.04 } } };
const cardVariant = {
  initial: { opacity: 0, y: 18, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: 'easeOut' } },
};

function AnimatedNumber({ value, suffix = '', duration = 0.6 }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const target = parseFloat(value) || 0;
    const startTime = Date.now();
    const startValue = prevRef.current;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
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
      animate={{ rotate: degree }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20" /><path d="m5 9 7-7 7 7" />
      </svg>
    </motion.div>
  );
}

function DetailCard({ icon, label, value, unit, children }) {
  return (
    <motion.div className="detail-card" variants={cardVariant} whileHover={{ scale: 1.03, y: -4 }}>
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

function AQIGauge({ aqi }) {
  const level = AQI_LEVELS[(aqi || 1) - 1] || AQI_LEVELS[0];
  const pct = ((aqi || 1) - 1) / 4;

  return (
    <div className="aqi-gauge-wrapper">
      <svg viewBox="0 0 200 110" className="aqi-gauge-svg">
        <defs>
          <linearGradient id="aqi-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4CAF50" />
            <stop offset="25%" stopColor="#FFEB3B" />
            <stop offset="50%" stopColor="#FF9800" />
            <stop offset="75%" stopColor="#F44336" />
            <stop offset="100%" stopColor="#9C27B0" />
          </linearGradient>
        </defs>
        <path d="M 20 95 A 80 80 0 0 1 180 95" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round" />
        <path d="M 20 95 A 80 80 0 0 1 180 95" fill="none" stroke="url(#aqi-grad)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${pct * 251} 251`}
        />
        <circle
          cx={20 + pct * 160}
          cy={95 - Math.sin(pct * Math.PI) * 80}
          r="8" fill={level.color}
          style={{ filter: `drop-shadow(0 0 8px ${level.color})` }}
        />
      </svg>
      <div className="aqi-center">
        <span className="aqi-value" style={{ color: level.color }}>{aqi}</span>
        <span className="aqi-label" style={{ color: level.color }}>{level.label}</span>
      </div>
    </div>
  );
}

function ForecastCard({ item, unit, index }) {
  const date = new Date(item.dt * 1000);
  const day = date.toLocaleDateString('en-US', { weekday: 'short' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
  const temp = unit === 'metric' ? Math.round(item.main.temp) : Math.round(item.main.temp * 9 / 5 + 32);
  const icon = weatherEmojis[item.weather[0].main] || '🌤️';

  return (
    <motion.div
      className="forecast-card"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.08 + index * 0.025, duration: 0.2 }}
      whileHover={{ scale: 1.06, y: -4 }}
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

  const fmt = (ts) => new Date(ts * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div className="sun-progress">
      <div className="sun-arc">
        <svg viewBox="0 0 200 100" className="sun-arc-svg">
          <path d="M 10 90 Q 100 -10 190 90" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="4 4" />
          <circle
            cx={10 + progress * 180}
            cy={90 - Math.sin(progress * Math.PI) * 90}
            r="8" fill="#FDB813" className="sun-dot"
          />
        </svg>
      </div>
      <div className="sun-times">
        <span>{fmt(sunrise)}</span>
        <span>{fmt(sunset)}</span>
      </div>
    </div>
  );
}

function calcDewPoint(tempC, humidity) {
  const a = 17.27, b = 237.7;
  const alpha = (a * tempC) / (b + tempC) + Math.log(humidity / 100);
  return Math.round((b * alpha) / (a - alpha));
}

function dewPointComfort(dp) {
  if (dp < 10) return 'Dry';
  if (dp < 16) return 'Comfortable';
  if (dp < 20) return 'Slightly humid';
  if (dp < 24) return 'Humid';
  return 'Oppressive';
}

function WeatherDashboard({ weather, forecast, airQuality, onBack, unit, onToggleUnit }) {
  if (!weather) return null;

  const temp = unit === 'metric' ? Math.round(weather.main.temp) : Math.round(weather.main.temp * 9 / 5 + 32);
  const feelsLike = unit === 'metric' ? Math.round(weather.main.feels_like) : Math.round(weather.main.feels_like * 9 / 5 + 32);
  const tempUnit = unit === 'metric' ? '°C' : '°F';
  const windSpeed = unit === 'metric' ? Math.round(weather.wind.speed * 3.6) : Math.round(weather.wind.speed * 2.237);
  const windUnit = unit === 'metric' ? 'km/h' : 'mph';
  const windGust = weather.wind.gust
    ? (unit === 'metric' ? Math.round(weather.wind.gust * 3.6) : Math.round(weather.wind.gust * 2.237))
    : null;
  const emoji = weatherEmojis[weather.weather[0].main] || '🌤️';
  const filteredForecast = forecast?.list?.filter((_, i) => i % 2 === 0).slice(0, 12) || [];
  const tempMin = unit === 'metric' ? Math.round(weather.main.temp_min) : Math.round(weather.main.temp_min * 9 / 5 + 32);
  const tempMax = unit === 'metric' ? Math.round(weather.main.temp_max) : Math.round(weather.main.temp_max * 9 / 5 + 32);
  const dewPoint = calcDewPoint(weather.main.temp, weather.main.humidity);
  const dewPointDisplay = unit === 'metric' ? dewPoint : Math.round(dewPoint * 9 / 5 + 32);
  const rainVolume = weather.rain?.['1h'] || weather.rain?.['3h'];
  const snowVolume = weather.snow?.['1h'] || weather.snow?.['3h'];

  const aqiData = airQuality;
  const aqiIndex = aqiData?.main?.aqi;
  const pollutants = aqiData?.components;

  return (
    <motion.div
      className="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
    >
      <div className="dashboard-header">
        <motion.button
          className="back-btn"
          onClick={onBack}
          whileHover={{ scale: 1.1, x: -3 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.04, duration: 0.22 }}
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
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.04, duration: 0.22 }}
        >
          <span className={unit === 'metric' ? 'active' : ''}>°C</span>
          <span className="toggle-divider">/</span>
          <span className={unit !== 'metric' ? 'active' : ''}>°F</span>
        </motion.button>
      </div>

      <div className="dashboard-content">
        <motion.div
          className="main-weather"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.03, duration: 0.3, ease: 'easeOut' }}
        >
          <div className="weather-location">
            <motion.h2
              className="city-name"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.22 }}
            >
              {weather.name}
              {weather.sys.country && <span className="country-code">{weather.sys.country}</span>}
            </motion.h2>
            <motion.p
              className="weather-date"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.12, duration: 0.22 }}
            >
              {new Date(weather.dt * 1000).toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              })}
            </motion.p>
          </div>

          <div className="temp-display">
            <motion.span
              className="weather-emoji-large"
              animate={{ y: [0, -8, 0], rotate: [0, 4, -4, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
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
            transition={{ delay: 0.16, duration: 0.22 }}
          >
            <span className="description-text">
              {weather.weather[0].description.charAt(0).toUpperCase() + weather.weather[0].description.slice(1)}
            </span>
            <span className="feels-like">Feels like {feelsLike}{tempUnit}</span>
          </motion.div>
        </motion.div>

        {aqiIndex && (
          <motion.div
            className="aqi-section"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.25 }}
          >
            <h3 className="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2h8l4 10H4z" /><path d="M12 12v10" /><path d="M8 22h8" />
              </svg>
              <span>Air Quality</span>
            </h3>
            <div className="aqi-content">
              <AQIGauge aqi={aqiIndex} />
              {pollutants && (
                <div className="aqi-pollutants">
                  <PollutantItem label="PM2.5" value={pollutants.pm2_5} unit="μg/m³" warn={pollutants.pm2_5 > 25} />
                  <PollutantItem label="PM10" value={pollutants.pm10} unit="μg/m³" warn={pollutants.pm10 > 50} />
                  <PollutantItem label="O₃" value={pollutants.o3} unit="μg/m³" warn={pollutants.o3 > 100} />
                  <PollutantItem label="NO₂" value={pollutants.no2} unit="μg/m³" warn={pollutants.no2 > 40} />
                  <PollutantItem label="SO₂" value={pollutants.so2} unit="μg/m³" warn={pollutants.so2 > 20} />
                  <PollutantItem label="CO" value={(pollutants.co / 1000).toFixed(1)} unit="mg/m³" warn={pollutants.co > 4000} />
                </div>
              )}
            </div>
          </motion.div>
        )}

        <motion.div className="details-grid" variants={stagger} initial="initial" animate="animate">
          <DetailCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" /><path d="M9.6 4.6A2 2 0 1 1 11 8H2" /><path d="M12.6 19.4A2 2 0 1 0 14 16H2" /></svg>}
            label="Wind"
            value={<><AnimatedNumber value={windSpeed} /> <span className="detail-unit">{windUnit}</span></>}
          >
            <div className="wind-info">
              {weather.wind.deg !== undefined && (
                <>
                  <WindDirectionArrow degree={weather.wind.deg} />
                  <span className="wind-direction-text">{getWindDirection(weather.wind.deg)}</span>
                </>
              )}
              {windGust && <span className="wind-gust">Gust: {windGust} {windUnit}</span>}
            </div>
          </DetailCard>

          <DetailCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></svg>}
            label="Humidity"
            value={<AnimatedNumber value={weather.main.humidity} suffix="%" />}
          >
            <div className="humidity-bar-container">
              <motion.div
                className="humidity-bar"
                initial={{ width: 0 }}
                animate={{ width: `${weather.main.humidity}%` }}
                transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </DetailCard>

          <DetailCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20" /><path d="M12 2v20" /><circle cx="12" cy="12" r="10" /></svg>}
            label="Pressure"
            value={<AnimatedNumber value={weather.main.pressure} suffix=" hPa" />}
          />

          <DetailCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>}
            label="Visibility"
            value={<>{(weather.visibility / 1000).toFixed(1)} <span className="detail-unit">km</span></>}
          />

          <DetailCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /></svg>}
            label="Cloudiness"
            value={<AnimatedNumber value={weather.clouds.all} suffix="%" />}
          />

          <DetailCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /><path d="M12 18v-6" /></svg>}
            label="Dew Point"
            value={<>{dewPointDisplay}° <span className="detail-unit">{unit === 'metric' ? 'C' : 'F'}</span></>}
          >
            <span className="dew-comfort">{dewPointComfort(dewPoint)}</span>
          </DetailCard>

          {(rainVolume || snowVolume) && (
            <DetailCard
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M8 19v1" /><path d="M8 14v1" /><path d="M16 19v1" /><path d="M16 14v1" /><path d="M12 21v1" /><path d="M12 16v1" /></svg>}
              label={rainVolume ? 'Rain' : 'Snow'}
              value={<>{(rainVolume || snowVolume).toFixed(1)} <span className="detail-unit">mm</span></>}
            />
          )}

          <DetailCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>}
            label="Sunrise & Sunset"
            value=""
          >
            <SunProgress sunrise={weather.sys.sunrise} sunset={weather.sys.sunset} timezone={weather.timezone} />
          </DetailCard>
        </motion.div>

        {filteredForecast.length > 0 && (
          <motion.div
            className="forecast-section"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.25 }}
          >
            <h3 className="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" />
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
          transition={{ delay: 0.28, duration: 0.22 }}
        >
          Last updated: {new Date(weather.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
        </motion.div>
      </div>
    </motion.div>
  );
}

function PollutantItem({ label, value, unit, warn }) {
  return (
    <div className={`pollutant-item ${warn ? 'pollutant-warn' : ''}`}>
      <span className="pollutant-label">{label}</span>
      <span className="pollutant-value">{value}</span>
      <span className="pollutant-unit">{unit}</span>
    </div>
  );
}

function getWindDirection(deg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

export default WeatherDashboard;
