"use client";

import { Loader } from 'lucide-react';

export default function LoadingState() {
  return (
    <div className="flex h-svh w-svh flex-col items-center justify-center bg-background text-primary">
      <div className="content-rotated text-center">
        <Loader className="h-16 w-16 animate-spin !rotate-90" />
        <p className="mt-4 text-2xl font-medium text-muted-foreground">
          Carregando conteúdo...
        </p>
      </div>
    </div>
  );
}
