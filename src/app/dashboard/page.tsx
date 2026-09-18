// app/dashboard/page.tsx — v0.14.0 "Surface Bridge"
// Dashboard Homepage: Project Discovery Hub for the Dual-Surface Platform
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FolderOpen, Map, Music, Box, Car, Loader2, ChevronRight, Search,
  BarChart3, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { readDashboardProjectPage, mergeDashboardProjects, filterDashboardProjects, type DashboardProject } from '@/lib/services/dashboard/project-discovery';

export default function DashboardHomePage() {
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [offset, setOffset] = useState(0);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [module, setModule] = useState<'all' | keyof DashboardProject['modules']>('all');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const loadProjects = async () => {
      try {
        const response = await fetch(`/api/map/projects?limit=24&offset=${offset}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Project request failed');
        const page = readDashboardProjectPage(await response.json(), offset);
        if (controller.signal.aborted) return;
        setProjects(current => offset === 0 ? page.projects : mergeDashboardProjects(current, page.projects));
        setNextOffset(page.nextOffset);
        setHasMore(page.hasMore);
      } catch {
        if (!controller.signal.aborted) setError(offset === 0 ? 'Projects could not be loaded. Please retry.' : 'More Projects could not be loaded. Your loaded Projects are still available.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void loadProjects();
    return () => controller.abort();
  }, [offset, requestVersion]);

  const matchingProjects = filterDashboardProjects(projects, search, module);
  const touchControl = 'h-8 text-xs [@media(pointer:coarse)]:min-h-11';

  if (loading && projects.length === 0) {
    return (
      <div className="space-y-4 p-1" role="status" aria-label="Loading Projects">
        <DashboardHeroSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse motion-reduce:animate-none">
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
    <div className="space-y-4 p-1">
      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-center">
            <p role="alert" className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className={`mt-2 ${touchControl}`} onClick={() => setRequestVersion(value => value + 1)}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && projects.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
            <h2 className="text-lg font-semibold mb-2">No Projects Available</h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Projects group your Music, ThreeD Garden, and Traffic modules together. 
              Create a Project in Admin, or return here when a Project is available to you.
            </p>
            <Button asChild>
              <Link href="/admin/projects/new">Create Project</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {projects.length > 0 && (
        <section aria-label="Find Projects" className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Filter loaded Projects by module" value={module} onChange={event => setModule(event.target.value as typeof module)} className="h-8 rounded-md border bg-background px-2 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring [@media(pointer:coarse)]:min-h-11">
              <option value="all">All Modules</option><option value="threed">ThreeD</option><option value="music">Music</option><option value="traffic">Traffic</option>
            </select>
            <div className="relative min-w-0 flex-1 basis-48">
              <Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input aria-label="Search loaded Projects" placeholder="Search loaded Projects…" value={search} onChange={event => setSearch(event.target.value)} className="h-8 w-full rounded-md border bg-background pl-8 pr-2 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring [@media(pointer:coarse)]:min-h-11" />
            </div>
            {(search || module !== 'all') && <Button variant="ghost" size="sm" className={touchControl} onClick={() => { setSearch(''); setModule('all'); }}>Clear Filters</Button>}
          </div>
          {matchingProjects.length === 0 && <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No loaded Projects match these filters.</p>}
        </section>
      )}

      {/* Quick Links Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickLinkCard
          icon={Map}
          title="ThreeD Scenes"
          description="View 2D maps and 3D scenes with runtime markers"
          href="/dashboard/map"
          color="text-emerald-500"
          bgColor="bg-emerald-500/10"
        />
        <QuickLinkCard
          icon={Music}
          title="Multimedia Library"
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

      {/* Project Grid */}
      {matchingProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matchingProjects.map((project) => (
            <Card 
              key={project.id} 
              className="group hover:shadow-md transition-shadow border-muted/60 hover:border-primary/30"
            >
              <CardContent className="flex h-full flex-col p-3">
                {/* Project Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm break-words">{project.name}</h3>
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
                  {project.assetCount === 0 && project.sceneAssetCount === 0 && (
                    <span className="text-[10px] text-muted-foreground italic">No assets yet</span>
                  )}
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {project.sceneAssetCount > 0 ? `${project.sceneAssetCount} Scene asset${project.sceneAssetCount !== 1 ? 's' : ''}` : `${project.assetCount} assignment${project.assetCount !== 1 ? 's' : ''}`}
                  </span>
                  {project.sceneAssetCount > 0 && project.assetCount > 0 && <span>{project.assetCount} assignment{project.assetCount !== 1 ? 's' : ''}</span>}
                  {project.slug && (
                    <span className="truncate">/{project.slug}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-auto flex gap-2">
                  <Button asChild variant="outline" size="sm" className={`flex-1 bg-transparent text-foreground shadow-none dark:bg-transparent ${touchControl}`}>
                    <Link href={`/dashboard/map?projectId=${project.id}`} aria-label={`Open Project: ${project.name}`}>
                      <Map className="w-3.5 h-3.5 mr-1" />
                      Open Project
                    </Link>
                  </Button>
                  {project.modules.music > 0 && (
                    <Button asChild variant="outline" size="sm" className={touchControl}>
                      <Link href="/dashboard/music" aria-label="Open Music Library" title="Music Library">
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

      {projects.length > 0 && (hasMore || loading) && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" className={touchControl} disabled={loading || Boolean(error)} onClick={() => setOffset(nextOffset)}>
            {loading && <Loader2 aria-hidden="true" className="mr-1.5 h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />}
            {loading ? 'Loading Projects…' : 'Load More Projects'}
          </Button>
        </div>
      )}


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
    <Link href={href} className="block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
      <Card className="group hover:shadow-md transition-all cursor-pointer border-muted/60 hover:border-primary/30 h-full">
        <CardContent className="p-4 flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform motion-reduce:transform-none motion-reduce:transition-none`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <h3 className="font-medium text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
          <ChevronRight aria-hidden="true" className="w-3.5 h-3.5 text-muted-foreground/40 ml-auto mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </CardContent>
      </Card>
    </Link>
  );
}

function DashboardHeroSkeleton() {
  return (
    <div className="animate-pulse motion-reduce:animate-none">
      <div className="flex items-center gap-3 mb-2">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div>
          <Skeleton className="h-7 w-48 mb-1" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      </div>
    </div>
  );
}
