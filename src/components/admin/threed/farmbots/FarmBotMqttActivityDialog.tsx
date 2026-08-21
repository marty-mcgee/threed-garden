'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, Loader2, Play, RefreshCw, Square, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';

interface FarmBotSummary {
  id: number;
  name: string;
  assetCode: string;
}

interface FarmBotMqttRuntime {
  brokerDeviceId: string;
  workerSessionId: string;
  connectionState: string;
  stateChangedAt: string;
  lastMessageAt: string | null;
  lastStatusAt: string | null;
  positionX: string | null;
  positionY: string | null;
  positionZ: string | null;
  tokenExpiresAt: string;
  isStale: boolean;
  reconnectAttempts: number;
  invalidMessageCount: number;
  errorCode: string | null;
}

interface FarmBotMqttEvent {
  id: number;
  eventId: string;
  source: string;
  eventType: string;
  connectionState: string | null;
  outcome: string | null;
  rpcLabel: string | null;
  errorCode: string | null;
  positionX: string | null;
  positionY: string | null;
  positionZ: string | null;
  summary: string;
  payloadBytes: number;
  payloadSha256: string;
  occurredAt: string;
}

const EVENT_SOURCES = [
  { value: 'all', label: 'All sources' },
  { value: 'lifecycle', label: 'Lifecycle' },
  { value: 'status', label: 'Status' },
  { value: 'from_device', label: 'From device' },
];

const EVENT_TYPES = [
  { value: 'all', label: 'All event types' },
  { value: 'connection_state', label: 'Connection state' },
  { value: 'position', label: 'Position' },
  { value: 'rpc_ok', label: 'RPC acknowledged' },
  { value: 'rpc_error', label: 'RPC rejected' },
  { value: 'invalid_message_summary', label: 'Invalid message summary' },
];

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString() : 'Never';
}

function runtimeBadgeVariant(state: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (state === 'connected') return 'default';
  if (state === 'error' || state === 'expired') return 'destructive';
  if (state === 'connecting' || state === 'reconnecting') return 'secondary';
  return 'outline';
}

