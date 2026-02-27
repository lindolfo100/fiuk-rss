import React, { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  Maximize2, 
  Minimize2, 
  X,
  FastForward,
  Rewind,
  Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const GlobalPlayer = () => {
  const { 
    currentMedia, 
    isPlaying, 
    togglePlay, 
    setPlaying,
    progress, 
    setProgress,
    volume,
    setVolume,
    playbackRate,
    setPlaybackRate,
    isMinimized,
    setMinimized,
    reset 
  } = usePlayerStore();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [duration, setDuration] = useState(0);
  const [showRateMenu, setShowRateMenu] = useState(false);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentMedia]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  if (!currentMedia) return null;

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isAudio = currentMedia.type === 'podcast';
  const isVideo = currentMedia.type === 'video';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={`fixed bottom-0 left-0 right-0 z-[200] bg-dark-surface/95 backdrop-blur-2xl border-t border-dark-border transition-all duration-300 ${
          isMinimized ? 'h-16' : 'h-28'
        }`}
      >
        {/* Progress Bar (Top of player) */}
        {!isMinimized && isAudio && (
          <div className="absolute top-0 left-0 right-0 h-1 group cursor-pointer">
            <input 
              type="range"
              min="0"
              max={duration || 100}
              value={progress}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="h-full bg-dark-bg w-full">
              <div 
                className="h-full bg-neon-accent relative" 
                style={{ width: `${(progress / (duration || 1)) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform" />
              </div>
            </div>
          </div>
        )}

        <div className="max-w-screen-2xl mx-auto h-full px-4 md:px-8 flex items-center justify-between gap-4 md:gap-8">
          {/* Media Info */}
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
            <div className="relative w-10 h-10 md:w-16 md:h-16 rounded-xl overflow-hidden flex-shrink-0 bg-dark-bg border border-dark-border shadow-lg">
              <img 
                src={currentMedia.thumbnail} 
                className="w-full h-full object-cover" 
                alt="" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-sm md:text-base truncate text-white">{currentMedia.title}</h4>
              <p className="text-[10px] md:text-xs text-gray-400 truncate uppercase tracking-wider font-medium">{currentMedia.source}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-1 md:gap-2 flex-1 max-w-xl">
            <div className="flex items-center gap-4 md:gap-8">
              <button 
                onClick={() => skip(-10)}
                className="text-gray-400 hover:text-white transition-colors hidden sm:block"
                title="Back 10s"
              >
                <Rewind size={20} />
              </button>
              <button className="text-gray-400 hover:text-white transition-colors">
                <SkipBack size={22} />
              </button>
              <button 
                onClick={togglePlay}
                className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
              >
                {isPlaying ? <Pause size={28} fill="black" /> : <Play size={28} fill="black" className="ml-1" />}
              </button>
              <button className="text-gray-400 hover:text-white transition-colors">
                <SkipForward size={22} />
              </button>
              <button 
                onClick={() => skip(10)}
                className="text-gray-400 hover:text-white transition-colors hidden sm:block"
                title="Forward 10s"
              >
                <FastForward size={20} />
              </button>
            </div>
            
            {!isMinimized && isAudio && (
              <div className="w-full flex items-center gap-3 px-2">
                <span className="text-[10px] text-gray-500 font-mono w-12 text-right">
                  {formatTime(progress)}
                </span>
                <div className="flex-1 relative h-1.5 group">
                  <input 
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={progress}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="absolute inset-0 bg-dark-bg rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-neon-accent/80 group-hover:bg-neon-accent transition-colors" 
                      style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 font-mono w-12">
                  {formatTime(duration)}
                </span>
              </div>
            )}
          </div>

          {/* Extra Controls */}
          <div className="flex items-center gap-2 md:gap-6 flex-1 justify-end">
            {/* Playback Rate */}
            {!isMinimized && (
              <div className="relative hidden lg:block">
                <button 
                  onClick={() => setShowRateMenu(!showRateMenu)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-[11px] font-bold ${
                    showRateMenu ? 'bg-neon-accent text-black border-neon-accent' : 'bg-dark-bg border-dark-border text-gray-400 hover:text-white'
                  }`}
                >
                  <Settings2 size={14} />
                  {playbackRate}x
                </button>
                <AnimatePresence>
                  {showRateMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full mb-4 right-0 bg-dark-surface border border-dark-border rounded-xl p-2 shadow-2xl min-w-[100px]"
                    >
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                        <button
                          key={rate}
                          onClick={() => {
                            setPlaybackRate(rate);
                            setShowRateMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                            playbackRate === rate ? 'bg-neon-accent text-black font-bold' : 'hover:bg-dark-bg text-gray-400'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Volume */}
            <div className="hidden md:flex items-center gap-3 group">
              <button 
                onClick={() => setVolume(volume === 0 ? 1 : 0)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <div className="w-24 h-1.5 bg-dark-bg rounded-full relative overflow-hidden cursor-pointer">
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div 
                  className="h-full bg-gray-400 group-hover:bg-neon-accent transition-colors" 
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => setMinimized(!isMinimized)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
              </button>
              <button 
                onClick={reset}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Hidden Audio Element */}
        {isAudio && currentMedia.audioUrl && (
          <audio 
            ref={audioRef}
            src={currentMedia.audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setPlaying(false)}
          />
        )}

        {/* Video PiP Overlay */}
        {isVideo && !isMinimized && currentMedia.videoId && (
          <motion.div 
            drag
            dragConstraints={{ left: -window.innerWidth + 350, right: 0, top: -window.innerHeight + 250, bottom: 0 }}
            className="fixed bottom-32 right-8 w-80 md:w-96 aspect-video rounded-2xl overflow-hidden shadow-2xl border border-dark-border bg-black z-[210] cursor-move"
          >
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-end px-3 pointer-events-none">
              <div className="bg-neon-accent w-2 h-2 rounded-full animate-pulse" />
            </div>
            <iframe 
              src={`https://www.youtube.com/embed/${currentMedia.videoId}?autoplay=1&modestbranding=1&rel=0`} 
              className="w-full h-full pointer-events-auto" 
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
