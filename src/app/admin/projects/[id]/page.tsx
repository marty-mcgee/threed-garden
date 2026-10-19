// app/admin/projects/[id]/page.tsx - Updated with Create tabs and session storage

'use client';

import { ProjectWeatherSettings } from '@/components/admin/projects/ProjectWeatherSettings';
import { ProjectConfigurations } from '@/components/admin/projects/ProjectConfigurations';
import { ProjectDetailsFields } from '@/components/admin/projects/ProjectDetailsFields';
import type { ProjectConfigurationRequest } from '@/libraries/services/project/configuration';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  CircleHelp, Plus, Box, Car, Music, Trash2, X, Loader2,
  CheckCircle, XCircle, MoreHorizontal, ChevronDown, ChevronRight,
  FolderOpen, Layers, Sprout, Package, User, AlertTriangle, Music2,
  Image, Link2, FileText, Route, Flame, Radio, MapPin
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// ✅ Import all CRUD Components
import { MultimediaAlbumCRUD } from '@/components/admin/multimedia/albums/MultimediaAlbumCRUD';
import { MultimediaTracksCRUD } from '@/components/admin/multimedia/tracks/MultimediaTracksCRUD';
import { MultimediaMediaCRUD } from '@/components/admin/multimedia/media/MultimediaMediaCRUD';
import { MultimediaLinksCRUD } from '@/components/admin/multimedia/links/MultimediaLinksCRUD';

import { ThreeDPlantsCRUD } from '@/components/admin/threed/plants/ThreeDPlantsCRUD';
import { ThreeDPlantingsCRUD } from '@/components/admin/threed/plantings/ThreeDPlantingsCRUD';
import { ThreeDBedsCRUD } from '@/components/admin/threed/beds/ThreeDBedsCRUD';
import { ThreeDModelsCRUD } from '@/components/admin/threed/models/ThreeDModelsCRUD';
import { ThreeDCharactersCRUD } from '@/components/admin/threed/characters/ThreeDCharactersCRUD';
import { ThreeDTasksCRUD } from '@/components/admin/threed/tasks/ThreeDTasksCRUD';
import { ThreeDWateringSchedulesCRUD } from '@/components/admin/threed/watering-schedules/ThreeDWateringSchedulesCRUD';
import { ThreeDHarvestsCRUD } from '@/components/admin/threed/harvests/ThreeDHarvestsCRUD';
import { ThreeDFarmbotsCRUD } from '@/components/admin/threed/farmbots/ThreeDFarmbotsCRUD';
import { ThreeDLayersCRUD } from '@/components/admin/threed/layers/ThreeDLayersCRUD';

import { TrafficCHPCADCRUD } from '@/components/admin/traffic/chp-cad/TrafficCHPCADCRUD';
import { TrafficCHPCentersCRUD } from '@/components/admin/traffic/chp-centers/TrafficCHPCentersCRUD';
import { TrafficCHPCasesCRUD } from '@/components/admin/traffic/chp-cases/TrafficCHPCasesCRUD';
import { TrafficCaltransCRUD } from '@/components/admin/traffic/caltrans/TrafficCaltransCRUD';
import { TrafficCaltransCctvCRUD } from '@/components/admin/traffic/caltrans-cctv/TrafficCaltransCctvCRUD';
import { TrafficCaltransDistrictsCRUD } from '@/components/admin/traffic/caltrans-districts/TrafficCaltransDistrictsCRUD';
import { TrafficCalfireCRUD } from '@/components/admin/traffic/calfire/TrafficCalfireCRUD';
import { TrafficBayArea511CRUD } from '@/components/admin/traffic/bay-area-511/TrafficBayArea511CRUD';

import { ProjectAssetManager } from '@/components/admin/projects/ProjectAssetManager';
import {
  calibrateThreeDGeographicOrigin,
  type ThreeDCoordinateCalibrationResult,
} from '@/libraries/services/threed/markers/map-coordinate-core';

interface Project {
  config?: unknown;
  id: number;
  name: string;
  description: string;
  slug: string;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  userId: string;
  originLatitude: string | null;
  originLongitude: string | null;
  originAltitude: string;
  headingDegrees: string;
  metersPerSceneUnit: string;
  calibrationPointALocalX: string | null;
  calibrationPointALocalZ: string | null;
  calibrationPointALatitude: string | null;
  calibrationPointALongitude: string | null;
  calibrationPointBLocalX: string | null;
  calibrationPointBLocalZ: string | null;
  calibrationPointBLatitude: string | null;
  calibrationPointBLongitude: string | null;
}

