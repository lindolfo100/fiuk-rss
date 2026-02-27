import { JSDOM } from 'jsdom';

/**
 * Resolves a standard URL (YouTube, Spotify, Reddit, or Blog) to its raw RSS/XML feed URL.
 */
export async function resolveUrlToRss(inputUrl: string): Promise<string | null> {
  const url = inputUrl.trim();
  
  try {
    // 1. Reddit
    if (url.includes('reddit.com')) {
      const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
      return cleanUrl.endsWith('.rss') ? cleanUrl : `${cleanUrl}/.rss`;
    }

    // 2. YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const response = await fetch(url, { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
        } 
      });
      const html = await response.text();
      
      // Try to find channel ID in meta tags
      const channelIdMatch = html.match(/itemprop="identifier" content="(UC[a-zA-Z0-9_-]+)"/);
      if (channelIdMatch) {
        return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelIdMatch[1]}`;
      }
      
      // Fallback: Try to find it in the HTML source via externalId
      const externalIdMatch = html.match(/"externalId":"(UC[a-zA-Z0-9_-]+)"/);
      if (externalIdMatch) {
        return `https://www.youtube.com/feeds/videos.xml?channel_id=${externalIdMatch[1]}`;
      }

      // Fallback: Try auto-discovery link
      const dom = new JSDOM(html);
      const rssLink = dom.window.document.querySelector('link[type="application/rss+xml"]');
      if (rssLink) {
        return rssLink.getAttribute('href');
      }
    }

    // 3. Spotify Podcasts
    if (url.includes('open.spotify.com/show/')) {
      const response = await fetch(url, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
        }
      });
      const html = await response.text();
      const dom = new JSDOM(html);
      const title = dom.window.document.querySelector('title')?.textContent?.split('|')[0].trim();
      
      if (title) {
        const itunesResponse = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(title)}&entity=podcast`);
        const itunesData = await itunesResponse.json();
        if (itunesData.results && itunesData.results.length > 0) {
          return itunesData.results[0].feedUrl;
        }
      }
    }

    // 4. Standard Blogs/Websites (Auto-discovery)
    const response = await fetch(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } 
    });
    
    if (response.ok) {
      const html = await response.text();
      const dom = new JSDOM(html);
      
      // Look for RSS or Atom links
      const rssLink = dom.window.document.querySelector('link[type="application/rss+xml"]') || 
                      dom.window.document.querySelector('link[type="application/atom+xml"]');
      
      if (rssLink) {
        let href = rssLink.getAttribute('href');
        if (href && !href.startsWith('http')) {
          const baseUrl = new URL(url);
          href = new URL(href, baseUrl.origin).href;
        }
        return href;
      }
    }

    // If it's already an RSS feed, it might just work
    if (url.toLowerCase().endsWith('.xml') || url.toLowerCase().endsWith('.rss') || url.toLowerCase().includes('/feed')) {
      return url;
    }

    return null;
  } catch (error) {
    console.error(`Error resolving URL ${url}:`, error);
    return null;
  }
}
