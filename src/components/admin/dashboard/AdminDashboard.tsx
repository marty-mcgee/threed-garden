// components/admin/dashboard/AdminDashboard.tsx
'use client';

import { useRouter } from 'next/navigation';
import {
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DashboardData {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    createdAt: Date | null;
  };
  stats: {
    projects: number;
    modules: {
      total: number;
      threed: number;
      traffic: number;
      music: number;
    };
    projectModules: {
      total: number;
      threed: number;
      traffic: number;
      music: number;
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
  }>;
}

interface AdminDashboardProps {
  data: DashboardData;
}

export function AdminDashboard({ data }: AdminDashboardProps) {
  const router = useRouter();

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
      case 'music':
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
      case 'music':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6 p-0">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {data.user.name || 'User'}!
          </p>
        </div>
        <div className="flex items-center gap-2">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.projects}</div>
            <p className="text-xs text-muted-foreground">
              {data.stats.projectModules.total} modules assigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <Layers className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.modules.total}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-green-500">●</span> {data.stats.modules.threed} ThreeD
              <span className="text-blue-500 ml-2">●</span> {data.stats.modules.traffic} Traffic
              <span className="text-purple-500 ml-2">●</span> {data.stats.modules.music} Music
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Layers className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.assets.total}</div>
            <p className="text-xs text-muted-foreground">
              {data.stats.assets.byModuleType.length} asset types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Module Distribution</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
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
                <span className="text-sm font-medium">{data.stats.projectModules.music}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.stats.projectModules.total} total modules in projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Create new projects or modules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push('/admin/projects')}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Create New Project
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => router.push('/admin/threed')}
              >
                <Box className="w-4 h-4 mr-2 text-green-500" />
                ThreeD
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => router.push('/admin/traffic')}
              >
                <Car className="w-4 h-4 mr-2 text-blue-500" />
                Traffic
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => router.push('/admin/music')}
              >
                <Music className="w-4 h-4 mr-2 text-purple-500" />
                Music
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Module Overview</CardTitle>
            <CardDescription>Your modules across all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-green-500" />
                  <span className="text-sm">ThreeD Modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{data.stats.modules.threed}</Badge>
                  <span className="text-xs text-muted-foreground">
                    in {data.stats.projectModules.threed} projects
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
                    in {data.stats.projectModules.traffic} projects
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Music Modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{data.stats.modules.music}</Badge>
                  <span className="text-xs text-muted-foreground">
                    in {data.stats.projectModules.music} projects
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Projects</CardTitle>
              <CardDescription>Your most recently created projects</CardDescription>
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
                onClick={() => router.push('/admin/projects')}
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
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentProjects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/admin/projects/${project.id}`)}
                  >
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {project.description || '—'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {formatDate(project.createdAt)}
                    </TableCell>
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