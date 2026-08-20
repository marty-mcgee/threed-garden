// components/admin/threed/farmbots/ThreeDFarmbotsCRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Bot,
  MoreHorizontal,
  Search,
  Filter,
  Eye,
  EyeOff,
  MapPin,
  Battery,
  Wifi,
  Cpu,
  Clock,
  Zap,
  KeyRound,
  RefreshCw,
  Unplug,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
import { FarmBotMqttActivityDialog } from './FarmBotMqttActivityDialog';

// ✅ Types
interface Bed {
  id: number;
  bedId: string;
  name: string;
}

interface Farmbot {
  id: number;
  assetCode: string;
  farmbotDeviceId: number | null;
  brokerDeviceId: string | null;
  name: string;
  isActive: boolean;
  status: string;
  bedId: number | null;
  positionX: string | null;
  positionY: string | null;
  positionZ: string | null;
  apiUrl: string | null;
  credentialConfigured: boolean;
  lastSeen: string | null;
  batteryLevel: number | null;
  firmwareVersion: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  bed?: Bed;
}

interface FormData {
  assetCode: string;
  name: string;
  isActive: boolean;
  status: string;
  bedId: string;
  positionX: string;
  positionY: string;
  positionZ: string;
  apiUrl: string;
  lastSeen: string;
  batteryLevel: string;
  firmwareVersion: string;
  notes: string;
}

interface FarmBotConnectionSummary {
  authenticated: true;
  deviceId: number;
  name: string | null;
  firmwareVersion: string | null;
  lastSawApi: string | null;
  lastSawMessageBroker: string | null;
  timezone: string | null;
  brokerDeviceId: string | null;
  credentialExpiresAt: string | null;
}

interface FarmBotPeripheralInventory {
  peripherals: Array<{ id: number; pin: number; label: string; mode: 0 | 1 }>;
  totalCount: number;
  truncated: boolean;
}

interface FarmBotPeripheralBinding {
  id: number;
  semanticAction: string;
  peripheralId: number;
  peripheralLabel: string;
  peripheralPin: number;
  peripheralMode: number;
  isActive: boolean;
}

interface FarmBotBindingValidation {
  valid: boolean;
  reason: 'valid' | 'binding_inactive' | 'peripheral_missing' | 'metadata_changed';
}

interface FarmBotBrokerMetadata {
  mqttHost: string;
  mqttWsUrl: string;
  brokerDeviceId: string | null;
  vhost: string;
  tokenIssuedAt: string;
  tokenExpiresAt: string;
  observedAt: string;
  restVerifiedAt: string | null;
}

type FarmBotMqttReadinessIssue =
  | 'credential_not_configured'
  | 'identity_not_verified'
  | 'identity_mismatch'
  | 'token_expired'
  | 'snapshot_missing'
  | 'snapshot_outdated'
  | 'rest_verification_required';

interface FarmBotMqttReadiness {
  ready: boolean;
  checkedAt: string;
  farmbotDeviceId: number | null;
  brokerDeviceId: string | null;
  mqttHost: string | null;
  mqttWsUrl: string | null;
  tokenExpiresAt: string | null;
  restVerifiedAt: string | null;
  issues: FarmBotMqttReadinessIssue[];
}

const MQTT_READINESS_ISSUE_LABELS: Record<FarmBotMqttReadinessIssue, string> = {
  credential_not_configured: 'Credential not configured',
  identity_not_verified: 'REST/MQTT identity not verified',
  identity_mismatch: 'REST, parent, and token identities do not match',
  token_expired: 'Credential expired',
  snapshot_missing: 'Broker snapshot missing',
  snapshot_outdated: 'Broker snapshot differs from the stored credential',
  rest_verification_required: 'REST verification required',
};

// ✅ Options
const FARMBOT_STATUS_OPTIONS = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'error', label: 'Error' },
];

