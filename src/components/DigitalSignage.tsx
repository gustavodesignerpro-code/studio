"use client";

import { usePlaylistWithCache } from '@/hooks/use-playlist-with-cache';
import { LiveClock } from '@/components/LiveClock';
import { Slideshow } from '@/components/Slideshow';
import { EmptyState } from '@/components/states/EmptyState';
import LoadingState from '@/app/loading';
import { WifiOff } from 'lucide-react';
import { ErrorState } from './states/ErrorState';
import { PreloadingState } from './states/PreloadingState';

export function DigitalSignage() {
  const {
    playlist,
    isLoading,
    error,
    isOnline,
    cacheStatus,
    logoUrl,
  } = usePlaylistWithCache();

  if (!isOnline && cacheStatus.totalItems === 0) {
    return (
      <div className="flex h-svh w-svh flex-col items-center justify-center bg-background text-muted-foreground p-8 text-center">
        <WifiOff className="h-24 w-24" />
        <h2 className="mt-4 text-4xl font-bold">Sem conexão com a internet</h2>
        <p className="mt-2 text-xl">É necessário conectar à internet para o primeiro carregamento.</p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState />;
  }
  
  if (error) {
    return <ErrorState error={error} />;
  }
  
  if (!playlist || playlist.length === 0) {
    return <EmptyState />;
  }

  // Show preloading screen until at least 2 items are cached
  const isReadyForDisplay = cacheStatus.cachedItems >= Math.min(2, cacheStatus.totalItems) && cacheStatus.totalItems > 0;
  if (!isReadyForDisplay && cacheStatus.totalItems > 0) {
    const progress = cacheStatus.totalItems > 0 ? (cacheStatus.cachedItems / cacheStatus.totalItems) * 100 : 0;
    return <PreloadingState progress={progress} statusText={cacheStatus.statusText} />;
  }

  // Filter playlist to only include items that are in cache
  const cachedPlaylist = playlist.filter(item => {
    if (item.tipo === 'texto') return true;
    const cacheKey = `${item.url}_${item.versao}`;
    return cacheStatus.cachedKeys.includes(cacheKey);
  });

  if (cachedPlaylist.length === 0 && cacheStatus.totalItems > 0) {
     const progress = cacheStatus.totalItems > 0 ? (cacheStatus.cachedItems / cacheStatus.totalItems) * 100 : 0;
    return <PreloadingState progress={progress} statusText="Aguardando mídias em cache..." />;
  }
  
  if (cachedPlaylist.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="relative h-svh w-svh overflow-hidden bg-black">
      <Slideshow playlist={cachedPlaylist} />
      <LiveClock />
      {logoUrl && (
        <img 
          src={logoUrl} 
          alt="Store Logo" 
          className="absolute bottom-4 left-4 h-16 w-auto drop-shadow-lg" 
        />
      )}
      {cacheStatus.isUpdating && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-lg bg-black/50 px-4 py-2 text-white shadow-2xl backdrop-blur-sm">
           <div className="h-3 w-3 animate-pulse rounded-full bg-accent"></div>
          <span className="text-sm font-medium">Atualizando conteúdo...</span>
        </div>
      )}
    </div>
  );
}
