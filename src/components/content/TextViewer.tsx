"use client";

interface TextViewerProps {
  text: string;
}

export function TextViewer({ text }: TextViewerProps) {
  return (
    <div className="h-full w-full bg-primary flex items-center justify-center p-16">
      <p className="text-primary-foreground text-center font-bold drop-shadow-lg" style={{ fontSize: 'clamp(48px, 6vw, 96px)', lineHeight: '1.2' }}>
        {text}
      </p>
    </div>
  );
}
