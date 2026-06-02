'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ExternalLink,
  Music,
  ShoppingBag,
  Youtube,
  Instagram,
  Twitter,
  Link as LinkIcon,
  Plus,
  Edit,
  Trash2,
  Globe,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MusicLinkType, MusicLinkStatus } from '@/lib/types/music';

interface Link {
  id: number;
  title: string;
  url: string;
  type: MusicLinkType;
  icon: string | null;
  description: string | null;
  status: MusicLinkStatus;
  displayOrder: number;
}

interface LinksManagerProps {
  albumId?: number;
  trackId?: number;
  isIndependent?: boolean;
  onLinkAdded?: () => void;
}

const linkTypeConfig = {
  [MusicLinkType.EXTERNAL]: {
    icon: Globe,
    color: 'default',
    label: 'External Link',
    gradient: 'from-gray-500 to-gray-600',
  },
  [MusicLinkType.SOCIAL]: {
    icon: Instagram,
    color: 'secondary',
    label: 'Social Media',
    gradient: 'from-purple-500 to-pink-500',
  },
  [MusicLinkType.BUY]: {
    icon: ShoppingBag,
    color: 'success',
    label: 'Buy Music',
    gradient: 'from-green-500 to-emerald-500',
  },
  [MusicLinkType.STREAM]: {
    icon: Music,
    color: 'primary',
    label: 'Streaming',
    gradient: 'from-blue-500 to-cyan-500',
  },
  [MusicLinkType.VIDEO]: {
    icon: Youtube,
    color: 'destructive',
    label: 'Video',
    gradient: 'from-red-500 to-orange-500',
  },
};

export function LinksManager({ albumId, trackId, isIndependent, onLinkAdded }: LinksManagerProps) {
  const [links, setLinks] = useState<Link[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    type: MusicLinkType.EXTERNAL,
    description: '',
  });

  useEffect(() => {
    fetchLinks();
  }, [albumId, trackId, isIndependent]);

  const fetchLinks = async () => {
    const params = new URLSearchParams();
    if (albumId) params.append('albumId', albumId.toString());
    if (trackId) params.append('trackId', trackId.toString());
    if (isIndependent) params.append('independent', 'true');
    
    const response = await fetch(`/api/music/links?${params.toString()}`);
    if (response.ok) {
      const data = await response.json();
      setLinks(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const url = '/api/music/links';
    const method = editingLink ? 'PUT' : 'POST';
    const body = editingLink
      ? { ...editingLink, ...formData }
      : { ...formData, albumId, trackId, isIndependent };
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (response.ok) {
      setIsDialogOpen(false);
      setEditingLink(null);
      setFormData({ title: '', url: '', type: MusicLinkType.EXTERNAL, description: '' });
      fetchLinks();
      onLinkAdded?.();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this link?')) {
      const response = await fetch(`/api/music/links?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchLinks();
      }
    }
  };

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Connected Links</h3>
          <p className="text-sm text-muted-foreground">
            Manage your music links and social presence
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLink ? 'Edit Link' : 'Add New Link'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Listen on Spotify"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
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
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(linkTypeConfig).map(([type, config]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this link..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Save Link</Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {links.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-muted">
                <LinkIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground mb-2">No links added yet</p>
                <p className="text-sm text-muted-foreground">
                  Add links to your music, social media, or other online presence
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {links.map((link) => {
            const config = linkTypeConfig[link.type];
            const Icon = config.icon;
            
            return (
              <Card
                key={link.id}
                className="group relative overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                {/* Gradient Background */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-300",
                  config.gradient,
                  "group-hover:opacity-5"
                )} />
                
                <CardContent className="p-4 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={cn(
                        "p-2 rounded-lg bg-gradient-to-br",
                        config.gradient
                      )}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{link.title}</h4>
                          <Badge variant={config.color as any} className="text-xs">
                            {config.label}
                          </Badge>
                          {link.status === MusicLinkStatus.ACTIVE && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Sparkles className="h-3 w-3" />
                              Active
                            </Badge>
                          )}
                        </div>
                        {link.description && (
                          <p className="text-sm text-muted-foreground mb-2">{link.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-2"
                            onClick={() => handleOpenLink(link.url)}
                          >
                            <ExternalLink className="h-3 w-3" />
                            Visit Link
                          </Button>
                          <span className="text-xs text-muted-foreground truncate">
                            {link.url}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingLink(link);
                          setFormData({
                            title: link.title,
                            url: link.url,
                            type: link.type,
                            description: link.description || '',
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(link.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}