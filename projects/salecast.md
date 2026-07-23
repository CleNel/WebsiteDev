
The goal of this project was to figure out whether a discount on Steam is actually a good deal, or just a big-looking number for a game that always goes that cheap. Steam runs sales constantly, and the percentage off alone doesn't tell you whether now is unusually good or perfectly ordinary for that specific game.

To build this, I developed a full ML pipeline on Cloudflare D1 and GitHub Actions cron jobs, kept live entirely on free tiers. The process involved:

- **Data foundation:** Curated a set of ~1,000 qualifying Steam games (filtered by review count and age) and backfilled years of real price/discount history per game via the IsThereAnyDeal API, since Steam itself only exposes the current price.
- **Automation:** Built daily price-scrape and weekly discovery jobs so the dataset keeps growing and updating itself without any manual work.
- **Clustering:** Engineered discount-behavior features (depth, frequency, trend over time) and ran K-means to group games by *how* they discount, guarding against silhouette score picking a k that just isolates a single outlier as its own cluster.
- **Smart-buy model:** Built a labeled training set from raw price history (sampling synthetic "today" points and checking what actually happened next) and trained a random forest to predict the probability a game hits a target discount within N days, validated on games it never saw during training.
- **Deal scorer + API:** Combined cluster behavior, smart-buy probability, and a Wilson-score-adjusted review confidence into one composite score, exposed through a small FastAPI service.
- **Frontend + explainability:** Built a static search page with charts showing the reasoning behind every score: the actual price history, a breakdown of what makes up the deal score, and how a game's discounting behavior compares to its cluster's average.

The result is a live tool that turns a Steam discount percentage into an actual answer: is this deal good for *this* game specifically, and how confident should you be.

![SaleCast](projects/salecast.png)
