"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PlaylistItem } from '@/types/playlist';
import { VideoPlayer } from './content/VideoPlayer';
import { ImageViewer } from './content/ImageViewer';
import { TextViewer } from './content/TextViewer';
import { FullscreenClock } from './content/FullscreenClock';
import { Loader } from 'lucide-react';

interface SlideshowProps {
  playlist: PlaylistItem[];
}

export function Slideshow({ playlist }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleNext = useCallback(() => {
    if (isMounted.current) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % playlist.length);
    }
  }, [playlist.length]);

  const currentItem = playlist[currentIndex];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (currentItem.tipo !== 'video') {
      timer = setTimeout(handleNext, currentItem.duracao * 1000);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [currentItem, handleNext]);

  const renderContent = () => {
    if (!currentItem) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-black">
          <Loader className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    switch (currentItem.tipo) {
      case 'video':
        return <VideoPlayer src={currentItem.url} onEnded={handleNext} />;
      case 'imagem':
        return <ImageViewer src={currentItem.url} />;
      case 'texto':
        return <TextViewer text={currentItem.texto || ''} />;
      case 'clock':
        return <FullscreenClock />;
      default:
        handleNext(); // Skip invalid item type
        return null;
    }
  };

  return (
    <div key={currentIndex} className="absolute inset-0 fade-in-content transition-opacity duration-1000">
      {renderContent()}
    </div>
  );
}
