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

const getFormattedWeatherData = async (searchParams) => {
    try {
        // Get current weather
        const currentWeather = await getWeatherData("weather", searchParams);
        const formattedCurrentWeather = formatCurrentWeather(currentWeather);
        
        // Get forecast data just for the timezone info (WE USE free API)
        const { lat, lon } = formattedCurrentWeather;
        const forecastData = await getWeatherData("forecast", {
            lat,
            lon,
            units: searchParams.units,
        });
        
        // Extract timezone from forecast data
        const timezone = forecastData.city.timezone; // This is the correct timezone offset!
        
        return {
            ...formattedCurrentWeather,
            timezone: timezone, // Now we have the correct timezone!
            daily: [],
            hourly: [],
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
    // Convert UTC timestamp to local time using timezone offset
    const utcTime = DateTime.fromSeconds(secs);
    const localTime = utcTime.plus({ seconds: timezoneOffset });
    return localTime.toFormat(format);
};

const iconUrlFromCode = (code) => `https://openweathermap.org/img/wn/${code}@2x.png`;

export default getFormattedWeatherData;
export { formatToLocalTime, iconUrlFromCode };
