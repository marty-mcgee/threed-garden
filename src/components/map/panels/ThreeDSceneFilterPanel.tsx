'use client';

import { Filter, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const THREED_SCENE_FILTER_TYPES = [
  'Plantings',
  'Beds',
  'Characters',
  'FarmBots',
  'Models',
  'CHP CAD',
  'CalFire',
] as const;

interface ThreeDSceneFilterPanelProps {
  isOpen: boolean;
  text: string;
  activeOnly: boolean;
  assetType: string | null;
  onTextChange: (value: string) => void;
  onActiveOnlyChange: (value: boolean) => void;
  onAssetTypeChange: (value: string) => void;
  onClear: () => void;
}

export function ThreeDSceneFilterPanel({
  isOpen,
  text,
  activeOnly,
  assetType,
  onTextChange,
  onActiveOnlyChange,
  onAssetTypeChange,
  onClear,
}: ThreeDSceneFilterPanelProps) {
  if (!isOpen) return null;

  return (
    <Card className="border-primary/20">
      <CardContent className="p-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
          </div>

          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search markers by name..."
              value={text}
              onChange={(event) => onTextChange(event.target.value)}
              className="h-7 w-44 text-xs"
            />
            {text && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onTextChange('')}
                aria-label="Clear marker search"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <Switch
              checked={activeOnly}
              onCheckedChange={onActiveOnlyChange}
              id="active-only"
              className="scale-75"
            />
            <Label htmlFor="active-only" className="cursor-pointer text-xs">
              Active Only
            </Label>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Type:</span>
            {THREED_SCENE_FILTER_TYPES.map((type) => (
              <Badge
                key={type}
                variant={assetType === type ? 'default' : 'outline'}
                className="cursor-pointer text-[10px] hover:bg-muted"
                onClick={() => onAssetTypeChange(type)}
              >
                {type}
                {assetType === type && <X className="ml-1 h-2.5 w-2.5" />}
              </Badge>
            ))}
          </div>

          {(text || activeOnly || assetType) && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 text-xs text-muted-foreground"
              onClick={onClear}
            >
              Clear All Filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
