// src/components/admin/threed/models/ThreeDModelAnimations.tsx — v0.16.5b
// Admin UI to map a model's embedded GLB/FBX animation clips to the app's
// logical animation actions. Saving persists to threed_models.metadata.animationMap.
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Box, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { ANIMATION_ACTIONS } from '@/lib/utils/animation';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

interface Model {
  id: number;
  modelName: string;
  modelType: string;
  filePath: string;
  metadata?: any;
}

export function ThreeDModelAnimations() {
  const { showToast, ToastComponent } = useToast();
  const [models, setModels] = useState<Model[]>([]);
  const [modelId, setModelId] = useState<string>('');
  const [clips, setClips] = useState<string[]>([]);
  const [loadingClips, setLoadingClips] = useState(false);
  const [saving, setSaving] = useState(false);
  // action -> clipName (or '' = auto-detect, 'none' = none)
  const [map, setMap] = useState<Record<string, string>>({});

  const selectedModel = useMemo(() => models.find((m) => String(m.id) === modelId), [models, modelId]);

  useEffect(() => {
    fetch('/api/threed/models?limit=200')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) {
          setModels(d.data);
          if (d.data.length && !modelId) setModelId(String(d.data[0].id));
        }
      })
      .catch(() => showToast('Failed to load models', 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load clips for the selected model.
  useEffect(() => {
    if (!selectedModel?.filePath) { setClips([]); setMap({}); return; }
    let cancelled = false;
    setLoadingClips(true);
    (async () => {
      try {
        const type = selectedModel.modelType?.toLowerCase() || 'glb';
        let obj: any;
        if (type === 'fbx') {
          obj = await new FBXLoader().loadAsync(selectedModel.filePath);
        } else {
          obj = (await new GLTFLoader().loadAsync(selectedModel.filePath)).scene;
        }
        const names = ((obj as any).animations || []).map((a: any) => a.name).filter(Boolean);
        if (cancelled) return;

        // Initialize map from existing saved metadata (action -> clip).
        const saved = selectedModel.metadata?.animationMap;
        const initial: Record<string, string> = {};
        if (saved && typeof saved === 'object') {
          for (const [action, clip] of Object.entries(saved)) {
            if (typeof clip === 'string') initial[action] = clip;
          }
        }
        setClips(names);
        setMap(initial);
      } catch (e) {
        if (!cancelled) {
          showToast(`Could not load clips: ${String(e)}`, 'error');
          setClips([]);
          setMap({});
        }
      } finally {
        if (!cancelled) setLoadingClips(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId, selectedModel?.filePath]);

  async function handleSave() {
    if (!selectedModel) return;
    setSaving(true);
    try {
      const animationMap: Record<string, string> = {};
      for (const action of ANIMATION_ACTIONS) {
        const v = map[action];
        if (v && v !== 'auto' && v !== 'none') animationMap[action] = v;
      }
      // Preserve other metadata fields.
      const metadata = { ...(selectedModel.metadata || {}), animationMap };
      const res = await fetch(`/api/threed/models?id=${selectedModel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Animation mapping saved', 'success');
      } else {
        showToast(data.error || 'Failed to save', 'error');
      }
    } catch (e) {
      showToast(`Save failed: ${String(e)}`, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {ToastComponent}

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[260px] flex-1">
          <Label className="text-xs">Model</Label>
          <Select value={modelId} onValueChange={setModelId}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select a model" /></SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>{m.modelName} ({m.modelType})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="h-8 text-xs" onClick={handleSave} disabled={!selectedModel || saving || loadingClips}>
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Save Mapping
        </Button>
      </div>

      {selectedModel && (
        <div className="flex flex-wrap items-center gap-2 rounded border px-2 py-1.5 bg-muted/30">
          <Box className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-medium">{selectedModel.modelName}</span>
          <Badge variant="outline" className="text-[10px]">{clips.length} clips</Badge>
          <span className="text-[10px] text-muted-foreground truncate max-w-[260px]">{selectedModel.filePath}</span>
        </div>
      )}

      {loadingClips ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : clips.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg">
          <p>No animation clips found in this model</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="grid grid-cols-[minmax(140px,1fr)_minmax(200px,1.5fr)] border-b bg-muted/40 px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            <span>App Action</span>
            <span>Model Clip</span>
          </div>
          <div className="divide-y">
            {ANIMATION_ACTIONS.map((action) => (
              <div key={action} className="grid grid-cols-[minmax(140px,1fr)_minmax(200px,1.5fr)] items-center px-2 py-1">
                <span className="text-xs capitalize">{action.replace(/_/g, ' ')}</span>
                <Select
                  value={map[action] ?? 'auto'}
                  onValueChange={(v) => setMap((prev) => ({ ...prev, [action]: v }))}
                >
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                    {clips.map((clip) => (
                      <SelectItem key={clip} value={clip}>{clip}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}