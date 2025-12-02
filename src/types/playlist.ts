
export type PlaylistItemType = 'video' | 'imagem' | 'texto' | 'clock';

export interface PlaylistItem {
  ordem: number;
  tipo: PlaylistItemType;
  url: string; 
  duracao: number; // Duration in seconds
  texto?: string; 
  ativo: boolean;
  versao: string; // For cache-busting (_updatedAt)
}

export interface PlaylistData {
  items: PlaylistItem[];
  logoUrl: string | null;
}
