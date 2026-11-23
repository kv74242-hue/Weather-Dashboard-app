This is a Weather and Air Quality Dashboard App which can be used to fetch the weather and air quality data of any country or city in the whole wide world.

- it fetches both the weather data and Air quality data together at a time
- These are the APIS used to fetch those data :
- Open Meteo-Geocoding: https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1
-Forecast: https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&timezone=auto
-AirQuality: https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm2_5,pm10,european_aqi

Live Website link : https://
