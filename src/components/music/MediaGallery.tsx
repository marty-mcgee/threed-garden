'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export function MediaGallery({ media, className }: MediaGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!media || media.length === 0) return null;

  const images = media.filter(item => item.fileType.startsWith('image/'));
  if (images.length === 0) return null;

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
  }, [selectedPhotoIndex]);

  const sortedImages = [...images].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return 0;
  });

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold">Media Gallery</h3>
        <span className="text-xs text-gray-400">({images.length} images)</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {sortedImages.slice(0, 12).map((image, idx) => (
          <div
            key={image.id}
            onClick={() => setSelectedPhotoIndex(idx)}
            className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-gray-800 hover:opacity-90 transition-opacity"
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
          <div className="aspect-square rounded-lg bg-gray-800 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors">
            <span className="text-xs text-gray-400">+{images.length - 12} more</span>
          </div>
        )}
      </div>

      <Dialog open={selectedPhotoIndex !== null} onOpenChange={() => setSelectedPhotoIndex(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black/95 border-none">
          {selectedPhotoIndex !== null && (
            <div className="relative w-full h-full flex flex-col">
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setIsZoomed(!isZoomed)}>
                  {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setSelectedPhotoIndex(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {images.length > 1 && (
                <>
                  <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10" onClick={handlePrev}>
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10" onClick={handleNext}>
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
                <p className="text-gray-400 text-xs mt-2">{selectedPhotoIndex + 1} of {images.length}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}