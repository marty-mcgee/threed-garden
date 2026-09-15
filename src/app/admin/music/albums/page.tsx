// app/admin/music/albums/page.tsx
'use client';

import { useMusicRecords, MusicRecordsSearch, MusicRecordsTable, MusicStatus } from '@/components/admin/music/shared/MusicRecordsWorkspace';
import { AdminWorkspaceHeader } from '@/components/admin/layout/AdminWorkspaceHeader';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Eye, Music, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Album {
  id: number;
  title: string;
  artist: string;
  coverArt: string;
  releaseYear: number | null;
  description: string | null;
  status: string;
  isPublic: boolean;
  sortOrder: number;
  tracks?: Track[];
  createdAt: string;
}

interface Track {
  id: number;
  title: string;
  duration: number | null;
  trackNumber: number | null;
}

export default function AlbumsManagementPage() {
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const workspace = useMusicRecords('albums', true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    coverArt: '',
    releaseYear: '',
    description: '',
    status: 'draft',
    isPublic: false,
    sortOrder: '0',
  });

  const fetchAlbums = async () => { workspace.reload(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.artist || !formData.coverArt) {
      showToast('Title, artist, and cover art are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingAlbum ? `/api/music/albums?id=${editingAlbum.id}` : '/api/music/albums';
      const method = editingAlbum ? 'PUT' : 'POST';
      const payload = {
        title: formData.title,
        artist: formData.artist,
        coverArt: formData.coverArt,
        releaseYear: formData.releaseYear ? parseInt(formData.releaseYear) : null,
        description: formData.description || null,
        status: formData.status,
        isPublic: formData.isPublic,
        sortOrder: parseInt(formData.sortOrder) || 0,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast(editingAlbum ? 'Album updated successfully' : 'Album created successfully', 'success');
        setIsDialogOpen(false);
        resetForm();
        await fetchAlbums();
      } else {
        showToast(data.error || 'Failed to save album', 'error');
      }
    } catch (error) {
      console.error('Error saving album:', error);
      showToast('Failed to save album', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? All tracks will also be deleted.`)) return;
    
    try {
      const response = await fetch(`/api/music/albums?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        showToast('Album deleted successfully', 'success');
        await fetchAlbums();
      } else {
        showToast(data.error || 'Failed to delete album', 'error');
      }
    } catch (error) {
      console.error('Error deleting album:', error);
      showToast('Failed to delete album', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      artist: '',
      coverArt: '',
      releaseYear: '',
      description: '',
      status: 'draft',
      isPublic: false,
      sortOrder: workspace.total.toString(),
    });
    setEditingAlbum(null);
  };

  const openEdit = (album: Album) => {
    setEditingAlbum(album);
    setFormData({
      title: album.title,
      artist: album.artist,
      coverArt: album.coverArt || '',
      releaseYear: album.releaseYear?.toString() || '',
      description: album.description || '',
      status: album.status || 'draft',
      isPublic: album.isPublic || false,
      sortOrder: album.sortOrder?.toString() || '0',
    });
    setIsDialogOpen(true);
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'archived': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {ToastComponent}

      {/* Header */}
      <fieldset className="min-w-0 shrink-0" disabled={workspace.busy}>
      <AdminWorkspaceHeader icon={Music} title="Albums" description="Manage Multimedia albums">
        <Badge variant="secondary" className="text-xs">{workspace.total}</Badge>
        <MusicRecordsSearch workspace={workspace} />
        <Button size="sm" className="ml-auto h-7 px-2 text-xs" onClick={() => {
          resetForm();
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          New Album
        </Button>
      </AdminWorkspaceHeader>
      </fieldset>

      <MusicRecordsTable workspace={workspace} label="Albums" columns={[
        { field: 'title', label: 'Title', render: row => <span className="inline-flex items-center gap-2"><Music className="h-4 w-4 text-blue-500" />{String(row.title)}</span> },
        { field: 'id', label: 'ID' }, { field: 'artist', label: 'Artist' }, { field: 'releaseYear', label: 'Year' },
        { field: 'status', label: 'Status', render: row => <MusicStatus value={row.status} /> },
        { field: 'isPublic', label: 'Public', render: row => <MusicStatus value={row.isPublic} /> },
      ]} actions={row => <div className="flex justify-end gap-1">
        <Button size="sm" variant="ghost" className="h-7 px-2" aria-label={`View Album ${row.title}`} onClick={() => router.push(`/admin/music/albums/${row.id}`)}><Eye className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" className="h-7 px-2" aria-label={`Edit Album ${row.title}`} onClick={() => openEdit(row as unknown as Album)}><Edit className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500" aria-label={`Delete Album ${row.title}`} onClick={() => handleDelete(row.id, String(row.title))}><Trash2 className="h-4 w-4" /></Button>
      </div>} />

      {/* Album Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAlbum ? 'Edit Album' : 'Create New Album'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <Label htmlFor="artist">Artist *</Label>
              <Input
                id="artist"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <Label htmlFor="coverArt">Cover Art URL *</Label>
              <Input
                id="coverArt"
                value={formData.coverArt}
                onChange={(e) => setFormData({ ...formData, coverArt: e.target.value })}
                placeholder="https://example.com/cover.jpg"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="releaseYear">Release Year</Label>
                <Input
                  id="releaseYear"
                  type="number"
                  value={formData.releaseYear}
                  onChange={(e) => setFormData({ ...formData, releaseYear: e.target.value })}
                  disabled={isSubmitting}
                  placeholder="2024"
                />
              </div>
              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  disabled={isSubmitting}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Lower numbers appear first
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="w-full p-2 border rounded-md bg-background"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={isSubmitting}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                  disabled={isSubmitting}
                />
                <Label htmlFor="isPublic">Make public</Label>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingAlbum ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingAlbum ? 'Update Album' : 'Create Album'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
