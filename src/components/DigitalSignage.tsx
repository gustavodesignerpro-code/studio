"use client";

import { usePlaylist } from '@/hooks/use-playlist';
import { Slideshow } from '@/components/Slideshow';
import { EmptyState } from '@/components/states/EmptyState';
import LoadingState from '@/app/loading';
import { WifiOff } from 'lucide-react';
import { ErrorState } from './states/ErrorState';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useEffect, useState } from 'react';

export function DigitalSignage() {
  const {
    playlist,
    logoUrl,
    isLoading,
    error,
    fetchPlaylist,
  } = usePlaylist();
  const isOnline = useNetworkStatus();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Poll for updates every 2 minutes if online
  useEffect(() => {
    const interval = setInterval(() => {
        if (isOnline) {
            console.log('Verificando atualizações de conteúdo...');
            fetchPlaylist();
        }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [isOnline, fetchPlaylist]);

  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoad(false);
    }
  }, [isLoading]);

  if (isLoading && isInitialLoad) {
    return <LoadingState />;
  }

  if (error && (!playlist || playlist.length === 0)) {
    return <ErrorState error={error} />;
  }

  if (!isOnline && (!playlist || playlist.length === 0)) {
     return (
      <div className="flex h-svh w-svh flex-col items-center justify-center bg-background p-8 text-center">
        <div className="content-rotated">
            <WifiOff className="h-24 w-24 !rotate-90 mx-auto" />
            <h2 className="mt-4 text-4xl font-bold">Sem conexão com a internet</h2>
            <p className="mt-2 text-xl">É necessário conectar à internet para o primeiro carregamento.</p>
        </div>
      </div>
    );
  }

  if (!playlist || playlist.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="relative h-svh w-svh overflow-hidden bg-black">
      <Slideshow playlist={playlist} />
      {logoUrl && (
        <img 
          src={logoUrl} 
          alt="Store Logo" 
          className="absolute bottom-4 left-4 h-16 w-auto drop-shadow-lg z-20 -rotate-90 origin-bottom-left"
        />
      )}
      {isLoading && !isInitialLoad && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-lg bg-black/50 px-4 py-2 text-white shadow-2xl backdrop-blur-sm -rotate-90 origin-top-left">
           <div className="h-3 w-3 animate-pulse rounded-full bg-accent"></div>
          <span className="text-sm font-medium">Atualizando conteúdo...</span>
        </div>
      )}
    </div>
  );
}
