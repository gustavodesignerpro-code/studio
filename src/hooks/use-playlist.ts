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

    try {
      const result = await fetchPlaylistFromDato(lastEtag);
      
      // If etag is the same, content has not changed
      if (result.status === 304) {
        console.log("Playlist não modificada. Usando dados em memória.");
        return;
      }
      
      if (result.status !== 200 || !result.data) {
        throw new Error(result.error || `Falha ao buscar dados (status: ${result.status})`);
      }

      setLastEtag(result.etag);

      const activeItems = (result.data.items || [])
        .filter(item => item.ativo)
        .map((item, index) => ({ ...item, ordem: index })) // Re-order based on DatoCMS order
        .sort((a, b) => a.ordem - b.ordem);
      
      setPlaylist(activeItems);
      setLogoUrl(result.data.logoUrl);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching playlist from DatoCMS:", err);
      if (playlist === null) { // Only set error if it's the initial load that failed
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
