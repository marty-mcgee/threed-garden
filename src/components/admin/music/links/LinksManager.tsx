// components/admin/music/links/LinksManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  Music,
  ShoppingBag,
  Youtube,
  Instagram,
  Twitter,
  Link as LinkIcon,
  Edit,
  Trash2,
  Globe,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { LinkForm } from './LinkForm';
import { MusicLink, MusicLinkType, MusicLinkStatus } from '@/lib/types/music';

interface LinksManagerProps {
  albumId?: number;
  trackId?: number;
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

export function LinksManager({ albumId, trackId, onLinkAdded }: LinksManagerProps) {
  const { showToast, ToastComponent } = useToast();
  const [links, setLinks] = useState<MusicLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, [albumId, trackId]);

  const fetchLinks = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (albumId) params.append('albumId', albumId.toString());
    if (trackId) params.append('trackId', trackId.toString());
    
    try {
      const response = await fetch(`/api/music/links?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLinks(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching links:', error);
      showToast('Failed to load links', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    
    try {
      const response = await fetch(`/api/music/links?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        showToast('Link deleted', 'success');
        fetchLinks();
        if (onLinkAdded) onLinkAdded();
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      showToast('Failed to delete link', 'error');
    }
  };

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ToastComponent}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium">Connected Links</h3>
          <p className="text-xs text-muted-foreground">
            {links.length} link{links.length !== 1 ? 's' : ''} associated
          </p>
        </div>
        <LinkForm
          albumId={albumId}
          trackId={trackId}
          onSuccess={() => {
            fetchLinks();
            if (onLinkAdded) onLinkAdded();
          }}
        />
      </div>

      {links.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 rounded-full bg-muted">
                <LinkIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No links added yet</p>
              <p className="text-xs text-muted-foreground">
                Add links to your music, social media, or other online presence
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {links.map((link) => {
            const config = linkTypeConfig[link.type as keyof typeof linkTypeConfig];
            const Icon = config?.icon || LinkIcon;
            
            return (
              <Card
                key={link.id}
                className="group relative overflow-hidden transition-all duration-200 hover:shadow-sm"
              >
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-200",
                  config?.gradient || "from-gray-500 to-gray-600",
                  "group-hover:opacity-5"
                )} />
                
                <CardContent className="p-3 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={cn(
                        "p-1.5 rounded-lg bg-gradient-to-br flex-shrink-0",
                        config?.gradient || "from-gray-500 to-gray-600"
                      )}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">{link.title}</span>
                          <Badge variant={config?.color as any || 'default'} className="text-[10px]">
                            {config?.label || 'Link'}
                          </Badge>
                          {link.status === MusicLinkStatus.ACTIVE && (
                            <Badge variant="outline" className="text-[10px] gap-0.5">
                              <Sparkles className="h-2.5 w-2.5" />
                              Active
                            </Badge>
                          )}
                        </div>
                        {link.description && (
                          <p className="text-xs text-muted-foreground truncate">{link.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs gap-1"
                            onClick={() => handleOpenLink(link.url)}
                          >
                            <ExternalLink className="h-3 w-3" />
                            Visit
                          </Button>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {link.url}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-0.5 flex-shrink-0 ml-2">
                      <LinkForm
                        albumId={albumId}
                        trackId={trackId}
                        existingLink={link}
                        onSuccess={() => {
                          fetchLinks();
                          if (onLinkAdded) onLinkAdded();
                        }}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(link.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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