// app/dashboard/page.tsx — v0.14.0 "Surface Bridge"
// Dashboard Homepage: Project Discovery Hub for the Dual-Surface Platform
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FolderOpen, Map, Music, Box, Car, Loader2, ExternalLink,
  BarChart3, Layers, Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardProject {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  isPublic: boolean;
  assetCount: number;
  modules: {
    music: number;
    threed: number;
    traffic: number;
  };
}

export default function DashboardHomePage() {
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('/api/map/projects');
        const data = await response.json();
        if (data.projects && Array.isArray(data.projects)) {
          const enriched = data.projects.map((p: any) => ({
            id: p.id,
            name: p.name || 'Untitled',
            slug: p.slug || `project-${p.id}`,
            description: p.description || null,
            isActive: p.isActive ?? true,
            isPublic: p.isPublic ?? false,
            assetCount: p.assetCount || 0,
            modules: {
              music: p.moduleCounts?.music || 0,
              threed: p.moduleCounts?.threed || 0,
              traffic: p.moduleCounts?.traffic || 0,
            },
          }));
          setProjects(enriched);
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardHeroSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <Skeleton className="h-5 w-2/3 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Discover Projects</h1>
            <p className="text-sm text-muted-foreground">
              Explore public projects with real-time data, 3D scenes, and music
            </p>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold mb-2">No Projects Yet</h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Projects group your Music, ThreeD Garden, and Traffic modules together. 
              Create your first project to get started.
            </p>
            <Button asChild>
              <Link href="/admin/projects/new">Create Your First Project</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Project Grid */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="group hover:shadow-md transition-shadow border-muted/60 hover:border-primary/30"
            >
              <CardContent className="p-5">
                {/* Project Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base truncate">{project.name}</h3>
                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {project.description}
                      </p>
                    )}
                  </div>
                  {project.isPublic ? (
                    <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">Public</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] shrink-0 ml-2">Private</Badge>
                  )}
                </div>

                {/* Module Pills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {project.modules.music > 0 && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Music className="w-3 h-3" />
                      Music
                    </Badge>
                  )}
                  {project.modules.threed > 0 && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Box className="w-3 h-3" />
                      ThreeD
                    </Badge>
                  )}
                  {project.modules.traffic > 0 && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Car className="w-3 h-3" />
                      Traffic
                    </Badge>
                  )}
                  {project.assetCount === 0 && (
                    <span className="text-[10px] text-muted-foreground italic">No modules yet</span>
                  )}
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {project.assetCount} asset{project.assetCount !== 1 ? 's' : ''}
                  </span>
                  {project.slug && (
                    <span className="truncate">/{project.slug}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button asChild size="sm" className="flex-1 h-8 text-xs">
                    <Link href={`/dashboard/map?projectId=${project.id}`}>
                      <Map className="w-3.5 h-3.5 mr-1" />
                      View Map
                    </Link>
                  </Button>
                  {project.modules.music > 0 && (
                    <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                      <Link href={`/dashboard/music`}>
                        <Music className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Links Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickLinkCard
          icon={Map}
          title="Unified Map"
          description="View 2D maps and 3D scenes with runtime markers"
          href="/dashboard/map"
          color="text-emerald-500"
          bgColor="bg-emerald-500/10"
        />
        <QuickLinkCard
          icon={Music}
          title="Music Library"
          description="Browse albums and listen to tracks"
          href="/dashboard/music"
          color="text-violet-500"
          bgColor="bg-violet-500/10"
        />
        <QuickLinkCard
          icon={Car}
          title="Traffic Monitor"
          description="Real-time traffic incidents and closures"
          href="/dashboard/traffic"
          color="text-orange-500"
          bgColor="bg-orange-500/10"
        />
      </div>
    </div>
  );
}

function QuickLinkCard({ 
  icon: Icon, 
  title, 
  description, 
  href, 
  color, 
  bgColor 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  href: string;
  color: string;
  bgColor: string;
}) {
  return (
    <Link href={href}>
      <Card className="group hover:shadow-md transition-all cursor-pointer border-muted/60 hover:border-primary/30 h-full">
        <CardContent className="p-4 flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <h3 className="font-medium text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 ml-auto mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </CardContent>
      </Card>
    </Link>
  );
}

function DashboardHeroSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-3 mb-2">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div>
          <Skeleton className="h-7 w-48 mb-1" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
    </div>
  );
}