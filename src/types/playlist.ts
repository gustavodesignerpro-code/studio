import type { Timestamp } from 'firebase/firestore';

export type PlaylistItemType = 'video' | 'imagem' | 'texto';

export interface PlaylistItem {
  ordem: number;
  tipo: PlaylistItemType;
  url: string;
  duracao: number;
  ativo: boolean;
  criadoEm?: Timestamp;
}

export interface PlaylistDocument {
  items: PlaylistItem[];
}
