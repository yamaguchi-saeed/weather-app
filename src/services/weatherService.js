import { DateTime } from 'luxon';

// Load API key from environment variables
const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;

// Base URL for OpenWeatherMap API
const BASE_URL = "https://api.openweathermap.org/data/2.5/";

// Check if API key is loaded (helpful for debugging)
console.log('API Key available:', !!API_KEY);

// Function to fetch weather data from OpenWeatherMap
const getWeatherData = async (infoType, searchParams) => {
    const url = new URL(BASE_URL + infoType);
    url.search = new URLSearchParams({ ...searchParams, appid: API_KEY });

    console.log('Fetching from:', url.toString());

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
        console.error('API Error:', data);
        throw new Error(data.message || "API error");
    }

    return data;
};

// Format the current weather data
const formatCurrentWeather = (data) => {
    const {
        coord: { lat, lon },
        main: { temp, feels_like, temp_min, temp_max, humidity },
        name,
        dt,
        sys: { country, sunrise, sunset },
        weather,
        wind: { speed },
    } = data;

    const { main: details, icon } = weather[0];

    return {
        lat,
        lon,
        temp,
        feels_like,
        temp_min,
        temp_max,
        humidity,
        name,
        dt,
        country,
        sunrise,
        sunset,
        details,
        icon,
        speed,
    };
};

// Format forecast weather (daily and hourly)
const formatForecastWeather = (data) => {
    const { list, city } = data;
    const timezone = city.timezone; // Timezone offset in seconds

    console.log('Timezone offset:', timezone, 'seconds');

    // Group forecast by day and pick closest to 12 PM
    const dailyMap = new Map();

    list.forEach(item => {
        const localTime = DateTime.fromSeconds(item.dt).plus({ seconds: timezone });
        const date = localTime.toFormat('yyyy-MM-dd');
        const hour = localTime.hour;

        if (!dailyMap.has(date) || Math.abs(hour - 12) < Math.abs(dailyMap.get(date).hour - 12)) {
            dailyMap.set(date, {
                dt: item.dt,
                temp: item.main.temp,
                icon: item.weather[0].icon,
                hour: hour
            });
        }
    });

    // Format daily data (skip today, show next 5 days)
    const daily = Array.from(dailyMap.values())
        .slice(1, 6)
        .map(d => ({
            title: formatToLocalTime(d.dt, timezone, "ccc"), // Mon, Tue...
            temp: d.temp,
            icon: d.icon
        }));

    // Format hourly data (next 5 time blocks, ~15 hours)
    const hourly = list
        .slice(1, 6)
        .map(d => ({
            title: formatToLocalTime(d.dt, timezone, "hh:mm a"), // 03:00 PM
            temp: d.main.temp,
            icon: d.weather[0].icon
        }));

    return { timezone, daily, hourly };
};

// Main function to fetch and return all formatted weather data
const getFormattedWeatherData = async (searchParams) => {
    try {
        const currentWeatherData = await getWeatherData("weather", searchParams);
        const formattedCurrentWeather = formatCurrentWeather(currentWeatherData);

        const { lat, lon } = formattedCurrentWeather;
        const forecastData = await getWeatherData("forecast", {
            lat,
            lon,
            units: searchParams.units,
        });

        const formattedForecastWeather = formatForecastWeather(forecastData);

        return {
            ...formattedCurrentWeather,
            ...formattedForecastWeather
        };
    } catch (error) {
        console.error("Error fetching weather data:", error);
        throw error;
    }
};

// Format timestamp and timezone offset into readable time
const formatToLocalTime = (
    secs,
    timezoneOffset,
    format = "ccc dd LLL yyyy' | Local time: 'hh:mm a"
) => {
    const utcTime = DateTime.fromSeconds(secs, { zone: 'utc' });
    const localTime = utcTime.plus({ seconds: timezoneOffset });
    return localTime.toFormat(format);
};

// Build full URL for weather icon
const iconUrlFromCode = (code) => `https://openweathermap.org/img/wn/${code}@2x.png`;

// Export main function and helpers
export default getFormattedWeatherData;
export { formatToLocalTime, iconUrlFromCode };