// ✅ Helper
const getOptionLabel = (options: { value: string; label: string }[], value: string) => {
  const option = options.find((o) => o.value === value);
  return option ? option.label : value;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'online': return 'bg-green-100 text-green-700';
    case 'offline': return 'bg-gray-100 text-gray-700';
    case 'maintenance': return 'bg-yellow-100 text-yellow-700';
    case 'error': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getBatteryColor = (level: number | null) => {
  if (level === null) return 'bg-gray-100 text-gray-700';
  if (level >= 70) return 'bg-green-100 text-green-700';
  if (level >= 30) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
};

const getBatteryIcon = (level: number | null) => {
  if (level === null) return <Zap className="w-3 h-3" />;
  if (level >= 70) return <Battery className="w-3 h-3 text-green-500" />;
  if (level >= 30) return <Battery className="w-3 h-3 text-yellow-500" />;
  return <Battery className="w-3 h-3 text-red-500" />;
};

export function ThreeDFarmbotsCRUD({ onModuleUpdate }: { onModuleUpdate?: () => void }) {
  const { showToast, ToastComponent } = useToast();
  const [farmbots, setFarmbots] = useState<Farmbot[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingFarmbot, setEditingFarmbot] = useState<Farmbot | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [credentialFarmbot, setCredentialFarmbot] = useState<Farmbot | null>(null);
  const [credentialInput, setCredentialInput] = useState('');
  const [credentialLoading, setCredentialLoading] = useState(false);
  const [credentialSaving, setCredentialSaving] = useState(false);
  const [credentialConfigured, setCredentialConfigured] = useState(false);
  const [credentialMode, setCredentialMode] = useState<'login' | 'token'>('login');
  const [farmBotEmail, setFarmBotEmail] = useState('');
  const [farmBotPassword, setFarmBotPassword] = useState('');
  const [connectionTesting, setConnectionTesting] = useState(false);
  const [connectionSummary, setConnectionSummary] = useState<FarmBotConnectionSummary | null>(null);
  const [peripheralsLoading, setPeripheralsLoading] = useState(false);
  const [peripheralInventory, setPeripheralInventory] = useState<FarmBotPeripheralInventory | null>(null);
  const [bindingSaving, setBindingSaving] = useState(false);
  const [waterBinding, setWaterBinding] = useState<FarmBotPeripheralBinding | null>(null);
  const [bindingValidating, setBindingValidating] = useState(false);
  const [bindingValidation, setBindingValidation] = useState<FarmBotBindingValidation | null>(null);
  const [brokerMetadata, setBrokerMetadata] = useState<FarmBotBrokerMetadata | null>(null);
  const [brokerMetadataRefreshing, setBrokerMetadataRefreshing] = useState(false);
  const [mqttReadinessChecking, setMqttReadinessChecking] = useState(false);
  const [mqttReadiness, setMqttReadiness] = useState<FarmBotMqttReadiness | null>(null);
  const [activityFarmbot, setActivityFarmbot] = useState<Farmbot | null>(null);

  // ✅ Form state
  const [formData, setFormData] = useState<FormData>({
    assetCode: '',
    name: '',
    isActive: true,
    status: 'offline',
    bedId: '',
    positionX: '',
    positionY: '',
    positionZ: '',
    apiUrl: '',
    lastSeen: '',
    batteryLevel: '',
    firmwareVersion: '',
    notes: '',
  });

  // ✅ Fetch data
  useEffect(() => {
    fetchFarmbots();
    fetchBeds();
  }, []);

  const fetchFarmbots = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/threed/farmbots?limit=100');
      const data = await response.json();
      if (data.success) {
        setFarmbots(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || 'Failed to fetch farmbots', 'error');
        setFarmbots([]);
      }
    } catch (error) {
      console.error('Error fetching farmbots:', error);
      showToast('Failed to fetch farmbots', 'error');
      setFarmbots([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBeds = async () => {
    try {
      const response = await fetch('/api/threed/beds?isActive=true&limit=100');
      const data = await response.json();
      if (data.success) {
        setBeds(Array.isArray(data.data) ? data.data : []);
      }
    } catch (error) {
      console.error('Error fetching beds:', error);
      setBeds([]);
    }
  };

  const filteredFarmbots = farmbots.filter((farmbot) =>
    farmbot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    farmbot.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (farmbot.brokerDeviceId?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (farmbot.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleCreate = async () => {
    if (!formData.assetCode) {
      showToast('Asset code is required', 'error');
      return;
    }
    if (!formData.name) {
      showToast('FarmBot name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        bedId: formData.bedId ? parseInt(formData.bedId) : null,
        batteryLevel: formData.batteryLevel ? parseInt(formData.batteryLevel) : null,
        positionX: formData.positionX || null,
        positionY: formData.positionY || null,
        positionZ: formData.positionZ || null,
        lastSeen: formData.lastSeen || null,
      };

      const response = await fetch('/api/threed/farmbots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('FarmBot created successfully', 'success');
        setShowCreateDialog(false);
        resetForm();
        await fetchFarmbots();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create farmbot', 'error');
      }
    } catch (error) {
      console.error('Error creating farmbot:', error);
      showToast('Failed to create farmbot', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingFarmbot) return;
    if (!formData.assetCode) {
      showToast('Asset code is required', 'error');
      return;
    }
    if (!formData.name) {
      showToast('FarmBot name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        bedId: formData.bedId ? parseInt(formData.bedId) : null,
        batteryLevel: formData.batteryLevel ? parseInt(formData.batteryLevel) : null,
        positionX: formData.positionX || null,
        positionY: formData.positionY || null,
        positionZ: formData.positionZ || null,
        lastSeen: formData.lastSeen || null,
      };

      const response = await fetch(`/api/threed/farmbots?id=${editingFarmbot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        showToast('FarmBot updated successfully', 'success');
        setEditingFarmbot(null);
        await fetchFarmbots();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update farmbot', 'error');
      }
    } catch (error) {
      console.error('Error updating farmbot:', error);
      showToast('Failed to update farmbot', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete FarmBot "${name}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/threed/farmbots?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('FarmBot deleted successfully', 'success');
        await fetchFarmbots();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete farmbot', 'error');
      }
    } catch (error) {
      console.error('Error deleting farmbot:', error);
      showToast('Failed to delete farmbot', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      assetCode: '',
      name: '',
      isActive: true,
      status: 'offline',
      bedId: '',
      positionX: '',
      positionY: '',
      positionZ: '',
      apiUrl: '',
      lastSeen: '',
      batteryLevel: '',
      firmwareVersion: '',
      notes: '',
    });
  };

  const openEditDialog = (farmbot: Farmbot) => {
    setEditingFarmbot(farmbot);
    setFormData({
      assetCode: farmbot.assetCode || '',
      name: farmbot.name,
      isActive: farmbot.isActive ?? true,
      status: farmbot.status || 'offline',
      bedId: farmbot.bedId ? String(farmbot.bedId) : '',
      positionX: farmbot.positionX || '',
      positionY: farmbot.positionY || '',
      positionZ: farmbot.positionZ || '',
      apiUrl: farmbot.apiUrl || '',
      lastSeen: farmbot.lastSeen ? new Date(farmbot.lastSeen).toISOString().split('T')[0] : '',
      batteryLevel: farmbot.batteryLevel ? String(farmbot.batteryLevel) : '',
      firmwareVersion: farmbot.firmwareVersion || '',
      notes: farmbot.notes || '',
    });
  };

  const closeCredentialDialog = () => {
    setCredentialFarmbot(null);
    setCredentialInput('');
    setCredentialConfigured(false);
    setCredentialMode('login');
    setFarmBotEmail('');
    setFarmBotPassword('');
    setConnectionSummary(null);
    setPeripheralInventory(null);
    setWaterBinding(null);
    setBindingValidation(null);
    setBrokerMetadata(null);
    setMqttReadiness(null);
  };

  const openCredentialDialog = async (farmbot: Farmbot) => {
    setCredentialFarmbot(farmbot);
    setCredentialInput('');
    setCredentialConfigured(farmbot.credentialConfigured);
    setCredentialMode('login');
    setFarmBotEmail('');
    setFarmBotPassword('');
    setConnectionSummary(null);
    setPeripheralInventory(null);
    setWaterBinding(null);
    setBindingValidation(null);
    setBrokerMetadata(null);
    setMqttReadiness(null);
    setCredentialLoading(true);

    try {
      const [credentialResponse, bindingsResponse, brokerMetadataResponse] = await Promise.all([
        fetch(`/api/threed/farmbots/${farmbot.id}/credential`, { cache: 'no-store' }),
        fetch(`/api/threed/farmbots/${farmbot.id}/peripheral-bindings`, { cache: 'no-store' }),
        fetch(`/api/threed/farmbots/${farmbot.id}/broker-metadata`, { cache: 'no-store' }),
      ]);
      const [credentialData, bindingsData, brokerMetadataData] = await Promise.all([
        credentialResponse.json(),
        bindingsResponse.json(),
        brokerMetadataResponse.json(),
      ]);
      if (credentialData.success) {
        setCredentialConfigured(Boolean(credentialData.data?.configured));
      } else {
        showToast(credentialData.error || 'Failed to load credential status', 'error');
      }
      if (bindingsData.success) {
        const bindings = bindingsData.data as FarmBotPeripheralBinding[];
        setWaterBinding(bindings.find((binding) => binding.semanticAction === 'water') ?? null);
      } else {
        showToast(bindingsData.error || 'Failed to load peripheral assignments', 'error');
      }
      if (brokerMetadataData.success) {
        setBrokerMetadata(brokerMetadataData.data as FarmBotBrokerMetadata | null);
      } else {
        showToast(brokerMetadataData.error || 'Failed to load broker metadata', 'error');
      }
    } catch (error) {
      console.error('Failed to load FarmBot credential status:', error);
      showToast('Failed to load credential status', 'error');
    } finally {
      setCredentialLoading(false);
    }
  };

  const saveCredential = async () => {
    if (!credentialFarmbot || !credentialInput.trim()) {
      showToast('Enter a FarmBot credential', 'error');
      return;
    }

    setCredentialSaving(true);
    try {
      const response = await fetch(`/api/threed/farmbots/${credentialFarmbot.id}/credential`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialInput }),
      });
      const data = await response.json();
      if (data.success) {
        showToast('FarmBot credential stored securely', 'success');
        setCredentialInput('');
        setCredentialConfigured(true);
        setConnectionSummary(null);
        setMqttReadiness(null);
        setPeripheralInventory(null);
        setWaterBinding(null);
        setBindingValidation(null);
        const metadataResponse = await fetch(
          `/api/threed/farmbots/${credentialFarmbot.id}/broker-metadata`,
          { cache: 'no-store' }
        );
        const metadataData = await metadataResponse.json();
        setBrokerMetadata(metadataData.success ? metadataData.data : null);
        await fetchFarmbots();
      } else {
        showToast(data.error || 'Failed to store FarmBot credential', 'error');
      }
    } catch (error) {
      console.error('Failed to store FarmBot credential:', error);
      showToast('Failed to store FarmBot credential', 'error');
    } finally {
      setCredentialSaving(false);
    }
  };

  const disconnectCredential = async () => {
    if (!credentialFarmbot) return;
    if (!confirm(`Remove the stored credential for "${credentialFarmbot.name}"?`)) return;

    setCredentialSaving(true);
    try {
      const response = await fetch(`/api/threed/farmbots/${credentialFarmbot.id}/credential`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        showToast('FarmBot credential removed', 'success');
        setCredentialInput('');
        setCredentialConfigured(false);
        setConnectionSummary(null);
        setMqttReadiness(null);
        setPeripheralInventory(null);
        setWaterBinding(null);
        setBindingValidation(null);
        setBrokerMetadata(null);
        await fetchFarmbots();
      } else {
        showToast(data.error || 'Failed to remove FarmBot credential', 'error');
      }
    } catch (error) {
      console.error('Failed to remove FarmBot credential:', error);
      showToast('Failed to remove FarmBot credential', 'error');
    } finally {
      setCredentialSaving(false);
    }
  };

  const generateCredentialFromLogin = async () => {
    if (!credentialFarmbot || !farmBotEmail.trim() || !farmBotPassword) {
      showToast('Enter your FarmBot email and password', 'error');
      return;
    }

    setCredentialSaving(true);
    try {
      const response = await fetch(
        `/api/threed/farmbots/${credentialFarmbot.id}/credential/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: farmBotEmail.trim(), password: farmBotPassword }),
        }
      );
      const data = await response.json();
      if (data.success) {
        showToast('FarmBot credential generated and stored securely', 'success');
        setFarmBotEmail('');
        setCredentialConfigured(true);
        setConnectionSummary(null);
        setMqttReadiness(null);
        setPeripheralInventory(null);
        setWaterBinding(null);
        setBindingValidation(null);
        const metadataResponse = await fetch(
          `/api/threed/farmbots/${credentialFarmbot.id}/broker-metadata`,
          { cache: 'no-store' }
        );
        const metadataData = await metadataResponse.json();
        setBrokerMetadata(metadataData.success ? metadataData.data : null);
        await fetchFarmbots();
      } else {
        showToast(data.error || 'Failed to authenticate with FarmBot', 'error');
      }
    } catch (error) {
      console.error('FarmBot login request failed:', error);
      showToast('Failed to authenticate with FarmBot', 'error');
    } finally {
      setFarmBotPassword('');
      setCredentialSaving(false);
    }
  };

  const testStoredCredential = async () => {
    if (!credentialFarmbot || !credentialConfigured) return;

    setConnectionTesting(true);
    setConnectionSummary(null);
    try {
      const response = await fetch(
        `/api/threed/farmbots/${credentialFarmbot.id}/credential/test`,
        { method: 'POST' }
      );
      const data = await response.json();
      if (data.success) {
        setConnectionSummary(data.data as FarmBotConnectionSummary);
        setBrokerMetadata(data.data.brokerMetadata as FarmBotBrokerMetadata);
        setMqttReadiness(null);
        showToast('FarmBot REST authentication succeeded', 'success');
      } else {
        showToast(data.error || 'FarmBot connection test failed', 'error');
      }
    } catch (error) {
      console.error('FarmBot connection test request failed:', error);
      showToast('FarmBot connection test failed', 'error');
    } finally {
      setConnectionTesting(false);
    }
  };

  const refreshBrokerMetadata = async () => {
    if (!credentialFarmbot || !credentialConfigured) return;

    setBrokerMetadataRefreshing(true);
    try {
      const response = await fetch(
        `/api/threed/farmbots/${credentialFarmbot.id}/credential/refresh`,
        { method: 'POST' }
      );
      const data = await response.json();
      if (data.success) {
        setBrokerMetadata(data.data.brokerMetadata as FarmBotBrokerMetadata);
        setMqttReadiness(null);
        showToast('FarmBot broker metadata refreshed; token expiration unchanged', 'success');
        await fetchFarmbots();
      } else {
        showToast(data.error || 'FarmBot broker metadata refresh failed', 'error');
      }
    } catch (error) {
      console.error('FarmBot broker metadata refresh request failed:', error);
      showToast('FarmBot broker metadata refresh failed', 'error');
    } finally {
      setBrokerMetadataRefreshing(false);
    }
  };

  const checkMqttReadiness = async () => {
    if (!credentialFarmbot) return;

    setMqttReadinessChecking(true);
    try {
      const response = await fetch(
        `/api/threed/farmbots/${credentialFarmbot.id}/mqtt-readiness`,
        { cache: 'no-store' }
      );
      const data = await response.json();
      if (data.success) {
        const readiness = data.data as FarmBotMqttReadiness;
        setMqttReadiness(readiness);
        showToast(
          readiness.ready
            ? 'FarmBot configuration is ready for a future MQTT worker'
            : 'FarmBot configuration is not ready for MQTT',
          readiness.ready ? 'success' : 'error'
        );
      } else {
        showToast(data.error || 'FarmBot MQTT readiness check failed', 'error');
      }
    } catch (error) {
      console.error('FarmBot MQTT readiness request failed:', error);
      showToast('FarmBot MQTT readiness check failed', 'error');
    } finally {
      setMqttReadinessChecking(false);
    }
  };

  const discoverPeripherals = async () => {
    if (!credentialFarmbot || !credentialConfigured) return;

    setPeripheralsLoading(true);
    setPeripheralInventory(null);
    try {
      const response = await fetch(`/api/threed/farmbots/${credentialFarmbot.id}/peripherals`, {
        cache: 'no-store',
      });
      const data = await response.json();
      if (data.success) {
        setPeripheralInventory(data.data as FarmBotPeripheralInventory);
        showToast(`Found ${data.data.totalCount} FarmBot peripheral(s)`, 'success');
      } else {
        showToast(data.error || 'FarmBot peripheral discovery failed', 'error');
      }
    } catch (error) {
      console.error('FarmBot peripheral discovery request failed:', error);
      showToast('FarmBot peripheral discovery failed', 'error');
    } finally {
      setPeripheralsLoading(false);
    }
  };

  const assignWaterPeripheral = async (peripheralId: number) => {
    if (!credentialFarmbot) return;

    setBindingSaving(true);
    try {
      const response = await fetch(
        `/api/threed/farmbots/${credentialFarmbot.id}/peripheral-bindings`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ semanticAction: 'water', peripheralId }),
        }
      );
      const data = await response.json();
      if (data.success) {
        setWaterBinding(data.data as FarmBotPeripheralBinding);
        setBindingValidation(null);
        showToast('Water peripheral assigned; physical commands remain disabled', 'success');
      } else {
        showToast(data.error || 'Failed to assign Water peripheral', 'error');
      }
    } catch (error) {
      console.error('FarmBot Water peripheral assignment failed:', error);
      showToast('Failed to assign Water peripheral', 'error');
    } finally {
      setBindingSaving(false);
    }
  };

  const clearWaterPeripheral = async () => {
    if (!credentialFarmbot || !waterBinding) return;
    if (!confirm(`Remove Water assignment from "${waterBinding.peripheralLabel}"?`)) return;

    setBindingSaving(true);
    try {
      const response = await fetch(
        `/api/threed/farmbots/${credentialFarmbot.id}/peripheral-bindings?semanticAction=water`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      if (data.success) {
        setWaterBinding(null);
        setBindingValidation(null);
        showToast('Water peripheral assignment removed', 'success');
      } else {
        showToast(data.error || 'Failed to remove Water peripheral assignment', 'error');
      }
    } catch (error) {
      console.error('FarmBot Water peripheral removal failed:', error);
      showToast('Failed to remove Water peripheral assignment', 'error');
    } finally {
      setBindingSaving(false);
    }
  };

  const validateWaterPeripheral = async () => {
    if (!credentialFarmbot || !waterBinding) return;

    setBindingValidating(true);
    setBindingValidation(null);
    try {
      const response = await fetch(
        `/api/threed/farmbots/${credentialFarmbot.id}/peripheral-bindings/validate?semanticAction=water`,
        { cache: 'no-store' }
      );
      const data = await response.json();
      if (data.success) {
        const validation = data.data as FarmBotBindingValidation;
        setBindingValidation(validation);
        showToast(
          validation.valid
            ? 'Water peripheral assignment is current'
            : 'Water peripheral assignment requires review',
          validation.valid ? 'success' : 'error'
        );
      } else {
        showToast(data.error || 'Failed to validate Water peripheral assignment', 'error');
      }
    } catch (error) {
      console.error('FarmBot Water peripheral validation failed:', error);
      showToast('Failed to validate Water peripheral assignment', 'error');
    } finally {
      setBindingValidating(false);
    }
  };

  const renderActions = (farmbot: Farmbot) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" onClick={() => openEditDialog(farmbot)}>
        <Edit className="w-4 h-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => openCredentialDialog(farmbot)}>
            <KeyRound className="w-4 h-4 mr-2" />
            FarmBot Connection
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActivityFarmbot(farmbot)}>
            <Activity className="w-4 h-4 mr-2" />
            MQTT Activity
          </DropdownMenuItem>
          {farmbot.positionX && farmbot.positionZ && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                ({farmbot.positionX}, {farmbot.positionZ})
              </span>
            </DropdownMenuItem>
          )}
          {farmbot.batteryLevel !== null && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Battery className="w-3 h-3" />
                {farmbot.batteryLevel}%
              </span>
            </DropdownMenuItem>
          )}
          {farmbot.firmwareVersion && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                FW: {farmbot.firmwareVersion}
              </span>
            </DropdownMenuItem>
          )}
          {farmbot.apiUrl && (
            <DropdownMenuItem>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                {farmbot.apiUrl}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(farmbot.id, farmbot.name)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {ToastComponent}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium">FarmBots</span>
          <Badge variant="secondary" className="text-xs">
            {filteredFarmbots.length}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Add FarmBot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New FarmBot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Basic Info */}
              <div>
                <Label htmlFor="assetCode">Asset code *</Label>
                <Input
                  id="assetCode"
                  placeholder="e.g., FARMBOT-003"
                  value={formData.assetCode}
                  onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <Label htmlFor="name">FarmBot Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Main Garden Bot"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {FARMBOT_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="batteryLevel">Battery Level (%)</Label>
                  <Input
                    id="batteryLevel"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="85"
                    value={formData.batteryLevel}
                    onChange={(e) => setFormData({ ...formData, batteryLevel: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Location</Label>
                <div className="space-y-2 mt-2">
                  <div>
                    <Label htmlFor="bedId" className="text-xs">Bed</Label>
                    <Select
                      value={formData.bedId}
                      onValueChange={(value) => setFormData({ ...formData, bedId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a bed (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {beds.map((bed) => (
                          <SelectItem key={bed.id} value={String(bed.id)}>
                            {bed.name} ({bed.bedId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">3D Position</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <Input
                        placeholder="X"
                        type="number"
                        step="0.01"
                        value={formData.positionX}
                        onChange={(e) => setFormData({ ...formData, positionX: e.target.value })}
                        disabled={isSubmitting}
                      />
                      <Input
                        placeholder="Y"
                        type="number"
                        step="0.01"
                        value={formData.positionY}
                        onChange={(e) => setFormData({ ...formData, positionY: e.target.value })}
                        disabled={isSubmitting}
                      />
                      <Input
                        placeholder="Z"
                        type="number"
                        step="0.01"
                        value={formData.positionZ}
                        onChange={(e) => setFormData({ ...formData, positionZ: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* API Configuration */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">API Configuration</Label>
                <div className="space-y-2 mt-2">
                  <div>
                    <Label htmlFor="apiUrl" className="text-xs">API URL</Label>
                    <Input
                      id="apiUrl"
                      placeholder="https://my.farmbot.io/api"
                      value={formData.apiUrl}
                      onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Credentials will be configured through the secure FarmBot connection workflow.
                  </p>
                </div>
              </div>

              {/* Firmware & Last Seen */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">System Info</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label htmlFor="firmwareVersion" className="text-xs">Firmware Version</Label>
                    <Input
                      id="firmwareVersion"
                      placeholder="v1.2.3"
                      value={formData.firmwareVersion}
                      onChange={(e) => setFormData({ ...formData, firmwareVersion: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastSeen" className="text-xs">Last Seen</Label>
                    <Input
                      id="lastSeen"
                      type="date"
                      value={formData.lastSeen}
                      onChange={(e) => setFormData({ ...formData, lastSeen: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              {/* Active Status */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create FarmBot'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, device ID, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {FARMBOT_STATUS_OPTIONS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" />
            <SelectValue placeholder="Active" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => {
            setSearchQuery('');
            setFilterStatus('all');
            setFilterActive('all');
            fetchFarmbots();
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* FarmBots Table */}
      {filteredFarmbots.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg">
          <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No FarmBots found</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 px-2 text-xs"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Create your first FarmBot
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs py-1">Name</TableHead>
                <TableHead className="hidden sm:table-cell text-xs py-1">Asset code</TableHead>
                <TableHead className="hidden md:table-cell text-xs py-1">Status</TableHead>
                <TableHead className="hidden lg:table-cell text-xs py-1">Battery</TableHead>
                <TableHead className="hidden xl:table-cell text-xs py-1">Position</TableHead>
                <TableHead className="text-center text-xs py-1">Active</TableHead>
                <TableHead className="text-right text-xs py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFarmbots.map((farmbot) => (
                <TableRow key={farmbot.id} className="hover:bg-muted/50">
                  <TableCell className="py-1 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Bot className="w-3.5 h-3.5 text-slate-500" />
                      {farmbot.name}
                      {farmbot.credentialConfigured && (
                        <Badge variant="secondary" className="text-[10px]">Credential stored</Badge>
                      )}
                      {!farmbot.isActive && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-1 text-xs font-mono text-muted-foreground">
                    {farmbot.assetCode || '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-1 text-sm text-muted-foreground">
                    <Badge className={`text-[10px] ${getStatusColor(farmbot.status)}`}>
                      {getOptionLabel(FARMBOT_STATUS_OPTIONS, farmbot.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-1 text-sm text-muted-foreground">
                    {farmbot.batteryLevel !== null ? (
                      <div className="flex items-center gap-1.5">
                        {getBatteryIcon(farmbot.batteryLevel)}
                        <Badge className={`text-[10px] ${getBatteryColor(farmbot.batteryLevel)}`}>
                          {farmbot.batteryLevel}%
                        </Badge>
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell py-1 text-xs font-mono text-muted-foreground">
                    {farmbot.positionX && farmbot.positionZ ? (
                      `(${farmbot.positionX}, ${farmbot.positionZ})`
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-center py-1">
                    <Badge className={`text-[10px] ${farmbot.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {farmbot.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1 text-right">{renderActions(farmbot)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingFarmbot} onOpenChange={(open) => !open && setEditingFarmbot(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit FarmBot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-assetCode">Asset code *</Label>
              <Input
                id="edit-assetCode"
                value={formData.assetCode}
                onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="edit-name">FarmBot Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {FARMBOT_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-batteryLevel">Battery Level (%)</Label>
                <Input
                  id="edit-batteryLevel"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.batteryLevel}
                  onChange={(e) => setFormData({ ...formData, batteryLevel: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Location */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Location</Label>
              <div className="space-y-2 mt-2">
                <div>
                  <Label htmlFor="edit-bedId" className="text-xs">Bed</Label>
                  <Select
                    value={formData.bedId}
                    onValueChange={(value) => setFormData({ ...formData, bedId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a bed (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {beds.map((bed) => (
                        <SelectItem key={bed.id} value={String(bed.id)}>
                          {bed.name} ({bed.bedId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">3D Position</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <Input
                      placeholder="X"
                      type="number"
                      step="0.01"
                      value={formData.positionX}
                      onChange={(e) => setFormData({ ...formData, positionX: e.target.value })}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="Y"
                      type="number"
                      step="0.01"
                      value={formData.positionY}
                      onChange={(e) => setFormData({ ...formData, positionY: e.target.value })}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="Z"
                      type="number"
                      step="0.01"
                      value={formData.positionZ}
                      onChange={(e) => setFormData({ ...formData, positionZ: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* API Configuration */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">API Configuration</Label>
              <div className="space-y-2 mt-2">
                <div>
                  <Label htmlFor="edit-apiUrl" className="text-xs">API URL</Label>
                  <Input
                    id="edit-apiUrl"
                    value={formData.apiUrl}
                    onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Credentials will be configured through the secure FarmBot connection workflow.
                </p>
              </div>
            </div>

            {/* Firmware & Last Seen */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">System Info</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Label htmlFor="edit-firmwareVersion" className="text-xs">Firmware Version</Label>
                  <Input
                    id="edit-firmwareVersion"
                    value={formData.firmwareVersion}
                    onChange={(e) => setFormData({ ...formData, firmwareVersion: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-lastSeen" className="text-xs">Last Seen</Label>
                  <Input
                    id="edit-lastSeen"
                    type="date"
                    value={formData.lastSeen}
                    onChange={(e) => setFormData({ ...formData, lastSeen: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                disabled={isSubmitting}
              />
            </div>

            {/* Active Status */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  disabled={isSubmitting}
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>
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

      <Dialog
        open={!!credentialFarmbot}
        onOpenChange={(open) => !open && !credentialSaving && !connectionTesting
          && !peripheralsLoading && !bindingSaving
          && !bindingValidating && !brokerMetadataRefreshing && !mqttReadinessChecking
          && closeCredentialDialog()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>FarmBot Connection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{credentialFarmbot?.name}</span>
                <Badge variant={credentialConfigured ? 'secondary' : 'outline'}>
                  {credentialLoading
                    ? 'Checking…'
                    : credentialConfigured
                      ? 'Credential stored'
                      : 'Not configured'}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Stored means encrypted credentials are available. It does not confirm that the
                FarmBot is online or that a connection has been tested.
              </p>
              {credentialFarmbot?.farmbotDeviceId && credentialFarmbot.brokerDeviceId && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Verified identity: REST {credentialFarmbot.farmbotDeviceId} · MQTT{' '}
                  {credentialFarmbot.brokerDeviceId}
                </p>
              )}
              {credentialConfigured && !brokerMetadata && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={checkMqttReadiness}
                  disabled={credentialLoading || credentialSaving || connectionTesting
                    || mqttReadinessChecking}
                >
                  {mqttReadinessChecking && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Check MQTT readiness
                </Button>
              )}
            </div>

            {connectionSummary && (
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-950">
                <div className="flex items-center gap-2 font-medium">
                  <Wifi className="h-4 w-4" />
                  REST authentication verified
                </div>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                  <dt className="text-green-700">Device</dt>
                  <dd>{connectionSummary.name || `ID ${connectionSummary.deviceId}`}</dd>
                  <dt className="text-green-700">FarmBot device ID</dt>
                  <dd>{connectionSummary.deviceId}</dd>
                  <dt className="text-green-700">FarmBot OS</dt>
                  <dd>{connectionSummary.firmwareVersion || 'Not reported'}</dd>
                  <dt className="text-green-700">Timezone</dt>
                  <dd>{connectionSummary.timezone || 'Not reported'}</dd>
                  <dt className="text-green-700">Broker identity</dt>
                  <dd>{connectionSummary.brokerDeviceId || 'Not reported'}</dd>
                  <dt className="text-green-700">Credential expires</dt>
                  <dd>{connectionSummary.credentialExpiresAt
                    ? new Date(connectionSummary.credentialExpiresAt).toLocaleString()
                    : 'Not reported'}</dd>
                  <dt className="text-green-700">Last API contact</dt>
                  <dd>{connectionSummary.lastSawApi || 'Not reported'}</dd>
                  <dt className="text-green-700">Last broker contact</dt>
                  <dd>{connectionSummary.lastSawMessageBroker || 'Not reported'}</dd>
                </dl>
                <p className="mt-2 text-xs text-green-700">
                  This verifies the Web App API only, not physical device connectivity.
                </p>
              </div>
            )}

            {brokerMetadata && (
              <div className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-medium">Broker metadata snapshot</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={brokerMetadata.restVerifiedAt ? 'secondary' : 'outline'}>
                      {brokerMetadata.restVerifiedAt ? 'REST verified' : 'Unverified'}
                    </Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={refreshBrokerMetadata}
                      disabled={credentialLoading || credentialSaving || connectionTesting
                        || peripheralsLoading || bindingSaving || bindingValidating
                        || brokerMetadataRefreshing || mqttReadinessChecking}
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${
                        brokerMetadataRefreshing ? 'animate-spin' : ''
                      }`} />
                      Refresh
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={checkMqttReadiness}
                      disabled={credentialLoading || credentialSaving || connectionTesting
                        || peripheralsLoading || bindingSaving || bindingValidating
                        || brokerMetadataRefreshing || mqttReadinessChecking}
                    >
                      {mqttReadinessChecking && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Readiness
                    </Button>
                  </div>
                </div>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                  <dt className="text-muted-foreground">MQTT host</dt>
                  <dd className="break-all">{brokerMetadata.mqttHost}</dd>
                  <dt className="text-muted-foreground">MQTT WebSocket</dt>
                  <dd className="break-all">{brokerMetadata.mqttWsUrl}</dd>
                  <dt className="text-muted-foreground">Broker identity</dt>
                  <dd>{brokerMetadata.brokerDeviceId || 'Not verified'}</dd>
                  <dt className="text-muted-foreground">Vhost</dt>
                  <dd>{brokerMetadata.vhost}</dd>
                  <dt className="text-muted-foreground">Token issued</dt>
                  <dd>{new Date(brokerMetadata.tokenIssuedAt).toLocaleString()}</dd>
                  <dt className="text-muted-foreground">Token expires</dt>
                  <dd>{new Date(brokerMetadata.tokenExpiresAt).toLocaleString()}</dd>
                  <dt className="text-muted-foreground">Observed</dt>
                  <dd>{new Date(brokerMetadata.observedAt).toLocaleString()}</dd>
                  <dt className="text-muted-foreground">REST verified</dt>
                  <dd>{brokerMetadata.restVerifiedAt
                    ? new Date(brokerMetadata.restVerifiedAt).toLocaleString()
                    : 'Not yet'}</dd>
                </dl>
                <p className="mt-2 text-xs text-muted-foreground">
                  The encrypted token remains the connection source of truth. This snapshot is
                  retained for diagnostics and must be refreshed when credentials change.
                </p>
              </div>
            )}

            {mqttReadiness && (
              <div className={`rounded-md border p-3 text-sm ${
                mqttReadiness.ready
                  ? 'border-green-200 bg-green-50 text-green-950'
                  : 'border-amber-200 bg-amber-50 text-amber-950'
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">MQTT worker readiness</span>
                  <Badge variant={mqttReadiness.ready ? 'secondary' : 'outline'}>
                    {mqttReadiness.ready ? 'Ready' : 'Not ready'}
                  </Badge>
                </div>
                {mqttReadiness.issues.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">
                    {mqttReadiness.issues.map((issue) => (
                      <li key={issue}>{MQTT_READINESS_ISSUE_LABELS[issue]}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-xs opacity-80">
                  Configuration readiness only. No MQTT socket or physical-device connection was
                  attempted.
                </p>
              </div>
            )}

            {credentialConfigured && (
              <div className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Configured peripherals</p>
                    <p className="text-xs text-muted-foreground">
                      Read-only output hardware metadata from FarmBot.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={discoverPeripherals}
                    disabled={credentialLoading || credentialSaving || connectionTesting
                      || peripheralsLoading || brokerMetadataRefreshing}
                  >
                    {peripheralsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Discover
                  </Button>
                </div>
                {waterBinding && (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-xs">
                    <div>
                      <span className="font-medium">Water assignment:</span>{' '}
                      {waterBinding.peripheralLabel} · Pin {waterBinding.peripheralPin}
                      {bindingValidation && (
                        <Badge
                          variant={bindingValidation.valid ? 'secondary' : 'outline'}
                          className="ml-2"
                        >
                          {bindingValidation.valid
                            ? 'Current'
                            : bindingValidation.reason === 'peripheral_missing'
                              ? 'Missing'
                              : bindingValidation.reason === 'metadata_changed'
                                ? 'Changed'
                                : 'Inactive'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={validateWaterPeripheral}
                        disabled={bindingSaving || bindingValidating || brokerMetadataRefreshing}
                      >
                        {bindingValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Validate
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={clearWaterPeripheral}
                        disabled={bindingSaving || bindingValidating || brokerMetadataRefreshing}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
                {peripheralInventory && (
                  peripheralInventory.peripherals.length ? (
                    <div className="max-h-40 space-y-1 overflow-y-auto border-t pt-2">
                      {peripheralInventory.peripherals.map((peripheral) => (
                        <div
                          key={peripheral.id}
                          className="flex items-center justify-between gap-3 rounded px-1 py-1 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="block truncate">{peripheral.label}</span>
                            <span className="text-muted-foreground">
                              Pin {peripheral.pin} · Mode {peripheral.mode}
                            </span>
                          </div>
                          {waterBinding?.peripheralId === peripheral.id ? (
                            <Badge variant="secondary" className="shrink-0">Water</Badge>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => assignWaterPeripheral(peripheral.id)}
                              disabled={bindingSaving || bindingValidating
                                || brokerMetadataRefreshing}
                            >
                              Assign to Water
                            </Button>
                          )}
                        </div>
                      ))}
                      {peripheralInventory.truncated && (
                        <p className="text-xs text-muted-foreground">
                          Showing 100 of {peripheralInventory.totalCount} peripherals.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="border-t pt-2 text-xs text-muted-foreground">
                      No peripherals are configured in FarmBot.
                    </p>
                  )
                )}
              </div>
            )}

            <div className="flex rounded-md border p-1">
              <Button
                type="button"
                size="sm"
                variant={credentialMode === 'login' ? 'secondary' : 'ghost'}
                className="flex-1"
                onClick={() => setCredentialMode('login')}
                disabled={credentialSaving || connectionTesting || peripheralsLoading
                  || bindingSaving || brokerMetadataRefreshing}
              >
                FarmBot login
              </Button>
              <Button
                type="button"
                size="sm"
                variant={credentialMode === 'token' ? 'secondary' : 'ghost'}
                className="flex-1"
                onClick={() => setCredentialMode('token')}
                disabled={credentialSaving || connectionTesting || peripheralsLoading
                  || bindingSaving || brokerMetadataRefreshing}
              >
                Existing token
              </Button>
            </div>

            {credentialMode === 'login' ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="farmbot-email">FarmBot account email</Label>
                  <Input
                    id="farmbot-email"
                    type="email"
                    autoComplete="username"
                    value={farmBotEmail}
                    onChange={(event) => setFarmBotEmail(event.target.value)}
                    disabled={credentialLoading || credentialSaving || connectionTesting
                      || peripheralsLoading || bindingSaving || brokerMetadataRefreshing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="farmbot-password">FarmBot account password</Label>
                  <Input
                    id="farmbot-password"
                    type="password"
                    autoComplete="current-password"
                    value={farmBotPassword}
                    onChange={(event) => setFarmBotPassword(event.target.value)}
                    disabled={credentialLoading || credentialSaving || connectionTesting
                      || peripheralsLoading || bindingSaving || brokerMetadataRefreshing}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your password is sent once to FarmBot to generate a token. This App does not
                  store it, and the generated token is encrypted without returning it here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="farmbot-credential">
                  {credentialConfigured ? 'Replace credential' : 'Credential'}
                </Label>
                <Input
                  id="farmbot-credential"
                  type="password"
                  autoComplete="new-password"
                  value={credentialInput}
                  onChange={(event) => setCredentialInput(event.target.value)}
                  placeholder="Paste a FarmBot API token"
                  disabled={credentialLoading || credentialSaving || connectionTesting
                    || peripheralsLoading || bindingSaving || brokerMetadataRefreshing}
                />
                <p className="text-xs text-muted-foreground">
                  Existing credentials are never displayed. Saving replaces any stored credential.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <div className="flex flex-wrap gap-2">
                {credentialConfigured && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={testStoredCredential}
                      disabled={credentialLoading || credentialSaving || connectionTesting
                        || peripheralsLoading || bindingSaving || brokerMetadataRefreshing}
                    >
                      {connectionTesting
                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        : <Wifi className="mr-2 h-4 w-4" />}
                      Test
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={disconnectCredential}
                      disabled={credentialLoading || credentialSaving || connectionTesting
                        || peripheralsLoading || bindingSaving || brokerMetadataRefreshing}
                    >
                      <Unplug className="mr-2 h-4 w-4" />
                      Disconnect
                    </Button>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeCredentialDialog}
                  disabled={credentialSaving || connectionTesting || peripheralsLoading
                    || bindingSaving || bindingValidating || brokerMetadataRefreshing
                    || mqttReadinessChecking}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={credentialMode === 'login' ? generateCredentialFromLogin : saveCredential}
                  disabled={credentialLoading || credentialSaving || connectionTesting
                    || peripheralsLoading || bindingSaving || bindingValidating
                    || brokerMetadataRefreshing || mqttReadinessChecking || (
                    credentialMode === 'login'
                      ? !farmBotEmail.trim() || !farmBotPassword
                      : !credentialInput.trim()
                  )}
                >
                  {credentialSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {credentialMode === 'login'
                    ? credentialConfigured ? 'Generate replacement' : 'Generate and store'
                    : credentialConfigured ? 'Replace' : 'Store securely'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FarmBotMqttActivityDialog
        farmbot={activityFarmbot}
        onClose={() => setActivityFarmbot(null)}
      />
    </div>
  );
}
