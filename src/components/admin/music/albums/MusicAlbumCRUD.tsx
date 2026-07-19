// components/admin/music/albums/MusicAlbumCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  CheckCircle,
  XCircle,
  Music,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
// import { useSession } from 'next-auth/react';

interface Album {
  id: number;
  title: string;
  artist: string;
  coverArt: string;
  releaseYear: number;
  description: string;
  status: string;
  isPublic: boolean;
  sortOrder: number;
  createdAt: string;
  userId: string;
  tracks?: Track[];
}

interface Track {
  id: number;
  title: string;
  duration: number;
  trackNumber: number;
  publicUrl: string;
  status: string;
  playCount: number;
}

interface MusicAlbumCRUDProps {
  userId: string;
  projectId?: number; // ✅ Optional: for adding assets to projects
  onModuleUpdate?: () => void;
}

export function MusicAlbumCRUD({ userId, projectId, onModuleUpdate }: MusicAlbumCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [showTracksDialog, setShowTracksDialog] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    coverArt: '',
    releaseYear: new Date().getFullYear(),
    description: '',
    status: 'draft',
    isPublic: false,
  });

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/music/albums');
      const data = await response.json();
      if (data.success) {
        setAlbums(data.data || []);
      } else {
        showToast(data.error || 'Failed to fetch albums', 'error');
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
      showToast('Failed to fetch albums', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.artist) {
      showToast('Title and artist are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/music/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Album created successfully', 'success');
        setShowCreateDialog(false);
        setFormData({
          title: '',
          artist: '',
          coverArt: '',
          releaseYear: new Date().getFullYear(),
          description: '',
          status: 'draft',
          isPublic: false,
        });
        await fetchAlbums();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create album', 'error');
      }
    } catch (error) {
      console.error('Error creating album:', error);
      showToast('Failed to create album', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingAlbum) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/music/albums?id=${editingAlbum.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Album updated successfully', 'success');
        setEditingAlbum(null);
        await fetchAlbums();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update album', 'error');
      }
    } catch (error) {
      console.error('Error updating album:', error);
      showToast('Failed to update album', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/music/albums?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Album deleted successfully', 'success');
        await fetchAlbums();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete album', 'error');
      }
    } catch (error) {
      console.error('Error deleting album:', error);
      showToast('Failed to delete album', 'error');
    }
  };

  const handleAddToProject = async (albumId: number) => {
    if (!projectId) {
      showToast('No project selected', 'error');
      return;
    }

    try {
      const response = await fetch('/api/project/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          assetType: 'music_albums',
          assetId: albumId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Album added to project successfully', 'success');
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to add album to project', 'error');
      }
    } catch (error) {
      console.error('Error adding album to project:', error);
      showToast('Failed to add album to project', 'error');
    }
  };

  const handleRemoveFromProject = async (albumId: number) => {
    if (!projectId) {
      showToast('No project selected', 'error');
      return;
    }

    try {
      const response = await fetch(
        `/api/project/assets?projectId=${projectId}&type=music_albums&assetId=${albumId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();
      if (data.success) {
        showToast('Album removed from project successfully', 'success');
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to remove album from project', 'error');
      }
    } catch (error) {
      console.error('Error removing album from project:', error);
      showToast('Failed to remove album from project', 'error');
    }
  };

  // Add the "Add to Project" button in your table row
  // Example in your table render:
  const renderActions = (album: any) => (
    <div className="flex gap-2">
      {/* Existing actions */}
      {projectId && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddToProject(album.id)}
          >
            Add to Project
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleRemoveFromProject(album.id)}
          >
            Remove from Project
          </Button>
        </>
      )}
    </div>
  );

  const viewTracks = async (album: Album) => {
    try {
      const response = await fetch(`/api/music/albums?id=${album.id}&includeTracks=true`);
      const data = await response.json();
      if (data.success) {
        setSelectedAlbum(data.data);
        setShowTracksDialog(true);
      } else {
        showToast('Failed to load tracks', 'error');
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
      showToast('Failed to load tracks', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Open edit dialog with album data
  const openEditDialog = (album: Album) => {
    setEditingAlbum(album);
    setFormData({
      title: album.title,
      artist: album.artist,
      coverArt: album.coverArt || '',
      releaseYear: album.releaseYear || new Date().getFullYear(),
      description: album.description || '',
      status: album.status || 'draft',
      isPublic: album.isPublic || false,
    });
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

      {/* Header with count and add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Music className="w-5 h-5 text-purple-500" />
          <h3 className="text-sm font-semibold">Albums</h3>
          <Badge variant="secondary" className="ml-2">
            {albums.length} {albums.length === 1 ? 'album' : 'albums'}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Album
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Album</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Album title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="artist">Artist *</Label>
                <Input
                  id="artist"
                  placeholder="Artist name"
                  value={formData.artist}
                  onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="coverArt">Cover Art URL</Label>
                <Input
                  id="coverArt"
                  placeholder="https://example.com/cover.jpg"
                  value={formData.coverArt}
                  onChange={(e) => setFormData({ ...formData, coverArt: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="releaseYear">Release Year</Label>
                <Input
                  id="releaseYear"
                  type="number"
                  placeholder="2024"
                  value={formData.releaseYear}
                  onChange={(e) => setFormData({ ...formData, releaseYear: parseInt(e.target.value) || new Date().getFullYear() })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Album description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                  disabled={isSubmitting}
                />
                <Label htmlFor="isPublic">Make public</Label>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Album'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Albums Table */}
      {albums.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No albums yet</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Create your first album
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">Artist</TableHead>
              <TableHead className="hidden md:table-cell">Year</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {albums.map((album) => (
              <TableRow key={album.id}>
                <TableCell className="font-medium">
                  {album.title}
                  {album.isPublic && (
                    <Badge variant="outline" className="ml-2 text-xs">Public</Badge>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {album.artist}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {album.releaseYear}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {album.status === 'published' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="text-sm">
                      {album.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewTracks(album)}
                    >
                      <Music className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(album)}
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
                        {album.coverArt && (
                          <DropdownMenuItem onClick={() => window.open(album.coverArt, '_blank')}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Cover
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(album.id, album.title)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingAlbum} onOpenChange={(open) => !open && setEditingAlbum(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Album</DialogTitle>
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
              <Label htmlFor="edit-artist">Artist *</Label>
              <Input
                id="edit-artist"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-coverArt">Cover Art URL</Label>
              <Input
                id="edit-coverArt"
                value={formData.coverArt}
                onChange={(e) => setFormData({ ...formData, coverArt: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-releaseYear">Release Year</Label>
              <Input
                id="edit-releaseYear"
                type="number"
                value={formData.releaseYear}
                onChange={(e) => setFormData({ ...formData, releaseYear: parseInt(e.target.value) || new Date().getFullYear() })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                disabled={isSubmitting}
              />
              <Label htmlFor="edit-isPublic">Make public</Label>
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

      {/* Tracks Dialog */}
      <Dialog open={showTracksDialog} onOpenChange={setShowTracksDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Tracks for "{selectedAlbum?.title}"
              {selectedAlbum?.artist && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  by {selectedAlbum.artist}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            {selectedAlbum?.tracks && selectedAlbum.tracks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Plays</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedAlbum.tracks.map((track) => (
                    <TableRow key={track.id}>
                      <TableCell className="text-center text-muted-foreground">
                        {track.trackNumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        {track.title}
                        {track.publicUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-2"
                            onClick={() => window.open(track.publicUrl, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDuration(track.duration)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={track.status === 'active' ? 'default' : 'secondary'}>
                          {track.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {track.playCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tracks found for this album</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}