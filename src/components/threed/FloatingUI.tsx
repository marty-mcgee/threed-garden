// src/components/threed/FloatingUI.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  RotateCw, 
  Settings, 
  BarChart3, 
  Sparkles
} from 'lucide-react';

interface FloatingUIProps {
  onToggleStats?: () => void;
  onToggleAutoRotate?: () => void;
  onToggleEffects?: () => void;
  autoRotate?: boolean;
  showEffects?: boolean;
}

export function FloatingUI({ 
  onToggleStats, 
  onToggleAutoRotate, 
  onToggleEffects,
  autoRotate = false,
  showEffects = true
}: FloatingUIProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="absolute bottom-4 right-4 z-10">
      <Card className="p-2 bg-background/80 backdrop-blur-sm shadow-lg">
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          {isExpanded && (
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleStats}
                title="Show Performance Stats"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              
              <Button
                variant={autoRotate ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={onToggleAutoRotate}
                title={autoRotate ? "Auto-rotate On" : "Auto-rotate Off"}
              >
                <RotateCw className={`h-4 w-4 ${autoRotate ? "animate-spin" : ""}`} />
              </Button>
              
              <Button
                variant={showEffects ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={onToggleEffects}
                title={showEffects ? "Effects On" : "Effects Off"}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}