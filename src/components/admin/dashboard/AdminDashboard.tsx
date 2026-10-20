// components/admin/dashboard/AdminDashboard.tsx
'use client';

import { useState, type ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CircleHelp,
  ArrowUpDown,
  Package,
  Plus,
  FolderOpen,
  Box,
  Car,
  Music,
  Layers,
  ArrowRight,
  Users,
  Calendar,
  Activity,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DashboardData {
  review?: {
    models: { withoutTextureAssignments: number; withoutTopView: number; withoutThumbnail: number };
    characters: { withoutModel: number; withoutLibraryAnimations: number };
    projects: { withActiveScenarios: number; withActiveSimulations: number; withUnfinalizedRuns: number };
  };
  user: {
    id: string;
    name: string | null;
    email: string | null;
    createdAt: Date | null;
  };
  stats: {
    models: number;
    characters: number;
    projects: number;
    modules: {
      total: number;
      threed: number;
      traffic: number;
      multimedia: number;
    };
    projectModules: {
      total: number;
      threed: number;
      traffic: number;
      multimedia: number;
    };
    assets: {
      total: number;
      byModuleType: Array<{ moduleType: string; count: number }>;
    };
  };
  recentProjects: Array<{
    id: number;
    name: string;
    description: string | null;
    slug: string;
    isActive: boolean;
    isPublic: boolean;
    createdAt: Date | null;
    updatedAt: Date | null;
  }>;
}

interface AdminDashboardProps {
  data: DashboardData;
}

function OverviewHelp({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <TooltipProvider delayDuration={200}><Tooltip open={open} onOpenChange={setOpen}><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="threed-field-help h-6 w-6 shrink-0 text-muted-foreground" aria-label={label + ' help'} onClick={() => setOpen(value => !value)}><CircleHelp aria-hidden="true" className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent className="font-normal leading-relaxed">{children}</TooltipContent></Tooltip></TooltipProvider>;
}

export function AdminDashboard({ data }: AdminDashboardProps) {
  const router = useRouter();
  const [updatedSort, setUpdatedSort] = useState<'asc' | 'desc' | null>(null);
  const recentProjects = [...data.recentProjects];
  if (updatedSort) recentProjects.sort((a, b) => {
    const left = a.updatedAt ? new Date(a.updatedAt).getTime() : NaN;
    const right = b.updatedAt ? new Date(b.updatedAt).getTime() : NaN;
    if (!Number.isFinite(left)) return Number.isFinite(right) ? 1 : a.id - b.id;
    if (!Number.isFinite(right)) return -1;
    return (updatedSort === 'desc' ? right - left : left - right) || a.id - b.id;
  });

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'threed':
        return <Box className="w-4 h-4" />;
      case 'traffic':
        return <Car className="w-4 h-4" />;
      case 'multimedia':
        return <Music className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  const getModuleColor = (type: string) => {
    switch (type) {
      case 'threed':
        return 'text-green-500';
      case 'traffic':
        return 'text-blue-500';
      case 'multimedia':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="min-w-0 space-y-4">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">
            Welcome back, {data.user.name || 'User'}!
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {data.user.email}
          </Badge>
          {data.user.createdAt && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Joined {formatDate(data.user.createdAt)}
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <Card className="min-w-0 gap-3 overflow-hidden rounded-xl">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg"><FolderOpen aria-hidden="true" className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.projects}</div>
            <p className="text-xs text-muted-foreground">
              {data.stats.projectModules.total} modules assigned
            </p>
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-3 overflow-hidden rounded-xl">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg"><Layers aria-hidden="true" className="size-5 shrink-0 text-cyan-600 dark:text-cyan-400" />Total Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.modules.total}</div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="text-green-500">●</span> {data.stats.modules.threed} ThreeD
              <span className="text-blue-500 ml-2">●</span> {data.stats.modules.traffic} Traffic
              <span className="text-purple-500 ml-2">●</span> {data.stats.modules.multimedia} Multimedia
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-3 overflow-hidden rounded-xl">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg"><Package aria-hidden="true" className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.assets.total}</div>
            <p className="text-xs text-muted-foreground">
              {data.stats.assets.byModuleType.length} asset types
            </p>
          </CardContent>
        </Card>

        <Card className="min-w-0 gap-3 overflow-hidden rounded-xl">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg"><BarChart3 aria-hidden="true" className="size-5 shrink-0 text-violet-600 dark:text-violet-400" />Module Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium">{data.stats.projectModules.threed}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm font-medium">{data.stats.projectModules.traffic}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-sm font-medium">{data.stats.projectModules.multimedia}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.stats.projectModules.total} total modules in projects
            </p>
          </CardContent>
        </Card>
        <Card className="min-w-0 gap-3 overflow-hidden rounded-xl"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg"><Box aria-hidden="true" className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />Total Models</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.stats.models}</div></CardContent></Card>
        <Card className="min-w-0 gap-3 overflow-hidden rounded-xl"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-lg"><Users aria-hidden="true" className="size-5 shrink-0 text-violet-600 dark:text-violet-400" />Total Characters</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.stats.characters}</div></CardContent></Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Actions Card */}
        <Card className="min-w-0 gap-3 overflow-hidden rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Activity aria-hidden="true" className="size-5 text-emerald-600 dark:text-emerald-400" />Quick Actions<OverviewHelp label="Quick Actions">Manage your Projects and modules</OverviewHelp></CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="min-h-12 w-full justify-start gap-2 rounded-lg border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-sm font-medium hover:bg-emerald-500/10 dark:border-emerald-500/25 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10"
              variant="outline"
              onClick={() => router.push('/admin/projects/new')}
            >
              <FolderOpen aria-hidden="true" className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              Create a New Project
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button
                variant="outline"
                className="h-auto min-h-11 justify-start whitespace-normal rounded-lg"
                onClick={() => router.push('/admin/threed')}
              >
                <Box className="w-4 h-4 mr-2 text-green-500" />
                ThreeD
              </Button>
              <Button
                variant="outline"
                className="h-auto min-h-11 justify-start whitespace-normal rounded-lg"
                onClick={() => router.push('/admin/traffic')}
              >
                <Car className="w-4 h-4 mr-2 text-blue-500" />
                Traffic
              </Button>
              <Button
                variant="outline"
                className="h-auto min-h-11 justify-start whitespace-normal rounded-lg"
                onClick={() => router.push('/admin/multimedia')}
              >
                <Music className="w-4 h-4 mr-2 text-purple-500" />
                Multimedia
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card className="min-w-0 gap-3 overflow-hidden rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Layers aria-hidden="true" className="size-5 text-violet-600 dark:text-violet-400" />Module Overview<OverviewHelp label="Module Overview">Your modules across all projects</OverviewHelp></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-green-500" />
                  <span className="text-sm">ThreeD Modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{data.stats.modules.threed}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {data.stats.projectModules.threed} assignments
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Traffic Modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{data.stats.modules.traffic}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {data.stats.projectModules.traffic} assignments
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Multimedia Modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{data.stats.modules.multimedia}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {data.stats.projectModules.multimedia} assignments
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {data.review && <section aria-labelledby="review-title" className="space-y-3">
        <h2 id="review-title" className="flex items-center gap-2 text-lg font-semibold"><Activity aria-hidden="true" className="size-5 text-amber-600 dark:text-amber-400" />Setup review and Project activity<OverviewHelp label="Setup review and Project activity">Your saved records at page load. Counts identify records to review; links open their management pages.</OverviewHelp></h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { title: 'Projects', Icon: FolderOpen, iconColor: 'text-cyan-600 dark:text-cyan-400', note: 'Active means available. Unfinalized runs are saved as running and may be interrupted; this is not live execution status.', rows: [
              { label: 'With active Scenarios', count: data.review.projects.withActiveScenarios, href: '/admin/threed/scenarios' },
              { label: 'With active Simulations', count: data.review.projects.withActiveSimulations, href: '/admin/threed/simulations' },
              { label: 'With unfinalized Simulation runs', count: data.review.projects.withUnfinalizedRuns, href: '/admin/threed/simulation-results' }] },
            { title: 'Characters', createHref: '/admin/threed/characters/new', Icon: Users, iconColor: 'text-violet-600 dark:text-violet-400', note: 'Animation tally includes Model inheritance and Character overrides. Embedded or legacy animations may still work.', rows: [
              { label: 'Missing a linked Model', count: data.review.characters.withoutModel, href: '/admin/threed/characters' },
              { label: 'Missing active Library Animation assignments', count: data.review.characters.withoutLibraryAnimations, href: '/admin/threed/characters' }] },
            { title: 'Models', Icon: Box, iconColor: 'text-emerald-600 dark:text-emerald-400', note: 'No assignment does not mean broken: embedded textures, attached Files and material colors may be valid.', rows: [
              { label: 'Missing Texture assignments', count: data.review.models.withoutTextureAssignments, href: '/admin/threed/models' },
              { label: 'Missing Image Top View', count: data.review.models.withoutTopView, href: '/admin/threed/models' },
              { label: 'Missing a thumbnail', count: data.review.models.withoutThumbnail, href: '/admin/threed/models' }] },
          ].map(group => <Card key={group.title} className="min-w-0 gap-3 rounded-xl"><CardHeader className="pb-0"><CardTitle className="flex items-center gap-2 text-base"><group.Icon aria-hidden="true" className={`size-5 shrink-0 ${group.iconColor}`} />{group.title}<OverviewHelp label={group.title}>{group.note}</OverviewHelp></CardTitle></CardHeader><CardContent className="space-y-3">{group.createHref && <Link href={group.createHref} className="flex min-h-12 items-center gap-2 rounded-lg border border-violet-500/25 bg-violet-500/5 px-3 py-2 text-sm font-medium hover:bg-violet-500/10 focus-visible:outline-2 focus-visible:outline-ring"><Plus aria-hidden="true" className="size-4 shrink-0 text-violet-600 dark:text-violet-400" />Create a New Character<ArrowRight aria-hidden="true" className="ml-auto size-4 shrink-0" /></Link>}<div className="space-y-2">{group.rows.map(row => <Link key={row.label} href={row.href} className="flex min-h-12 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"><span>{row.label}</span><Badge variant="secondary">{row.count}</Badge></Link>)}</div></CardContent></Card>)}
        </div>
      </section>}

      {/* Recent Projects */}
      <Card className="min-w-0 gap-3 overflow-hidden rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg"><FolderOpen aria-hidden="true" className="size-5 text-cyan-600 dark:text-cyan-400" />Recent Projects<OverviewHelp label="Recent Projects">Your five most recently created Projects. Updated sorts these displayed Projects by their last update; it does not change which five are loaded.</OverviewHelp></CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/projects')}
            >
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.recentProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">No projects yet</p>
              <p className="text-xs">Create your first project to get started</p>
              <Button
                className="mt-4"
                size="sm"
                onClick={() => router.push('/admin/projects/new')}
              >
                Create Project
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="hidden sm:table-cell">Created</TableHead>
                  <TableHead aria-sort={updatedSort === null ? 'none' : updatedSort === 'desc' ? 'descending' : 'ascending'}><button type="button" className="inline-flex min-h-9 items-center gap-1 rounded-sm font-medium focus-visible:outline-2 focus-visible:outline-ring" aria-label={updatedSort === 'desc' ? 'Sort Updated oldest first' : 'Sort Updated newest first'} onClick={() => setUpdatedSort(current => current === 'desc' ? 'asc' : 'desc')}>Updated<ArrowUpDown aria-hidden="true" className="size-3.5" /></button></TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentProjects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="hover:bg-muted/50"
                  >
                    <TableCell className="font-medium"><Link href={`/admin/projects/${project.id}`} className="block rounded-sm py-2 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">{project.name}</Link></TableCell>
                    <TableCell className="hidden md:table-cell">
                      {project.description || '—'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {formatDate(project.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(project.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {project.isPublic && (
                          <Badge variant="outline" className="text-[10px]">
                            Public
                          </Badge>
                        )}
                        <Badge
                          variant={project.isActive ? 'default' : 'secondary'}
                          className="text-[10px]"
                        >
                          {project.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
