'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Image, Star, ExternalLink, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Media {
  id: number;
  albumId: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number | null;
  isPrimary: boolean;
  album?: {
    title: string;
    artist: string;
  };
  createdAt: string;
}

interface Album {
  id: number;
  title: string;
  artist: string;
}

export default function MediaManagementPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    fileName: '',
    fileUrl: '',
    fileType: 'image/jpeg',
    isPrimary: false,
  });

  useEffect(() => {
    fetchMedia();
    fetchAlbums();
  }, []);

  const fetchMedia = async () => {
    const response = await fetch('/api/music/media/all');
    if (response.ok) {
      const data = await response.json();
      setMedia(data);
    }
    setLoading(false);
  };

  const fetchAlbums = async () => {
    const response = await fetch('/api/music/albums');
    if (response.ok) {
      const data = await response.json();
      setAlbums(data);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedAlbumId) {
      toast.error('Please select an album first');
      return;
    }

    setIsUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('albumId', selectedAlbumId);
    uploadFormData.append('isPrimary', formData.isPrimary.toString());

    try {
      const response = await fetch('/api/music/media', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) throw new Error('Upload failed');

      toast.success('Media uploaded successfully');
      setIsDialogOpen(false);
      fetchMedia();
      resetForm();
    } catch (error) {
      toast.error('Failed to upload media');
    } finally {
      setIsUploading(false);
    }
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
          albumId: parseInt(selectedAlbumId),
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

  const resetForm = () => {
    setFormData({
      fileName: '',
      fileUrl: '',
      fileType: 'image/jpeg',
      isPrimary: false,
    });
    setEditingMedia(null);
    setSelectedAlbumId('');
  };

  const openEdit = (item: Media) => {
    setEditingMedia(item);
    setFormData({
      fileName: item.fileName,
      fileUrl: item.fileUrl,
      fileType: item.fileType,
      isPrimary: item.isPrimary,
    });
    setSelectedAlbumId(item.albumId.toString());
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-12">Loading media...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Media Gallery</h1>
          <p className="text-muted-foreground mt-1">
            Manage images across all albums
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Media
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingMedia ? 'Edit Media' : 'Upload Media'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingMedia && (
                <div>
                  <Label>Select Album *</Label>
                  <Select value={selectedAlbumId} onValueChange={setSelectedAlbumId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an album" />
                    </SelectTrigger>
                    <SelectContent>
                      {albums.map((album) => (
                        <SelectItem key={album.id} value={album.id.toString()}>
                          {album.title} - {album.artist}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Label>Upload Image File</Label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileUpload}
                  className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  JPEG, PNG, WebP, or GIF up to 10MB
                </p>
              </div>
              
              <div>
                <Label>File Name</Label>
                <Input
                  value={formData.fileName}
                  onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                  placeholder="image-name.jpg"
                />
              </div>
              
              <div>
                <Label>File URL (or use upload above)</Label>
                <Input
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
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
              
              {isUploading && (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button type="submit" disabled={isUploading}>
                  {editingMedia ? 'Update' : 'Add'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Media</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {media.map((item) => (
              <Card key={item.id} className="group">
                <CardContent className="p-3">
                  <div className="aspect-square rounded-md overflow-hidden bg-muted mb-2 relative">
                    <img
                      src={item.fileUrl}
                      alt={item.fileName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        onClick={() => openEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {item.isPrimary && (
                      <div className="absolute top-1 left-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium truncate">{item.fileName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.album?.title} - {item.album?.artist}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          {media.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No media yet. Click "Add Media" to upload images.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}