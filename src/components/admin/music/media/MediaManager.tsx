// components/admin/music/media/MediaManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Image as ImageIcon,
  Edit,
  Trash2,
  Star,
  Plus,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { MediaForm } from './MediaForm';
import { MusicMedia } from '@/lib/types/music';

interface MediaManagerProps {
  albumId?: number;
  albumTitle?: string;
  onMediaChange?: () => void;
}

export function MediaManager({ albumId, albumTitle, onMediaChange }: MediaManagerProps) {
  const { showToast, ToastComponent } = useToast();
  const [media, setMedia] = useState<MusicMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedia();
  }, [albumId]);

  const fetchMedia = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (albumId) params.append('albumId', albumId.toString());
    
    try {
      const response = await fetch(`/api/music/media?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setMedia(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
      showToast('Failed to load media', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, fileName: string) => {
    if (!confirm(`Delete "${fileName}"? This action cannot be undone.`)) return;
    
    try {
      const response = await fetch(`/api/music/media?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        showToast('Media deleted', 'success');
        fetchMedia();
        if (onMediaChange) onMediaChange();
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      showToast('Failed to delete media', 'error');
    }
  };

  const handleSetPrimary = async (id: number) => {
    try {
      const response = await fetch(`/api/music/media/${id}/primary`, { method: 'PATCH' });
      if (response.ok) {
        showToast('Primary media updated', 'success');
        fetchMedia();
        if (onMediaChange) onMediaChange();
      }
    } catch (error) {
      console.error('Error setting primary:', error);
      showToast('Failed to update primary media', 'error');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ToastComponent}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium">Media Gallery</h3>
          <p className="text-xs text-muted-foreground">
            {media.length} media item{media.length !== 1 ? 's' : ''} associated
          </p>
        </div>
        <MediaForm
          albumId={albumId}
          onSuccess={() => {
            fetchMedia();
            if (onMediaChange) onMediaChange();
          }}
        />
      </div>

      {media.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 rounded-full bg-muted">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No media added yet</p>
              <p className="text-xs text-muted-foreground">
                Upload images or media files for this album
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {media.map((item) => (
            <Card key={item.id} className="group overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square relative bg-muted/20">
                  {item.fileType.startsWith('image/') ? (
                    <img
                      src={item.fileUrl}
                      alt={item.fileName}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/50" />
                        <span className="text-xs text-muted-foreground block mt-1">
                          {item.fileType}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {item.isPrimary && (
                    <Badge className="absolute top-2 left-2 text-[10px]">
                      Primary
                    </Badge>
                  )}
                  
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                    {!item.isPrimary && (
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                        onClick={() => handleSetPrimary(item.id)}
                      >
                        <Star className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <MediaForm
                      albumId={albumId}
                      existingMedia={item}
                      onSuccess={() => {
                        fetchMedia();
                        if (onMediaChange) onMediaChange();
                      }}
                      trigger={
                        <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7 rounded-full"
                      onClick={() => handleDelete(item.id, item.fileName)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs truncate font-medium">{item.fileName}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{item.fileType}</span>
                    <span>•</span>
                    <span>{formatFileSize(item.fileSize)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}