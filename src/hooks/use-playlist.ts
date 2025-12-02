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

let lastEtag: string | null = null;

export function usePlaylist(): UsePlaylistReturn {
  const [playlist, setPlaylist] = useState<PlaylistItem[] | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchPlaylist = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchPlaylistFromDato(lastEtag);
      
      if (result.status === 304) {
        console.log("Playlist não modificada.");
        return; // Não faz nada, mantém os dados atuais
      }
      
      if (result.status !== 200 || !result.data) {
        throw new Error(result.error || `Falha ao buscar dados (status: ${result.status})`);
      }

      lastEtag = result.etag;
      
      const activeItems = (result.data.items || [])
        .filter(item => item.ativo)
        .map((item, index) => ({ ...item, ordem: index }))
        .sort((a, b) => a.ordem - b.ordem);
      
      setPlaylist(activeItems);
      setLogoUrl(result.data.logoUrl);

    } catch (err: any) {
      console.error("Erro ao processar playlist do DatoCMS:", err);
      // Se a busca falhar, mantém os dados antigos se existirem, senão define o erro
      if (!playlist) { 
        setError(new Error(err.message || "Não foi possível carregar a playlist."));
      }
    } finally {
      setIsLoading(false);
    }
  }, [playlist]);

  useEffect(() => {
    fetchPlaylist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Apenas na montagem inicial

  return { playlist, logoUrl, isLoading, error, fetchPlaylist };
}
