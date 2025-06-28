import { DateTime } from 'luxon';



const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5/";


// https://api.openweathermap.org/data/2.5/weather?q=tokyo&appid=XXXXXXXXXXXXXXXXXXXX
//use this to check objects/ data to be used, like coord, wind, temp, secs, dt, etc.

const getWeatherData = (infoType, searchParams) => {
    const url = new URL(BASE_URL + infoType)
    url.search = new URLSearchParams(
        { ...searchParams, appid: API_KEY });

    return fetch(url)
        .then((res) => res.json())
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

    } = data

    const { main: details, icon } = weather[0]

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
    }
};

const formatForecastWeather = (data) => {
    let { timezone, daily, hourly } = data;
    daily = daily.slice(1, 6).map(d => {
        return {
            title: formatToLocalTime(d.dt, timezone, "ccc"),
            temp: d.temp.day,
            icon: d.weather[0].icon
        }
    })

    hourly = hourly.slice(1, 6).map(d => {
        return {
            title: formatToLocalTime(d.dt, timezone, "hh:mm a"),
            temp: d.temp,
            icon: d.weather[0].icon
        }
    });

    return { timezone, daily, hourly };
}


const getFormattedWeatherData = async (searchParams) => {

    try {
        const formattedCurrentWeather = await getWeatherData
            ("weather", searchParams).then(formatCurrentWeather)

        const { lat, lon } = formattedCurrentWeather

        const formattedForecastWeather = await getWeatherData("onecall", {
            lat,
            lon,
            exclude: "current, minutely, alert",
            units: searchParams.units,
        }).then(formatCurrentWeather)

        return { ...formattedCurrentWeather, ...formattedForecastWeather };
    } catch (error) {
        console.error("Error fetching weather data:", error);
    }

};

const formatToLocalTime = (
    secs,
    zone,
    format = "ccc dd LLL yyyy' | Local time: 'hh:mm a"
) => DateTime.fromSeconds(secs).setZone(zone).toFormat(format);


const iconUrlFromCode = (code) => `https://openweathermap.org./img/wn/${code}@2x.png`;

export default getFormattedWeatherData;

export { formatToLocalTime, iconUrlFromCode };
