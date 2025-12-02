"use client";

import { useEffect, useState } from 'react';
import type { PlaylistItem } from '@/types/playlist';
import { DownloadCloud } from 'lucide-react';
import { Progress } from './ui/progress';

export type CachedMedia = {
  [originalUrl: string]: string;
};

interface MediaPreloaderProps {
  playlist: PlaylistItem[];
  onComplete: (cachedMedia: CachedMedia) => void;
}

export function MediaPreloader({ playlist, onComplete }: MediaPreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Preparando para baixar...');

  useEffect(() => {
    const preloadMedia = async () => {
      const mediaItems = playlist.filter(
        (item) => item.tipo === 'imagem' || item.tipo === 'video'
      );

      if (mediaItems.length === 0) {
        onComplete({});
        return;
      }

      const cachedMedia: CachedMedia = {};
      let loadedCount = 0;

      setStatus(`Baixando ${mediaItems.length} mídias...`);

      const promises = mediaItems.map(async (item) => {
        try {
          const response = await fetch(item.url);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${item.url}: ${response.statusText}`);
          }
          const blob = await response.blob();
          const localUrl = URL.createObjectURL(blob);
          cachedMedia[item.url] = localUrl;
        } catch (error) {
          console.error(`Could not preload media: ${item.url}`, error);
          // If preloading fails, we'll just use the original URL later.
          cachedMedia[item.url] = item.url;
        } finally {
          loadedCount++;
          const currentProgress = (loadedCount / mediaItems.length) * 100;
          setProgress(currentProgress);
        }
      });

      await Promise.all(promises);
      
      setStatus('Conteúdo pronto!');
      // Short delay to show "Conteúdo pronto!" before transitioning
      setTimeout(() => {
        onComplete(cachedMedia);
      }, 500);
    };

    preloadMedia();
    
    // We don't need a cleanup function to revoke object URLs here,
    // as the browser will automatically do it when the document is unloaded.
  }, [playlist, onComplete]);

  return (
    <div className="flex h-svh w-svh flex-col items-center justify-center bg-background text-primary p-8">
      <DownloadCloud className="h-16 w-16 mb-6" />
      <h2 className="text-3xl font-bold mb-4">Preparando conteúdo...</h2>
      <p className="text-muted-foreground mb-6">{status}</p>
      <Progress value={progress} className="w-full max-w-md" />
    </div>
  );
}
