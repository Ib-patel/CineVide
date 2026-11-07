"use client";

import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

interface OgpbEmbedProps {
  embedUrl: string;
  title?: string;
  onEnded?: () => void;
  onError?: (error: string) => void;
}

export function OgpbEmbed({ embedUrl, title, onError }: OgpbEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative aspect-video w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {!loaded && !failed && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-night/95 text-white gap-3">
          <Loader2 className="size-8 animate-spin text-accent" />
          <p className="text-sm font-medium text-white/80">Connecting to stream provider...</p>
        </div>
      )}

      {failed ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-night text-white p-6 text-center">
          <AlertCircle className="size-10 text-amber-400 mb-2" />
          <h3 className="font-semibold text-lg text-ink">Stream Unavailable</h3>
          <p className="text-sm text-muted mt-1 max-w-md">
            Unable to connect to the embed stream. Please check your connection or try another server.
          </p>
        </div>
      ) : (
        <iframe
          src={embedUrl}
          title={title || "Video Player"}
          className="w-full h-full border-0 absolute inset-0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="origin"
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-top-navigation-by-user-activation"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            onError?.("Failed to load stream embed.");
          }}
        />
      )}
    </div>
  );
}
