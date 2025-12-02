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
  const { playlist, logoUrl, isLoading, error, fetchPlaylist } = usePlaylist(storeId);
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
  const isFirstLoad = useRef(true);

  // Poll for updates every 2 minutes
  useEffect(() => {
    if (!isFirstLoad.current) {
        const interval = setInterval(() => {
            if (isOnline) {
                console.log('Verificando atualizações de conteúdo...');
                fetchPlaylist();
            }
        }, 120000); // 2 minutes

        return () => clearInterval(interval);
    }
  }, [isOnline, fetchPlaylist]);

  const processQueue = useCallback(async () => {
    if (activeDownloads.current >= MAX_CONCURRENT_DOWNLOADS || downloadQueue.current.length === 0) {
      if (downloadQueue.current.length === 0 && activeDownloads.current === 0) {
         setCacheStatus(prev => ({ ...prev, isUpdating: false, statusText: 'Conteúdo atualizado.' }));
      }
      return;
    }

    activeDownloads.current++;
    const item = downloadQueue.current.shift()!;
    
    setCacheStatus(prev => ({ ...prev, isUpdating: true, statusText: `Baixando mídia ${prev.cachedItems + 1} de ${prev.totalItems}...` }));

    try {
      const cacheKey = `${item.url}_${item.versao}`;
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
      console.error(`Falha ao baixar ${item.url}`, e);
    } finally {
      activeDownloads.current--;
      processQueue();
    }
  }, []);


  useEffect(() => {
    if (!playlist) return;

    if (isFirstLoad.current) {
        isFirstLoad.current = false;
    }

    const mediaItems = playlist.filter(item => item.tipo === 'imagem' || item.tipo === 'video');
    const validCacheKeys = mediaItems.map(item => `${item.url}_${item.versao}`);

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
            const cacheKey = `${item.url}_${item.versao}`;
            const cachedUrl = await getMediaUrl(cacheKey, false); 
            if (cachedUrl) {
                if (!cacheStatus.cachedKeys.includes(cacheKey)) {
                   initialCachedKeys.push(cacheKey);
                }
            } else if(isOnline) {
                itemsToDownload.push(item);
            }
        }
        
        setCacheStatus(prev => ({
            ...prev,
            cachedItems: [...new Set([...prev.cachedKeys, ...initialCachedKeys])].length,
            cachedKeys: [...new Set([...prev.cachedKeys, ...initialCachedKeys])],
            statusText: 'Verificando mídias...'
        }));
        
        if (itemsToDownload.length > 0) {
            downloadQueue.current = itemsToDownload;
            for (let i = 0; i < MAX_CONCURRENT_DOWNLOADS; i++) {
                processQueue();
            }
        } else {
            setCacheStatus(prev => ({ ...prev, isUpdating: false, statusText: 'Conteúdo atualizado.' }));
        }
    };
    
    checkCacheAndQueueDownloads();

  }, [playlist, isOnline, processQueue]);


  return { playlist, logoUrl, isLoading, error, isOnline, cacheStatus };
}
