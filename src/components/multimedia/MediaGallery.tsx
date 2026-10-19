'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/libraries/utils';

interface MediaItem {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  isPrimary: boolean;
}

interface MediaGalleryProps {
  media: MediaItem[];
  albumId?: number;
  className?: string;
  onMediaPlay?: (element: HTMLMediaElement) => void;
}

export function MediaGallery({ media, className, onMediaPlay }: MediaGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const playable = (media || []).filter(item => item.fileType?.startsWith('video/') || item.fileType?.startsWith('audio/'));
  const images = (media || []).filter(item => item.fileType?.startsWith('image/')).sort((a, b) => Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)));

  const handlePrev = () => {
    setSelectedPhotoIndex((prev) => 
      prev !== null ? (prev - 1 + images.length) % images.length : null
    );
  };

  const handleNext = () => {
    setSelectedPhotoIndex((prev) => 
      prev !== null ? (prev + 1) % images.length : null
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex !== null) {
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'Escape') setSelectedPhotoIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, images.length]);

  useEffect(() => { setSelectedPhotoIndex(null); setIsZoomed(false); }, [media]);
  if (!media?.length) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Media Gallery</h3>
        <span className="text-xs text-muted-foreground">({media.length} items)</span>
      </div>

      {playable.length > 0 && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {playable.map(item => <AlbumMediaPreview key={item.id} item={item} onMediaPlay={onMediaPlay} />)}
      </div>}
      {!images.length && !playable.length && <p className="text-sm text-muted-foreground">No supported preview for this Media.</p>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {images.slice(0, 12).map((image, idx) => (
          <div
            key={image.id}
            role="button" tabIndex={0} aria-label={`Open ${image.fileName}`}
            onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedPhotoIndex(idx); } }}
            onClick={() => setSelectedPhotoIndex(idx)}
            className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-muted hover:opacity-90 transition-opacity"
          >
            <img src={image.fileUrl} alt={image.fileName} className="w-full h-full object-cover" />
            {image.isPrimary && (
              <div className="absolute top-1 left-1">
                <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full">Primary</span>
              </div>
            )}
          </div>
        ))}
        {images.length > 12 && (
          <button type="button" onClick={() => setSelectedPhotoIndex(12)} className="aspect-square rounded-lg bg-muted flex items-center justify-center cursor-pointer hover:bg-accent transition-colors">
            <span className="text-xs text-muted-foreground">+{images.length - 12} more</span>
          </button>
        )}
      </div>

      <Dialog open={selectedPhotoIndex !== null} onOpenChange={() => setSelectedPhotoIndex(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black/95 border-none">
          <DialogTitle className="sr-only">Album image preview</DialogTitle>
          {selectedPhotoIndex !== null && images[selectedPhotoIndex] && (
            <div className="relative w-full h-full flex flex-col">
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" aria-label={isZoomed ? 'Zoom out' : 'Zoom in'} onClick={() => setIsZoomed(!isZoomed)}>
                  {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" aria-label="Close image preview" onClick={() => setSelectedPhotoIndex(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {images.length > 1 && (
                <>
                  <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10" aria-label="Previous image" onClick={handlePrev}>
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10" aria-label="Next image" onClick={handleNext}>
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}

              <div className="flex-1 flex items-center justify-center p-8">
                <img
                  src={images[selectedPhotoIndex].fileUrl}
                  alt={images[selectedPhotoIndex].fileName}
                  className={cn("max-w-full max-h-full object-contain transition-transform duration-300", isZoomed && "scale-150")}
                />
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <h3 className="text-white font-semibold">{images[selectedPhotoIndex].fileName}</h3>
                {images[selectedPhotoIndex].isPrimary && <p className="text-blue-400 text-xs mt-1">Primary Album Cover</p>}
                <p className="text-muted-foreground text-xs mt-2">{selectedPhotoIndex + 1} of {images.length}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
function AlbumMediaPreview({ item, onMediaPlay }: { item: MediaItem; onMediaPlay?: (element: HTMLMediaElement) => void }) {
  const element = useRef<HTMLMediaElement | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
    const current = element.current;
    return () => { current?.pause(); };
  }, [item.fileUrl]);
  const props = {
    src: item.fileUrl, controls: true, preload: 'metadata' as const,
    onPlay: (event: React.SyntheticEvent<HTMLMediaElement>) => onMediaPlay?.(event.currentTarget),
    onError: () => setFailed(true),
    'aria-label': item.fileName,
    className: cn('w-full min-w-0 rounded border', item.fileType.startsWith('video/') && 'aspect-video object-contain bg-black'),
  };
  return <section className="min-w-0 space-y-2 rounded border p-2">
    <h4 className="line-clamp-2 break-words text-xs font-medium" title={item.fileName}>{item.fileName}</h4>
    {item.fileType.startsWith('video/') ? <video {...props} playsInline ref={node => { element.current = node; }} /> : <audio {...props} ref={node => { element.current = node; }} />}
    {failed && <div className="space-y-2">
      <p role="alert" className="text-sm text-destructive">This Media could not be played. Retry to reconnect, or check browser format support.</p>
      <Button type="button" variant="outline" size="sm" onClick={() => {
        setFailed(false);
        // Restart from the App URL so authorization and the storage link refresh.
        element.current?.load();
      }}>Retry Media</Button>
    </div>}
  </section>;
}
