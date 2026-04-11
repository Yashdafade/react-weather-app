import React, { useState } from 'react'
import './WeatherApp.css'

import humidity from '../Assets/humidity.png';
import wind from '../Assets/wind.png';
import clouds from '../Assets/clouds.png';
import clear from '../Assets/clear.png';
import rain from '../Assets/rain.png';
import drizzle from '../Assets/drizzle.png';
import mist from '../Assets/mist.png';

const apiKey = process.env.REACT_APP_WEATHER_API_KEY;

const WeatherApp = () => {
    const [wicon, setWicon] = useState(clear);
    const [loading, setLoading] = useState(false);

    const checkWeather = async () => {
        let CityName = document.getElementById("input-city");

        if (!apiKey) {
            alert("Weather API key is missing. Please add REACT_APP_WEATHER_API_KEY to your .env file.");
            return;
        }

        let url = `https://api.openweathermap.org/data/2.5/weather?q=${CityName.value}&APPID=${apiKey}&units=metric`;

        let city = document.querySelector('.CityName');
        let temp = document.querySelector('.temperature');
        let description = document.querySelector('.description');
        let WindSpeed = document.querySelector('.WindSpeed');
        let Humidity = document.querySelector('.Humidity');

        try {
            setLoading(true); // Show loading animation

            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    alert("City not found. Please enter a valid city name.");
                } else {
                    alert(`Error: ${response.status} - Something went wrong.`);
                }
                return;
            }

            let data = await response.json();

            if (!data || !data.weather || !data.weather[0]) {
                alert("No weather data available for the specified city.");
                return;
            }

            city.innerHTML = data.name;
            description.innerHTML = data.weather[0].description;
            temp.innerHTML = Math.round(data.main.temp) + "°C";
            WindSpeed.innerHTML = data.wind.speed + " Km/hr";
            Humidity.innerHTML = data.main.humidity + "%";

            document.querySelector('.weather').style.display = "block";

            // Set weather icon based on conditions
            if (data.weather[0].main === "Clouds") {
                setWicon(clouds);
            } else if (data.weather[0].main === "Clear") {
                setWicon(clear);
            } else if (data.weather[0].main === "Rain") {
                setWicon(rain);
            } else if (data.weather[0].main === "Drizzle") {
                setWicon(drizzle);
            } else if (data.weather[0].main === "Mist") {
                setWicon(mist);
            } else {
                setWicon(clear);
            }
        } catch (error) {
            console.error("An error occurred while fetching weather data:", error);
        } finally {
            setLoading(false); // Hide loading animation
        }
    };



    return (
        <>
           {loading ? (
                <div className="loading">
                    <div className="loading-bar"></div>
                </div>
            ) : ""}
        <div className="container">
         
            <div className="card">
                <div className="input-field">
                    <input className="input-city" id="input-city" type="text" placeholder="Type Your City"></input>
                    <div className="search" id="search" onClick={() => { checkWeather() }}><i className='bx bx-search-alt-2'></i></div>
                </div>
                <div className="weather">
                    <div className="display">
                        <img className="image" src={wicon} alt="." />
                        <h1 className="temperature">--°C</h1>
                        <h2 className="CityName">Search for a city</h2>
                        <h3 className="description">Weather details will appear here</h3>
                    </div>
                    <div className="details">
                        <div className="col">
                            <img src={wind} alt='' />
                            <div>
                                <p>Wind Speed</p>
                                <p className="WindSpeed"></p>
                            </div>
                        </div>
                        <div className="col">
                            <img src={humidity} alt='' />
                            <div>
                                <p>Humidity</p>
                                <p className="Humidity"></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    )


}

export default WeatherApp
