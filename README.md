# 🌦️ Weather App with API Integration

A modern **Weather Application** built using **HTML, CSS, and JavaScript**, integrated with a live **Weather API** (like OpenWeatherMap or WeatherAPI) to fetch and display real-time weather data for any city in the world.

---

## 🚀 Features

* 🌍 **Search Weather by City Name** – Get real-time weather info for any location worldwide.
* 🌡️ **Detailed Weather Info** – Displays temperature, humidity, wind speed, and weather conditions.
* 🎨 **Responsive & Clean UI** – Works perfectly on desktop and mobile.
* 📡 **Live API Integration** – Uses a public weather API for real-time data fetching.
* 🌅 **Dynamic Backgrounds / Icons** – Background or icons change based on weather conditions.

---

## 🛠️ Tech Stack

* **Frontend:** HTML, CSS, JavaScript
* **API:** [OpenWeatherMap API](https://openweathermap.org/api) *(or any other weather API you’re using)*
* **Version Control:** Git & GitHub

---

## 🧩 Folder Structure

```
Weather-App-with-API-Integration/
│
├── index.html          # Main HTML file
├── style.css           # Styling for the app
├── script.js           # API calls and logic
├── assets/             # Icons or background images
└── README.md           # Documentation
```

---

## ⚙️ Setup & Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/<your-username>/Weather-App-with-API-Integration.git
   cd Weather-App-with-API-Integration
   ```

2. **Get your API Key:**

   * Create an account at [OpenWeatherMap](https://openweathermap.org/).
   * Navigate to **API Keys** in your profile and copy your key.

3. **Add your API Key to the script:**
   In `script.js`, replace the placeholder with your actual key:

   ```javascript
   const apiKey = "YOUR_API_KEY_HERE";
   ```

4. **Run the app:**

   * Open `index.html` in your browser, or
   * Use a local server (e.g., VS Code Live Server extension).

---

## 💡 Usage

1. Enter the name of a city (e.g., *New York, London, Tokyo*).
2. Hit the **Search** button.
3. View live weather updates, including:

   * Current temperature
   * Weather description
   * Humidity and wind speed
   * Weather icon or background change

---

## 🧠 Example Output

**City:** London
**Temperature:** 15°C
**Condition:** Cloudy ☁️
**Humidity:** 72%
**Wind:** 8 km/h

---

## 📸 Screenshots

*(Add your app screenshots here for better presentation)*
Example:

```
![Weather App Screenshot](assets/screenshot.png)
```

---

## 🔮 Future Enhancements

* 📍 Detect user’s location automatically using Geolocation API.
* 📅 5-day weather forecast view.
* 🎨 Theme customization (dark/light mode).
* 📊 Graphical representation of temperature trends.

---

## 🤝 Contributing

Contributions are welcome!
To contribute:

1. Fork this repository
2. Create a new branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m "Added new feature"`
4. Push and open a Pull Request

---

## 🪪 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.