interface Module {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  projectId: number;
  slug: string;
  createdAt: string;
}

type ModuleType = 'threed' | 'traffic' | 'multimedia';
type CalibrationDiagnostics = ThreeDCoordinateCalibrationResult['diagnostics'];

function getStoredCalibrationDiagnostics(projectData: Project): CalibrationDiagnostics | null {
  const values = [
    projectData.calibrationPointALocalX,
    projectData.calibrationPointALocalZ,
    projectData.calibrationPointALatitude,
    projectData.calibrationPointALongitude,
    projectData.calibrationPointBLocalX,
    projectData.calibrationPointBLocalZ,
    projectData.calibrationPointBLatitude,
    projectData.calibrationPointBLongitude,
  ];
  if (values.some((value) => value === null || !Number.isFinite(Number(value)))) return null;
  try {
    return calibrateThreeDGeographicOrigin({
      pointA: {
        local: {
          x: Number(projectData.calibrationPointALocalX),
          z: Number(projectData.calibrationPointALocalZ),
        },
        geographic: {
          latitude: Number(projectData.calibrationPointALatitude),
          longitude: Number(projectData.calibrationPointALongitude),
        },
      },
      pointB: {
        local: {
          x: Number(projectData.calibrationPointBLocalX),
          z: Number(projectData.calibrationPointBLocalZ),
        },
        geographic: {
          latitude: Number(projectData.calibrationPointBLatitude),
          longitude: Number(projectData.calibrationPointBLongitude),
        },
      },
      originAltitude: Number(projectData.originAltitude),
    }).diagnostics;
  } catch {
    return null;
  }
}

// ✅ Module configuration with ALL CRUD components listed
const moduleConfig: Record<ModuleType, {
  icon: LucideIcon;
  color: string;
  label: string;
  borderColor: string;
  crudComponents: Array<{
    id: string;
    label: string;
    component: React.ComponentType<{ onModuleUpdate?: () => void }>;
    icon: LucideIcon;
  }>;
}> = {
  threed: {
    icon: Box,
    color: 'text-green-600',
    label: 'ThreeD',
    borderColor: 'border-green-200',
    crudComponents: [
      { id: 'plants', label: 'Plants', component: ThreeDPlantsCRUD, icon: Sprout },
      { id: 'plantings', label: 'Plantings', component: ThreeDPlantingsCRUD, icon: Box },
      { id: 'beds', label: 'Beds', component: ThreeDBedsCRUD, icon: Box },
      { id: 'models', label: 'Models', component: ThreeDModelsCRUD, icon: Package },
      { id: 'characters', label: 'Characters', component: ThreeDCharactersCRUD, icon: User },
      { id: 'layers', label: 'Layers', component: ThreeDLayersCRUD, icon: Layers },
      { id: 'tasks', label: 'Tasks', component: ThreeDTasksCRUD, icon: Sprout },
      { id: 'harvests', label: 'Harvests', component: ThreeDHarvestsCRUD, icon: User },
      { id: 'watering-schedules', label: 'Watering Schedules', component: ThreeDWateringSchedulesCRUD, icon: Package },
      { id: 'farmbots', label: 'FarmBots', component: ThreeDFarmbotsCRUD, icon: User },
    ],
  },
  traffic: {
    icon: Car,
    color: 'text-blue-600',
    label: 'Traffic',
    borderColor: 'border-blue-200',
    crudComponents: [
      { id: 'chp-cad', label: 'CHP-CAD Incidents', component: TrafficCHPCADCRUD, icon: AlertTriangle },
      { id: 'chp-centers', label: 'CHP Centers', component: TrafficCHPCentersCRUD, icon: AlertTriangle },
      { id: 'chp-cases', label: 'CHP Cases', component: TrafficCHPCasesCRUD, icon: FileText },
      { id: 'caltrans', label: 'Caltrans Closures', component: TrafficCaltransCRUD, icon: Route },
      { id: 'caltrans-districts', label: 'Caltrans Districts', component: TrafficCaltransDistrictsCRUD, icon: Route },
      { id: 'caltrans-cctv', label: 'CCTV Cameras', component: TrafficCaltransCctvCRUD, icon: Route },
      { id: 'bay-area-511', label: 'Bay Area 511', component: TrafficBayArea511CRUD, icon: Radio },
      { id: 'calfire', label: 'CalFire Incidents', component: TrafficCalfireCRUD, icon: Flame },
    ],
  },
  multimedia: {
    icon: Music,
    color: 'text-purple-600',
    label: 'Music',
    borderColor: 'border-purple-200',
    crudComponents: [
      { id: 'albums', label: 'Albums', component: MultimediaAlbumCRUD, icon: Music },
      { id: 'tracks', label: 'Tracks', component: MultimediaTracksCRUD, icon: Music2 },
      { id: 'media', label: 'Media', component: MultimediaMediaCRUD, icon: Image },
      { id: 'links', label: 'Links', component: MultimediaLinksCRUD, icon: Link2 },
    ],
  },
};

