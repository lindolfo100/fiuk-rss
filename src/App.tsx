import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LayoutGrid, 
  Cpu, 
  Laugh, 
  Mic, 
  Palette, 
  Settings, 
  Search, 
  Home, 
  Compass, 
  Bookmark,
  Play,
  Pause,
  SkipForward,
  ChevronUp,
  MessageSquare,
  Share2,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  X,
  BookOpen,
  Download,
  Upload,
  FileJson
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FeedItem, FeedType, Folder, ReaderArticle } from './types';
import { MOCK_FOLDERS } from './constants';
import { usePlayerStore } from './store/usePlayerStore';
import { GlobalPlayer } from './components/GlobalPlayer';
import { downloadOPML } from './utils/opml';
import { transformToRssUrl } from './utils/rss';

const DEFAULT_FEEDS = [
  'https://www.theverge.com/rss/index.xml',
  'https://techcrunch.com/feed/',
  'https://www.youtube.com/feeds/videos.xml?playlist_id=UUBJycsmduvYELg8GaZ5XC2g', // MKBHD Uploads
  'https://www.reddit.com/r/technology/.rss',
  'https://lexfridman.com/feed/podcast/',
];

// --- Components ---
// ... (Sidebar, FeedCard, MediaPlayer, MobileNav components remain largely the same but use NormalizedFeedItem)

// I will keep the components inside App.tsx for simplicity as they were before, 
// but I'll update the data fetching logic.

