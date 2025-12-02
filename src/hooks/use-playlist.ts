"use client";

import { useState, useEffect, useCallback } from 'react';
import type { PlaylistItem, PlaylistItemType } from '@/types/playlist';
import { fetchPlaylist as fetchPlaylistFromDato } from '@/lib/datocms';

interface UsePlaylistReturn {
  playlist: PlaylistItem[] | null;
  logoUrl: string | null;
  isLoading: boolean;
  error: Error | null;
  fetchPlaylist: () => void;
}

let lastEtag: string | null = null;

// Função para inserir o relógio na playlist
const injectClockIntoPlaylist = (items: PlaylistItem[]): PlaylistItem[] => {
  const newPlaylist: PlaylistItem[] = [];
  items.forEach((item, index) => {
    newPlaylist.push(item);
    // Adiciona o relógio a cada 2 itens
    if ((index + 1) % 2 === 0) {
      const clockItem: PlaylistItem = {
        ordem: -1, // Ordem especial para o relógio
        tipo: 'clock',
        url: '',
        texto: 'Clock',
        duracao: 10, // Duração da exibição do relógio em segundos
        ativo: true,
        versao: `clock-${index}`,
      };
      newPlaylist.push(clockItem);
    }
  });
  return newPlaylist;
};

export function usePlaylist(): UsePlaylistReturn {
  const [playlist, setPlaylist] = useState<PlaylistItem[] | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchPlaylist = useCallback(async () => {
    // Não reinicia o isLoading para true a cada poll, apenas na carga inicial
    // setIsLoading(true); 
    setError(null);

    try {
      const result = await fetchPlaylistFromDato(lastEtag);
      
      if (result.status === 304) {
        console.log("Playlist não modificada.");
        setIsLoading(false); // Garante que o loading pare se nada mudou
        return; 
      }
      
      if (result.status !== 200 || !result.data) {
        throw new Error(result.error || `Falha ao buscar dados (status: ${result.status})`);
      }

      lastEtag = result.etag;
      
      const activeItems = (result.data.items || [])
        .filter(item => item.ativo)
        .map((item, index) => ({ ...item, ordem: index }))
        .sort((a, b) => a.ordem - b.ordem);
      
      const finalPlaylist = injectClockIntoPlaylist(activeItems);

      setPlaylist(finalPlaylist);
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
