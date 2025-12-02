"use client";

import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  src: string;
  onEnded: () => void;
}

export function VideoPlayer({ src, onEnded }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Attempt to play with sound
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(error => {
        // Autoplay with sound might be blocked. Try playing muted.
        console.warn("Autoplay with sound failed, trying muted:", error);
        video.muted = true;
        video.play();
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
          console.error("Video playback error:", e);
          onEnded(); // Skip broken video
        }}
        autoPlay
        playsInline
      >
        <source src={src} />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
