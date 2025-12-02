"use client";

import { useState, useEffect, useCallback } from 'react';
import type { PlaylistItem } from '@/types/playlist';
import { fetchPlaylist as fetchPlaylistFromDato } from '@/lib/datocms';

interface UsePlaylistReturn {
  playlist: PlaylistItem[] | null;
  logoUrl: string | null;
  isLoading: boolean;
  error: Error | null;
  fetchPlaylist: () => void;
}

export function usePlaylist(): UsePlaylistReturn {
  const [playlist, setPlaylist] = useState<PlaylistItem[] | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastEtag, setLastEtag] = useState<string | null>(null);

  const fetchPlaylist = useCallback(async () => {
    // Only set loading true on the very first fetch
    if (playlist === null) {
      setIsLoading(true);
    }
    setError(null); // Clear previous errors on a new fetch attempt

    try {
      const result = await fetchPlaylistFromDato(lastEtag);
      
      // If etag is the same, content has not changed, do nothing.
      if (result.status === 304) {
        console.log("Playlist não modificada. Usando dados em memória.");
        setIsLoading(false);
        return;
      }
      
      // If the fetch was not successful, throw an error to be caught by the catch block.
      if (result.status !== 200 || !result.data) {
        throw new Error(result.error || `Falha ao buscar dados (status: ${result.status})`);
      }

      // On success, update state
      setLastEtag(result.etag);
      const activeItems = (result.data.items || [])
        .filter(item => item.ativo)
        .map((item, index) => ({ ...item, ordem: index }))
        .sort((a, b) => a.ordem - b.ordem);
      
      setPlaylist(activeItems);
      setLogoUrl(result.data.logoUrl);

    } catch (err: any) {
      console.error("Error processing playlist from DatoCMS:", err);
      // Set error state only if it's the initial load or a subsequent load fails.
      // This prevents showing an error if a background poll fails but we still have old data.
      if (playlist === null) { 
        setError(new Error(err.message || "Não foi possível carregar a playlist."));
      }
    } finally {
      setIsLoading(false);
    }
  }, [lastEtag, playlist]);

  useEffect(() => {
    fetchPlaylist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only runs on initial mount

  return { playlist, logoUrl, isLoading, error, fetchPlaylist };
}
