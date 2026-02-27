export type FeedType = 'article' | 'video' | 'podcast' | 'reddit';

export interface FeedItem {
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

export interface Folder {
  id: string;
  name: string;
  icon: string;
}

export interface ReaderArticle {
  title: string;
  content: string;
  textContent: string;
  length: number;
  excerpt: string;
  byline: string;
  dir: string;
  siteName: string;
  lang: string;
  publishedTime: string;
}
