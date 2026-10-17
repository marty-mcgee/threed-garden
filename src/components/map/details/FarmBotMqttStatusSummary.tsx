'use client';

import { Loader2 } from 'lucide-react';
import { useFarmBotLiveState } from '@/components/map/hooks/useFarmBotLiveState';
import { DetailsCardSection } from './DetailsCardSection';
import { KvRow } from './DetailsCardRow';

function formatMqttDate(value: string | null): string {
  return value ? new Date(value).toLocaleString() : 'Never';
}


export function FarmBotMqttStatusSummary({
  farmbotId,
  projectId,
}: {
  farmbotId: number;
  projectId: string | null;
}) {
  const { state: runtime, loading, error } = useFarmBotLiveState({
    farmbotId,
    projectId,
  });

  return (
    <DetailsCardSection
      title="Live FarmBot State"
      summaryAside={loading ? (
          <Loader2 className="h-3 w-3 animate-spin text-foreground/40" />
        ) : runtime ? (
          <div className="flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${runtime.condition === 'live' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-[10px] capitalize text-foreground/70">{runtime.condition}</span>
          </div>
        ) : (
          <span className="text-[10px] text-foreground/35">{error ? 'Unavailable' : 'No recorded status'}</span>
        )}
    >
      {runtime && (
        <div className="space-y-0.5">
          <KvRow label="State" value={runtime.connectionState ?? 'Unavailable'} />
          <KvRow label="Source" value="FarmBot MQTT" />
          <KvRow label="Changed" value={formatMqttDate(runtime.stateChangedAt)} />
          <KvRow label="Observed" value={formatMqttDate(runtime.observedAt)} />
          <KvRow
            label="Device"
            value={runtime.position
              ? `X:${runtime.position.x.toFixed(1)} Y:${runtime.position.y.toFixed(1)} Z:${runtime.position.z.toFixed(1)}`
              : 'Position not recorded'}
          />
        </div>
      )}
    </DetailsCardSection>
  );
}