export function FarmBotMqttActivityPanel({
  farmbot,
  onClose,
}: {
  farmbot: FarmBotSummary;
  onClose: () => void;
}) {
  const { showToast, ToastComponent } = useToast();
  const [runtime, setRuntime] = useState<FarmBotMqttRuntime | null>(null);
  const [events, setEvents] = useState<FarmBotMqttEvent[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [source, setSource] = useState('all');
  const [eventType, setEventType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sessionChanging, setSessionChanging] = useState<'start' | 'stop' | null>(null);

  const loadActivity = useCallback(async (append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (source !== 'all') params.set('source', source);
      if (eventType !== 'all') params.set('eventType', eventType);
      if (append && nextCursor) params.set('beforeId', String(nextCursor));

      const [runtimeResponse, eventsResponse] = await Promise.all([
        append
          ? Promise.resolve(null)
          : fetch(`/api/threed/farmbots/${farmbot.id}/mqtt-runtime`, { cache: 'no-store' }),
        fetch(`/api/threed/farmbots/${farmbot.id}/mqtt-events?${params}`, {
          cache: 'no-store',
        }),
      ]);
      const runtimeData = runtimeResponse ? await runtimeResponse.json() : null;
      const eventsData = await eventsResponse.json();

      if (runtimeData && !runtimeData.success) throw new Error(runtimeData.error);
      if (!eventsData.success) throw new Error(eventsData.error);
      if (runtimeData) setRuntime(runtimeData.data as FarmBotMqttRuntime | null);
      const nextEvents = Array.isArray(eventsData.data)
        ? eventsData.data as FarmBotMqttEvent[]
        : [];
      setEvents((current) => append ? [...current, ...nextEvents] : nextEvents);
      setNextCursor(eventsData.nextCursor ?? null);
    } catch (error) {
      console.error('Failed to load FarmBot MQTT activity', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToast('Failed to load FarmBot MQTT activity', 'error');
      if (!append) {
        setRuntime(null);
        setEvents([]);
        setNextCursor(null);
      }
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  }, [eventType, farmbot, nextCursor, showToast, source]);

  useEffect(() => {
    setRuntime(null);
    setEvents([]);
    setNextCursor(null);
    void loadActivity(false);
    // nextCursor changes during pagination and must not restart the first-page request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmbot, source, eventType]);

  const deleteHistory = async () => {
    if (!confirm(`Delete all MQTT event history for "${farmbot.name}"?`)) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/threed/farmbots/${farmbot.id}/mqtt-events?all=true`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      setEvents([]);
      setNextCursor(null);
      showToast(`Deleted ${data.data.deleted} MQTT event record(s)`, 'success');
    } catch (error) {
      console.error('Failed to delete FarmBot MQTT activity', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToast('Failed to delete FarmBot MQTT activity', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const changeSession = async (action: 'start' | 'stop') => {
    setSessionChanging(action);
    try {
      const response = await fetch(`/api/threed/farmbots/${farmbot.id}/mqtt-session`, {
        method: action === 'start' ? 'POST' : 'DELETE',
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error);
      showToast(
        action === 'start'
          ? 'Read-only MQTT session started'
          : 'Read-only MQTT session stopped',
        'success'
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
      await loadActivity(false);
    } catch (error) {
      console.error('Failed to change FarmBot MQTT session', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      showToast(
        error instanceof Error ? error.message : 'Failed to change MQTT session',
        'error'
      );
    } finally {
      setSessionChanging(null);
    }
  };

  return (
    <div className="space-y-3">
      {ToastComponent}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <h3 className="flex items-center gap-2 font-semibold">
            <Activity className="h-5 w-5" />
            MQTT Activity — {farmbot.name}
        </h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"
          onClick={onClose}
        >
          <X className="mr-1 h-4 w-4" />
          Close
        </Button>
      </div>

      <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Normalized worker lifecycle and broker events. Credentials, complete status trees,
            and raw MQTT payloads are never stored here.
          </p>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Current worker status</span>
                    {runtime ? (
                      <Badge variant={runtimeBadgeVariant(runtime.connectionState)}>
                        {runtime.connectionState}
                      </Badge>
                    ) : (
                      <Badge variant="outline">No recorded status</Badge>
                    )}
                    {runtime?.isStale && <Badge variant="outline">Stale</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                      onClick={() => changeSession('start')}
                      disabled={sessionChanging !== null}
                    >
                      {sessionChanging === 'start'
                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        : <Play className="mr-2 h-4 w-4" />}
                      Start read-only
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                      onClick={() => changeSession('stop')}
                      disabled={sessionChanging !== null}
                    >
                      {sessionChanging === 'stop'
                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        : <Square className="mr-2 h-4 w-4" />}
                      Stop
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                      onClick={() => loadActivity(false)}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                  </div>
                </div>
                {runtime && (
                  <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-[auto_1fr_auto_1fr]">
                    <dt className="text-muted-foreground">Broker identity</dt>
                    <dd>{runtime.brokerDeviceId}</dd>
                    <dt className="text-muted-foreground">State changed</dt>
                    <dd>{formatDate(runtime.stateChangedAt)}</dd>
                    <dt className="text-muted-foreground">Last message</dt>
                    <dd>{formatDate(runtime.lastMessageAt)}</dd>
                    <dt className="text-muted-foreground">Last status</dt>
                    <dd>{formatDate(runtime.lastStatusAt)}</dd>
                    <dt className="text-muted-foreground">Position</dt>
                    <dd>{runtime.positionX !== null
                      ? `X ${runtime.positionX}, Y ${runtime.positionY}, Z ${runtime.positionZ}`
                      : 'Not recorded'}</dd>
                    <dt className="text-muted-foreground">Token expires</dt>
                    <dd>{formatDate(runtime.tokenExpiresAt)}</dd>
                    <dt className="text-muted-foreground">Reconnect attempts</dt>
                    <dd>{runtime.reconnectAttempts}</dd>
                    <dt className="text-muted-foreground">Invalid messages</dt>
                    <dd>{runtime.invalidMessageCount}</dd>
                    {runtime.errorCode && (
                      <>
                        <dt className="text-muted-foreground">Last error</dt>
                        <dd>{runtime.errorCode}</dd>
                      </>
                    )}
                  </dl>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_SOURCES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger className="w-[190px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="ml-auto border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                  size="sm"
                  variant="outline"
                  onClick={deleteHistory}
                  disabled={deleting || events.length === 0}
                >
                  {deleting
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <Trash2 className="mr-2 h-4 w-4" />}
                  Clear history
                </Button>
              </div>

              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Time</TableHead>
                      <TableHead className="text-xs">Source</TableHead>
                      <TableHead className="text-xs">Event</TableHead>
                      <TableHead className="text-xs">Summary</TableHead>
                      <TableHead className="text-right text-xs">Bytes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                          No MQTT activity has been recorded for this FarmBot.
                        </TableCell>
                      </TableRow>
                    ) : events.map((event) => (
                      <TableRow key={event.eventId}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {formatDate(event.occurredAt)}
                        </TableCell>
                        <TableCell><Badge variant="outline">{event.source}</Badge></TableCell>
                        <TableCell className="text-xs">{event.eventType}</TableCell>
                        <TableCell className="max-w-[360px] text-xs">
                          <div>{event.summary}</div>
                          {event.rpcLabel && (
                            <div className="truncate font-mono text-[10px] text-muted-foreground">
                              RPC {event.rpcLabel}
                            </div>
                          )}
                          <div className="truncate font-mono text-[10px] text-muted-foreground">
                            SHA-256 {event.payloadSha256}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs">{event.payloadBytes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {nextCursor && (
                <div className="flex justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    onClick={() => loadActivity(true)}
                    disabled={loadingMore}
                  >
                    {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Load older events
                  </Button>
                </div>
              )}
            </>
          )}
      </div>
    </div>
  );
}
