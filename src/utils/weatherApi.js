import fetch from "node-fetch";

const GEOCODING_BASE =
  process.env.GEOCODING_API_BASE || "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_BASE = process.env.WEATHER_API_BASE || "https://api.open-meteo.com/v1/forecast";

/**
 * Resolves a city/country string to lat/lon using Open-Meteo's free geocoding API
 * (no API key required).
 */
export const geocodeCity = async (city, country) => {
  const query = country ? `${city}, ${country}` : city;
  const url = `${GEOCODING_BASE}?name=${encodeURIComponent(city)}&count=5&language=en&format=json`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding API request failed");

  const data = await res.json();
  if (!data.results || data.results.length === 0) return null;

  // Prefer a result whose country matches, otherwise take the first
  const match =
    data.results.find(
      (r) => country && r.country?.toLowerCase().includes(country.toLowerCase())
    ) || data.results[0];

  return { lat: match.latitude, lon: match.longitude, resolvedName: match.name };
};

/**
 * Fetches a short-range forecast for a lat/lon pair using Open-Meteo (no API key required).
 * This is the "external API integration" required by the assignment: it enriches
 * each event with live weather data for its location.
 */
export const getWeatherForCoords = async (lat, lon) => {
  const url = `${WEATHER_BASE}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather API request failed");

  const data = await res.json();
  return {
    current: data.current,
    daily: data.daily,
    timezone: data.timezone,
  };
};

/** Convenience helper: city name -> weather, geocoding first then forecasting. */
export const getWeatherForCity = async (city, country) => {
  const geo = await geocodeCity(city, country);
  if (!geo) return null;
  const weather = await getWeatherForCoords(geo.lat, geo.lon);
  return { ...geo, weather };
};
