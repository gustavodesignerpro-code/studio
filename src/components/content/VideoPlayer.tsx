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
