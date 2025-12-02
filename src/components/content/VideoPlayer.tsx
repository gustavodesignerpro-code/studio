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
      video.src = src;
      video.play().catch(error => {
        console.warn("Autoplay com som falhou, tentando mudo:", error);
        video.muted = true;
        video.play().catch(err => {
          console.error("Autoplay mudo também falhou:", err);
          onEnded();
        });
      });
    }
  }, [src, onEnded]);

  return (
    <div className="h-full w-full bg-black">
      <video
        ref={videoRef}
        key={src}
        className="h-full w-full object-contain"
        onEnded={onEnded}
        onError={(e) => {
          console.error("Erro na reprodução do vídeo:", e);
          onEnded(); // Pula vídeo quebrado
        }}
        autoPlay
        playsInline
        muted // Começa mudo para maior compatibilidade de autoplay
      >
        <source src={src} type="video/mp4" />
        Seu navegador não suporta a tag de vídeo.
      </video>
    </div>
  );
}
