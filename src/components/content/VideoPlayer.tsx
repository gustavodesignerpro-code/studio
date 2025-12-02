"use client";

import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  src: string;
  onEnded: () => void;
}

export function VideoPlayer({ src, onEnded }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Garantir que a fonte do vídeo seja atualizada quando o src muda.
  useEffect(() => {
    const video = videoRef.current;
    if (video && video.src !== src) {
      video.src = src;
      video.load(); // Carrega a nova fonte
      video.play().catch(() => {
        // O autoplay pode falhar se não for mudo, o atributo `muted` no JSX cuida disso.
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
        onError={(e) => {
          console.error("Erro na reprodução do vídeo:", e);
          onEnded(); // Pula vídeo quebrado
        }}
        autoPlay
        playsInline
        muted // Essencial para o autoplay funcionar na maioria dos navegadores/dispositivos
      >
        <source src={src} type="video/mp4" />
        Seu navegador não suporta a tag de vídeo.
      </video>
    </div>
  );
}
