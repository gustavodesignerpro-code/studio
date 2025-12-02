"use client";

import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  error: Error;
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className="flex h-svh w-svh flex-col items-center justify-center bg-background text-destructive p-8 text-center">
      <AlertCircle className="h-24 w-24" />
      <h2 className="mt-4 text-4xl font-bold">Erro ao Carregar Playlist</h2>
      <p className="mt-2 text-xl max-w-2xl">{error.message}</p>
      <p className="mt-8 text-lg text-muted-foreground">Verifique seu token de API do DatoCMS, o ID da loja na URL e se a playlist existe.</p>
    </div>
  );
}
