'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Image, Star, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Media {
  id: number;
  albumId: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number | null;
  isPrimary: boolean;
  metadata: any;
}

interface MediaManagerProps {
  albumId: number;
  albumTitle: string;
}

export function MediaManager({ albumId, albumTitle }: MediaManagerProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [formData, setFormData] = useState({
    fileName: '',
    fileUrl: '',
    fileType: 'image/jpeg',
    isPrimary: false,
  });

  useEffect(() => {
    fetchMedia();
  }, [albumId]);

  const fetchMedia = async () => {
    const response = await fetch(`/api/music/media?albumId=${albumId}`);
    if (response.ok) {
      const data = await response.json();
      setMedia(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = '/api/music/media';
    const method = editingMedia ? 'PUT' : 'POST';
    const body = editingMedia
      ? {
          id: editingMedia.id,
          ...formData,
        }
      : {
          albumId,
          ...formData,
          fileSize: 0,
        };

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      toast.success(editingMedia ? 'Media updated' : 'Media added');
      setIsDialogOpen(false);
      fetchMedia();
      resetForm();
    } else {
      toast.error('Failed to save media');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this media?')) return;
    
    const response = await fetch(`/api/music/media?id=${id}`, { method: 'DELETE' });
    if (response.ok) {
      toast.success('Media deleted');
      fetchMedia();
    } else {
      toast.error('Failed to delete media');
    }
  };

  const handleSetPrimary = async (id: number) => {
    const response = await fetch('/api/music/media', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        isPrimary: true,
      }),
    });

    if (response.ok) {
      toast.success('Primary media updated');
      fetchMedia();
    } else {
      toast.error('Failed to update primary');
    }
  };

  const resetForm = () => {
    setFormData({
      fileName: '',
      fileUrl: '',
      fileType: 'image/jpeg',
      isPrimary: false,
    });
    setEditingMedia(null);
  };

  const openEdit = (item: Media) => {
    setEditingMedia(item);
    setFormData({
      fileName: item.fileName,
      fileUrl: item.fileUrl,
      fileType: item.fileType,
      isPrimary: item.isPrimary,
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-4">Loading media...</div>;
  }

  const primaryMedia = media.find(m => m.isPrimary);
  const otherMedia = media.filter(m => !m.isPrimary);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Album Media</h3>
          <p className="text-sm text-muted-foreground">Manage images for {albumTitle}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Media
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMedia ? 'Edit Media' : 'Add Media'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>File Name *</Label>
                <Input
                  value={formData.fileName}
                  onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                  placeholder="cover.jpg"
                  required
                />
              </div>
              <div>
                <Label>File URL *</Label>
                <Input
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>
              <div>
                <Label>File Type</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={formData.fileType}
                  onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                >
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/png">PNG</option>
                  <option value="image/webp">WebP</option>
                  <option value="image/gif">GIF</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  />
                  Set as primary album cover
                </label>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingMedia ? 'Update' : 'Add'}</Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Primary Media Display */}
      {primaryMedia && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted">
                <img
                  src={primaryMedia.fileUrl}
                  alt={primaryMedia.fileName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <h4 className="font-semibold">Primary Cover</h4>
                </div>
                <p className="text-sm mt-1">{primaryMedia.fileName}</p>
                <p className="text-xs text-muted-foreground">{primaryMedia.fileType}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" asChild>
                    <a href={primaryMedia.fileUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </a>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(primaryMedia)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Media */}
      {otherMedia.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Additional Images ({otherMedia.length})</h4>
          <div className="grid grid-cols-2 gap-3">
            {otherMedia.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-3">
                  <div className="aspect-square rounded-md overflow-hidden bg-muted mb-2">
                    <img
                      src={item.fileUrl}
                      alt={item.fileName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs font-medium truncate">{item.fileName}</p>
                  <div className="flex gap-1 mt-2">
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleSetPrimary(item.id)}>
                      <Star className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(item)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {media.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No media yet. Click "Add Media" to upload images.</p>
        </div>
      )}
    </div>
  );
}