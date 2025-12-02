"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePlaylist } from './use-playlist';
import { useNetworkStatus } from './use-network-status';
import { PlaylistItem } from '@/types/playlist';
import {
  cacheMedia,
  getMediaUrl,
  clearOldCache,
  MAX_CONCURRENT_DOWNLOADS,
} from '@/lib/media-cache';

interface CacheStatus {
  totalItems: number;
  cachedItems: number;
  cachedKeys: string[];
  isUpdating: boolean;
  statusText: string;
}

export function usePlaylistWithCache(storeId: string) {
  const { playlist, logoUrl, isLoading, error } = usePlaylist(storeId);
  const isOnline = useNetworkStatus();
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    totalItems: 0,
    cachedItems: 0,
    cachedKeys: [],
    isUpdating: false,
    statusText: 'Iniciando...',
  });
  
  const activeDownloads = useRef(0);
  const downloadQueue = useRef<PlaylistItem[]>([]);

  const processQueue = useCallback(async () => {
    if (activeDownloads.current >= MAX_CONCURRENT_DOWNLOADS || downloadQueue.current.length === 0) {
      return;
    }

    activeDownloads.current++;
    const item = downloadQueue.current.shift()!;
    
    setCacheStatus(prev => ({ ...prev, isUpdating: true, statusText: `Baixando mídia ${prev.cachedItems + 1} de ${prev.totalItems}...` }));

    try {
      const cacheKey = `${item.driveId}_${item.versao}`;
      await cacheMedia(item);
      setCacheStatus(prev => {
        const newCachedKeys = [...prev.cachedKeys, cacheKey];
        return {
          ...prev,
          cachedItems: newCachedKeys.length,
          cachedKeys: newCachedKeys,
        };
      });
    } catch (e) {
      console.error(`Falha ao baixar ${item.driveId}`, e);
    } finally {
      activeDownloads.current--;
      processQueue();
    }
  }, []);


  useEffect(() => {
    if (!playlist) return;

    const mediaItems = playlist.filter(item => item.tipo === 'imagem' || item.tipo === 'video');
    const validCacheKeys = mediaItems.map(item => `${item.driveId}_${item.versao}`);

    setCacheStatus(prev => ({
        ...prev,
        totalItems: mediaItems.length,
        isUpdating: true,
    }));

    // Clear old cache entries that are no longer in the playlist
    clearOldCache(validCacheKeys);
    
    const checkCacheAndQueueDownloads = async () => {
        const initialCachedKeys: string[] = [];
        const itemsToDownload: PlaylistItem[] = [];

        for (const item of mediaItems) {
            const cacheKey = `${item.driveId}_${item.versao}`;
            const cachedUrl = await getMediaUrl(cacheKey, false); // don't fetch from network here
            if (cachedUrl) {
                initialCachedKeys.push(cacheKey);
            } else if(isOnline) {
                itemsToDownload.push(item);
            }
        }
        
        setCacheStatus(prev => ({
            ...prev,
            cachedItems: initialCachedKeys.length,
            cachedKeys: initialCachedKeys,
            statusText: 'Verificando mídias...'
        }));
        
        downloadQueue.current = itemsToDownload;

        if (downloadQueue.current.length === 0) {
           setCacheStatus(prev => ({ ...prev, isUpdating: false, statusText: 'Conteúdo atualizado.' }));
        } else {
            // Start processing the queue
            for (let i = 0; i < MAX_CONCURRENT_DOWNLOADS; i++) {
                processQueue();
            }
        }
    };
    
    checkCacheAndQueueDownloads();

  }, [playlist, isOnline, processQueue]);


  return { playlist, logoUrl, isLoading, error, isOnline, cacheStatus };
}
