// components/admin/music/media/MediaForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Loader2, ImageIcon } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { MusicMedia } from '@/lib/types/music';

const MEDIA_TYPES = [
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/png', label: 'PNG' },
  { value: 'image/webp', label: 'WebP' },
  { value: 'image/svg+xml', label: 'SVG' },
  { value: 'image/gif', label: 'GIF' },
  { value: 'audio/mpeg', label: 'MP3' },
  { value: 'audio/wav', label: 'WAV' },
  { value: 'audio/flac', label: 'FLAC' },
  { value: 'video/mp4', label: 'MP4' },
];

interface MediaFormProps {
  albumId?: number;
  existingMedia?: MusicMedia;
  onSuccess?: () => void;
  onCancel?: () => void;
  trigger?: React.ReactNode;
}

export function MediaForm({ 
  albumId, 
  existingMedia, 
  onSuccess, 
  onCancel,
  trigger 
}: MediaFormProps) {
  const { showToast, ToastComponent } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fileName: '',
    fileUrl: '',
    fileType: 'image/jpeg',
    fileSize: 0,
    isPrimary: false,
  });

  useEffect(() => {
    if (existingMedia) {
      setFormData({
        fileName: existingMedia.fileName,
        fileUrl: existingMedia.fileUrl,
        fileType: existingMedia.fileType || 'image/jpeg',
        fileSize: existingMedia.fileSize || 0,
        isPrimary: existingMedia.isPrimary || false,
      });
      setPreviewUrl(existingMedia.fileUrl);
    }
  }, [existingMedia]);

  const resetForm = () => {
    setFormData({
      fileName: '',
      fileUrl: '',
      fileType: 'image/jpeg',
      fileSize: 0,
      isPrimary: false,
    });
    setPreviewUrl(null);
  };

  // Preview image when URL changes
  useEffect(() => {
    if (formData.fileUrl && formData.fileType.startsWith('image/')) {
      setPreviewUrl(formData.fileUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [formData.fileUrl, formData.fileType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fileName || !formData.fileUrl) {
      showToast('File name and URL are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = existingMedia 
        ? `/api/music/media?id=${existingMedia.id}` 
        : '/api/music/media';
      const method = existingMedia ? 'PUT' : 'POST';
      
      const payload: any = {
        ...formData,
        albumId: albumId || null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast(
          existingMedia ? 'Media updated successfully' : 'Media added successfully',
          'success'
        );
        setIsOpen(false);
        resetForm();
        if (onSuccess) onSuccess();
      } else {
        showToast(data.error || 'Failed to save media', 'error');
      }
    } catch (error) {
      console.error('Error saving media:', error);
      showToast('Failed to save media', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {ToastComponent}
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open && onCancel) onCancel();
      }}>
        <DialogTrigger asChild>
          {trigger || (
            <Button size="sm" className="gap-1">
              <Plus className="w-3.5 h-3.5" />
              {existingMedia ? 'Edit Media' : 'Add Media'}
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {existingMedia ? 'Edit Media' : 'Add Media'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {/* Preview */}
            {previewUrl && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div>
              <Label htmlFor="fileName">File Name *</Label>
              <Input
                id="fileName"
                placeholder="cover-art.jpg"
                value={formData.fileName}
                onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <Label htmlFor="fileUrl">File URL *</Label>
              <Input
                id="fileUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                disabled={isSubmitting}
                required
              />
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
                  {MEDIA_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fileSize">File Size (bytes)</Label>
              <Input
                id="fileSize"
                type="number"
                placeholder="1024"
                value={formData.fileSize || ''}
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
              <Label htmlFor="isPrimary">Set as primary media</Label>
            </div>

            {albumId && (
              <div className="text-xs text-muted-foreground">
                This media will be associated with Album ID: {albumId}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  existingMedia ? 'Update Media' : 'Add Media'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}