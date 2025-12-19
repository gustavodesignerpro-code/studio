"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FullscreenClockProps {
  logoUrl: string | null;
}

export function FullscreenClock({ logoUrl }: FullscreenClockProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = format(now, 'HH:mm');
  const dateString = format(now, "EEEE, dd 'de' MMMM", {
    locale: ptBR,
  });

  const capitalizedDateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);

  return (
    <div className="h-full w-full bg-primary flex flex-col items-center justify-center p-16 text-primary-foreground fade-in-content">
      <div className="content-rotated text-center flex flex-col items-center">
        {logoUrl && (
          <img 
            src={logoUrl} 
            alt="Logo" 
            className="h-40 w-auto mb-12"
          />
        )}
        <div className="text-9xl font-black tracking-tighter" style={{ fontSize: 'clamp(8rem, 25vw, 18rem)' }}>
          {timeString}
        </div>
        <div className="text-4xl font-normal capitalize text-primary-foreground/80" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
          {capitalizedDateString}
        </div>
      </div>
    </div>
  );
}
