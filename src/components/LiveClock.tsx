"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function LiveClock() {
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

  // Capitalize the first letter of the day of the week
  const capitalizedDateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);

  return (
    <div className="absolute top-4 right-4 z-10 rounded-lg bg-black/50 px-6 py-3 text-white shadow-2xl backdrop-blur-sm">
      <div className="text-right text-6xl font-black tracking-tighter">
        {timeString}
      </div>
      <div className="text-right text-lg font-normal capitalize text-white/80">
        {capitalizedDateString}
      </div>
    </div>
  );
}
