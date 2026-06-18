
The goal of this project was to make housing displacement risk in Los Angeles visible and easy to explore. A lot of data on housing stress exists in public records, but it is scattered across different agencies and formats. I wanted to combine it into a single map where anyone could see the pressure their neighborhood is under and understand what is driving it.

To build this, I developed a full-stack application with a React frontend, a FastAPI backend, and a PostgreSQL database with PostGIS for spatial queries. The process involved:

- **Spatial data pipeline:** Downloaded US Census TIGER/Line tract boundary files, clipped them to the City of Los Angeles boundary, and loaded the resulting shapes into PostGIS so the map could draw and query them.
- **Indicator collection:** Built ETL scripts that pull seven housing stress signals per tract from three sources: the American Community Survey (rent burden, poverty rate, renter share, overcrowding, median income), LA open data (demolition and construction permit activity), and FRED (county-wide median listing price trend).
- **Risk scoring:** Converted each indicator into a 0-100 percentile rank across all LA City tracts, then combined them using weighted scoring (rent burden weighted heaviest at 25%) to produce a single displacement risk score per tract. Scores are bucketed into four tiers: Low, Moderate, High, and Critical.
- **Interactive map:** Built a Mapbox-powered choropleth map where each tract is colored by tier. Clicking a tract opens a panel showing its score, a breakdown of every indicator, and a list of the nearest tenant support organizations (legal aid, rental assistance, eviction defense) returned by a PostGIS distance query.
- **Data export:** Added a CSV download so researchers or advocates can work with the full scored dataset directly.

The result is a working tool that turns several disconnected public datasets into one readable map of where housing pressure in Los Angeles is highest, and why.

![DisplaceMap](projects/displacemap.png)