// Session storage helpers
const STORAGE_KEY = 'project_module_expanded';
const CREATE_TAB_STORAGE_KEY = 'project_create_tab';

const getStoredExpandedState = (): Record<string, boolean> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading from sessionStorage:', error);
  }
  return {};
};

const setStoredExpandedState = (state: Record<string, boolean>) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error writing to sessionStorage:', error);
  }
};

const getStoredCreateTab = (key: string): string => {
  if (typeof window === 'undefined') return '';
  try {
    const stored = sessionStorage.getItem(`${CREATE_TAB_STORAGE_KEY}_${key}`);
    return stored || '';
  } catch (error) {
    console.error('Error reading from sessionStorage:', error);
    return '';
  }
};

const setStoredCreateTab = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${CREATE_TAB_STORAGE_KEY}_${key}`, value);
  } catch (error) {
    console.error('Error writing to sessionStorage:', error);
  }
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast, ToastComponent } = useToast();
  const { data: session, status } = useSession();
  const projectId = parseInt(params.id as string);
  const projectScopeRef = useRef(projectId);
  projectScopeRef.current = projectId;
  const loadSequenceRef = useRef(0);

  const [project, setProject] = useState<Project | null>(null);
  const [modules, setModules] = useState<Record<ModuleType, Module[]>>({
    threed: [],
    traffic: [],
    multimedia: [],
  });
  const [loading, setLoading] = useState(true);
  const [projectHelpOpen, setProjectHelpOpen] = useState(false);
  const [projectTab, setProjectTab] = useState('setup');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewModuleDialog, setShowNewModuleDialog] = useState(false);
  const [newModuleData, setNewModuleData] = useState({
    type: 'threed' as ModuleType,
    name: '',
    description: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
    isActive: true,
  });
  const [calibrationData, setCalibrationData] = useState({
    pointALocalX: '0',
    pointALocalZ: '0',
    pointALatitude: '',
    pointALongitude: '',
    pointBLocalX: '',
    pointBLocalZ: '',
    pointBLatitude: '',
    pointBLongitude: '',
  });
  const [calibrationDiagnostics, setCalibrationDiagnostics] = useState<CalibrationDiagnostics | null>(null);

  const restoreProjectDetails = (saved: Project) => {
    setFormData({ name: saved.name || '', description: saved.description || '', isPublic: saved.isPublic || false, isActive: saved.isActive !== false });
    setCalibrationDiagnostics(getStoredCalibrationDiagnostics(saved));
    setCalibrationData({
      pointALocalX: saved.calibrationPointALocalX ?? '0',
      pointALocalZ: saved.calibrationPointALocalZ ?? '0',
      pointALatitude: saved.calibrationPointALatitude ?? saved.originLatitude ?? '',
      pointALongitude: saved.calibrationPointALongitude ?? saved.originLongitude ?? '',
      pointBLocalX: saved.calibrationPointBLocalX ?? '',
      pointBLocalZ: saved.calibrationPointBLocalZ ?? '',
      pointBLatitude: saved.calibrationPointBLatitude ?? '',
      pointBLongitude: saved.calibrationPointBLongitude ?? '',
    });
  };

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    return getStoredExpandedState();
  });

  const [activeModuleTab, setActiveModuleTab] = useState<Record<string, 'assets' | 'create'>>({});
  const [activeCreateTab, setActiveCreateTab] = useState<Record<string, string>>({});

  useEffect(() => {
    setStoredExpandedState(expandedModules);
  }, [expandedModules]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProject();
    }
  }, [projectId, session]);

  const fetchProject = async () => {
    if (!session?.user?.id) {
      showToast('You must be signed in', 'error');
      router.push('/sign-in');
      return;
    }

    const requestId = ++loadSequenceRef.current;
    const isCurrent = () => projectScopeRef.current === projectId && loadSequenceRef.current === requestId;
    if (project?.id !== projectId) setLoading(true);
    try {
      const projectRes = await fetch(`/api/project?id=${projectId}`);
      if (!isCurrent()) return;

      if (!projectRes.ok) {
        if (projectRes.status === 404) {
          showToast('Project not found or you do not have access to it', 'error');
          router.push('/admin');
          return;
        }
        if (projectRes.status === 401) {
          router.push('/sign-in');
          return;
        }
        throw new Error('Failed to fetch project');
      }

      const projectData = await projectRes.json();
      if (!isCurrent()) return;

      if (!projectData.data) {
        showToast('Project not found', 'error');
        router.push('/admin');
        return;
      }

      if (projectData.data.userId !== session.user.id) {
        showToast('You do not have permission to view this project', 'error');
        router.push('/admin');
        return;
      }

      setProject(projectData.data);
      restoreProjectDetails(projectData.data);

      const modulesRes = await fetch(`/api/project/modules?projectId=${projectId}`);
      if (!isCurrent()) return;

      if (modulesRes.status === 404) {
        setModules({ threed: [], traffic: [], multimedia: [] });
      } else if (modulesRes.ok) {
        const modulesData = await modulesRes.json();
        if (!isCurrent()) return;
        const newModules = modulesData.data || { threed: [], traffic: [], multimedia: [] };
        setModules(newModules);

        setExpandedModules(prev => {
          const currentState = { ...prev };
          const storedState = getStoredExpandedState();

          Object.entries(newModules).forEach(([type, moduleList]) => {
            (moduleList as Module[]).forEach((mod: Module) => {
              const uniqueKey = `${type}_module_${mod.id}`;
              if (!(uniqueKey in currentState)) {
                if (uniqueKey in storedState) {
                  currentState[uniqueKey] = storedState[uniqueKey];
                } else {
                  currentState[uniqueKey] = false;
                }
              }
            });
          });

          const validKeys = new Set<string>();
          Object.entries(newModules).forEach(([type, moduleList]) => {
            (moduleList as Module[]).forEach((mod: Module) => {
              validKeys.add(`${type}_module_${mod.id}`);
            });
          });

          Object.keys(currentState).forEach(key => {
            if (!validKeys.has(key)) {
              delete currentState[key];
            }
          });

          return currentState;
        });

        // ✅ Initialize create tabs from session storage
        Object.entries(newModules).forEach(([type, moduleList]) => {
          (moduleList as Module[]).forEach((mod: Module) => {
            const uniqueKey = `${type}_module_${mod.id}`;
            const storedTab = getStoredCreateTab(uniqueKey);
            const config = moduleConfig[type as ModuleType];
            const defaultTab = config.crudComponents[0]?.id || '';

            if (storedTab && config.crudComponents.some(c => c.id === storedTab)) {
              setActiveCreateTab(prev => ({ ...prev, [uniqueKey]: storedTab }));
            } else if (defaultTab) {
              setActiveCreateTab(prev => ({ ...prev, [uniqueKey]: defaultTab }));
            }
          });
        });
      } else {
        setModules({ threed: [], traffic: [], multimedia: [] });
      }
    } catch (error) {
      if (!isCurrent()) return;
      console.error('Error fetching project:', error);
      showToast(error instanceof Error ? error.message : 'Failed to load project', 'error');
      router.push('/admin');
    } finally {
      if (isCurrent()) setLoading(false);
    }
  };

  const updateProject = async (configuration: ProjectConfigurationRequest | undefined, signal: AbortSignal) => {
    if (!session?.user?.id) {
      throw new Error('You must be signed in');
    }

    const captured = { ...formData };
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/project?id=${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({ ...captured, ...(configuration ? { configuration } : {}) }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        if (response.status === 401) {
          router.push('/auth/sign-in');
        }
        throw new Error(result?.error || 'Failed to save Project changes. Your edits are retained.');
      }
      if (signal.aborted || projectScopeRef.current !== projectId) throw new Error('Project changed before Save completed.');
      if (result.data?.id !== projectId || !('config' in result.data)) throw new Error('Save did not confirm the Project. Your edits are retained.');

      setProject(result.data);
      setFormData(current => ({
        name: current.name === captured.name ? result.data.name : current.name,
        description: current.description === captured.description ? result.data.description || '' : current.description,
        isPublic: current.isPublic === captured.isPublic ? result.data.isPublic === true : current.isPublic,
        isActive: current.isActive === captured.isActive ? result.data.isActive !== false : current.isActive,
      }));
      showToast('Project updated successfully', 'success');
      return result.data.config as unknown;
    } catch (error) {
      if (!signal.aborted && projectScopeRef.current === projectId) showToast(error instanceof Error ? error.message : 'Failed to save Project', 'error');
      throw error;
    } finally {
      if (projectScopeRef.current === projectId) setIsSubmitting(false);
    }
  };

  const calibrateProjectCoordinates = async () => {
    if (!session?.user?.id) {
      showToast('You must be signed in', 'error');
      return;
    }
    const rawValues = Object.values(calibrationData);
    const values = rawValues.map(Number);
    if (rawValues.some((value) => value.trim() === '') || values.some((value) => !Number.isFinite(value))) {
      showToast('Both local/GPS reference points are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/project?id=${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinateCalibration: {
            pointA: {
              localX: calibrationData.pointALocalX,
              localZ: calibrationData.pointALocalZ,
              latitude: calibrationData.pointALatitude,
              longitude: calibrationData.pointALongitude,
            },
            pointB: {
              localX: calibrationData.pointBLocalX,
              localZ: calibrationData.pointBLocalZ,
              latitude: calibrationData.pointBLatitude,
              longitude: calibrationData.pointBLongitude,
            },
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to calibrate Project coordinates');
      setCalibrationDiagnostics(result.calibrationDiagnostics ?? null);
      showToast(result.message || 'Project coordinates calibrated', 'success');
      await fetchProject();
    } catch (error) {
      console.error('Error calibrating Project coordinates:', error);
      showToast(error instanceof Error ? error.message : 'Failed to calibrate Project coordinates', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleModuleStatus = async (type: ModuleType, moduleId: number, currentStatus: boolean) => {
    if (!session?.user?.id) {
      showToast('You must be signed in', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/${type}?id=${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/sign-in');
          return;
        }
        throw new Error('Failed to update module status');
      }

      showToast(`Module ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
      await fetchProject();
    } catch (error) {
      console.error('Error toggling module status:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update module status', 'error');
    }
  };

  const createModule = async () => {
    if (!session?.user?.id) {
      showToast('You must be signed in', 'error');
      return;
    }

    if (!newModuleData.name.trim()) {
      showToast('Module name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const createResponse = await fetch(`/api/${newModuleData.type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newModuleData.name,
          description: newModuleData.description,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Failed to create module');
      }

      const createData = await createResponse.json();
      const moduleId = createData.data.id;

      const addResponse = await fetch(`/api/project/modules?projectId=${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newModuleData.type,
          moduleId: moduleId,
        }),
      });

      if (!addResponse.ok) {
        const errorData = await addResponse.json();
        throw new Error(errorData.error || 'Failed to add module to project');
      }

      showToast(`${moduleConfig[newModuleData.type].label} module created and added successfully`, 'success');
      setShowNewModuleDialog(false);
      setNewModuleData({ type: 'threed', name: '', description: '' });
      await fetchProject();
    } catch (error) {
      console.error('Error creating module:', error);
      showToast(error instanceof Error ? error.message : 'Failed to create module', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteModule = async (type: ModuleType, id: number, name: string) => {
    if (!session?.user?.id) {
      showToast('You must be signed in', 'error');
      return;
    }

    if (!confirm(`Delete "${name}" module? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/project/modules?projectId=${projectId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, moduleId: id }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/sign-in');
          return;
        }
        throw new Error('Failed to delete module');
      }

      showToast('Module deleted successfully', 'success');
      await fetchProject();
    } catch (error) {
      console.error('Error deleting module:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete module', 'error');
    }
  };

  const toggleModuleExpand = (type: ModuleType, moduleId: number) => {
    const uniqueKey = `${type}_module_${moduleId}`;
    setExpandedModules(prev => ({
      ...prev,
      [uniqueKey]: !prev[uniqueKey],
    }));
  };

  const setModuleTab = (type: ModuleType, moduleId: number, tab: 'assets' | 'create') => {
    const uniqueKey = `${type}_module_${moduleId}`;
    setActiveModuleTab(prev => ({
      ...prev,
      [uniqueKey]: tab,
    }));
  };

  const getModuleTab = (type: ModuleType, moduleId: number): 'assets' | 'create' => {
    const uniqueKey = `${type}_module_${moduleId}`;
    return activeModuleTab[uniqueKey] || 'assets';
  };

  const setCreateTab = (type: ModuleType, moduleId: number, tabId: string) => {
    const uniqueKey = `${type}_module_${moduleId}`;
    setActiveCreateTab(prev => ({ ...prev, [uniqueKey]: tabId }));
    setStoredCreateTab(uniqueKey, tabId);
  };

  const getCreateTab = (type: ModuleType, moduleId: number): string => {
    const uniqueKey = `${type}_module_${moduleId}`;
    const config = moduleConfig[type];
    const storedTab = activeCreateTab[uniqueKey];

    // If stored tab exists and is valid, use it
    if (storedTab && config.crudComponents.some(c => c.id === storedTab)) {
      return storedTab;
    }

    // Otherwise return the first available tab
    return config.crudComponents[0]?.id || '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getAllModules = (): { type: ModuleType; module: Module; uniqueKey: string }[] => {
    const result: { type: ModuleType; module: Module; uniqueKey: string }[] = [];
    (['threed', 'traffic', 'multimedia'] as ModuleType[]).forEach(type => {
      (modules[type] || []).forEach(module => {
        const uniqueKey = `${type}_module_${module.id}`;
        result.push({ type, module, uniqueKey });
      });
    });
    return result;
  };

  if (status === 'loading' || loading || (project !== null && project.id !== projectId)) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground">Please sign in to access this page</p>
          <Button className="mt-4" onClick={() => router.push('/auth/sign-in')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Project Not Found</h3>
          <p className="text-muted-foreground mb-4">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push('/admin')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const allModules = getAllModules();

  return (
    <div className="space-y-4">
      {ToastComponent}

      {/* Project Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 flex-wrap">
            {project.name}
            <Badge variant={project.isActive ? 'default' : 'secondary'}>
              {project.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {project.isPublic && (
              <Badge variant="outline">Public</Badge>
            )}
            <TooltipProvider delayDuration={200}><Tooltip open={projectHelpOpen} onOpenChange={setProjectHelpOpen}>
              <TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="threed-field-help h-6 w-6 shrink-0 text-muted-foreground" aria-label="Project information" onClick={() => setProjectHelpOpen(open => !open)}><CircleHelp aria-hidden="true" className="h-3.5 w-3.5" /></Button></TooltipTrigger>
              <TooltipContent className="space-y-2 break-words font-normal">
                <p>{project.description || 'No description provided'}</p>
                <dl className="space-y-1"><div><dt className="inline font-semibold">ID: </dt><dd className="inline">{project.id}</dd></div><div><dt className="inline font-semibold">Slug: </dt><dd className="inline">{project.slug}</dd></div><div><dt className="inline font-semibold">Created: </dt><dd className="inline">{formatDate(project.createdAt)}</dd></div></dl>
              </TooltipContent>
            </Tooltip></TooltipProvider>
          </h1>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/projects"><FolderOpen aria-hidden="true" className="w-4 h-4 mr-2" />All Projects</Link>
        </Button>
      </div>

      <Tabs value={projectTab} onValueChange={setProjectTab} className="space-y-4">
        <TabsList><TabsTrigger value="setup">Setup</TabsTrigger><TabsTrigger value="modules">Modules and assets</TabsTrigger></TabsList>
        <TabsContent value="setup" forceMount className="space-y-4 data-[state=inactive]:hidden">
      {/* Project details are always available on the Setup tab. */}
      <ProjectConfigurations key={project.id} project={project} disabled={isSubmitting}
        detailsDirty={formData.name !== project.name || formData.description !== (project.description || '') || formData.isPublic !== (project.isPublic === true) || formData.isActive !== (project.isActive !== false)}
        onSave={updateProject} onReset={() => restoreProjectDetails(project)}
        onSaved={config => setProject(current => current?.id === project.id ? { ...current, config } : current)}
        onCalibrate={() => { const panel = document.getElementById('project-coordinate-calibration'); if (panel instanceof HTMLDetailsElement) panel.open = true; requestAnimationFrame(() => document.getElementById('calibration-pointALocalX')?.focus()); }}
        rightColumnFooter={<ProjectWeatherSettings key={`weather-${project.id}`} projectId={project.id} disabled={isSubmitting} compact />}
        details={
        <Card className="min-w-0 gap-0 overflow-hidden border-t-2 border-t-emerald-500/60">
          <CardContent className="p-5">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold"><FolderOpen aria-hidden="true" className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />Project details and access</h2>
            <p className="mb-4 text-sm text-muted-foreground">Name your Project and choose who can view it.</p>
            <div className="space-y-3">
              <ProjectDetailsFields value={formData} onChange={setFormData} disabled={isSubmitting} idPrefix="edit" />
              <details id="project-coordinate-calibration" className="rounded-xl border bg-muted/20 p-4">
                <summary className="cursor-pointer text-sm font-semibold"><MapPin aria-hidden="true" className="mr-2 inline size-4 text-amber-600 dark:text-amber-400" />Project Coordinate Calibration<span className="ml-2 text-xs font-normal text-muted-foreground">Advanced</span></summary>
                <div className="mt-3 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Enter two matching local X/Z and GPS latitude/longitude points. Calibration
                    preserves local marker positions and refreshes saved marker GPS metadata.
                  </p>
                </div>
                {([
                  ['A', 'pointALocalX', 'pointALocalZ', 'pointALatitude', 'pointALongitude'],
                  ['B', 'pointBLocalX', 'pointBLocalZ', 'pointBLatitude', 'pointBLongitude'],
                ] as const).map(([label, localX, localZ, latitude, longitude]) => (
                  <div key={label} className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {([
                      [localX, `Point ${label} Local X`, '0.001'],
                      [localZ, `Point ${label} Local Z`, '0.001'],
                      [latitude, `Point ${label} Latitude`, '0.0000001'],
                      [longitude, `Point ${label} Longitude`, '0.0000001'],
                    ] as const).map(([field, fieldLabel, step]) => (
                      <div key={field} className="space-y-1">
                        <Label htmlFor={`calibration-${field}`} className="text-xs">{fieldLabel}</Label>
                        <Input
                          id={`calibration-${field}`}
                          type="number"
                          step={step}
                          value={calibrationData[field]}
                          onChange={(event) => setCalibrationData((current) => ({
                            ...current,
                            [field]: event.target.value,
                          }))}
                          disabled={isSubmitting}
                        />
                      </div>
                    ))}
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={calibrateProjectCoordinates}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="mr-2 h-4 w-4" />
                    )}
                    Calibrate Coordinates
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Current: {project.metersPerSceneUnit} m/unit · {project.headingDegrees}°
                  </span>
                </div>
                {calibrationDiagnostics && (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 rounded bg-muted/40 px-2 py-1.5 text-[11px] text-muted-foreground md:grid-cols-4">
                    <span>Local span: {calibrationDiagnostics.localDistanceUnits.toFixed(3)} units</span>
                    <span>GPS span: {calibrationDiagnostics.geographicDistanceMeters.toFixed(3)} m</span>
                    <span>Scale: {(calibrationDiagnostics.geographicDistanceMeters / calibrationDiagnostics.localDistanceUnits).toFixed(6)} m/unit</span>
                    <span>Endpoint residual: {calibrationDiagnostics.referenceErrorMeters.toFixed(4)} m</span>
                  </div>
                )}
                </div>
              </details>
            </div>
          </CardContent>
        </Card>} />
        </TabsContent>
        <TabsContent value="modules" className="space-y-4">
      {/* Modules Section */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold"><Layers aria-hidden="true" className="size-5 shrink-0 text-cyan-600 dark:text-cyan-400" />Project Modules</h2>
          <p className="text-sm text-muted-foreground">
            {allModules.length} module{allModules.length !== 1 ? 's' : ''} associated with this project
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => router.push(`/admin/threed/scenarios?projectId=${projectId}&create=1`)}>
            Set up Scenario
          </Button>
        <Dialog open={showNewModuleDialog} onOpenChange={setShowNewModuleDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Module
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Module</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Module Type</Label>
                <select
                  className="w-full mt-1 p-2 border rounded-md"
                  value={newModuleData.type}
                  onChange={(e) => setNewModuleData({ ...newModuleData, type: e.target.value as ModuleType })}
                  disabled={isSubmitting}
                >
                  <option value="threed">ThreeD</option>
                  <option value="traffic">Traffic</option>
                  <option value="multimedia">Music</option>
                </select>
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  placeholder="e.g., My Garden"
                  value={newModuleData.name}
                  onChange={(e) => setNewModuleData({ ...newModuleData, name: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Module description..."
                  value={newModuleData.description}
                  onChange={(e) => setNewModuleData({ ...newModuleData, description: e.target.value })}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
              <Button onClick={createModule} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Module'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Module Cards */}
      {allModules.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-1">No Modules Yet</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Create your first module to start managing assets for this project.
            </p>
            <Button size="sm" onClick={() => setShowNewModuleDialog(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Create Module
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {allModules.map(({ type, module, uniqueKey }) => {
            const config = moduleConfig[type];
            const Icon = config.icon;
            const isExpanded = expandedModules[uniqueKey] || false;
            const activeTab = getModuleTab(type, module.id);

            return (
              <Card
                key={uniqueKey}
                className={`border-l-4 ${config.borderColor}`}
              >
                {/* Module Header */}
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggleModuleExpand(type, module.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icon className={`w-5 h-5 ${config.color} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold truncate">{module.name}</h4>
                        <Badge variant={module.isActive ? 'default' : 'secondary'} className="flex-shrink-0">
                          {module.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="flex-shrink-0">
                          {config.label}
                        </Badge>
                      </div>
                      {module.description && (
                        <p className="text-sm text-muted-foreground truncate">{module.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleModuleStatus(type, module.id, module.isActive);
                      }}
                    >
                      {module.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => deleteModule(type, module.id, module.name)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Module
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="sm" className="ml-0">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Module Content */}
                {isExpanded && (
                  <CardContent className="p-3 pt-0">
                    <Tabs
                      value={activeTab}
                      onValueChange={(value) => setModuleTab(type, module.id, value as 'assets' | 'create')}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2 mb-2">
                        <TabsTrigger value="assets" className="flex items-center gap-2 py-1.5 text-sm">
                          <Layers className="w-4 h-4" />
                          Manage Assigned Assets
                        </TabsTrigger>
                        <TabsTrigger value="create" className="flex items-center gap-2 py-1.5 text-sm">
                          <Plus className="w-4 h-4" />
                          Create New {config.label} Asset
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="assets" className="mt-0">
                        <ProjectAssetManager
                          projectId={projectId}
                          userId={session?.user?.id || ''}
                          moduleType={type}
                          moduleId={module.id}
                          onUpdate={fetchProject}
                        />
                      </TabsContent>

                      <TabsContent value="create" className="max-h-[70vh] overflow-y-auto pr-1 mt-0">
                        {/* ✅ CRUD Components with Tabs */}
                        <Tabs
                          value={getCreateTab(type, module.id)}
                          onValueChange={(value) => setCreateTab(type, module.id, value)}
                          className="w-full"
                        >
                          <TabsList className="flex flex-wrap gap-1 mb-2">
                            {config.crudComponents.map((crud) => {
                              const CrudIcon = crud.icon;
                              return (
                                <TabsTrigger
                                  key={crud.id}
                                  value={crud.id}
                                  className="px-2 py-1 text-xs"
                                >
                                  <CrudIcon className="w-3 h-3 mr-1" />
                                  {crud.label}
                                </TabsTrigger>
                              );
                            })}
                          </TabsList>

                          {config.crudComponents.map((crud) => {
                            const CrudComponent = crud.component;
                            return (
                              <TabsContent key={crud.id} value={crud.id} className="mt-0">
                                {crud.id === 'layers' ? (
                                  <ThreeDLayersCRUD
                                    onModuleUpdate={fetchProject}
                                    userId={session?.user?.id}
                                    projectId={projectId}
                                  />
                                ) : (
                                  <CrudComponent onModuleUpdate={fetchProject} />
                                )}
                              </TabsContent>
                            );
                          })}
                        </Tabs>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
