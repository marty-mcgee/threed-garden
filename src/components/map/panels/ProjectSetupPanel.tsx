'use client';

import { Box, CheckCircle2, ExternalLink, Map, Sparkles, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProjectSetupPanel({
  isOpen,
  hasThreeDModule,
  hasEnvironment,
  hasCharacter,
  hasSceneModel,
  onClose,
  onAddEnvironment,
  onAddCharacter,
  onOpenModelLibrary,
  onOpenProjectSettings,
}: {
  isOpen: boolean;
  hasThreeDModule: boolean;
  hasEnvironment: boolean;
  hasCharacter: boolean;
  hasSceneModel: boolean;
  onClose: () => void;
  onAddEnvironment: () => void;
  onAddCharacter: () => void;
  onOpenModelLibrary: () => void;
  onOpenProjectSettings: () => void;
}) {
  if (!isOpen) return null;
  const completedStepCount = [hasEnvironment, hasCharacter, hasSceneModel]
    .filter(Boolean).length;

  return (
    <section
      className="absolute left-1/2 top-14 z-30 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-cyan-400/25 bg-background/95 shadow-2xl backdrop-blur-md"
      aria-labelledby="project-setup-title"
    >
      <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 ring-1 ring-cyan-400/30">
              <Sparkles className="h-4 w-4 text-cyan-500" aria-hidden="true" />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-300">
                Project Tour · Getting Started
              </div>
              <h2 id="project-setup-title" className="mt-0.5 text-base font-semibold">
                Build your ThreeD Project
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {completedStepCount === 0
                  ? 'Choose a starting point. The guide uses the App\'s existing libraries and Project tools.'
                  : `${completedStepCount} of 3 Scene foundations ready. Continue building or revisit an existing library.`}
              </p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Close Project setup</span>
          </Button>
        </div>

        {!hasThreeDModule && (
          <div className="mt-3 rounded-lg border border-sky-400/25 bg-sky-500/10 px-3 py-2 text-xs text-sky-800 dark:text-sky-200">
            <span className="font-medium">First step:</span> add an active ThreeD module in Project Settings, then return here to place Scene assets.
          </div>
        )}

        {hasThreeDModule && (
          <div className="mt-3 grid grid-cols-3 gap-1.5" aria-label="Project setup progress">
            {[
              { label: 'Environment', complete: hasEnvironment },
              { label: 'Character', complete: hasCharacter },
              { label: 'Model', complete: hasSceneModel },
            ].map((step) => (
              <div
                key={step.label}
                className={`flex items-center justify-center gap-1 rounded-md border px-1.5 py-1 text-[10px] ${step.complete
                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-border/70 bg-muted/30 text-muted-foreground'}`}
              >
                {step.complete && <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />}
                <span className="truncate">{step.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Button type="button" className="h-10 justify-start bg-cyan-600 text-xs text-white hover:bg-cyan-500" disabled={!hasThreeDModule} onClick={onAddEnvironment}>
            <Map className="h-4 w-4" />
            {hasEnvironment ? 'Open Environment Library' : 'Add Environment / Base Map'}
            {hasEnvironment && <CheckCircle2 className="ml-auto h-3.5 w-3.5" aria-hidden="true" />}
          </Button>
          <Button type="button" variant="outline" className="h-10 justify-start text-xs hover:border-cyan-400/40 hover:bg-cyan-500/10" disabled={!hasThreeDModule} onClick={onAddCharacter}>
            <User className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
            {hasCharacter ? 'Open Character Library' : 'Add Character'}
            {hasCharacter && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />}
          </Button>
          <Button type="button" variant="outline" className="h-10 justify-start text-xs hover:border-cyan-400/40 hover:bg-cyan-500/10" disabled={!hasThreeDModule} onClick={onOpenModelLibrary}>
            <Box className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
            Open Model Library
            {hasSceneModel && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />}
          </Button>
          <Button type="button" variant="outline" className="h-10 justify-start text-xs hover:border-cyan-400/40 hover:bg-cyan-500/10" onClick={onOpenProjectSettings}>
            <ExternalLink className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
            Project Settings &amp; Coordinates
          </Button>
        </div>
      </div>
    </section>
  );
}
