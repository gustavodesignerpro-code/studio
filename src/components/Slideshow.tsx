"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PlaylistItem } from '@/types/playlist';
import { VideoPlayer } from './content/VideoPlayer';
import { ImageViewer } from './content/ImageViewer';
import { TextViewer } from './content/TextViewer';
import { getMediaUrl } from '@/lib/media-cache';
import { Loader } from 'lucide-react';

interface SlideshowProps {
  playlist: PlaylistItem[];
}

export function Slideshow({ playlist }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  
  const isMounted = useRef(true);

  const handleNext = useCallback(() => {
    if (isMounted.current) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % playlist.length);
    }
  }, [playlist.length]);

  const currentItem = playlist[currentIndex];

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let cancelled = false;

    const fetchMedia = async () => {
      if (!isMounted.current) return;
      
      setMediaUrl(null); // Reset while fetching new media

      if (currentItem.tipo === 'texto') {
        if (!cancelled) setMediaUrl(currentItem.texto || '');
        return;
      }
      
      const cacheKey = `${currentItem.driveId}_${currentItem.versao}`;
      try {
        const url = await getMediaUrl(cacheKey);
        if (!cancelled && isMounted.current) {
          setMediaUrl(url);
        }
      } catch (error) {
        console.error(`Error getting media URL for ${cacheKey}:`, error);
        if (!cancelled) handleNext(); // Skip to next item on error
      }
    };

    fetchMedia();

    if (currentItem.tipo !== 'video') {
      timer = setTimeout(handleNext, currentItem.duracao * 1000);
    }

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [currentItem, handleNext]);

  const renderContent = () => {
    if (!mediaUrl) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-black">
          <Loader className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    switch (currentItem.tipo) {
      case 'video':
        return <VideoPlayer src={mediaUrl} onEnded={handleNext} />;
      case 'imagem':
        return <ImageViewer src={mediaUrl} />;
      case 'texto':
        return <TextViewer text={mediaUrl} />;
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