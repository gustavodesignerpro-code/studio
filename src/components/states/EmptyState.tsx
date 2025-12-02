"use client";

import { ListX } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex h-svh w-svh flex-col items-center justify-center bg-background text-muted-foreground p-8 text-center">
      <ListX className="h-24 w-24" />
      <h2 className="mt-6 text-4xl font-bold">Nenhum conteúdo configurado</h2>
      <p className="mt-2 text-xl max-w-xl">
        A playlist está vazia ou não possui itens ativos. Adicione mídias no DatoCMS para começar.
      </p>
    </div>
  );
}
