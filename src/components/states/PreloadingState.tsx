"use client";

import { DownloadCloud } from 'lucide-react';
import { Progress } from '../ui/progress';

interface PreloadingStateProps {
    progress: number;
    statusText: string;
}

export function PreloadingState({ progress, statusText }: PreloadingStateProps) {
  return (
    <div className="flex h-svh w-svh flex-col items-center justify-center bg-background text-primary p-8">
      <DownloadCloud className="h-16 w-16 mb-6" />
      <h2 className="text-3xl font-bold mb-4">Preparando conteúdo...</h2>
      <p className="text-muted-foreground mb-6">{statusText}</p>
      <Progress value={progress} className="w-full max-w-md" />
    </div>
  );
}
