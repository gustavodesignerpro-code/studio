"use client";

import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  src: string;
  onEnded: () => void;
}

export function VideoPlayer({ src, onEnded }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
        if (video.src !== src) {
            video.src = src;
            video.load(); 
        }
        video.play().catch(error => {
            console.warn("Autoplay do vídeo bloqueado, tentando com áudio mudo.", error);
        });
    }
  }, [src]);

  return (
    <div className="h-full w-full bg-black">
      <video
        ref={videoRef}
        key={src}
        className="h-full w-full object-contain"
        onEnded={onEnded}
        onError={() => {
          onEnded(); // Pula vídeo quebrado
        }}
        autoPlay
        playsInline
        muted // Essencial para o autoplay funcionar na maioria dos navegadores/dispositivos
      />
    </div>
  );
}
