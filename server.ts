import express from "express";
import { createServer as createViteServer } from "vite";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import multer from "multer";
import xml2js from "xml2js";
import { fetchAllFeeds } from "./src/services/feedService.js";
import { resolveUrlToRss } from "./src/services/urlResolver.js";

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/feeds", async (req, res) => {
    try {
      const { urls } = req.body;
      if (!urls || !Array.isArray(urls)) {
        return res.status(400).json({ error: "Invalid urls array" });
      }

      const feeds = await fetchAllFeeds(urls);
      res.json(feeds);
    } catch (error) {
      console.error("Feed fetch error:", error);
      res.status(500).json({ error: "Failed to fetch feeds" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/readability", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch article: ${response.status}`);
      }

      const html = await response.text();
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (!article) {
        return res.status(404).json({ error: "Could not parse article content" });
      }

      res.json(article);
    } catch (error) {
      console.error("Readability error:", error);
      res.status(500).json({ error: "Failed to extract article content" });
    }
  });

  app.post("/api/opml/import", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const xml = req.file.buffer.toString("utf-8");
      const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
      const result = await parser.parseStringPromise(xml);

      const feeds: { title: string; url: string; folder?: string }[] = [];

      const processOutline = (outline: any, folderName?: string) => {
        const outlines = Array.isArray(outline) ? outline : [outline];
        
        for (const item of outlines) {
          if (item.type === "rss") {
            feeds.push({
              title: item.text || item.title || "Unknown Feed",
              url: item.xmlUrl,
              folder: folderName
            });
          } else if (item.outline) {
            // It's a folder
            processOutline(item.outline, item.text || item.title);
          }
        }
      };

      if (result.opml && result.opml.body && result.opml.body.outline) {
        processOutline(result.opml.body.outline);
      }

      res.json({ feeds });
    } catch (error) {
      console.error("OPML Import error:", error);
      res.status(500).json({ error: "Failed to parse OPML file" });
    }
  });

  app.post("/api/resolve-url", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const resolvedUrl = await resolveUrlToRss(url);
      if (resolvedUrl) {
        res.json({ resolvedUrl });
      } else {
        res.status(404).json({ error: "Could not resolve RSS feed for this URL" });
      }
    } catch (error) {
      console.error("URL resolution error:", error);
      res.status(500).json({ error: "Failed to resolve URL" });
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
    // In production, serve static files from dist
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
