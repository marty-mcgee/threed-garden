export const PROJECT_TOUR_STEP_KEYS = ['environment', 'model', 'character'] as const;

export type ProjectTourStepKey = (typeof PROJECT_TOUR_STEP_KEYS)[number];

export interface ProjectTourProgressInput {
  hasEnvironment: boolean;
  hasSceneModel: boolean;
  hasCharacter: boolean;
}

export interface ProjectTourStepState {
  key: ProjectTourStepKey;
  label: string;
  description: string;
  complete: boolean;
  current: boolean;
}

export interface ProjectTourState {
  steps: ProjectTourStepState[];
  completedStepCount: number;
  totalStepCount: number;
  currentStep: ProjectTourStepState | null;
  isComplete: boolean;
}

const PROJECT_TOUR_STEP_DEFINITIONS: ReadonlyArray<{
  key: ProjectTourStepKey;
  label: string;
  description: string;
}> = [
  {
    key: 'environment',
    label: 'Choose Environment',
    description: 'Establish the visual setting or reusable base map for this Project.',
  },
  {
    key: 'model',
    label: 'Place a Model',
    description: 'Choose a prepared Model, set its placement scale, and place it in the Scene.',
  },
  {
    key: 'character',
    label: 'Add a Character',
    description: 'Bring a Character into the Project for movement and Scene interaction.',
  },
];

export function createProjectTourState(input: ProjectTourProgressInput): ProjectTourState {
  const completion: Record<ProjectTourStepKey, boolean> = {
    environment: input.hasEnvironment,
    model: input.hasSceneModel,
    character: input.hasCharacter,
  };
  const currentStepKey = PROJECT_TOUR_STEP_KEYS.find((key) => !completion[key]) ?? null;
  const steps = PROJECT_TOUR_STEP_DEFINITIONS.map((step) => ({
    ...step,
    complete: completion[step.key],
    current: step.key === currentStepKey,
  }));
  const completedStepCount = steps.filter((step) => step.complete).length;

  return {
    steps,
    completedStepCount,
    totalStepCount: steps.length,
    currentStep: steps.find((step) => step.current) ?? null,
    isComplete: completedStepCount === steps.length,
  };
}
