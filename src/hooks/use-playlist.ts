"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PlaylistItem, PlaylistDocument } from '@/types/playlist';

interface UsePlaylistReturn {
  playlist: PlaylistItem[] | null;
  isLoading: boolean;
  error: Error | null;
}

export function usePlaylist(storeId: string): UsePlaylistReturn {
  const [playlist, setPlaylist] = useState<PlaylistItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!storeId) {
        setIsLoading(false);
        setError(new Error("ID da loja não especificado."));
        return;
    }
    
    const docRef = doc(db, 'playlists', storeId);
    
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as PlaylistDocument;
          const activeItems = data.items
            .filter(item => item.ativo)
            .sort((a, b) => a.ordem - b.ordem);
          
          setPlaylist(activeItems);
          setError(null);
        } else {
          setPlaylist([]);
          console.warn(`Playlist for store '${storeId}' not found.`);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching playlist:", err);
        setError(new Error("Não foi possível carregar a playlist. Verifique sua conexão e as configurações do Firebase."));
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [storeId]);

  return { playlist, isLoading, error };
}
