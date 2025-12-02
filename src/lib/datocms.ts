"use server";

import { GraphQLClient, gql } from 'graphql-request';
import type { PlaylistItem, PlaylistData } from '@/types/playlist';

const API_URL = 'https://graphql.datocms.com/';

// Estrutura da resposta da API do DatoCMS para um modelo de coleção
interface DatoResponse {
  allItemsDeMidia: {
    _updatedAt: string;
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
  }[];
}

// Query GraphQL atualizada para buscar o primeiro item de uma coleção
const GET_PLAYLIST_QUERY = gql`
  query GetPlaylist {
    allItemsDeMidia(first: 1) {
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
    const datoData: DatoResponse = await client.request(GET_PLAYLIST_QUERY);
    
    // Pega a primeira (e única) configuração da TV encontrada
    const configuracao = datoData.allItemsDeMidia?.[0];
    const newEtag = configuracao?._updatedAt ?? null;

    if (etag && newEtag === etag) {
      return { status: 304, data: null, etag };
    }

    if (!configuracao) {
      return { status: 404, data: { items: [], logoUrl: null }, error: `Nenhuma configuração encontrada no DatoCMS. Verifique se o modelo "Items de Midia" foi criado e se existe pelo menos um registro publicado.`, etag: newEtag };
    }
    
    const transformedItems: PlaylistItem[] = configuracao.items
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
      logoUrl: configuracao.logo?.url ?? null,
      items: transformedItems, // A ordenação já vem do DatoCMS
    };

    return { status: 200, data: playlistData, etag: newEtag };

  } catch (error: any) {
    console.error("Failed to fetch from DatoCMS:", error);
     // Check if the error is a "Not Found" error from the API
    if (error.response && error.response.errors) {
      const notFoundError = error.response.errors.find((e: any) => e.extensions?.code === 'undefinedField' || e.extensions?.code === 'NOT_FOUND');
      if (notFoundError) {
        return { status: 404, data: { items: [], logoUrl: null }, error: 'O modelo "Items de Midia" (API Key: items_de_midia) não foi encontrado ou não está publicado. Verifique as configurações no DatoCMS.', etag: null };
      }
    }
    return { status: 500, data: null, error: error.message, etag: null };
  }
}
