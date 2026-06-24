import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const apiKey = process.env.REACT_APP_WEATHER_API_KEY;

const POPULAR_BY_COUNTRY = {
  US: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami', 'Seattle'],
  GB: ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Edinburgh', 'Bristol'],
  IN: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'],
  AU: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra'],
  CA: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton'],
  DE: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart'],
  FR: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Bordeaux'],
  JP: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya', 'Sapporo'],
  BR: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Curitiba', 'Recife'],
  AE: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain', 'Fujairah'],
  CN: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou'],
  KR: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju'],
  MX: ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Cancún', 'Tijuana'],
  IT: ['Rome', 'Milan', 'Naples', 'Turin', 'Florence', 'Venice'],
  ES: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao', 'Málaga'],
  RU: ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan', 'Sochi'],
  ZA: ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein'],
  NG: ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City'],
  PK: ['Karachi', 'Lahore', 'Islamabad', 'Faisalabad', 'Rawalpindi', 'Multan'],
  BD: ['Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet', 'Rangpur'],
  ID: ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Bali', 'Yogyakarta'],
  PH: ['Manila', 'Cebu', 'Davao', 'Quezon City', 'Makati', 'Taguig'],
  TR: ['Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bursa', 'Adana'],
  SA: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Tabuk'],
  EG: ['Cairo', 'Alexandria', 'Giza', 'Luxor', 'Aswan', 'Sharm El Sheikh'],
  TH: ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Krabi', 'Hua Hin'],
  VN: ['Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Nha Trang', 'Hue', 'Hai Phong'],
  MY: ['Kuala Lumpur', 'George Town', 'Johor Bahru', 'Kota Kinabalu', 'Malacca', 'Ipoh'],
  SG: ['Singapore'],
  NZ: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Queenstown', 'Dunedin'],
  AR: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán', 'Mar del Plata'],
  CL: ['Santiago', 'Valparaíso', 'Concepción', 'Antofagasta', 'Temuco', 'La Serena'],
  CO: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Santa Marta'],
  SE: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Linköping', 'Örebro'],
  NO: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Tromsø', 'Drammen'],
  FI: ['Helsinki', 'Espoo', 'Tampere', 'Turku', 'Oulu', 'Rovaniemi'],
  DK: ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Roskilde'],
  NL: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen'],
  BE: ['Brussels', 'Antwerp', 'Ghent', 'Bruges', 'Liège', 'Namur'],
  CH: ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne', 'Lucerne'],
  AT: ['Vienna', 'Salzburg', 'Innsbruck', 'Graz', 'Linz', 'Klagenfurt'],
  PL: ['Warsaw', 'Kraków', 'Wrocław', 'Gdańsk', 'Poznań', 'Łódź'],
  PT: ['Lisbon', 'Porto', 'Faro', 'Coimbra', 'Braga', 'Funchal'],
  IE: ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Killarney'],
  GR: ['Athens', 'Thessaloniki', 'Heraklion', 'Patras', 'Rhodes', 'Corfu'],
  IL: ['Tel Aviv', 'Jerusalem', 'Haifa', 'Eilat', 'Beer Sheva', 'Netanya'],
  KE: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Malindi'],
  GH: ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast', 'Sunyani'],
  LK: ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo', 'Trincomalee'],
  NP: ['Kathmandu', 'Pokhara', 'Lalitpur', 'Biratnagar', 'Bharatpur', 'Birgunj'],
};

const DEFAULT_POPULAR = ['Tokyo', 'London', 'New York', 'Paris', 'Sydney', 'Dubai'];

const weatherEmojis = {
  Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
  Snow: '❄️', Thunderstorm: '⛈️', Mist: '🌫️', Smoke: '🌫️',
  Haze: '🌫️', Fog: '🌫️', Dust: '🌬️',
};

const typewriterTexts = [
  'Check the weather anywhere in the world',
  'Real-time forecasts at your fingertips',
  'Beautiful weather, beautiful interface',
  'Plan your day with accurate data',
];

