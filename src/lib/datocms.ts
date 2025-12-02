"use server";

import { GraphQLClient, gql } from 'graphql-request';
import type { PlaylistItem, PlaylistData } from '@/types/playlist';

const API_URL = 'https://graphql.datocms.com/';

interface DatoResponse {
  playlist: {
    logo: {
      url: string;
    } | null;
    items: {
      id: string;
      tipo: 'imagem' | 'video' | 'texto';
      media: {
        url: string;
        video?: {
          duration: number;
        };
      } | null;
      texto: string | null;
      duracao: number;
      ativo: boolean;
      _updatedAt: string;
    }[];
  } | null;
}

const GET_PLAYLIST_QUERY = gql`
  query GetPlaylist($storeId: String!) {
    playlist(filter: { id_da_loja: { eq: $storeId } }) {
      logo {
        url
      }
      items {
        id
        tipo
        media {
          url
          video {
            duration
          }
        }
        texto
        duracao
        ativo
        _updatedAt
      }
    }
  }
`;

export async function fetchPlaylistByStoreId(storeId: string, etag: string | null): Promise<{ status: number, data: PlaylistData | null, error?: string, etag: string | null }> {
  const token = process.env.NEXT_PUBLIC_DATO_API_TOKEN;
  if (!token) {
    return { status: 500, data: null, error: 'Token da API do DatoCMS não configurado.', etag: null };
  }

  const client = new GraphQLClient(API_URL);
  
  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
    'X-Api-Version': '2023-11-28',
  };

  if (etag) {
    headers['If-None-Match'] = etag;
  }

  try {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            ...headers,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: GET_PLAYLIST_QUERY,
            variables: { storeId },
        }),
        next: { revalidate: 0 } // No caching on Next.js level
    });
    
    const newEtag = response.headers.get('ETag');

    if (response.status === 304) {
      return { status: 304, data: null, etag: newEtag };
    }

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`DatoCMS API Error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const jsonResponse = await response.json();

    if (jsonResponse.errors) {
      throw new Error(`GraphQL Error: ${jsonResponse.errors.map((e: any) => e.message).join(', ')}`);
    }

    const datoData: DatoResponse = jsonResponse.data;

    if (!datoData.playlist) {
      return { status: 404, data: { items: [], logoUrl: null }, error: `Playlist '${storeId}' não encontrada.`, etag: newEtag };
    }
    
    const transformedItems: PlaylistItem[] = datoData.playlist.items
      .filter(item => item.ativo)
      .map((item, index): PlaylistItem => {
        const url = item.media?.url ?? '';
        const duracao = item.tipo === 'video' && item.media?.video
            ? Math.round(item.media.video.duration)
            : item.duracao;

        return {
          ordem: index,
          tipo: item.tipo,
          url: url,
          texto: item.texto ?? '',
          duracao: duracao || 10,
          ativo: item.ativo,
          versao: item._updatedAt, // Use _updatedAt for cache busting
        };
      });

    const playlistData: PlaylistData = {
      logoUrl: datoData.playlist.logo?.url ?? null,
      items: transformedItems.sort((a, b) => a.ordem - b.ordem),
    };

    return { status: 200, data: playlistData, etag: newEtag };

  } catch (error: any) {
    console.error("Failed to fetch from DatoCMS:", error);
    return { status: 500, data: null, error: error.message, etag: null };
  }
}
