"use server";

import { GraphQLClient, gql } from 'graphql-request';
import type { PlaylistItem, PlaylistData } from '@/types/playlist';

const API_URL = 'https://graphql.datocms.com/';

// Estrutura da resposta da API do DatoCMS para o modelo de instância única
interface DatoResponse {
  configuracaoDaTv: {
    _updatedAt: string; // ETag for the whole config
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
      _updatedAt: string; // ETag for the individual block
    }[];
  } | null;
}

// Query GraphQL atualizada para buscar a "Instância Única" com conteúdo modular
const GET_PLAYLIST_QUERY = gql`
  query GetPlaylist {
    configuracaoDaTv {
      _updatedAt # Used for cache invalidation of the whole playlist
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
        _updatedAt # Used for cache invalidation of individual items
      }
    }
  }
`;

export async function fetchPlaylist(etag: string | null): Promise<{ status: number, data: PlaylistData | null, error?: string, etag: string | null }> {
  const token = process.env.NEXT_PUBLIC_DATO_API_TOKEN;
  if (!token) {
    return { status: 500, data: null, error: 'Token da API do DatoCMS não configurado.', etag: null };
  }

  const client = new GraphQLClient(API_URL, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Api-Version': '2023-11-28',
    },
    fetch,
  });

  try {
     // DatoCMS doesn't support ETag headers well for POST GraphQL.
     // We will use the top-level _updatedAt field as a manual version check.
    const datoData: DatoResponse = await client.request(GET_PLAYLIST_QUERY);
    const newEtag = datoData?.configuracaoDaTv?._updatedAt ?? null;

    if (etag && newEtag === etag) {
      return { status: 304, data: null, etag };
    }

    if (!datoData.configuracaoDaTv) {
      return { status: 404, data: { items: [], logoUrl: null }, error: `Configuração da TV não encontrada no DatoCMS.`, etag: newEtag };
    }
    
    const transformedItems: PlaylistItem[] = datoData.configuracaoDaTv.items
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
          versao: item._updatedAt, // Use _updatedAt of the block for cache busting
        };
      });

    const playlistData: PlaylistData = {
      logoUrl: datoData.configuracaoDaTv.logo?.url ?? null,
      items: transformedItems.sort((a, b) => a.ordem - b.ordem),
    };

    return { status: 200, data: playlistData, etag: newEtag };

  } catch (error: any) {
    console.error("Failed to fetch from DatoCMS:", error);
     // Check if the error is a "Not Found" error from the API
    if (error.response && error.response.errors) {
      const notFoundError = error.response.errors.find((e: any) => e.extensions?.code === 'NOT_FOUND');
      if (notFoundError) {
        return { status: 404, data: { items: [], logoUrl: null }, error: 'Configuração da TV não encontrada. Verifique se o modelo foi criado e publicado.', etag: null };
      }
    }
    return { status: 500, data: null, error: error.message, etag: null };
  }
}
