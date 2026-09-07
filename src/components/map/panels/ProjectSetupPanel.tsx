'use client';

import { Box, CheckCircle2, ExternalLink, Map, Sparkles, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  createProjectTourState,
  type ProjectTourStepKey,
} from '@/lib/services/project/project-tour-core';

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
  const tour = createProjectTourState({ hasEnvironment, hasSceneModel, hasCharacter });
  const stepActions: Record<ProjectTourStepKey, () => void> = {
    environment: onAddEnvironment,
    model: onOpenModelLibrary,
    character: onAddCharacter,
  };
  const stepIcons = {
    environment: Map,
    model: Box,
    character: User,
  } satisfies Record<ProjectTourStepKey, typeof Box>;

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
                {!hasThreeDModule
                  ? 'Connect the ThreeD module before adding Scene assets.'
                  : tour.isComplete
                    ? 'Your Project foundation is ready. Continue exploring or revisit any step.'
                    : `${tour.completedStepCount} of ${tour.totalStepCount} foundations ready. Follow the recommended next step or choose another.`}
              </p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Close Project setup</span>
          </Button>
        </div>

        {!hasThreeDModule && (
          <div className="mt-4 rounded-lg border border-cyan-400/25 bg-cyan-500/10 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">
              Step 1 · Project Foundation
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Add or assign an active ThreeD module in Project Settings. The Environment, Character, and Model libraries will become available here afterward.
            </p>
            <Button
              type="button"
              className="mt-3 h-10 w-full justify-start bg-cyan-600 text-xs text-white hover:bg-cyan-500"
              onClick={onOpenProjectSettings}
            >
              <ExternalLink className="h-4 w-4" />
              Add ThreeD Module in Project Settings
            </Button>
          </div>
        )}

        {hasThreeDModule && (
          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                <span>Project foundation</span>
                <span>{tour.completedStepCount} / {tour.totalStepCount}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-label={`${tour.completedStepCount} of ${tour.totalStepCount} Project Tour steps complete`}>
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-[width] duration-300" style={{ width: `${(tour.completedStepCount / tour.totalStepCount) * 100}%` }} />
              </div>
            </div>

            {!tour.isComplete && tour.currentStep && (() => {
              const CurrentIcon = stepIcons[tour.currentStep.key];
              return (
                <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-300">
                    Recommended next · Step {tour.completedStepCount + 1}
                  </div>
                  <div className="mt-2 flex items-start gap-2">
                    <CurrentIcon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-300" aria-hidden="true" />
                    <div>
                      <div className="text-sm font-medium">{tour.currentStep.label}</div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{tour.currentStep.description}</p>
                    </div>
                  </div>
                  <Button type="button" className="mt-3 h-9 w-full bg-cyan-600 text-xs text-white hover:bg-cyan-500" onClick={stepActions[tour.currentStep.key]}>
                    Continue to {tour.currentStep.label}
                  </Button>
                </div>
              );
            })()}

            {tour.isComplete && (
              <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Project foundation complete
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Your Environment, first Model, and Character are ready. Close the Tour to explore the Scene.</p>
                <Button type="button" className="mt-3 h-9 w-full bg-emerald-600 text-xs text-white hover:bg-emerald-500" onClick={onClose}>Explore the Scene</Button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-1.5" aria-label="Project setup steps">
              {tour.steps.map((step, index) => {
                const StepIcon = stepIcons[step.key];
                return (
                  <button
                    key={step.key}
                    type="button"
                    className={`rounded-md border p-2 text-left transition-colors ${step.complete
                      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : step.current
                        ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
                        : 'border-border/70 bg-muted/20 text-muted-foreground hover:border-cyan-400/30'}`}
                    onClick={stepActions[step.key]}
                  >
                    <span className="flex items-center gap-1 text-[10px] font-medium">
                      {step.complete ? <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" /> : <StepIcon className="h-3 w-3 shrink-0" aria-hidden="true" />}
                      Step {index + 1}
                    </span>
                    <span className="mt-1 block truncate text-[10px]">{step.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] text-muted-foreground" onClick={onOpenProjectSettings}>
                <ExternalLink className="h-3 w-3" /> Project Settings &amp; Coordinates
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
