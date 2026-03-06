"use client";

import React, { useEffect, useState } from 'react';
import { Cloud, CloudRain, Sun, CloudLightning, Snowflake, Wind, Droplets } from 'lucide-react';

// Map WMO Weather interpretation codes to Lucide icons and descriptions
// https://open-meteo.com/en/docs
const getWeatherDetails = (code) => {
    switch (true) {
        case (code === 0):
            return { icon: <Sun size={32} color="#fbbf24" />, desc: 'Clear' };
        case (code === 1 || code === 2 || code === 3):
            return { icon: <Cloud size={32} color="#9ca3af" />, desc: 'Partly Cloudy' };
        case (code === 45 || code === 48):
            return { icon: <Cloud size={32} color="#6b7280" />, desc: 'Fog' };
        case (code >= 51 && code <= 67): // Drizzle & Rain
            return { icon: <CloudRain size={32} color="#60a5fa" />, desc: 'Rain' };
        case (code >= 71 && code <= 77): // Snow
            return { icon: <Snowflake size={32} color="#e5e7eb" />, desc: 'Snow' };
        case (code >= 80 && code <= 82): // Rain showers
            return { icon: <CloudRain size={32} color="#3b82f6" />, desc: 'Showers' };
        case (code >= 95 && code <= 99): // Thunderstorm
            return { icon: <CloudLightning size={32} color="#f59e0b" />, desc: 'Storm' };
        default:
            return { icon: <Cloud size={32} color="#9ca3af" />, desc: 'Unknown' };
    }
};

export default function WeatherWidget({ lat, lng, timezone = 'America/New_York' }) {
    const [forecast, setForecast] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!lat || !lng) {
            setLoading(false);
            return;
        }

        const fetchWeather = async () => {
            try {
                // Fetch 5-day forecast, max/min temps, and daily weather code
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&temperature_unit=fahrenheit`);

                if (!res.ok) throw new Error('Failed to fetch weather data');

                const data = await res.json();

                // Format data into a usable array
                const dailyData = data.daily.time.map((time, index) => ({
                    date: new Date(time + 'T12:00:00'), // Add time to avoid timezone shift issues parsing raw date strings
                    maxTemp: Math.round(data.daily.temperature_2m_max[index]),
                    minTemp: Math.round(data.daily.temperature_2m_min[index]),
                    code: data.daily.weathercode[index]
                })).slice(0, 5); // Take first 5 days

                setForecast(dailyData);
            } catch (err) {
                console.error("Weather fetch error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, [lat, lng, timezone]);

    if (!lat || !lng) return null; // Don't show if no coordinates

    if (loading) {
        return (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'var(--text-muted)' }}>Loading forecast...</div>
            </div>
        );
    }

    if (error || !forecast) {
        return null; // Fail gracefully
    }

    return (
        <div className="card" style={{ padding: '2rem', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ color: 'var(--accent)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                <Cloud size={28} /> Tournament Forecast
            </h2>

            <div style={{
                display: 'flex',
                gap: '1rem',
                overflowX: 'auto',
                paddingBottom: '1rem',
                justifyContent: forecast.length < 5 ? 'center' : 'space-between',
                scrollbarWidth: 'thin',
                WebkitOverflowScrolling: 'touch'
            }}>
                {forecast.map((day, i) => {
                    const details = getWeatherDetails(day.code);
                    const isToday = i === 0;

                    return (
                        <div key={i} style={{
                            flex: '0 0 auto',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            minWidth: '100px',
                            background: isToday ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
                            border: isToday ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
                            padding: '1rem',
                            borderRadius: '12px',
                            transition: 'transform 0.2s ease',
                            cursor: 'default'
                        }}
                            className="weather-day"
                        >
                            <span style={{
                                fontWeight: 'bold',
                                color: isToday ? 'var(--accent)' : 'var(--text-main)',
                                marginBottom: '0.5rem',
                                fontSize: '0.9rem'
                            }}>
                                {isToday ? 'Today' : day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>

                            <div style={{ margin: '0.5rem 0' }}>{details.icon}</div>

                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                {details.desc}
                            </span>

                            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.95rem' }}>
                                <span style={{ fontWeight: 'bold' }}>{day.maxTemp}°</span>
                                <span style={{ color: 'var(--text-muted)' }}>{day.minTemp}°</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
                .weather-day:hover {
                    transform: translateY(-5px);
                    background: rgba(255,255,255,0.08) !important;
                }
            `}</style>
        </div>
    );
}
