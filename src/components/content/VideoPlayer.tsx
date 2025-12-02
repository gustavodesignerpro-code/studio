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
      // src is a blob URL, so it needs to be set and then played.
      video.src = src;
      video.play().catch(error => {
        console.warn("Autoplay with sound failed, trying muted:", error);
        video.muted = true;
        video.play().catch(err => {
          console.error("Muted autoplay also failed:", err);
          // If all fails, move to the next item.
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
          console.error("Video playback error:", e);
          onEnded(); // Skip broken video
        }}
        autoPlay
        playsInline
        muted // Start muted for better autoplay compatibility
      >
        {/* The source is set programmatically to handle blob URLs */}
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
