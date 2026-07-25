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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { LinksManager } from '../links/LinksManager';
import { MediaManager } from '../media/MediaManager';
import { MusicAlbum, MusicLink, MusicMedia } from '@/lib/types/music';

interface MusicAlbumCRUDProps {
  onModuleUpdate?: () => void;
}

export function MusicAlbumCRUD({ onModuleUpdate }: MusicAlbumCRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [albums, setAlbums] = useState<MusicAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<MusicAlbum | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<MusicAlbum | null>(null);
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
      const response = await fetch('/api/music/albums?includeTracks=true&includeLinks=true&includeMedia=true');
      const data = await response.json();
      if (data.success) {
        setAlbums(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || 'Failed to fetch albums', 'error');
        setAlbums([]);
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
      showToast('Failed to fetch albums', 'error');
      setAlbums([]);
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

  const openAlbumDetail = async (album: MusicAlbum) => {
    const response = await fetch(`/api/music/albums?id=${album.id}&includeTracks=true&includeLinks=true&includeMedia=true`);
    const data = await response.json();
    if (data.success) {
      setSelectedAlbum(data.data);
    }
  };

  const openEditDialog = (album: MusicAlbum) => {
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

  const albumList = Array.isArray(albums) ? albums : [];

  return (
    <div className="space-y-4">
      {ToastComponent}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium">Albums</span>
          <Badge variant="secondary" className="text-xs">
            {albumList.length}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 gap-1">
              <Plus className="w-3.5 h-3.5" />
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
      {albumList.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No albums yet</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Create your first album
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs py-1">Title</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">Artist</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Tracks</TableHead>
                <TableHead className="text-center text-xs py-1">Status</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {albumList.map((album) => (
                <TableRow 
                  key={album.id} 
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => openAlbumDetail(album)}
                >
                  <TableCell className="py-1.5 text-sm font-medium">
                    {album.title}
                    {album.isPublic && (
                      <Badge variant="outline" className="ml-2 text-[10px]">Public</Badge>
                    )}
                    {(album.links?.length || 0) > 0 && (
                      <span className="ml-1 text-[10px] text-muted-foreground">
                        🔗{album.links?.length}
                      </span>
                    )}
                    {(album.media?.length || 0) > 0 && (
                      <span className="ml-1 text-[10px] text-muted-foreground">
                        🖼️{album.media?.length}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1.5 text-sm text-muted-foreground">
                    {album.artist}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1.5 text-sm text-muted-foreground">
                    {album.tracks?.length || 0}
                  </TableCell>
                  <TableCell className="text-center py-1.5">
                    <div className="flex items-center justify-center gap-1.5">
                      {album.status === 'published' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-yellow-500" />
                      )}
                      <span className="text-xs">
                        {album.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openAlbumDetail(album)}>
                        <Music className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEditDialog(album)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(album.id, album.title)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Album Detail Dialog */}
      <Dialog open={!!selectedAlbum} onOpenChange={(open) => !open && setSelectedAlbum(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAlbum?.title}
              <Badge variant={selectedAlbum?.status === 'published' ? 'default' : 'secondary'}>
                {selectedAlbum?.status}
              </Badge>
            </DialogTitle>
            {selectedAlbum?.artist && (
              <p className="text-sm text-muted-foreground">by {selectedAlbum.artist}</p>
            )}
          </DialogHeader>

          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="tracks">
                Tracks ({selectedAlbum?.tracks?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="links">
                Links ({selectedAlbum?.links?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="media">
                Media ({selectedAlbum?.media?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <p className="text-sm font-medium">{selectedAlbum?.title}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Artist</Label>
                  <p className="text-sm font-medium">{selectedAlbum?.artist}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Release Year</Label>
                  <p className="text-sm">{selectedAlbum?.releaseYear}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge variant={selectedAlbum?.status === 'published' ? 'default' : 'secondary'}>
                    {selectedAlbum?.status}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <p className="text-sm">{selectedAlbum?.description || 'No description'}</p>
                </div>
                {selectedAlbum?.coverArt && (
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Cover Art</Label>
                    <div className="mt-1 relative w-32 h-32 rounded-lg overflow-hidden border">
                      <img
                        src={selectedAlbum.coverArt}
                        alt={selectedAlbum.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tracks" className="pt-4">
              {selectedAlbum?.tracks && selectedAlbum.tracks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-xs">#</TableHead>
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-right text-xs">Duration</TableHead>
                      <TableHead className="text-center text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedAlbum.tracks.map((track) => (
                      <TableRow key={track.id}>
                        <TableCell className="text-center text-muted-foreground text-sm">
                          {track.trackNumber}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{track.title}</TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {track.duration ? `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}` : '--'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={track.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                            {track.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tracks for this album</p>
                </div>
              )}
            </TabsContent>

            {/* Links Tab - uses existing LinksManager component */}
            <TabsContent value="links" className="pt-4">
              {selectedAlbum && (
                <LinksManager 
                  albumId={selectedAlbum.id}
                  onLinkAdded={() => {
                    // Refresh the selected album data
                    if (selectedAlbum) {
                      fetch(`/api/music/albums?id=${selectedAlbum.id}&includeLinks=true`)
                        .then(res => res.json())
                        .then(data => {
                          if (data.success) {
                            setSelectedAlbum(data.data);
                          }
                        });
                    }
                    fetchAlbums();
                  }}
                />
              )}
            </TabsContent>

            {/* Media Tab - uses existing MediaManager component */}
            <TabsContent value="media" className="pt-4">
              {selectedAlbum && (
                <MediaManager 
                  albumId={selectedAlbum.id}
                  albumTitle={selectedAlbum.title}
                  onMediaChange={() => {
                    // Refresh the selected album data
                    if (selectedAlbum) {
                      fetch(`/api/music/albums?id=${selectedAlbum.id}&includeMedia=true`)
                        .then(res => res.json())
                        .then(data => {
                          if (data.success) {
                            setSelectedAlbum(data.data);
                          }
                        });
                    }
                    fetchAlbums();
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingAlbum} onOpenChange={(open) => !open && setEditingAlbum(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Album</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label>Artist *</Label>
              <Input
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label>Cover Art URL</Label>
              <Input
                value={formData.coverArt}
                onChange={(e) => setFormData({ ...formData, coverArt: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label>Release Year</Label>
              <Input
                type="number"
                value={formData.releaseYear}
                onChange={(e) => setFormData({ ...formData, releaseYear: parseInt(e.target.value) || new Date().getFullYear() })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                disabled={isSubmitting}
              />
              <Label>Make public</Label>
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