import { DateTime } from 'luxon';

const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5/";

const getWeatherData = async (infoType, searchParams) => {
    const url = new URL(BASE_URL + infoType);
    url.search = new URLSearchParams({ ...searchParams, appid: API_KEY });
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (!res.ok) {
        console.error('API Error:', data);
        throw new Error(data.message || "API error");
    }
    
    return data;
};

const formatCurrentWeather = (data) => {
    const {
        coord: { lat, lon },
        main: { temp, feels_like, temp_min, temp_max, humidity },
        name,
        dt,
        sys: { country, sunrise, sunset },
        weather,
        wind: { speed },
        timezone,
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
        timezone,
    };
};

// NEW: Format the free 5-day forecast data
const formatForecastWeather = (data) => {
    const { list, city } = data;
    const timezoneOffset = city.timezone; // timezone offset in seconds
    
    // Get daily forecast (one per day at noon)
    const daily = list
        .filter((item, index) => index % 8 === 4) // Every 8th item starting from index 4 (noon)
        .slice(0, 5)
        .map(d => ({
            title: formatToLocalTime(d.dt, timezoneOffset, "ccc"),
            temp: d.main.temp,
            icon: d.weather[0].icon
        }));
    
    // Get hourly forecast (next 5 readings)
    const hourly = list
        .slice(1, 6)
        .map(d => ({
            title: formatToLocalTime(d.dt, timezoneOffset, "hh:mm a"),
            temp: d.main.temp,
            icon: d.weather[0].icon
        }));
    
    return { daily, hourly, timezone: timezoneOffset };
};

const getFormattedWeatherData = async (searchParams) => {
    try {
        // Get current weather
        const formattedCurrentWeather = await getWeatherData("weather", searchParams)
            .then(formatCurrentWeather);
        
        // Get forecast data using the FREE forecast endpoint
        const { lat, lon } = formattedCurrentWeather;
        const formattedForecastWeather = await getWeatherData("forecast", {
            lat,
            lon,
            units: searchParams.units,
        }).then(formatForecastWeather);
        
        return { 
            ...formattedCurrentWeather, 
            ...formattedForecastWeather 
        };
        
    } catch (error) {
        console.error("Error fetching weather data:", error);
        throw error;
    }
};

const formatToLocalTime = (
    secs,
    timezoneOffset,
    format = "ccc dd LLL yyyy' | Local time: 'hh:mm a"
) => {
    const utcTime = DateTime.fromSeconds(secs);
    const localTime = utcTime.plus({ seconds: timezoneOffset });
    return localTime.toFormat(format);
};

const iconUrlFromCode = (code) => `https://openweathermap.org/img/wn/${code}@2x.png`;

export default getFormattedWeatherData;
export { formatToLocalTime, iconUrlFromCode };
