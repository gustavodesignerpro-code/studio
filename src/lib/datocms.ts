"use server";

import { GraphQLClient, gql } from 'graphql-request';
import type { PlaylistItem, PlaylistData } from '@/types/playlist';

const API_URL = 'https://graphql.datocms.com/';

interface DatoResponse {
  configuracoDaTv: {
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
          mp4Url: string | null;
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
  query GetPlaylist {
    configuracoDaTv {
      _updatedAt
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
            mp4Url
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
    
    const configuracao = datoData.configuracoDaTv;
    const newEtag = configuracao?._updatedAt ?? null;

    if (etag && newEtag === etag) {
      return { status: 304, data: null, etag };
    }

    if (!configuracao) {
      return { status: 404, data: null, error: "Nenhuma configuração encontrada. Verifique se o modelo com API key 'configuraco_da_tv' existe, está como instância única e foi publicado no DatoCMS.", etag: newEtag };
    }
    
    const transformedItems: PlaylistItem[] = (configuracao.items || [])
      .filter(item => item && item.ativo) 
      .map((item, index): PlaylistItem => {
        let url = '';
        let duracao = item.duracao;

        if (item.tipo === 'video' && item.media) {
            url = item.media.video?.mp4Url ?? item.media.url;
            if (item.media.video?.duration) {
                duracao = Math.round(item.media.video.duration);
            }
        } else if (item.media) {
            url = item.media.url;
        }

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
      const graphqlError = error.response.errors[0];
      if (graphqlError?.extensions?.code === 'undefinedField') {
        const fieldName = graphqlError.path ? graphqlError.path.slice(-1) : graphqlError.extensions.fieldName;
        return { status: 404, data: null, error: `O campo '${fieldName}' não foi encontrado. Verifique a API Key do seu modelo e seus campos no DatoCMS. A query esperava encontrar 'configuracoDaTv'.`, etag: null };
      }
       return { status: 500, data: null, error: graphqlError.message, etag: null };
    }
    return { status: 500, data: null, error: error.message, etag: null };
  }
}
