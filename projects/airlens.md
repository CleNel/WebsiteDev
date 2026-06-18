
The goal of this project was to build a real-time air quality dashboard that gives anyone in the United States a clear, honest picture of the air around them, covering not just a single number but the full context: what pollutants are present, how conditions compare historically, and what the health implications are.

To build this, I developed a React application that pulls from several public data sources and layers them into a single coherent view. The process involved:

- **Live AQI data:** Integrated the EPA's AirNow API to fetch real-time air quality index readings and 2-day forecasts for any searched location or the user's current position.
- **Pollutant breakdown:** Surfaced individual readings for PM2.5, PM10, Ozone, and CO with category labels (Good → Hazardous) so users can see what is actually driving the overall score.
- **Historical trends:** Used the OpenAQ API to pull up to 30 days of PM2.5 measurements from the nearest monitoring station, aggregated by day and visualized with Recharts.
- **Environmental justice context:** Queried the EPA's EJScreen API to show each location's national pollution burden percentile and demographic context, situating air quality within the broader environmental justice picture.
- **Find better air:** Built a feature that surfaces nearby parks and green spaces with cleaner readings, giving users an actionable option when local air quality is poor.
- **Graceful degradation:** Designed the app so that every data source is optional. If AirNow is unavailable, it falls back to OpenAQ; if the map token is absent, it falls back to free OpenStreetMap tiles.

The result is a fully functional air quality tool that works for any US location, requires no account to use, and presents public environmental data in a way that is actually readable and useful.

![AirLens](projects/airlens.png)
