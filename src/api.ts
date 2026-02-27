import express from "express";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import multer from "multer";
import xml2js from "xml2js";
import { fetchAllFeeds } from "./services/feedService.js";
import { resolveUrlToRss } from "./services/urlResolver.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(express.json());

// API Routes
router.post("/feeds", async (req, res) => {
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

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.get("/readability", async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error("Failed to parse article content");
    }

    res.json(article);
  } catch (error) {
    console.error("Readability error:", error);
    res.status(500).json({ error: "Failed to parse article" });
  }
});

router.post("/opml/import", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const xml = req.file.buffer.toString("utf-8");
    const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
    const result = await parser.parseStringPromise(xml);

    const feeds: { title: string; url: string; folder?: string }[] = [];

    const processOutline = (outline: any, folderName?: string) => {
      if (!outline) return;
      const outlines = Array.isArray(outline) ? outline : [outline];
      
      for (const item of outlines) {
        const xmlUrl = item.xmlUrl || item.xmlurl || item.XMLURL;
        
        // If it has an xmlUrl, it's a feed
        if (xmlUrl) {
          feeds.push({
            title: item.text || item.title || "Unknown Feed",
            url: xmlUrl,
            folder: folderName
          });
        } 
        
        // If it has nested outlines, it's a folder or a nested structure
        if (item.outline) {
          processOutline(item.outline, item.text || item.title || folderName);
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

router.post("/resolve-url", async (req, res) => {
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

export default router;
