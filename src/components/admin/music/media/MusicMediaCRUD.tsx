// components/admin/music/media/MusicMediaCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  CheckCircle,
  XCircle,
  Image,
  MoreHorizontal,
  ExternalLink,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';

interface Media {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number | null;
  isPrimary: boolean;
  metadata: any;
  albumId: number | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface MusicMediaCRUDProps {
  onModuleUpdate?: () => void;
}

export function MusicMediaCRUD({ onModuleUpdate }: MusicMediaCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [albums, setAlbums] = useState<{ id: number; title: string }[]>([]);
  const [formData, setFormData] = useState({
    fileName: '',
    fileUrl: '',
    fileType: 'image/jpeg',
    fileSize: 0,
    isPrimary: false,
    albumId: '',
  });

  useEffect(() => {
    fetchMedia();
    fetchAlbums();
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/music/media');
      const data = await response.json();
      if (data.success) {
        setMedia(data.data || []);
      } else {
        showToast(data.error || 'Failed to fetch media', 'error');
      }
    } catch (error) {
      console.error('Error fetching media:', error);
      showToast('Failed to fetch media', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbums = async () => {
    try {
      const response = await fetch('/api/music/albums');
      const data = await response.json();
      if (data.success) {
        setAlbums(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.fileName || !formData.fileUrl) {
      showToast('File name and URL are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        fileName: formData.fileName,
        fileUrl: formData.fileUrl,
        fileType: formData.fileType,
        fileSize: formData.fileSize || null,
        isPrimary: formData.isPrimary,
        albumId: formData.albumId ? parseInt(formData.albumId) : null,
      };

      const response = await fetch('/api/music/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Media created successfully', 'success');
        setShowCreateDialog(false);
        setFormData({
          fileName: '',
          fileUrl: '',
          fileType: 'image/jpeg',
          fileSize: 0,
          isPrimary: false,
          albumId: '',
        });
        await fetchMedia();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create media', 'error');
      }
    } catch (error) {
      console.error('Error creating media:', error);
      showToast('Failed to create media', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingMedia) return;
    setIsSubmitting(true);
    try {
      const payload = {
        fileName: formData.fileName,
        fileUrl: formData.fileUrl,
        fileType: formData.fileType,
        fileSize: formData.fileSize || null,
        isPrimary: formData.isPrimary,
        albumId: formData.albumId ? parseInt(formData.albumId) : null,
      };

      const response = await fetch(`/api/music/media?id=${editingMedia.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Media updated successfully', 'success');
        setEditingMedia(null);
        await fetchMedia();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update media', 'error');
      }
    } catch (error) {
      console.error('Error updating media:', error);
      showToast('Failed to update media', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, fileName: string) => {
    if (!confirm(`Delete media "${fileName}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/music/media?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Media deleted successfully', 'success');
        await fetchMedia();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete media', 'error');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      showToast('Failed to delete media', 'error');
    }
  };

  const renderActions = (media: Media) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.open(media.fileUrl, '_blank')}
      >
        <ExternalLink className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => openEditDialog(media)}
      >
        <Edit className="w-4 h-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(media.id, media.fileName)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const openEditDialog = (media: Media) => {
    setEditingMedia(media);
    setFormData({
      fileName: media.fileName,
      fileUrl: media.fileUrl,
      fileType: media.fileType || 'image/jpeg',
      fileSize: media.fileSize || 0,
      isPrimary: media.isPrimary || false,
      albumId: media.albumId ? String(media.albumId) : '',
    });
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
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ToastComponent}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image className="w-5 h-5 text-pink-500" />
          <h3 className="text-sm font-semibold">Media</h3>
          <Badge variant="secondary" className="ml-2">
            {media.length} {media.length === 1 ? 'file' : 'files'}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Media
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Media File</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="fileName">File Name *</Label>
                <Input
                  id="fileName"
                  placeholder="cover-art.jpg"
                  value={formData.fileName}
                  onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="fileUrl">File URL *</Label>
                <Input
                  id="fileUrl"
                  placeholder="https://example.com/image.jpg"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="albumId">Album</Label>
                <Select
                  value={formData.albumId}
                  onValueChange={(value) => setFormData({ ...formData, albumId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select album" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {albums.map((album) => (
                      <SelectItem key={album.id} value={String(album.id)}>
                        {album.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fileType">File Type</Label>
                <Select
                  value={formData.fileType}
                  onValueChange={(value) => setFormData({ ...formData, fileType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select file type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image/jpeg">JPEG</SelectItem>
                    <SelectItem value="image/png">PNG</SelectItem>
                    <SelectItem value="image/webp">WebP</SelectItem>
                    <SelectItem value="image/svg+xml">SVG</SelectItem>
                    <SelectItem value="image/gif">GIF</SelectItem>
                    <SelectItem value="audio/mpeg">MP3</SelectItem>
                    <SelectItem value="audio/wav">WAV</SelectItem>
                    <SelectItem value="audio/flac">FLAC</SelectItem>
                    <SelectItem value="video/mp4">MP4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fileSize">File Size (bytes)</Label>
                <Input
                  id="fileSize"
                  type="number"
                  placeholder="1024"
                  value={formData.fileSize}
                  onChange={(e) => setFormData({ ...formData, fileSize: parseInt(e.target.value) || 0 })}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isPrimary"
                  checked={formData.isPrimary}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPrimary: checked })}
                  disabled={isSubmitting}
                />
                <Label htmlFor="isPrimary">Primary Media</Label>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Media'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {media.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No media files yet</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add your first media file
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead className="hidden sm:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">Size</TableHead>
              <TableHead className="text-center">Primary</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {media.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.fileName}
                  {item.albumId && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Album Media
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {item.fileType}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {formatFileSize(item.fileSize)}
                </TableCell>
                <TableCell className="text-center">
                  {item.isPrimary ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {renderActions(item)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editingMedia} onOpenChange={(open) => !open && setEditingMedia(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Media</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-fileName">File Name *</Label>
              <Input
                id="edit-fileName"
                value={formData.fileName}
                onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-fileUrl">File URL *</Label>
              <Input
                id="edit-fileUrl"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-albumId">Album</Label>
              <Select
                value={formData.albumId}
                onValueChange={(value) => setFormData({ ...formData, albumId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select album" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {albums.map((album) => (
                    <SelectItem key={album.id} value={String(album.id)}>
                      {album.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-fileType">File Type</Label>
              <Select
                value={formData.fileType}
                onValueChange={(value) => setFormData({ ...formData, fileType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select file type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image/jpeg">JPEG</SelectItem>
                  <SelectItem value="image/png">PNG</SelectItem>
                  <SelectItem value="image/webp">WebP</SelectItem>
                  <SelectItem value="image/svg+xml">SVG</SelectItem>
                  <SelectItem value="image/gif">GIF</SelectItem>
                  <SelectItem value="audio/mpeg">MP3</SelectItem>
                  <SelectItem value="audio/wav">WAV</SelectItem>
                  <SelectItem value="audio/flac">FLAC</SelectItem>
                  <SelectItem value="video/mp4">MP4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-fileSize">File Size (bytes)</Label>
              <Input
                id="edit-fileSize"
                type="number"
                value={formData.fileSize}
                onChange={(e) => setFormData({ ...formData, fileSize: parseInt(e.target.value) || 0 })}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-isPrimary"
                checked={formData.isPrimary}
                onCheckedChange={(checked) => setFormData({ ...formData, isPrimary: checked })}
                disabled={isSubmitting}
              />
              <Label htmlFor="edit-isPrimary">Primary Media</Label>
            </div>
            <Button onClick={handleUpdate} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}