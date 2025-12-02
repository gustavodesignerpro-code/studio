"use client";

import { useState, useEffect, useCallback } from 'react';
import type { PlaylistItem } from '@/types/playlist';
import { VideoPlayer } from './content/VideoPlayer';
import { ImageViewer } from './content/ImageViewer';
import { TextViewer } from './content/TextViewer';

interface SlideshowProps {
  playlist: PlaylistItem[];
}

export function Slideshow({ playlist }: SlideshowProps) {
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
    switch (currentItem.tipo) {
      case 'video':
        return <VideoPlayer src={currentItem.url} onEnded={handleNext} />;
      case 'imagem':
        return <ImageViewer src={currentItem.url} />;
      case 'texto':
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
