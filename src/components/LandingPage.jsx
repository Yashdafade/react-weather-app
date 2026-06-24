import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const apiKey = process.env.REACT_APP_WEATHER_API_KEY;

const typewriterTexts = [
  'Check the weather anywhere in the world',
  'Real-time forecasts at your fingertips',
  'Beautiful weather, beautiful interface',
  'Plan your day with accurate data',
];

function TypewriterText() {
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = typewriterTexts[textIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentText.length) {
          setCharIndex(charIndex + 1);
        } else {
          setTimeout(() => setIsDeleting(true), 1600);
        }
      } else {
        if (charIndex > 0) {
          setCharIndex(charIndex - 1);
        } else {
          setIsDeleting(false);
          setTextIndex((textIndex + 1) % typewriterTexts.length);
        }
      }
    }, isDeleting ? 25 : 45);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex]);

  return (
    <span className="typewriter-text">
      {typewriterTexts[textIndex].substring(0, charIndex)}
      <span className="cursor">|</span>
    </span>
  );
}

// Map a country code to its flag emoji
function countryFlag(code) {
  if (!code || code.length !== 2) return '';
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

function LandingPage({ onSearch, onSearchByCoords, onLocationSearch, loading }) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [fetching, setFetching] = useState(false);

  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  // Fetch city suggestions from the OpenWeatherMap Geocoding API
  const fetchSuggestions = useCallback(async (value) => {
    if (!apiKey || value.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setFetching(true);
      const res = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(value.trim())}&limit=5&appid=${apiKey}`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error('geocoding failed');
      const data = await res.json();

      // De-duplicate by name + state + country
      const seen = new Set();
      const unique = data.filter((c) => {
        const key = `${c.name}-${c.state || ''}-${c.country}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setSuggestions(unique);
      setShowDropdown(unique.length > 0);
      setActiveIndex(-1);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setSuggestions([]);
        setShowDropdown(false);
      }
    } finally {
      setFetching(false);
    }
  }, []);

  // Debounce input changes
  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
  };

  const selectSuggestion = (city) => {
    setQuery(`${city.name}${city.state ? ', ' + city.state : ''}, ${city.country}`);
    setShowDropdown(false);
    setSuggestions([]);
    setActiveIndex(-1);
    if (onSearchByCoords) {
      onSearchByCoords(city.lat, city.lon);
    } else {
      onSearch(city.name);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      selectSuggestion(suggestions[activeIndex]);
      return;
    }
    if (query.trim()) {
      setShowDropdown(false);
      onSearch(query.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') handleSearch(e);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timers/requests on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const popularCities = ['Tokyo', 'London', 'New York', 'Paris', 'Sydney', 'Dubai'];

  return (
    <motion.div
      className="landing-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
    >
      <div className="landing-content">
        <motion.div
          className="landing-badge"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35 }}
        >
          <span className="badge-dot" />
          <span>Powered by OpenWeatherMap</span>
        </motion.div>

        <motion.h1
          className="landing-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45, ease: 'easeOut' }}
        >
          <span className="title-line">Discover the</span>
          <span className="title-gradient">Weather</span>
          <span className="title-line">Around You</span>
        </motion.h1>

        <motion.p
          className="landing-subtitle"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
        >
          <TypewriterText />
        </motion.p>

        <motion.div
          className={`search-container ${isFocused ? 'focused' : ''}`}
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.28, duration: 0.4, ease: 'easeOut' }}
          ref={wrapperRef}
        >
          <div className="search-bar-wrapper">
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
              placeholder="Search any city..."
              value={query}
              onChange={handleChange}
              onFocus={() => {
                setIsFocused(true);
                if (suggestions.length > 0) setShowDropdown(true);
              }}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck="false"
            />
            <motion.button
              className="search-btn"
              onClick={handleSearch}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading || !query.trim()}
            >
              {loading ? (
                <div className="btn-spinner" />
              ) : (
                <>
                  <span>Search</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </>
              )}
            </motion.button>
          </div>

          <AnimatePresence>
            {showDropdown && suggestions.length > 0 && (
              <motion.ul
                className="search-dropdown"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {suggestions.map((city, i) => (
                  <li
                    key={`${city.lat}-${city.lon}-${i}`}
                    className={`dropdown-item ${i === activeIndex ? 'active' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectSuggestion(city);
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    <span className="dropdown-flag">{countryFlag(city.country)}</span>
                    <span className="dropdown-text">
                      <span className="dropdown-city">{city.name}</span>
                      <span className="dropdown-region">
                        {city.state ? `${city.state}, ` : ''}{city.country}
                      </span>
                    </span>
                    <svg className="dropdown-pin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>

          {fetching && isFocused && query.trim().length >= 2 && (
            <div className="search-hint">Searching cities…</div>
          )}
        </motion.div>

        <motion.button
          className="location-btn"
          onClick={onLocationSearch}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.3 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
          </svg>
          <span>Use my location</span>
        </motion.button>

        <motion.div
          className="popular-cities"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.44, duration: 0.35 }}
        >
          <p className="popular-label">Popular cities</p>
          <div className="city-chips">
            {popularCities.map((city, i) => (
              <motion.button
                key={city}
                className="city-chip"
                onClick={() => onSearch(city)}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.48 + i * 0.04, duration: 0.25 }}
                whileHover={{ scale: 1.1, y: -3 }}
                whileTap={{ scale: 0.9 }}
                disabled={loading}
              >
                {city}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="scroll-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5, y: [0, 8, 0] }}
          transition={{ delay: 1, duration: 1.6, repeat: Infinity }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </motion.div>
      </div>

      <div className="landing-decorations">
        <div className="deco-circle deco-1" />
        <div className="deco-circle deco-2" />
        <div className="deco-circle deco-3" />
      </div>
    </motion.div>
  );
}

export default LandingPage;
