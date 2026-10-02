## Try ThinkFlow

**Live demo:** https://thinkflow-learn.vercel.app
(The free backend sleeps when idle, so the first request can take up to ~50 seconds.)

**Run it locally with one command** (needs [Docker Desktop](https://www.docker.com/products/docker-desktop/)):

```bash
git clone https://github.com/pranavghuge/Thinkflow.git
cd Thinkflow
docker compose up --build
```

Then open http://localhost:3000. The database is created and filled with problems and hints automatically.

To use the AI evaluation features, open **Settings** in the app and add your own Gemini API key.

Stop with `Ctrl+C`. Reset everything with `docker compose down -v`.
