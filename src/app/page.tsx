"use client";

import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { requestFullscreen } from '@/lib/fullscreen';
import { DigitalSignage } from '@/components/DigitalSignage';
import { MonitorPlay } from 'lucide-react';

export default function HomePage() {
  const [isStarted, setIsStarted] = useState(false);
  const startButtonRef = useRef<HTMLButtonElement>(null);

  const handleStart = async () => {
    await requestFullscreen();
    setIsStarted(true);
  };

  // Set focus on the start button and clear cache on component mount
  useEffect(() => {
    startButtonRef.current?.focus();

    // Clear media cache on app start
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_MEDIA_CACHE' });
      console.log('Solicitação de limpeza de cache de mídia enviada ao Service Worker.');
    }
  }, []);


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
    <main className="flex h-svh w-svh items-center justify-center bg-background p-8">
      <div className="content-rotated text-center">
        <MonitorPlay className="mx-auto h-32 w-32 text-primary" />
        <h1 className="mt-8 text-6xl font-bold tracking-tight text-foreground">
          StoreCast
        </h1>
        <p className="mt-2 text-2xl text-muted-foreground">
          Sinalização Digital Inteligente
        </p>
        <Button
          ref={startButtonRef}
          onClick={handleStart}
          size="lg"
          className="mt-12 h-14 px-12 text-xl shadow-lg"
        >
          Iniciar
        </Button>
      </div>
    </main>
  );
}
