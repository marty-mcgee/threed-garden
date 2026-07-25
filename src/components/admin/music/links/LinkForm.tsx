// components/admin/music/links/LinkForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { MusicLinkType, MusicLinkStatus, MusicLink } from '@/lib/types/music';

const LINK_TYPES = [
  { value: MusicLinkType.STREAM, label: 'Stream' },
  { value: MusicLinkType.BUY, label: 'Buy' },
  { value: MusicLinkType.SOCIAL, label: 'Social' },
  { value: MusicLinkType.VIDEO, label: 'Video' },
  { value: MusicLinkType.EXTERNAL, label: 'External' },
];

const LINK_STATUSES = [
  { value: MusicLinkStatus.ACTIVE, label: 'Active' },
  { value: MusicLinkStatus.INACTIVE, label: 'Inactive' },
  { value: MusicLinkStatus.PENDING, label: 'Pending' },
  { value: MusicLinkStatus.EXPIRED, label: 'Expired' },
];

interface LinkFormProps {
  albumId?: number;
  trackId?: number;
  existingLink?: MusicLink;
  onSuccess?: () => void;
  onCancel?: () => void;
  trigger?: React.ReactNode;
}

export function LinkForm({ 
  albumId, 
  trackId, 
  existingLink, 
  onSuccess, 
  onCancel,
  trigger 
}: LinkFormProps) {
  const { showToast, ToastComponent } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    type: MusicLinkType.EXTERNAL,
    icon: '',
    description: '',
    status: MusicLinkStatus.ACTIVE,
    displayOrder: 0,
  });

  useEffect(() => {
    if (existingLink) {
      setFormData({
        title: existingLink.title,
        url: existingLink.url,
        type: existingLink.type,
        icon: existingLink.icon || '',
        description: existingLink.description || '',
        status: existingLink.status,
        displayOrder: existingLink.displayOrder || 0,
      });
    }
  }, [existingLink]);

  const resetForm = () => {
    setFormData({
      title: '',
      url: '',
      type: MusicLinkType.EXTERNAL,
      icon: '',
      description: '',
      status: MusicLinkStatus.ACTIVE,
      displayOrder: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.url) {
      showToast('Title and URL are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = existingLink 
        ? `/api/music/links?id=${existingLink.id}` 
        : '/api/music/links';
      const method = existingLink ? 'PUT' : 'POST';
      
      const payload: any = {
        ...formData,
        albumId: albumId || null,
        trackId: trackId || null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast(
          existingLink ? 'Link updated successfully' : 'Link created successfully',
          'success'
        );
        setIsOpen(false);
        resetForm();
        if (onSuccess) onSuccess();
      } else {
        showToast(data.error || 'Failed to save link', 'error');
      }
    } catch (error) {
      console.error('Error saving link:', error);
      showToast('Failed to save link', 'error');
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
              {existingLink ? 'Edit Link' : 'Add Link'}
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {existingLink ? 'Edit Link' : 'Add New Link'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Listen on Spotify"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://..."
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Link Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: MusicLinkType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {LINK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="icon">Icon (emoji or text)</Label>
              <Input
                id="icon"
                placeholder="🎵 or spotify"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this link..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: MusicLinkStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {LINK_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                placeholder="0"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                disabled={isSubmitting}
              />
            </div>

            {albumId && (
              <div className="text-xs text-muted-foreground">
                This link will be associated with Album ID: {albumId}
              </div>
            )}
            {trackId && (
              <div className="text-xs text-muted-foreground">
                This link will be associated with Track ID: {trackId}
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
                  existingLink ? 'Update Link' : 'Create Link'
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