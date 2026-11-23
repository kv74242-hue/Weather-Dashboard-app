const searchForm = document.getElementById('search-form')
const searchInput = document.getElementById('search-input')
const status = document.getElementById('status')
const dashboard = document.getElementById('dashboard')
const historyContainer = document.getElementById('history')
const weatherCard = document.getElementById('weather-card')
const aqiCard = document.getElementById('aqi-card')
let recentCities = loadSavedCities() 
const suggestionContainer = document.getElementById('suggestion')
let debounceTimer = null
let suggestionController = null
let dashController = null


async function fetchJson(url, errorMessage, signal) {
    const res = await fetch(url, { signal })
    if (!res.ok) {
        throw new Error(`${errorMessage} (HTTP ${res.status})`)
    }
    return res.json()
}

async function getCityDashboard(cityName) {
    clearDashboard()
    status.textContent = "Loading....."
    if (dashController) {
        dashController.abort()
    }
    const controller = new AbortController()
    dashController = controller
    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`,
            { signal: controller.signal }
        )

        if (!geoRes.ok) {
            throw new Error("Failed to fetch city location")
        }
        const geoData = await geoRes.json()
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found")
        }
        const city = geoData.results[0]

        await loadDashboardForCity(city)
    } catch (error) {
        if (error.name === 'AbortError') return
        console.error(error)
        status.textContent = error.message
    }
}

async function loadDashboardForCity(city) {
    clearDashboard()
    if (dashController) {
        dashController.abort()
    }
   
    const controller = new AbortController()
    dashController = controller
    status.textContent = "Loading....."
    try {
        const { latitude, longitude } = city
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&timezone=auto`
        const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm2_5,pm10,european_aqi`
        const [weatherResult, airResult] = await Promise.allSettled([
            fetchJson(weatherUrl, 'Weather data not available', controller.signal),
            fetchJson(airUrl, "Air data not available", controller.signal)
        ])
        if (controller.signal.aborted) return

        const weatherData = weatherResult.status === "fulfilled" ? weatherResult.value : null
        const airData = airResult.status === 'fulfilled' ? airResult.value : null
        if (!weatherData && !airData) {
            throw new Error('Loading Failed')
        }
        if (weatherData && airData) {
            status.textContent = ""
        } else if (!airData) {
            status.textContent = "Showing weather (air quality unavailable)"
        } else {
            status.textContent = "Showing air quality (weather unavailable)"
        }

        renderDashboard(city, weatherData, airData)
        saveCity(city)
    } catch (error) {
        status.textContent = error.message
        console.error(error)
    }
}

function getWeatherCondition(code) {
    if (typeof code !== 'number' || Number.isNaN(code))
        return 'Unknown'
    if (code === 0) return 'Clear Sky'
    if (code === 1 || code === 2 || code === 3) return 'Partly Cloudy'
    if (code === 48 || code === 45) return 'Fog'
    if (code >= 51 && code <= 67) return 'Rain / Drizzle'
    if (code >= 71 && code <= 77) return 'Snow'
    if (code >= 80 && code <= 82) return 'Rain showers'
    if (code === 95 || code === 96 || code === 99) return 'Thunderstorm'

    return 'Unknown'
}

function getAqiStatus(aqi) {
    if (typeof aqi !== 'number' || Number.isNaN(aqi)) return 'Unknown';
    if (aqi <= 40) return 'Good'
    if (aqi <= 60) return 'Fair'
    if (aqi <= 80) return 'Moderate'
    if (aqi <= 100) return 'Poor'
    return 'Very Poor'
}

function clearDashboard() {
    dashboard.innerHTML = ''
    weatherCard.innerHTML = ''
    aqiCard.innerHTML = ''
}

function renderDashboard(city, weatherData, airData) {
    const region = city.admin1 ? `${city.admin1}, ` : ''
    dashboard.innerHTML = `<h2>${city.name}, ${region}${city.country || ""}</h2>`
    
    
    if (weatherData?.current) {
        const {
            temperature_2m,
            apparent_temperature,
            relative_humidity_2m,
            wind_speed_10m,
            weather_code,
        } = weatherData.current

        weatherCard.innerHTML = `
    <h3>Weather</h3>
    <p>Temperature : ${temperature_2m ?? 'N/A'} °C </p>
    <p>Feels Like : ${apparent_temperature ?? 'N/A'} °C</p>
    <p> Condition : ${getWeatherCondition(weather_code)} </p>
    <p> Humidity : ${relative_humidity_2m ?? 'N/A'} % </p>
    <p> Wind Speed : ${wind_speed_10m ?? 'N/A'} km/h </p> `;
    } else {
        weatherCard.innerHTML = `
    <h3>Weather</h3>
     <p>Weather data unavailable</p> 
    `;
    }

    if (airData?.current) {
        const { european_aqi, pm2_5, pm10 } = airData.current
        const aqiDisplay =
            european_aqi !== null && european_aqi !== undefined
                ? `${european_aqi}`
                : 'N/A'
    
        const aqiStatus = getAqiStatus(european_aqi)
        const aqiClass = aqiStatus.toLowerCase().replace(/\s+/g, '-')
        aqiCard.innerHTML = `
    <h3>Air Quality</h3>
    <p>European AQI : ${aqiDisplay} <span class='aqi-badge aqi-${aqiClass}'>${aqiStatus}</span></p>
    <p>PM2.5: ${pm2_5 ?? 'N/A'} µg/m³</p>
    <p>PM10: ${pm10 ?? 'N/A'} µg/m³</p> 
    `
    } else {
        aqiCard.innerHTML = `
    <h3> Air Quality </h3>
    <p> Air quality unavailable </p>
    `
    }
}


function saveCity(city) {
    const savedCity = { name: city.name, admin1: city.admin1 || "", country: city.country || "", latitude: city.latitude, longitude: city.longitude }
    recentCities = recentCities.filter((c) => !(c.latitude === savedCity.latitude && c.longitude === savedCity.longitude))
    recentCities.unshift(savedCity)
    recentCities = recentCities.slice(0, 5)

    localStorage.setItem('recentCities', JSON.stringify(recentCities))
    renderHistory()
}

function renderHistory() {
    historyContainer.innerHTML = ''

    recentCities.forEach((city) => {
        const btn = document.createElement("button")
        btn.type = 'button'
        const region = city.admin1 ? `${city.admin1}, ` : ''
        btn.textContent = `${city.name}, ${region}${city.country || ""}`
        btn.addEventListener("click", () => {
            searchInput.value = city.name
            loadDashboardForCity(city)
        })
        historyContainer.appendChild(btn)
    })
}

searchForm.addEventListener("submit", (event) => {
    clearTimeout(debounceTimer)
    if(suggestionController){
        suggestionController.abort()
    }
    suggestionContainer.innerHTML = ""
    event.preventDefault()
    const cityName = searchInput.value.trim()

    if (cityName) {
        getCityDashboard(cityName)
    }
})

searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer)
    const query = searchInput.value.trim()
    if (query.length < 2) {
        suggestionContainer.innerHTML = ""
        return
    }
    debounceTimer = setTimeout(() => { fetchCitySuggestions(query) }, 300)

})

async function fetchCitySuggestions(query) {
    if (suggestionController) {
        suggestionController.abort()
    }
    suggestionController = new AbortController()
    try {
        const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5`,
            { signal: suggestionController.signal }
        )
        if (!res.ok) return
        const data = await res.json()
        renderSuggestion(data.results || [])
    } catch (error) {
        if (error.name === 'AbortError') return
        console.error(error)
    }
}

