'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, ExternalLink, Music, ShoppingBag, Youtube, Instagram, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface Album {
  id: number;
  title: string;
  artist: string;
}

interface Link {
  id: number;
  title: string;
  url: string;
  type: string;
  icon: string | null;
  description: string | null;
  status: string;
  displayOrder: number;
  musicAlbumLinks?: Array<{
    albumId: number | null;
    trackId: number | null;
    album?: Album;
  }>;
}

export default function LinksManagementPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    type: 'external',
    description: '',
    displayOrder: '0',
    associationType: 'independent', // 'independent', 'album', 'track'
    albumId: '',
    trackId: '',
  });

  useEffect(() => {
    fetchLinks();
    fetchAlbums();
  }, []);

  const fetchLinks = async () => {
    const response = await fetch('/api/music/links');
    if (response.ok) {
      const data = await response.json();
      setLinks(data);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const body: any = {
      title: formData.title,
      url: formData.url,
      type: formData.type,
      description: formData.description || null,
      displayOrder: parseInt(formData.displayOrder),
    };

    // Add association based on selection
    if (formData.associationType === 'album' && formData.albumId) {
      body.albumId = parseInt(formData.albumId);
    } else if (formData.associationType === 'track' && formData.trackId) {
      body.trackId = parseInt(formData.trackId);
    }

    const url = '/api/music/links';
    const method = editingLink ? 'PUT' : 'POST';
    
    if (editingLink) {
      body.id = editingLink.id;
    }

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      toast.success(editingLink ? 'Link updated' : 'Link created');
      setIsDialogOpen(false);
      fetchLinks();
      resetForm();
    } else {
      toast.error('Failed to save link');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this link?')) return;
    
    const response = await fetch(`/api/music/links?id=${id}`, { method: 'DELETE' });
    if (response.ok) {
      toast.success('Link deleted');
      fetchLinks();
    } else {
      toast.error('Failed to delete link');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      url: '',
      type: 'external',
      description: '',
      displayOrder: '0',
      associationType: 'independent',
      albumId: '',
      trackId: '',
    });
    setEditingLink(null);
  };

  const openEdit = (link: Link) => {
    // Determine association type
    let associationType = 'independent';
    let albumId = '';
    let trackId = '';
    
    if (link.musicAlbumLinks && link.musicAlbumLinks.length > 0) {
      const association = link.musicAlbumLinks[0];
      if (association.albumId) {
        associationType = 'album';
        albumId = association.albumId.toString();
      } else if (association.trackId) {
        associationType = 'track';
        trackId = association.trackId.toString();
      }
    }
    
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      type: link.type,
      description: link.description || '',
      displayOrder: link.displayOrder.toString(),
      associationType,
      albumId,
      trackId,
    });
    setIsDialogOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stream': return <Music className="h-4 w-4" />;
      case 'buy': return <ShoppingBag className="h-4 w-4" />;
      case 'video': return <Youtube className="h-4 w-4" />;
      case 'social': return <Instagram className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getAssociationLabel = (link: Link) => {
    if (link.musicAlbumLinks && link.musicAlbumLinks.length > 0) {
      const association = link.musicAlbumLinks[0];
      if (association.albumId && association.album) {
        return `Album: ${association.album.title}`;
      } else if (association.trackId) {
        return `Track ID: ${association.trackId}`;
      }
    }
    return 'Independent';
  };

  if (loading) {
    return <div className="text-center py-12">Loading links...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Links</h1>
          <p className="text-muted-foreground mt-1">
            Manage links for albums, tracks, or independent use
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingLink ? 'Edit Link' : 'Add New Link'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Listen on Spotify"
                  required
                />
              </div>
              <div>
                <Label>URL *</Label>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="external">External Link</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="buy">Buy Music</SelectItem>
                    <SelectItem value="stream">Streaming</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Association</Label>
                <Select
                  value={formData.associationType}
                  onValueChange={(value) => setFormData({ ...formData, associationType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="independent">Independent (appears in Links tab)</SelectItem>
                    <SelectItem value="album">Associated with Album</SelectItem>
                    <SelectItem value="track">Associated with Track</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.associationType === 'album' && (
                <div>
                  <Label>Select Album</Label>
                  <Select
                    value={formData.albumId}
                    onValueChange={(value) => setFormData({ ...formData, albumId: value })}
                  >
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
                <Label>Description (optional)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this link"
                />
              </div>
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingLink ? 'Update' : 'Create'}</Button>
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
          <CardTitle>All Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-2xl">{getTypeIcon(link.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{link.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700">
                        {link.type}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {getAssociationLabel(link)}
                      </span>
                      {link.status === 'active' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          Active
                        </span>
                      )}
                    </div>
                    {link.description && (
                      <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline truncate"
                      >
                        {link.url}
                      </a>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Order: {link.displayOrder}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(link)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(link.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {links.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No links yet. Click "Add Link" to create your first link.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}