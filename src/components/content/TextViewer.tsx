"use client";

interface TextViewerProps {
  text: string;
}

export function TextViewer({ text }: TextViewerProps) {
  return (
    <div className="h-full w-full bg-black flex items-center justify-center p-16">
      <p className="text-white text-center font-bold text-7xl leading-tight drop-shadow-lg" style={{ fontSize: 'clamp(48px, 6vw, 96px)' }}>
        {text}
      </p>
    </div>
  );
}
