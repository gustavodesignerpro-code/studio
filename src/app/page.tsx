"use client";

import { DigitalSignage } from '@/components/DigitalSignage';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Tv } from 'lucide-react';
import { requestFullscreen } from '@/lib/fullscreen';

export default function HomePage() {
  const [isStarted, setIsStarted] = useState(false);

  const handleStart = async () => {
    await requestFullscreen();
    setIsStarted(true);
  };

  // Lock keyboard inputs to prevent accidental exit from fullscreen
  useEffect(() => {
    if (!isStarted) return;

    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handler);

    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [isStarted]);

  if (isStarted) {
    return <DigitalSignage />;
  }

  return (
    <main className="flex h-svh w-svh flex-col items-center justify-center bg-background p-8 text-center">
      <div className="mb-6 text-primary">
        <Tv className="h-24 w-24" />
      </div>
      <h1 className="mb-3 text-5xl font-black text-primary md:text-7xl font-headline">
        StoreCast
      </h1>
      <p className="mb-10 max-w-md text-lg text-muted-foreground">
        Sinalização Digital Inteligente para sua Loja
      </p>
      <Button onClick={handleStart} size="lg" className="h-14 px-12 text-xl shadow-lg">
        Iniciar
      </Button>
    </main>
  );
}
