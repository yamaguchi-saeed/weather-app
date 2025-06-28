import { DateTime } from 'luxon';

// Load API key from environment variables
const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;

// Base URL for OpenWeatherMap API
const BASE_URL = "https://api.openweathermap.org/data/2.5/";

// Check if API key is loaded (helpful for debugging)
console.log('API Key available:', !!API_KEY);

// Generic function to fetch weather data (e.g., current or forecast)
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

// Format the response for current weather data
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

// Format the forecast data (5-day and hourly)
const formatForecastWeather = (data) => {
    const { list, city } = data;
    const timezone = city.timezone; // Offset in seconds from UTC

    console.log('Timezone offset:', timezone, 'seconds');

    // Group items by weekday title, and pick one per day
const dailyMapByTitle = new Map();

list.forEach(item => {
    const weekday = formatToLocalTime(item.dt, timezone, "ccc"); // e.g., Mon, Tue
    const hour = DateTime.fromSeconds(item.dt).plus({ seconds: timezone }).hour;

    if (!dailyMapByTitle.has(weekday) || Math.abs(hour - 12) < Math.abs(dailyMapByTitle.get(weekday).hour - 12)) {
        dailyMapByTitle.set(weekday, {
            title: weekday,
            temp: item.main.temp,
            icon: item.weather[0].icon,
            hour
        });
    }
});

const daily = Array.from(dailyMapByTitle.values()).slice(0, 5); // Always get 5 unique weekdays
    
    // Convert the map to an array, skip today, and keep next 5 days
    const daily = Array.from(dailyMap.values())
        .slice(1, 6)
        .map(d => ({
            title: formatToLocalTime(d.dt, timezone, "ccc"), // e.g., Mon, Tue, Wed
            temp: d.temp,
            icon: d.icon
        }));

    // Create hourly forecast from next 5 time slots (~15 hours ahead)
    const hourly = list
        .slice(1, 6)
        .map(d => ({
            title: formatToLocalTime(d.dt, timezone, "hh:mm a"), // e.g., 02:00 PM
            temp: d.main.temp,
            icon: d.weather[0].icon
        }));

    return { timezone, daily, hourly };
};

// Main function to get and combine current + forecast weather
const getFormattedWeatherData = async (searchParams) => {
    try {
        // Get and format current weather
        const currentWeatherData = await getWeatherData("weather", searchParams);
        const formattedCurrentWeather = formatCurrentWeather(currentWeatherData);

        // Use lat/lon from current weather to fetch forecast
        const { lat, lon } = formattedCurrentWeather;
        const forecastData = await getWeatherData("forecast", {
            lat,
            lon,
            units: searchParams.units,
        });

        const formattedForecastWeather = formatForecastWeather(forecastData);

        // Return both sets of formatted data
        return {
            ...formattedCurrentWeather,
            ...formattedForecastWeather
        };

    } catch (error) {
        console.error("Error fetching weather data:", error);
        throw error;
    }
};

// Convert UNIX timestamp and timezone offset into formatted local time
const formatToLocalTime = (
    secs,
    timezoneOffset,
    format = "ccc dd LLL yyyy' | Local time: 'hh:mm a"
) => {
    const utcTime = DateTime.fromSeconds(secs, { zone: 'utc' });
    const localTime = utcTime.plus({ seconds: timezoneOffset });
    return localTime.toFormat(format);
};

// Generate full image URL for weather icon using its code
const iconUrlFromCode = (code) => `https://openweathermap.org/img/wn/${code}@2x.png`;

// Export main function and helpers
export default getFormattedWeatherData;
export { formatToLocalTime, iconUrlFromCode };
