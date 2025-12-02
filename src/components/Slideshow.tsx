"use client";

import { useState, useEffect, useCallback } from 'react';
import type { PlaylistItem } from '@/types/playlist';
import { VideoPlayer } from './content/VideoPlayer';
import { ImageViewer } from './content/ImageViewer';
import { TextViewer } from './content/TextViewer';
import type { CachedMedia } from './MediaPreloader';

interface SlideshowProps {
  playlist: PlaylistItem[];
  cachedMedia: CachedMedia;
}

export function Slideshow({ playlist, cachedMedia }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % playlist.length);
  }, [playlist.length]);

  const currentItem = playlist[currentIndex];

  useEffect(() => {
    if (currentItem.tipo !== 'video') {
      const timer = setTimeout(handleNext, currentItem.duracao * 1000);
      return () => clearTimeout(timer);
    }
  }, [currentItem, handleNext]);

  const renderContent = () => {
    const mediaUrl = cachedMedia[currentItem.url] || currentItem.url;
    switch (currentItem.tipo) {
      case 'video':
        return <VideoPlayer src={mediaUrl} onEnded={handleNext} />;
      case 'imagem':
        return <ImageViewer src={mediaUrl} />;
      case 'texto':
        // Text doesn't need a cached URL, it's the content itself
        return <TextViewer text={currentItem.url} />;
      default:
        // Skip invalid item type
        handleNext();
        return null;
    }
  };

  return (
    <div key={currentIndex} className="absolute inset-0 fade-in-content">
      {renderContent()}
    </div>
  );
}
