// components/admin/music/tracks/MusicTracksCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  CheckCircle,
  XCircle,
  Music2,
  MoreHorizontal,
  ExternalLink,
  Play,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';

interface Track {
  id: number;
  title: string;
  duration: number | null;
  trackNumber: number | null;
  publicUrl: string;
  status: string;
  lyrics: string | null;
  metadata: any;
  playCount: number;
  albumId: number | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface MusicTracksCRUDProps {
  onModuleUpdate?: () => void;
}

export function MusicTracksCRUD({ onModuleUpdate }: MusicTracksCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [albums, setAlbums] = useState<{ id: number; title: string }[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    duration: 180,
    trackNumber: 1,
    publicUrl: '',
    status: 'active',
    lyrics: '',
    albumId: '',
  });

  useEffect(() => {
    fetchTracks();
    fetchAlbums();
  }, []);

  const fetchTracks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/music/tracks');
      const data = await response.json();
      if (data.success) {
        setTracks(data.data || []);
      } else {
        showToast(data.error || 'Failed to fetch tracks', 'error');
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
      showToast('Failed to fetch tracks', 'error');
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
    if (!formData.title || !formData.publicUrl) {
      showToast('Title and audio URL are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        duration: formData.duration || null,
        trackNumber: formData.trackNumber || null,
        publicUrl: formData.publicUrl,
        status: formData.status,
        lyrics: formData.lyrics || null,
        albumId: formData.albumId ? parseInt(formData.albumId) : null,
      };

      const response = await fetch('/api/music/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Track created successfully', 'success');
        setShowCreateDialog(false);
        setFormData({
          title: '',
          duration: 180,
          trackNumber: 1,
          publicUrl: '',
          status: 'active',
          lyrics: '',
          albumId: '',
        });
        await fetchTracks();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create track', 'error');
      }
    } catch (error) {
      console.error('Error creating track:', error);
      showToast('Failed to create track', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingTrack) return;
    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        duration: formData.duration || null,
        trackNumber: formData.trackNumber || null,
        publicUrl: formData.publicUrl,
        status: formData.status,
        lyrics: formData.lyrics || null,
        albumId: formData.albumId ? parseInt(formData.albumId) : null,
      };

      const response = await fetch(`/api/music/tracks?id=${editingTrack.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Track updated successfully', 'success');
        setEditingTrack(null);
        await fetchTracks();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update track', 'error');
      }
    } catch (error) {
      console.error('Error updating track:', error);
      showToast('Failed to update track', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete track "${title}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/music/tracks?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Track deleted successfully', 'success');
        await fetchTracks();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete track', 'error');
      }
    } catch (error) {
      console.error('Error deleting track:', error);
      showToast('Failed to delete track', 'error');
    }
  };

  const renderActions = (track: Track) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => previewTrack(track)}
      >
        <Play className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => openEditDialog(track)}
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
          <DropdownMenuItem onClick={() => window.open(track.publicUrl, '_blank')}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Play Audio
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(track.id, track.title)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const previewTrack = (track: Track) => {
    if (track.publicUrl) {
      window.open(track.publicUrl, '_blank');
    } else {
      showToast('No audio URL available', 'error');
    }
  };

  const openEditDialog = (track: Track) => {
    setEditingTrack(track);
    setFormData({
      title: track.title,
      duration: track.duration || 180,
      trackNumber: track.trackNumber || 1,
      publicUrl: track.publicUrl || '',
      status: track.status || 'active',
      lyrics: track.lyrics || '',
      albumId: track.albumId ? String(track.albumId) : '',
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
          <Music2 className="w-5 h-5 text-indigo-500" />
          <h3 className="text-sm font-semibold">Tracks</h3>
          <Badge variant="secondary" className="ml-2">
            {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Track
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Track</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Track title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="180"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="trackNumber">Track #</Label>
                  <Input
                    id="trackNumber"
                    type="number"
                    placeholder="1"
                    value={formData.trackNumber}
                    onChange={(e) => setFormData({ ...formData, trackNumber: parseInt(e.target.value) || 1 })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="publicUrl">Audio URL *</Label>
                <Input
                  id="publicUrl"
                  placeholder="https://example.com/track.mp3"
                  value={formData.publicUrl}
                  onChange={(e) => setFormData({ ...formData, publicUrl: e.target.value })}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  S3 URL or any publicly accessible audio file URL
                </p>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="lyrics">Lyrics</Label>
                <Textarea
                  id="lyrics"
                  placeholder="Track lyrics..."
                  value={formData.lyrics}
                  onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Track'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tracks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <Music2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No tracks yet</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Create your first track
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">Duration</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="text-center">Plays</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tracks.map((track) => (
              <TableRow key={track.id}>
                <TableCell className="text-center text-muted-foreground">
                  {track.trackNumber || '—'}
                </TableCell>
                <TableCell className="font-medium">
                  {track.title}
                  {track.albumId && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Album Track
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(track.duration)}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant={track.status === 'active' ? 'default' : 'secondary'}>
                    {track.status || 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {track.playCount || 0}
                </TableCell>
                <TableCell className="text-right">
                  {renderActions(track)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editingTrack} onOpenChange={(open) => !open && setEditingTrack(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Track</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-duration">Duration (seconds)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-trackNumber">Track #</Label>
                <Input
                  id="edit-trackNumber"
                  type="number"
                  value={formData.trackNumber}
                  onChange={(e) => setFormData({ ...formData, trackNumber: parseInt(e.target.value) || 1 })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-publicUrl">Audio URL *</Label>
              <Input
                id="edit-publicUrl"
                value={formData.publicUrl}
                onChange={(e) => setFormData({ ...formData, publicUrl: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-lyrics">Lyrics</Label>
              <Textarea
                id="edit-lyrics"
                value={formData.lyrics}
                onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                rows={4}
                disabled={isSubmitting}
              />
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