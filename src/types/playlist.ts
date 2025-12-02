
export type PlaylistItemType = 'video' | 'imagem' | 'texto';

export interface PlaylistItem {
  ordem: number;
  tipo: PlaylistItemType;
  url: string; // Direct URL from DatoCMS
  duracao: number; // Duration in seconds
  texto?: string; // Used when tipo is 'texto'
  ativo: boolean;
  versao: string; // For cache-busting (we'll use the _updatedAt field from DatoCMS)
}

export interface PlaylistData {
  items: PlaylistItem[];
  logoUrl: string | null;
}
