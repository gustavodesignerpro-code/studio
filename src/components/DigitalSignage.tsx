"use client";

import { useSearchParams } from 'next/navigation';
import { usePlaylist } from '@/hooks/use-playlist';
import { LiveClock } from '@/components/LiveClock';
import { Slideshow } from '@/components/Slideshow';
import { EmptyState } from '@/components/states/EmptyState';
import LoadingState from '@/app/loading';
import { AlertCircle, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MediaPreloader, type CachedMedia } from './MediaPreloader';

export function DigitalSignage() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get('loja') || 'main';

  const { playlist, isLoading, error } = usePlaylist(storeId);
  const [isOnline, setIsOnline] = useState(true);
  const [cachedMedia, setCachedMedia] = useState<CachedMedia>({});
  const [isPreloading, setIsPreloading] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="flex h-svh w-svh flex-col items-center justify-center bg-background text-muted-foreground p-8 text-center">
        <WifiOff className="h-24 w-24" />
        <h2 className="mt-4 text-4xl font-bold">Sem conexão com a internet</h2>
        <p className="mt-2 text-xl">Tentando reconectar automaticamente...</p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="flex h-svh w-svh flex-col items-center justify-center bg-background text-destructive p-8 text-center">
        <AlertCircle className="h-24 w-24" />
        <h2 className="mt-4 text-4xl font-bold">Erro ao Carregar Playlist</h2>
        <p className="mt-2 text-xl max-w-2xl">{error.message}</p>
        <p className="mt-8 text-lg text-muted-foreground">Verifique a configuração do Firebase e o nome da loja.</p>
      </div>
    );
  }

  if (!playlist || playlist.length === 0) {
    return <EmptyState />;
  }
  
  if (isPreloading) {
    return (
      <MediaPreloader
        playlist={playlist}
        onComplete={(media) => {
          setCachedMedia(media);
          setIsPreloading(false);
        }}
      />
    );
  }

  const logoUrl = undefined;

  return (
    <div className="relative h-svh w-svh overflow-hidden bg-black">
      <Slideshow playlist={playlist} cachedMedia={cachedMedia} />
      <LiveClock />
      {logoUrl && (
        <img 
          src={logoUrl} 
          alt="Store Logo" 
          className="absolute bottom-4 left-4 h-16 w-auto drop-shadow-lg" 
        />
      )}
    </div>
  );
}
