"use client";

import Image from 'next/image';

interface ImageViewerProps {
  src: string;
}

export function ImageViewer({ src }: ImageViewerProps) {
  return (
    <div className="h-full w-full bg-black flex items-center justify-center">
      <Image
        src={src}
        alt="Display image"
        fill
        sizes="100vw"
        style={{ objectFit: 'contain' }}
        priority // Preload the current image
      />
    </div>
  );
}
