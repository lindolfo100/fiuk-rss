/**
 * Automatically detects and transforms YouTube and Reddit URLs into their RSS feed formats.
 */
export function transformToRssUrl(url: string): string {
  const trimmedUrl = url.trim();
  
  // Reddit
  // Pattern: reddit.com/r/subreddit or reddit.com/u/user
  if (trimmedUrl.includes('reddit.com')) {
    // Remove trailing slash if exists
    const cleanUrl = trimmedUrl.endsWith('/') ? trimmedUrl.slice(0, -1) : trimmedUrl;
    if (!cleanUrl.endsWith('.rss')) {
      return `${cleanUrl}/.rss`;
    }
    return cleanUrl;
  }

  // YouTube
  // Channel: youtube.com/channel/UC...
  const channelMatch = trimmedUrl.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)/);
  if (channelMatch) {
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelMatch[1]}`;
  }

  // User: youtube.com/user/username
  const userMatch = trimmedUrl.match(/youtube\.com\/user\/([a-zA-Z0-9_-]+)/);
  if (userMatch) {
    return `https://www.youtube.com/feeds/videos.xml?user=${userMatch[1]}`;
  }

  // Playlist: youtube.com/playlist?list=PL...
  const playlistMatch = trimmedUrl.match(/youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch) {
    return `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistMatch[1]}`;
  }

  // Handle: youtube.com/@handle
  if (trimmedUrl.includes('youtube.com/@')) {
    return trimmedUrl; // Let the server-side discovery handle this
  }
  
  return trimmedUrl;
}
