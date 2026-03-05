import Parser from 'rss-parser';
import { JSDOM } from 'jsdom';

/**
 * Normalized Feed Item Interface
 */
export type FeedType = 'article' | 'video' | 'podcast' | 'reddit';

export interface NormalizedFeedItem {
  id: string;
  type: FeedType;
  source: string;
  sourceIcon?: string;
  author?: string;
  title: string;
  link: string;
  description?: string;
  pubDate: string;
  timestamp: number;
  thumbnail?: string;
  duration?: string;
  audioUrl?: string;
  videoId?: string;
  votes?: string;
  comments?: number;
  content?: string;
}

// Initialize RSS Parser
const parser = new Parser({
  customFields: {
    item: [
      ['media:group', 'mediaGroup'],
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['itunes:duration', 'itunesDuration'],
      ['itunes:image', 'itunesImage'],
      ['enclosure', 'enclosure'],
      ['dc:creator', 'creator'],
    ],
  },
});

const FEED_FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = FEED_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  // Use abort() without a reason for compatibility with older runtimes.
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Extracts the first image URL from an HTML string
 */
function extractImageFromHtml(html: string): string | undefined {
  try {
    const dom = new JSDOM(html);
    const img = dom.window.document.querySelector('img');
    return img?.src || undefined;
  } catch (e) {
    return undefined;
  }
}

/**
 * Normalizes a raw RSS item into our unified FeedItem structure
 */
export function normalizeFeedItem(item: any, feedTitle: string, feedUrl: string): NormalizedFeedItem {
  const link = item.link || '';
  const pubDate = item.pubDate || item.isoDate || new Date().toISOString();
  const timestamp = new Date(pubDate).getTime();
  const id = item.guid || item.id || link || Math.random().toString(36).substr(2, 9);

  // 1. Identify Type: YouTube
  if (feedUrl.includes('youtube.com') || link.includes('youtube.com') || link.includes('youtu.be')) {
    const videoId = link.split('v=')[1]?.split('&')[0] || link.split('/').pop();
    return {
      id,
      type: 'video',
      source: feedTitle,
      title: item.title,
      link,
      pubDate,
      timestamp,
      videoId,
      thumbnail: item.mediaThumbnail?.$?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      author: item.author || item.creator,
    };
  }

  // 2. Identify Type: Reddit
  if (feedUrl.includes('reddit.com') || link.includes('reddit.com')) {
    const content = item.content || item.description || '';
    const thumbnail = extractImageFromHtml(content);
    return {
      id,
      type: 'reddit',
      source: feedTitle,
      title: item.title,
      link,
      pubDate,
      timestamp,
      author: item.author?.name || item.creator,
      thumbnail,
      content: content.replace(/<[^>]*>?/gm, '').substring(0, 200), // Strip HTML for snippet
      votes: 'N/A', // RSS doesn't usually include votes
    };
  }

  // 3. Identify Type: Podcast
  const enclosure = item.enclosure || (Array.isArray(item.mediaContent) ? item.mediaContent[0] : item.mediaContent);
  const isAudio = enclosure?.type?.includes('audio') || link.endsWith('.mp3');
  if (isAudio || item.itunesDuration) {
    return {
      id,
      type: 'podcast',
      source: feedTitle,
      title: item.title,
      link,
      pubDate,
      timestamp,
      audioUrl: enclosure?.url || link,
      duration: item.itunesDuration,
      thumbnail: item.itunesImage?.$?.href || item.itunesImage || extractImageFromHtml(item.content || item.description || ''),
      description: item.contentSnippet || item.description,
    };
  }

  // 4. Default Type: Article
  const content = item.content || item['content:encoded'] || item.description || '';
  return {
    id,
    type: 'article',
    source: feedTitle,
    title: item.title,
    link,
    pubDate,
    timestamp,
    author: item.creator || item.author,
    description: item.contentSnippet || item.description,
    thumbnail: extractImageFromHtml(content),
    content: content,
  };
}

