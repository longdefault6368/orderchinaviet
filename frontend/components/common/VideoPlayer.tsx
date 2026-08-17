'use client';

import React, { useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  aspectRatio?: string;
  title?: string;
}

export function VideoPlayer({
  src,
  poster,
  className = '',
  aspectRatio = 'aspect-video',
  title = 'Video Hướng Dẫn',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-950 shadow-lg ${aspectRatio} group cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls={isPlaying}
        playsInline
        className="w-full h-full object-contain"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      >
        Trình duyệt không hỗ trợ xem video.
      </video>

      {/* Floating Eye-Catching Play Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center transition-all duration-300 z-10">
          {/* Animated Glowing Ring & Big Play Button */}
          <div className="relative flex items-center justify-center">
            <span className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#fa3131]/30 animate-ping pointer-events-none" />
            <span className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#fa3131]/50 animate-pulse pointer-events-none" />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#fa3131] to-[#ff5252] text-white flex items-center justify-center shadow-2xl shadow-rose-600/50 hover:scale-110 active:scale-95 transition-transform duration-200 border-2 border-white/80 cursor-pointer"
              aria-label="Phát video"
            >
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current translate-x-0.5" />
            </button>
          </div>

          <div className="mt-3 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] sm:text-xs font-semibold shadow-md flex items-center gap-1.5">
            <Play className="w-3 h-3 fill-current text-rose-400" />
            <span>Bấm để xem video hướng dẫn</span>
          </div>
        </div>
      )}
    </div>
  );
}
