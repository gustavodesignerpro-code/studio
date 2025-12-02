"use client";

import { automateFullscreenBasedOnDevice } from '@/ai/flows/automate-fullscreen-based-on-device';
import { DigitalSignage } from '@/components/DigitalSignage';
import { Button } from '@/components/ui/button';
import { useState, useCallback, useEffect } from 'react';
import { Tv } from 'lucide-react';

export default function HomePage() {
  const [isStarted, setIsStarted] = useState(false);

  const requestFullscreen = useCallback(async () => {
    try {
      // Use AI to get the best method for the current browser
      const { fullscreenMethod } = await automateFullscreenBasedOnDevice({
        userAgent: navigator.userAgent,
      });
      
      // Execute the recommended code
      const func = new Function(fullscreenMethod);
      func();
    } catch (error) {
      console.error('AI-driven fullscreen failed, using fallback:', error);
      // Fallback for safety or if AI fails
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) { /* Safari */
        (element as any).webkitRequestFullscreen();
      } else if ((element as any).msRequestFullscreen) { /* IE11 */
        (element as any).msRequestFullscreen();
      }
    }
  }, []);

  const handleStart = async () => {
    await requestFullscreen();
    setIsStarted(true);
  };

  // Lock keyboard inputs to prevent accidental exit from fullscreen
  useEffect(() => {
    if (!isStarted) return;

    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      // You can add specific key handling here if needed in the future
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
