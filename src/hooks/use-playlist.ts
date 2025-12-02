"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PlaylistItem, PlaylistDocument, ConfigDocument } from '@/types/playlist';

interface UsePlaylistReturn {
  playlist: PlaylistItem[] | null;
  logoUrl: string | null;
  isLoading: boolean;
  error: Error | null;
}

export function usePlaylist(storeId: string): UsePlaylistReturn {
  const [playlist, setPlaylist] = useState<PlaylistItem[] | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!storeId) {
        setIsLoading(false);
        setError(new Error("ID da loja não especificado."));
        return;
    }
    
    // Subscribe to the specific store playlist document
    const docRef = doc(db, 'playlists', storeId);
    
    const unsubscribePlaylist = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as PlaylistDocument;
          const activeItems = (data.items || [])
            .filter(item => item.ativo && (item.tipo === 'texto' || item.url))
            .sort((a, b) => a.ordem - b.ordem);
          
          setPlaylist(activeItems);
          setError(null);
        } else {
          setPlaylist([]); // Set to empty array if document doesn't exist
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

    // Subscribe to the config document for the logo
    const configRef = doc(db, 'config', storeId);
    const unsubscribeConfig = onSnapshot(
      configRef,
      (docSnap) => {
        if(docSnap.exists()) {
          const configData = docSnap.data() as ConfigDocument;
          if (configData.logoUrl) {
             setLogoUrl(configData.logoUrl);
          } else {
            setLogoUrl(null);
          }
        } else {
          setLogoUrl(null);
        }
      },
      (err) => {
        console.error("Error fetching config:", err);
        // Not a fatal error, so we just log it.
      }
    );


    return () => {
      unsubscribePlaylist();
      unsubscribeConfig();
    };
  }, [storeId]);

  return { playlist, logoUrl, isLoading, error };
}
