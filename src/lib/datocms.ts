"use server";

import { GraphQLClient, gql } from 'graphql-request';
import type { PlaylistItem, PlaylistData } from '@/types/playlist';

const API_URL = 'https://graphql.datocms.com/';

// Estrutura da resposta da API do DatoCMS para um modelo de instância única
// O nome do campo principal (itemsDeMidia) deve corresponder à API Key do seu modelo no DatoCMS
interface DatoResponse {
  itemsDeMidia: {
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
  } | null;
}

// Query GraphQL para um modelo de instância única.
// O campo 'itemsDeMidia' deve ser o camelCase da API Key do modelo ("Items de Midia" -> items_de_midia -> itemsDeMidia).
// Dentro dos 'items' (conteúdo modular), referenciamos os campos do bloco '... on MediaItemRecord'.
const GET_PLAYLIST_QUERY = gql`
  query GetPlaylist {
    itemsDeMidia {
      _updatedAt
      logo {
        url
      }
      items {
        id
        ... on MediaItemRecord { # O nome aqui é o PascalCase da API Key do bloco (media_item -> MediaItem) + 'Record'
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
    
    const configuracao = datoData.itemsDeMidia;
    const newEtag = configuracao?._updatedAt ?? null;

    if (etag && newEtag === etag) {
      return { status: 304, data: null, etag };
    }

    if (!configuracao) {
      return { status: 404, data: { items: [], logoUrl: null }, error: `Nenhuma configuração encontrada para o modelo com API key 'items_de_midia'. Verifique se o modelo foi criado, configurado como instância única e publicado no DatoCMS.`, etag: newEtag };
    }
    
    const transformedItems: PlaylistItem[] = (configuracao.items || [])
      .filter(item => item && item.ativo) // Garante que o item não é nulo
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
          versao: item._updatedAt,
        };
      });

    const playlistData: PlaylistData = {
      logoUrl: configuracao.logo?.url ?? null,
      items: transformedItems,
    };

    return { status: 200, data: playlistData, etag: newEtag };

  } catch (error: any) {
    console.error("Failed to fetch from DatoCMS:", error);
    if (error.response && error.response.errors) {
      const notFoundError = error.response.errors.find((e: any) => e.extensions?.code === 'undefinedField' || e.extensions?.code === 'NOT_FOUND');
      if (notFoundError) {
        return { status: 404, data: { items: [], logoUrl: null }, error: "O modelo com API Key 'items_de_midia' não foi encontrado. Verifique o nome do modelo e a API Key no DatoCMS.", etag: null };
      }
    }
    return { status: 500, data: null, error: error.message, etag: null };
  }
}
