import { DateTime } from 'luxon';

const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5/";

const getWeatherData = async (infoType, searchParams) => {
    const url = new URL(BASE_URL + infoType);
    url.search = new URLSearchParams({ ...searchParams, appid: API_KEY });
    
    console.log('Fetching from:', url.toString()); // Debug log
    
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

// Updated function to work with current weather only
const getFormattedWeatherData = async (searchParams) => {
    try {
        console.log('API Key available:', !!API_KEY); // Debug log
        
        const formattedCurrentWeather = await getWeatherData("weather", searchParams)
            .then(formatCurrentWeather);
        
        // Return only current weather data since we're using free tier
        return {
            ...formattedCurrentWeather,
            // Add empty arrays for forecast components to prevent errors
            daily: [],
            hourly: [],
            timezone: null
        };
        
    } catch (error) {
        console.error("Error fetching weather data:", error);
        throw error; // Re-throw so components can handle the error
    }
};

const formatToLocalTime = (
    secs,
    zone,
    format = "ccc dd LLL yyyy' | Local time: 'hh:mm a"
) => DateTime.fromSeconds(secs).setZone(zone).toFormat(format);

// Fixed the typo in the URL (removed extra dot)
const iconUrlFromCode = (code) => `https://openweathermap.org/img/wn/${code}@2x.png`;

export default getFormattedWeatherData;
export { formatToLocalTime, iconUrlFromCode };