/**
 * Fetches and normalizes multiple feeds concurrently
 */
export async function fetchAllFeeds(urls: string[]): Promise<NormalizedFeedItem[]> {
  const feedPromises = urls.map(async (url) => {
    let currentUrl = url;
    try {
      const isYouTube = currentUrl.includes('youtube.com');
      const isReddit = currentUrl.includes('reddit.com');
      
      const headers: Record<string, string> = {};

      if (isReddit) {
        // Reddit requires a unique User-Agent to avoid 403
        headers['User-Agent'] = 'FluxAggregator/1.0.0 (by /u/FluxUser)';
      } else if (isYouTube) {
        // YouTube RSS is extremely picky. Sometimes it works better with NO User-Agent 
        // or a very standard one. We'll try a very basic one.
        headers['User-Agent'] = 'Mozilla/5.0'; 
      } else {
        headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      }

      let response = await fetchWithTimeout(currentUrl, {
        headers,
        method: 'GET',
        redirect: 'follow',
      });

      if (!response.ok) {
        // Fallback for YouTube: Try the playlist format if channel_id fails, and vice-versa
        if (isYouTube && response.status === 404) {
          let fallbackUrl = null;
          if (currentUrl.includes('channel_id=')) {
            const channelId = currentUrl.split('channel_id=')[1].split('&')[0];
            fallbackUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=UU${channelId.substring(2)}`;
          } else if (currentUrl.includes('playlist_id=UU')) {
            const playlistId = currentUrl.split('playlist_id=')[1].split('&')[0];
            fallbackUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=UC${playlistId.substring(2)}`;
          }

          if (fallbackUrl) {
            console.log(`YouTube 404, trying fallback: ${fallbackUrl}`);
            response = await fetchWithTimeout(fallbackUrl, {
              headers,
              method: 'GET',
              redirect: 'follow',
            });
            if (response.ok) {
              currentUrl = fallbackUrl;
            }
          }
        }
        
        if (!response.ok) {
          throw new Error(`Status code ${response.status} for ${currentUrl}`);
        }
      }

      const xml = await response.text();
      const trimmedXml = xml.trim();
      
      // If the response is HTML, try to find the RSS link
      if (trimmedXml.toLowerCase().startsWith('<!doctype html') || trimmedXml.toLowerCase().startsWith('<html')) {
        const dom = new JSDOM(xml);
        const rssLink = dom.window.document.querySelector('link[type="application/rss+xml"]') || dom.window.document.querySelector('link[type="application/atom+xml"]');
        if (rssLink && rssLink.getAttribute('href')) {
          let discoveredUrl = rssLink.getAttribute('href')!;
          if (!discoveredUrl.startsWith('http')) {
            discoveredUrl = new URL(discoveredUrl, currentUrl).toString();
          }
          console.log(`Discovered RSS URL: ${discoveredUrl} for ${currentUrl}`);
          return fetchAllFeeds([discoveredUrl]);
        }
        throw new Error(`Received HTML instead of XML for ${currentUrl}`);
      }

      const feed = await parser.parseString(xml);
      
      return feed.items.map(item => normalizeFeedItem(item, feed.title || 'Unknown Source', currentUrl));
    } catch (error: any) {
      const errorCode = error.cause?.code || error.code;
      if (errorCode === 'ENOTFOUND' || errorCode === 'EAI_AGAIN' || errorCode === 'ECONNREFUSED') {
        console.warn(`Feed unavailable (DNS/Network error): ${url}`);
      } else if (error.message?.includes('Received HTML instead of XML')) {
        console.warn(`Feed unavailable (Returned HTML): ${url}`);
      } else {
        console.error(`Error fetching feed from ${url}:`, error.message || error);
      }
      return []; 
    }
  });

  const results = await Promise.all(feedPromises);
  const allItems = results.flat();

  // Sort by newest first
  return allItems.sort((a, b) => b.timestamp - a.timestamp);
}