function countryFlag(code) {
  if (!code || code.length !== 2) return '';
  return code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

function TypewriterText() {
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = typewriterTexts[textIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentText.length) setCharIndex(charIndex + 1);
        else setTimeout(() => setIsDeleting(true), 1600);
      } else {
        if (charIndex > 0) setCharIndex(charIndex - 1);
        else { setIsDeleting(false); setTextIndex((textIndex + 1) % typewriterTexts.length); }
      }
    }, isDeleting ? 20 : 35);
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex]);

  return (
    <span className="typewriter-text">
      {typewriterTexts[textIndex].substring(0, charIndex)}
      <span className="cursor">|</span>
    </span>
  );
}

function timeAgo(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const stagger = { animate: { transition: { staggerChildren: 0.04 } } };
const fadeUp = {
  initial: { opacity: 0, y: 16, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: 'easeOut' } },
};

function LandingPage({ onSearch, onSearchByCoords, onLocationSearch, loading, userCountry, recentSearches, onRecentClick }) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const hasRecent = recentSearches && recentSearches.length > 0;

  const popularCities = useMemo(
    () => (userCountry && POPULAR_BY_COUNTRY[userCountry]) || DEFAULT_POPULAR,
    [userCountry]
  );

  const fetchSuggestions = useCallback(async (value) => {
    const trimmed = value.trim();
    if (!apiKey || trimmed.length < 2) {
      setSuggestions([]); setShowDropdown(false); return;
    }
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const hasComma = trimmed.includes(',');
      const q = (!hasComma && userCountry) ? `${trimmed},${userCountry}` : trimmed;
      const res = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${apiKey}`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error('geocoding failed');
      let data = await res.json();
      const seen = new Set();
      data = data.filter((c) => {
        const key = `${c.name}-${c.state || ''}-${c.country}`;
        if (seen.has(key)) return false;
        seen.add(key); return true;
      });
      setSuggestions(data);
      setShowDropdown(data.length > 0);
      setActiveIndex(-1);
    } catch (err) {
      if (err.name !== 'AbortError') { setSuggestions([]); setShowDropdown(false); }
    }
  }, [userCountry]);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) { setSuggestions([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 180);
  };

  const selectSuggestion = useCallback((city) => {
    setQuery([city.name, city.state, city.country].filter(Boolean).join(', '));
    setShowDropdown(false); setSuggestions([]); setActiveIndex(-1);
    onSearchByCoords(city.lat, city.lon);
  }, [onSearchByCoords]);

  const handleSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) { selectSuggestion(suggestions[activeIndex]); return; }
    if (query.trim()) { setShowDropdown(false); onSearch(query.trim()); }
  }, [activeIndex, suggestions, selectSuggestion, query, onSearch]);

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') handleSubmit(e);
      return;
    }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setActiveIndex((i) => (i + 1) % suggestions.length); break;
      case 'ArrowUp': e.preventDefault(); setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1)); break;
      case 'Enter': e.preventDefault(); handleSubmit(e); break;
      case 'Escape': setShowDropdown(false); setActiveIndex(-1); break;
      default: break;
    }
  };

  useEffect(() => {
    const close = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false); setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return (
    <motion.div
      className={`landing-page ${hasRecent ? 'landing-compact' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
    >
      <div className="landing-content">
        {!hasRecent && (
          <>
            <motion.div
              className="landing-badge"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03, duration: 0.25 }}
            >
              <span className="badge-dot" />
              <span>Powered by OpenWeatherMap</span>
            </motion.div>

            <motion.h1
              className="landing-title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06, duration: 0.3, ease: 'easeOut' }}
            >
              <span className="title-line">Discover the</span>
              <span className="title-gradient">Weather</span>
              <span className="title-line">Around You</span>
            </motion.h1>

            <motion.p
              className="landing-subtitle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.25 }}
            >
              <TypewriterText />
            </motion.p>
          </>
        )}

        {hasRecent && (
          <motion.h2
            className="landing-greeting"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            Nimbus Weather
          </motion.h2>
        )}

        <motion.div
          className={`search-container ${isFocused ? 'focused' : ''}`}
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: hasRecent ? 0.04 : 0.18, duration: 0.3, ease: 'easeOut' }}
          ref={wrapperRef}
        >
          <form className="search-bar-wrapper" onSubmit={handleSubmit} role="search">
            <div className="search-icon-left">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder={userCountry ? `Search cities in ${countryFlag(userCountry)} or worldwide...` : 'Search any city...'}
              value={query}
              onChange={handleChange}
              onFocus={() => { setIsFocused(true); if (suggestions.length > 0) setShowDropdown(true); }}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck="false"
              role="combobox"
              aria-controls="suggestions-listbox"
              aria-expanded={showDropdown}
              aria-autocomplete="list"
            />
            <motion.button
              type="submit"
              className="search-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              disabled={loading || !query.trim()}
            >
              {loading ? <div className="btn-spinner" /> : (
                <>
                  <span>Search</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                  </svg>
                </>
              )}
            </motion.button>
          </form>

          <AnimatePresence>
            {showDropdown && suggestions.length > 0 && (
              <motion.ul
                className="search-dropdown"
                id="suggestions-listbox"
                role="listbox"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
              >
                {suggestions.map((city, i) => (
                  <li
                    key={`${city.lat.toFixed(4)}-${city.lon.toFixed(4)}`}
                    role="option"
                    aria-selected={i === activeIndex}
                    className={`dropdown-item${i === activeIndex ? ' active' : ''}`}
                    onMouseDown={(e) => { e.preventDefault(); selectSuggestion(city); }}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    <span className="dropdown-flag">{countryFlag(city.country)}</span>
                    <span className="dropdown-text">
                      <span className="dropdown-city">{city.name}</span>
                      <span className="dropdown-region">{[city.state, city.country].filter(Boolean).join(', ')}</span>
                    </span>
                    <svg className="dropdown-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.button
          className="location-btn"
          onClick={onLocationSearch}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: hasRecent ? 0.08 : 0.24, duration: 0.22 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.93 }}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M12 2v4" /><path d="M12 18v4" /><path d="M2 12h4" /><path d="M18 12h4" />
          </svg>
          <span>Use my location</span>
        </motion.button>

        {hasRecent && (
          <motion.div
            className="recent-section"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.28 }}
          >
            <p className="section-label">Recent Searches</p>
            <motion.div className="recent-grid" variants={stagger} initial="initial" animate="animate">
              {recentSearches.map((entry) => (
                <motion.button
                  key={`${entry.lat}-${entry.lon}`}
                  className="recent-card"
                  variants={fadeUp}
                  whileHover={{ scale: 1.04, y: -4 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onRecentClick(entry)}
                >
                  <div className="recent-card-top">
                    <span className="recent-emoji">{weatherEmojis[entry.condition] || '🌤️'}</span>
                    <span className="recent-temp">{entry.temp}°</span>
                  </div>
                  <div className="recent-card-bottom">
                    <span className="recent-city">{entry.name}</span>
                    <span className="recent-meta">
                      {countryFlag(entry.country)} {entry.description || entry.condition}
                    </span>
                    <span className="recent-time">{timeAgo(entry.timestamp)}</span>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}

        <motion.div
          className="popular-cities"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: hasRecent ? 0.2 : 0.32, duration: 0.25 }}
        >
          <p className="popular-label">
            {userCountry ? `Popular in ${countryFlag(userCountry)} ${userCountry}` : 'Popular cities'}
          </p>
          <div className="city-chips">
            {popularCities.map((city, i) => (
              <motion.button
                key={city}
                className="city-chip"
                onClick={() => onSearch(city)}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (hasRecent ? 0.24 : 0.36) + i * 0.03, duration: 0.2 }}
                whileHover={{ scale: 1.1, y: -3 }}
                whileTap={{ scale: 0.9 }}
                disabled={loading}
              >
                {city}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {!hasRecent && (
        <div className="landing-decorations">
          <div className="deco-circle deco-1" />
          <div className="deco-circle deco-2" />
          <div className="deco-circle deco-3" />
        </div>
      )}
    </motion.div>
  );
}

export default LandingPage;
