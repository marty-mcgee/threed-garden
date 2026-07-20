// components/admin/traffic/bayarea511/TrafficBayArea511CRUD.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  CheckCircle,
  XCircle,
  Radio,
  MoreHorizontal,
  ExternalLink,
  Calendar,
  MapPin
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

interface BayArea511Event {
  id: number;
  eventId: string;
  title: string;
  description: string | null;
  eventType: string;
  status: string;
  severity: string;
  location: string;
  route: string | null;
  direction: string | null;
  latitude: number | null;
  longitude: number | null;
  startTime: string | null;
  endTime: string | null;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface TrafficBayArea511CRUDProps {
  onModuleUpdate?: () => void;
}

export function TrafficBayArea511CRUD({ onModuleUpdate }: TrafficBayArea511CRUDProps) {
  const { showToast, ToastComponent } = useToast();
  const [events, setEvents] = useState<BayArea511Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<BayArea511Event | null>(null);
  const [formData, setFormData] = useState({
    eventId: '',
    title: '',
    description: '',
    eventType: 'accident',
    status: 'active',
    severity: 'moderate',
    location: '',
    route: '',
    direction: 'northbound',
    latitude: 37.7749,
    longitude: -122.4194,
    startTime: '',
    endTime: '',
    isActive: true,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/traffic/bay-area-511');
      const data = await response.json();
      if (data.success) {
        setEvents(data.data || []);
      } else {
        showToast(data.error || 'Failed to fetch events', 'error');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      showToast('Failed to fetch events', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.eventId || !formData.title || !formData.location) {
      showToast('Event ID, title, and location are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/traffic/bay-area-511', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: formData.eventId,
          title: formData.title,
          description: formData.description || null,
          eventType: formData.eventType,
          status: formData.status,
          severity: formData.severity,
          location: formData.location,
          route: formData.route || null,
          direction: formData.direction || null,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          startTime: formData.startTime || null,
          endTime: formData.endTime || null,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Event created successfully', 'success');
        setShowCreateDialog(false);
        setFormData({
          eventId: '',
          title: '',
          description: '',
          eventType: 'accident',
          status: 'active',
          severity: 'moderate',
          location: '',
          route: '',
          direction: 'northbound',
          latitude: 37.7749,
          longitude: -122.4194,
          startTime: '',
          endTime: '',
          isActive: true,
        });
        await fetchEvents();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to create event', 'error');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      showToast('Failed to create event', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingEvent) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/traffic/bay-area-511?id=${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: formData.eventId,
          title: formData.title,
          description: formData.description || null,
          eventType: formData.eventType,
          status: formData.status,
          severity: formData.severity,
          location: formData.location,
          route: formData.route || null,
          direction: formData.direction || null,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          startTime: formData.startTime || null,
          endTime: formData.endTime || null,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Event updated successfully', 'success');
        setEditingEvent(null);
        await fetchEvents();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to update event', 'error');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      showToast('Failed to update event', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete event "${title}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/traffic/bay-area-511?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        showToast('Event deleted successfully', 'success');
        await fetchEvents();
        if (onModuleUpdate) onModuleUpdate();
      } else {
        showToast(data.error || 'Failed to delete event', 'error');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('Failed to delete event', 'error');
    }
  };

  const renderActions = (event: BayArea511Event) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => viewEventDetails(event)}
      >
        <Radio className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => openEditDialog(event)}
      >
        <Edit className="w-4 h-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {event.latitude && event.longitude && (
            <DropdownMenuItem onClick={() => {
              window.open(
                `https://www.google.com/maps?q=${event.latitude},${event.longitude}`,
                '_blank'
              );
            }}>
              <MapPin className="w-4 h-4 mr-2" />
              View on Map
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleDelete(event.id, event.title)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const viewEventDetails = (event: BayArea511Event) => {
    showToast(
      `${event.title} - ${event.location}`,
      'info'
    );
  };

  const openEditDialog = (event: BayArea511Event) => {
    setEditingEvent(event);
    setFormData({
      eventId: event.eventId,
      title: event.title,
      description: event.description || '',
      eventType: event.eventType || 'accident',
      status: event.status || 'active',
      severity: event.severity || 'moderate',
      location: event.location,
      route: event.route || '',
      direction: event.direction || 'northbound',
      latitude: event.latitude || 37.7749,
      longitude: event.longitude || -122.4194,
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      isActive: event.isActive !== false,
    });
  };

  const getEventTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      accident: 'Accident',
      hazard: 'Hazard',
      road_closure: 'Road Closure',
      construction: 'Construction',
      special_event: 'Special Event',
      weather: 'Weather',
      other: 'Other',
    };
    return types[type] || type;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ToastComponent}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radio className="w-5 h-5 text-cyan-500" />
          <h3 className="text-sm font-semibold">Bay Area 511 Events</h3>
          <Badge variant="secondary" className="ml-2">
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </Badge>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New 511 Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="eventId">Event ID *</Label>
                <Input
                  id="eventId"
                  placeholder="e.g., 511-2024-001"
                  value={formData.eventId}
                  onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Event title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Event description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="eventType">Event Type</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value) => setFormData({ ...formData, eventType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accident">Accident</SelectItem>
                    <SelectItem value="hazard">Hazard</SelectItem>
                    <SelectItem value="road_closure">Road Closure</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="special_event">Special Event</SelectItem>
                    <SelectItem value="weather">Weather</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., I-880 near Oakland"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="route">Route</Label>
                  <Input
                    id="route"
                    placeholder="e.g., I-880"
                    value={formData.route}
                    onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="direction">Direction</Label>
                  <Select
                    value={formData.direction}
                    onValueChange={(value) => setFormData({ ...formData, direction: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="northbound">Northbound</SelectItem>
                      <SelectItem value="southbound">Southbound</SelectItem>
                      <SelectItem value="eastbound">Eastbound</SelectItem>
                      <SelectItem value="westbound">Westbound</SelectItem>
                      <SelectItem value="both">Both Directions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="cleared">Cleared</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => setFormData({ ...formData, severity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    placeholder="37.7749"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    placeholder="-122.4194"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  disabled={isSubmitting}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Event'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <Radio className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No events yet</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Create your first event
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">Location</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">
                  {event.title}
                  {event.severity && (
                    <Badge className={`ml-2 text-xs ${getSeverityColor(event.severity)}`}>
                      {event.severity.charAt(0).toUpperCase() + event.severity.slice(1)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {event.location}
                  {event.route && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({event.route})
                    </span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  <Badge variant="secondary" className="capitalize">
                    {getEventTypeLabel(event.eventType)}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {event.status === 'active' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : event.status === 'cleared' ? (
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm capitalize">
                      {event.status || 'Unknown'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {renderActions(event)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-eventId">Event ID *</Label>
              <Input
                id="edit-eventId"
                value={formData.eventId}
                onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-eventType">Event Type</Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) => setFormData({ ...formData, eventType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accident">Accident</SelectItem>
                  <SelectItem value="hazard">Hazard</SelectItem>
                  <SelectItem value="road_closure">Road Closure</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="special_event">Special Event</SelectItem>
                  <SelectItem value="weather">Weather</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-location">Location *</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-route">Route</Label>
                <Input
                  id="edit-route"
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-direction">Direction</Label>
                <Select
                  value={formData.direction}
                  onValueChange={(value) => setFormData({ ...formData, direction: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="northbound">Northbound</SelectItem>
                    <SelectItem value="southbound">Southbound</SelectItem>
                    <SelectItem value="eastbound">Eastbound</SelectItem>
                    <SelectItem value="westbound">Westbound</SelectItem>
                    <SelectItem value="both">Both Directions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="cleared">Cleared</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-severity">Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData({ ...formData, severity: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startTime">Start Time</Label>
                <Input
                  id="edit-startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-endTime">End Time</Label>
                <Input
                  id="edit-endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-latitude">Latitude</Label>
                <Input
                  id="edit-latitude"
                  type="number"
                  step="0.000001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-longitude">Longitude</Label>
                <Input
                  id="edit-longitude"
                  type="number"
                  step="0.000001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                disabled={isSubmitting}
              />
              <Label htmlFor="edit-isActive">Active</Label>
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