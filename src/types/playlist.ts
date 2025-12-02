import type { Timestamp } from 'firebase/firestore';

export type PlaylistItemType = 'video' | 'imagem' | 'texto';

export interface PlaylistItem {
  ordem: number;
  tipo: PlaylistItemType;
  url: string; // Catbox.moe direct URL
  duracao: number; // Duration in seconds
  texto?: string; // Used when tipo is 'texto'
  ativo: boolean;
  versao: number; // For cache-busting
  criadoEm?: Timestamp;
}

export interface PlaylistDocument {
  items: PlaylistItem[];
}

export interface ConfigDocument {
  logoUrl?: string; // Direct URL for the logo
}
