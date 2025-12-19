"use client";

import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { requestFullscreen } from '@/lib/fullscreen';
import { DigitalSignage } from '@/components/DigitalSignage';

export default function HomePage() {
  const [isStarted, setIsStarted] = useState(false);
  const startButtonRef = useRef<HTMLButtonElement>(null);

  const handleStart = async () => {
    await requestFullscreen();
    setIsStarted(true);
  };

  // Set focus on the start button on component mount
  useEffect(() => {
    startButtonRef.current?.focus();
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
        <div className="mb-10 flex items-center justify-center gap-12 text-primary">
            {/* Left Icon (Rectangle) */}
            <svg 
              width="50" 
              height="100" 
              viewBox="0 0 50 100" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="50" height="100" rx="8" fill="currentColor"/>
            </svg>

            {/* Right Icon (Screen) */}
            <svg 
              width="100" 
              height="100" 
              viewBox="0 0 100 100" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="h-20 w-20"
            >
                <path d="M83.3333 16.6667H16.6667C12.0417 16.6667 8.33334 20.4167 8.33334 25V75C8.33334 79.5833 12.0417 83.3333 16.6667 83.3333H83.3333C87.9167 83.3333 91.6667 79.5833 91.6667 75V25C91.6667 20.4167 87.9167 16.6667 83.3333 16.6667ZM83.3333 75H16.6667V25H83.3333V75ZM54.1667 45.8333L41.6667 33.3333V58.3333L54.1667 45.8333Z" fill="currentColor"/>

            </svg>
        </div>
        
        <Button
          ref={startButtonRef}
          onClick={handleStart}
          size="lg"
          className="h-14 px-12 text-xl shadow-lg"
        >
          Iniciar
        </Button>
      </div>
    </main>
  );
}