const Sidebar = ({ 
  activeFolder, 
  setActiveFolder, 
  onManageFeeds 
}: { 
  activeFolder: string, 
  setActiveFolder: (id: string) => void,
  onManageFeeds: () => void
}) => {
  return (
    <aside className="hidden md:flex flex-col w-[250px] border-r border-dark-border h-screen sticky top-0 bg-dark-bg p-6">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-8 h-8 rounded-lg bg-neon-accent flex items-center justify-center">
          <span className="text-black font-bold">F</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight">Flux</h1>
      </div>

      <nav className="flex-1 space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">Feeds</p>
        {MOCK_FOLDERS.map((folder) => {
          const Icon = { LayoutGrid, Cpu, Laugh, Mic, Palette, Bookmark }[folder.icon] || LayoutGrid;
          return (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                activeFolder === folder.id 
                  ? 'bg-neon-accent/10 text-neon-accent' 
                  : 'text-gray-400 hover:bg-dark-surface hover:text-gray-200'
              }`}
            >
              <Icon size={18} />
              <span className="font-medium">{folder.name}</span>
            </button>
          );
        })}
        
        <button
          onClick={onManageFeeds}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 hover:bg-dark-surface hover:text-gray-200 transition-colors mt-4"
        >
          <Plus size={18} />
          <span className="font-medium">Manage Feeds</span>
        </button>
      </nav>

      <div className="mt-auto pt-6 border-t border-dark-border">
        <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-gray-200 transition-colors">
          <Settings size={18} />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </aside>
  );
};

const FeedCard = ({ item, isActive, onClick }: { item: FeedItem, isActive: boolean, onClick: () => void, key?: string | number }) => {
  const { setMedia, currentMedia, isPlaying, togglePlay } = usePlayerStore();
  
  const isCurrentMedia = currentMedia?.id === item.id;
  const isCurrentlyPlaying = isCurrentMedia && isPlaying;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentMedia) {
      togglePlay();
    } else {
      setMedia(item);
    }
  };

  const formattedDate = useMemo(() => {
    const date = new Date(item.timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }, [item.timestamp]);

  const renderCardContent = () => {
    switch (item.type) {
      case 'article':
        return (
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {item.sourceIcon && <img src={item.sourceIcon} className="w-4 h-4 rounded-sm" alt="" />}
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{item.source} • {formattedDate}</span>
              </div>
              <h3 className="font-bold text-sm mb-1 line-clamp-2 leading-tight">{item.title}</h3>
              <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>
            </div>
            {item.thumbnail && (
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-dark-surface">
                <img src={item.thumbnail} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
              </div>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="space-y-3">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-dark-surface group">
              <img src={item.thumbnail} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={handlePlayClick}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/40 transition-colors"
                >
                  {isCurrentlyPlaying ? (
                    <Pause size={24} className="text-white fill-white" />
                  ) : (
                    <Play size={24} className="text-white fill-white ml-1" />
                  )}
                </button>
              </div>
              {item.duration && (
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white">
                  {item.duration}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                {item.sourceIcon && <img src={item.sourceIcon} className="w-4 h-4 rounded-full" alt="" />}
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{item.source} • {formattedDate}</span>
              </div>
              <h3 className="font-bold text-sm line-clamp-2 leading-tight">{item.title}</h3>
            </div>
          </div>
        );
      case 'podcast':
        return (
          <div className="flex gap-4">
            <div className="w-[100px] h-[100px] rounded-lg overflow-hidden flex-shrink-0 bg-dark-surface">
              <img src={item.thumbnail} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 flex flex-col justify-between min-w-0">
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">{item.source}</p>
                <h3 className="font-bold text-sm line-clamp-2 leading-tight">{item.title}</h3>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-gray-500 font-medium">{item.duration}</span>
                <button 
                  onClick={handlePlayClick}
                  className="w-8 h-8 rounded-full bg-neon-accent flex items-center justify-center text-black"
                >
                  {isCurrentlyPlaying ? (
                    <Pause size={14} className="fill-black" />
                  ) : (
                    <Play size={14} className="fill-black ml-0.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      case 'reddit':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white">r/</div>
              <span className="text-[10px] text-gray-500 font-bold tracking-wider">{item.source} • {item.author}</span>
            </div>
            <h3 className="font-bold text-sm leading-tight">{item.title}</h3>
            {item.thumbnail && (
              <div className="aspect-[16/10] rounded-lg overflow-hidden bg-dark-surface">
                <img src={item.thumbnail} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
              </div>
            )}
            <div className="flex items-center gap-4 text-gray-500">
              <div className="flex items-center gap-1 text-xs font-bold">
                <ChevronUp size={14} />
                <span>{item.votes}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold">
                <MessageSquare size={14} />
                <span>{item.comments}</span>
              </div>
              <Share2 size={14} />
            </div>
          </div>
        );
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={`p-4 rounded-2xl cursor-pointer border transition-all ${
        isActive 
          ? 'bg-dark-surface border-neon-accent/30 ring-1 ring-neon-accent/20' 
          : 'bg-transparent border-transparent hover:bg-dark-surface/50'
      }`}
    >
      {renderCardContent()}
    </motion.div>
  );
};

const MobileNav = ({ onAddFeed, activeFolder, setActiveFolder }: { onAddFeed: () => void, activeFolder: string, setActiveFolder: (id: string) => void }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass flex items-center justify-around px-4 z-50 border-t border-dark-border/50">
      <button 
        onClick={() => setActiveFolder('all')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeFolder !== 'saved' ? 'text-neon-accent' : 'text-gray-500'}`}
      >
        <Home size={20} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
      </button>
      <button 
        onClick={onAddFeed}
        className="flex flex-col items-center gap-1 text-gray-500"
      >
        <Plus size={20} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Add</span>
      </button>
      <button 
        onClick={() => setActiveFolder('saved')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeFolder === 'saved' ? 'text-neon-accent' : 'text-gray-500'}`}
      >
        <Bookmark size={20} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Saved</span>
      </button>
    </div>
  );
};

export default function App() {
  const [activeFolder, setActiveFolder] = useState('all');
  const [activeType, setActiveType] = useState<FeedType | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Custom Feed Management
  const [userFeedUrls, setUserFeedUrls] = useState<string[]>(() => {
    const saved = localStorage.getItem('flux_feed_urls');
    return saved ? JSON.parse(saved) : DEFAULT_FEEDS;
  });
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isAddingFeed, setIsAddingFeed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const saved = localStorage.getItem('flux_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  // Reader Mode
  const [readerArticle, setReaderArticle] = useState<ReaderArticle | null>(null);
  const [isReaderLoading, setIsReaderLoading] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  // Global Player Store
  const { currentMedia, isPlaying, togglePlay, setMedia } = usePlayerStore();
  
  const isCurrentMedia = currentMedia?.id === selectedItem?.id;
  const isCurrentlyPlaying = isCurrentMedia && isPlaying;

  const handleMainPlayClick = () => {
    if (!selectedItem) return;
    if (isCurrentMedia) {
      togglePlay();
    } else {
      setMedia(selectedItem);
    }
  };

  useEffect(() => {
    localStorage.setItem('flux_feed_urls', JSON.stringify(userFeedUrls));
  }, [userFeedUrls]);

  useEffect(() => {
    localStorage.setItem('flux_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const fetchFeeds = async () => {
    if (userFeedUrls.length === 0) {
      setFeeds([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: userFeedUrls }),
      });
      if (!response.ok) throw new Error('Failed to fetch feeds');
      const data = await response.json();
      setFeeds(data);
      if (data.length > 0 && !selectedItem) {
        setSelectedItem(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds();
  }, [userFeedUrls]);

  const toggleBookmark = (id: string) => {
    setBookmarks(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const addFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedUrl) return;
    
    setIsAddingFeed(true);
    try {
      const response = await fetch('/api/resolve-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newFeedUrl }),
      });

      let rssUrl = newFeedUrl;
      if (response.ok) {
        const data = await response.json();
        rssUrl = data.resolvedUrl;
      } else {
        // Fallback to client-side basic transformation if backend fails
        rssUrl = transformToRssUrl(newFeedUrl);
      }
      
      if (!userFeedUrls.includes(rssUrl)) {
        setUserFeedUrls(prev => [...prev, rssUrl]);
        setNewFeedUrl('');
      } else {
        alert('This feed is already in your list.');
      }
    } catch (err) {
      console.error('Resolution error:', err);
      // Fallback
      const rssUrl = transformToRssUrl(newFeedUrl);
      if (!userFeedUrls.includes(rssUrl)) {
        setUserFeedUrls(prev => [...prev, rssUrl]);
        setNewFeedUrl('');
      }
    } finally {
      setIsAddingFeed(false);
    }
  };

  const removeFeed = (url: string) => {
    setUserFeedUrls(prev => prev.filter(u => u !== url));
  };

  const handleImportOPML = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/opml/import', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to import OPML');
      const data = await response.json();
      
      const newUrls = data.feeds.map((f: any) => f.url).filter((url: string) => !userFeedUrls.includes(url));
      if (newUrls.length > 0) {
        setUserFeedUrls(prev => [...prev, ...newUrls]);
        alert(`Successfully imported ${newUrls.length} new feeds!`);
      } else {
        alert('No new feeds found in the OPML file.');
      }
    } catch (err) {
      console.error(err);
      alert('Error importing OPML file.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openReaderMode = async (url: string) => {
    setIsReaderOpen(true);
    setIsReaderLoading(true);
    setReaderArticle(null);
    try {
      const response = await fetch(`/api/readability?url=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error('Failed to load reader mode');
      const data = await response.json();
      setReaderArticle(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsReaderLoading(false);
    }
  };

  const filteredFeed = useMemo(() => {
    let result = feeds;
    if (activeFolder === 'saved') {
      result = feeds.filter(item => bookmarks.includes(item.id));
    }
    return result.filter(item => activeType === 'all' || item.type === activeType);
  }, [feeds, activeType, activeFolder, bookmarks]);

  const formattedSelectedDate = useMemo(() => {
    if (!selectedItem) return '';
    return new Date(selectedItem.timestamp).toLocaleString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [selectedItem]);

  return (
    <div className="flex min-h-screen bg-dark-bg text-gray-200">
      <Sidebar 
        activeFolder={activeFolder} 
        setActiveFolder={setActiveFolder} 
        onManageFeeds={() => setIsManageModalOpen(true)}
      />

      <main className="flex-1 flex flex-col md:flex-row min-w-0">
        {/* Center Column: Feed List */}
        <div className="w-full md:w-[400px] border-r border-dark-border flex flex-col h-screen overflow-hidden">
          <header className="p-6 sticky top-0 bg-dark-bg/80 backdrop-blur-md z-10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {activeFolder === 'saved' ? 'Saved Items' : 'Feed'}
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={fetchFeeds}
                  disabled={isLoading}
                  className="p-2 rounded-full hover:bg-dark-surface transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={18} className={`text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button 
                  onClick={() => setActiveFolder(activeFolder === 'saved' ? 'all' : 'saved')}
                  className={`p-2 rounded-full transition-colors ${activeFolder === 'saved' ? 'text-neon-accent bg-neon-accent/10' : 'text-gray-400 hover:bg-dark-surface'}`}
                >
                  <Bookmark size={20} />
                </button>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {['all', 'video', 'podcast', 'article'].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveType(type as any)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    activeType === type 
                      ? 'bg-neon-accent text-black' 
                      : 'bg-dark-surface text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {type === 'all' ? 'All' : type === 'article' ? 'Read' : type === 'video' ? 'Videos' : 'Audio'}
                </button>
              ))}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide pb-32">
            {isLoading && feeds.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-4">
                <Loader2 className="animate-spin" size={32} />
                <p className="text-sm font-medium">Fetching your feeds...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center space-y-4">
                <p className="text-red-400 text-sm">{error}</p>
                <button onClick={fetchFeeds} className="text-neon-accent text-xs font-bold uppercase tracking-widest underline">Retry</button>
              </div>
            ) : filteredFeed.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">
                  {activeFolder === 'saved' ? 'No saved items yet.' : 'No items found for this filter.'}
                </p>
              </div>
            ) : (
              filteredFeed.map((item) => (
                <FeedCard 
                  key={item.id} 
                  item={item} 
                  isActive={selectedItem?.id === item.id}
                  onClick={() => setSelectedItem(item)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Column: Content Pane */}
        <div className="hidden md:flex flex-1 flex-col h-screen overflow-hidden bg-dark-bg">
          <AnimatePresence mode="wait">
            {selectedItem ? (
              <motion.div
                key={selectedItem.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 overflow-y-auto p-10 pb-32"
              >
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedItem.sourceIcon && <img src={selectedItem.sourceIcon} className="w-6 h-6 rounded-md" alt="" />}
                      <div>
                        <p className="text-sm font-bold">{selectedItem.source}</p>
                        <p className="text-xs text-gray-500">{formattedSelectedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedItem.type === 'article' && (
                        <button 
                          onClick={() => openReaderMode(selectedItem.link)}
                          className="p-2 rounded-full hover:bg-dark-surface text-neon-accent transition-colors"
                          title="Reader Mode"
                        >
                          <BookOpen size={20} />
                        </button>
                      )}
                      <button 
                        onClick={() => toggleBookmark(selectedItem.id)}
                        className={`p-2 rounded-full transition-colors ${bookmarks.includes(selectedItem.id) ? 'text-neon-accent bg-neon-accent/10' : 'text-gray-400 hover:bg-dark-surface'}`}
                      >
                        <Bookmark size={20} fill={bookmarks.includes(selectedItem.id) ? "currentColor" : "none"} />
                      </button>
                      <button className="p-2 rounded-full hover:bg-dark-surface text-gray-400 transition-colors">
                        <Share2 size={20} />
                      </button>
                      <a 
                        href={selectedItem.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-dark-surface text-gray-400 transition-colors"
                      >
                        <ExternalLink size={20} />
                      </a>
                    </div>
                  </div>

                  <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
                    {selectedItem.title}
                  </h1>

                  {selectedItem.type === 'video' && selectedItem.videoId && (
                    <div className="aspect-video rounded-2xl overflow-hidden bg-dark-surface border border-dark-border">
                      <iframe 
                        src={`https://www.youtube.com/embed/${selectedItem.videoId}`} 
                        className="w-full h-full" 
                        allowFullScreen 
                        title={selectedItem.title}
                      />
                    </div>
                  )}

                  {selectedItem.type === 'reddit' && selectedItem.thumbnail && (
                    <div className="rounded-2xl overflow-hidden border border-dark-border">
                      <img src={selectedItem.thumbnail} className="w-full object-cover" alt="" referrerPolicy="no-referrer" />
                    </div>
                  )}

                  {selectedItem.type === 'podcast' && (
                    <div className="p-8 rounded-3xl bg-dark-surface border border-dark-border flex flex-col items-center text-center space-y-6">
                      <img src={selectedItem.thumbnail} className="w-48 h-48 rounded-2xl shadow-2xl" alt="" referrerPolicy="no-referrer" />
                      <div>
                        <h2 className="text-2xl font-bold mb-2">{selectedItem.title}</h2>
                        <p className="text-neon-accent font-medium uppercase tracking-widest text-xs">{selectedItem.source}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={handleMainPlayClick}
                          className="w-16 h-16 rounded-full bg-neon-accent text-black flex items-center justify-center hover:scale-105 transition-transform"
                        >
                          {isCurrentlyPlaying ? (
                            <Pause size={32} className="fill-black" />
                          ) : (
                            <Play size={32} className="fill-black ml-1" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="prose prose-invert max-w-none">
                    <div 
                      className="text-lg text-gray-400 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: selectedItem.content || selectedItem.description || "" }}
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-dark-surface flex items-center justify-center mx-auto">
                    <LayoutGrid size={40} className="text-gray-600" />
                  </div>
                  <p className="font-medium">Select an item from the feed to read</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Manage Feeds Modal */}
      <AnimatePresence>
        {isManageModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsManageModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-dark-surface border border-dark-border rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-dark-border flex items-center justify-between">
                <h3 className="text-xl font-bold">Manage Feeds</h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => downloadOPML(userFeedUrls)}
                    className="p-2 hover:bg-dark-bg rounded-full transition-colors text-gray-400 hover:text-neon-accent"
                    title="Export OPML"
                  >
                    <Download size={20} />
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-dark-bg rounded-full transition-colors text-gray-400 hover:text-neon-accent"
                    title="Import OPML"
                    disabled={isImporting}
                  >
                    {isImporting ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImportOPML} 
                    accept=".opml,.xml" 
                    className="hidden" 
                  />
                  <button onClick={() => setIsManageModalOpen(false)} className="p-2 hover:bg-dark-bg rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <form onSubmit={addFeed} className="flex gap-2">
                  <input 
                    type="url" 
                    placeholder="Enter RSS Feed URL..."
                    value={newFeedUrl}
                    onChange={(e) => setNewFeedUrl(e.target.value)}
                    className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neon-accent/50 transition-all"
                    required
                  />
                  <button 
                    type="submit" 
                    disabled={isAddingFeed}
                    className="bg-neon-accent text-black px-4 py-2 rounded-xl text-sm font-bold hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
                  >
                    {isAddingFeed && <Loader2 size={16} className="animate-spin" />}
                    Add
                  </button>
                </form>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Your Subscriptions</p>
                  {userFeedUrls.map((url) => (
                    <div key={url} className="flex items-center justify-between bg-dark-bg p-3 rounded-xl border border-dark-border group">
                      <span className="text-xs text-gray-400 truncate flex-1 mr-4">{url}</span>
                      <button 
                        onClick={() => removeFeed(url)}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {userFeedUrls.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4 italic">No feeds added yet.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reader Mode Overlay */}
      <AnimatePresence>
        {isReaderOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-dark-bg flex flex-col"
          >
            <header className="h-16 border-b border-dark-border flex items-center justify-between px-6 bg-dark-bg/80 backdrop-blur-md sticky top-0">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsReaderOpen(false)}
                  className="p-2 hover:bg-dark-surface rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Reader Mode</span>
              </div>
              <div className="flex items-center gap-4">
                {readerArticle && (
                  <span className="text-xs text-gray-500">{readerArticle.siteName}</span>
                )}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto py-16 px-6">
                {isReaderLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <Loader2 className="animate-spin text-neon-accent" size={40} />
                    <p className="text-gray-500 font-medium">Extracting clean content...</p>
                  </div>
                ) : readerArticle ? (
                  <article className="space-y-8">
                    <header className="space-y-4">
                      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                        {readerArticle.title}
                      </h1>
                      {readerArticle.byline && (
                        <p className="text-neon-accent font-bold">{readerArticle.byline}</p>
                      )}
                    </header>
                    <div 
                      className="reader-content prose prose-invert prose-lg max-w-none 
                        prose-headings:font-bold prose-headings:tracking-tight
                        prose-p:text-gray-300 prose-p:leading-relaxed
                        prose-a:text-neon-accent prose-a:no-underline hover:prose-a:underline
                        prose-img:rounded-2xl prose-img:border prose-img:border-dark-border"
                      dangerouslySetInnerHTML={{ __html: readerArticle.content }}
                    />
                  </article>
                ) : (
                  <div className="text-center py-20 space-y-4">
                    <p className="text-red-400">Failed to load content in reader mode.</p>
                    <button 
                      onClick={() => selectedItem && openReaderMode(selectedItem.link)}
                      className="text-neon-accent underline font-bold"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <GlobalPlayer />
      <MobileNav 
        onAddFeed={() => setIsManageModalOpen(true)} 
        activeFolder={activeFolder} 
        setActiveFolder={setActiveFolder} 
      />

      {/* Mobile FAB for adding feeds */}
      <div className="md:hidden fixed bottom-20 right-6 z-40">
        <button 
          onClick={() => setIsManageModalOpen(true)}
          className="w-14 h-14 rounded-full bg-neon-accent text-black shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        >
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
}