function renderSuggestion(cities) {
    suggestionContainer.innerHTML = ""

    cities.forEach((city) => {
        const btn = document.createElement('button')
        btn.type = "button"

        const region = city.admin1 ? `${city.admin1}, ` : ''
        btn.textContent = `${city.name}, ${region}${city.country || ""}`

        btn.addEventListener('click', () => {
            searchInput.value = city.name
            suggestionContainer.innerHTML = ''
            loadDashboardForCity(city)
        })
        suggestionContainer.appendChild(btn)
    })
}


function loadSavedCities() {
    const raw = localStorage.getItem('recentCities')
    if (raw === null) return []
    try {
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) {
            localStorage.removeItem('recentCities')
            return []
        }
        const validCities = parsed.filter((item) =>
            item !== null && typeof item === 'object' && typeof item.name === 'string' &&
            typeof item.latitude === 'number' && typeof item.longitude === 'number'
        )
        if (validCities.length === 0) {
            localStorage.removeItem('recentCities')
        } else if (validCities.length !== parsed.length) {
            localStorage.setItem('recentCities', JSON.stringify(validCities))

        }
        return validCities

    } catch (error) {
        localStorage.removeItem('recentCities')
        return []
    }
}

document.addEventListener('keydown', (event)=>{
    if(event.key === 'Escape'){
        suggestionContainer.innerHTML = '';
    
    if (suggestionContainer){
        suggestionContainer.abort()
    }
}
})

document.addEventListener('click',(event)=> {
    if(!searchForm.contains(event.target)) {
        suggestionContainer.innerHTML = ''
    }
})
renderHistory()

if(recentCities.length > 0){
    loadDashboardForCity(recentCities[0])
}