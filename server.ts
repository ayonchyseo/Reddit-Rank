import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  // Proxy route for Reddit API (Matches Vercel serverless function)
  app.get("/api/reddit", async (req, res) => {
    const { path: redditPath, ...params } = req.query;
    const queryString = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();

    const targetUrl = `https://www.reddit.com/${redditPath}.json?${queryString}`;
    const url = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Reddit fetch failed', details: String(err) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
