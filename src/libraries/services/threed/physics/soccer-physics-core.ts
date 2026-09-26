/** Historical compatibility fixture only. Live Scene counting uses sensor-counter-core. */
import {
  createThreeDRuntimeMarkerKey,
  type ThreeDRuntimeMarkerIdentity,
} from '../markers/runtime-marker-core';
import type { ThreeDPhysicsEventV1 } from './physics-event-core';
import { readPhysicsSensorCuboids } from './sensor-cuboid-core';

export const SOCCER_SCORING_TEAMS = ['home', 'away'] as const;
export type SoccerScoringTeam = typeof SOCCER_SCORING_TEAMS[number];
export interface SoccerGoalSensor {
  id: string;
  name: string;
  scoresFor: SoccerScoringTeam;
  position: Readonly<{ x: number; y: number; z: number }>;
  width: number;
  height: number;
  depth: number;
  rotationY: number;
}

export function readSoccerGoalSensors(metadata: unknown): readonly Readonly<SoccerGoalSensor>[] {
  return Object.freeze(readPhysicsSensorCuboids(metadata).flatMap((sensor) => {
    const record = metadata as any;
    const original = (record?.soccerGoalSensors ?? record?.physicsSensorCuboids ?? []).find((item: any) => item.id === sensor.id);
    const scoresFor: SoccerScoringTeam | null = original?.scoresFor === 'home' || original?.behavior === 'soccer-home-goal' ? 'home'
      : original?.scoresFor === 'away' || original?.behavior === 'soccer-away-goal' ? 'away' : null;
    return scoresFor ? [Object.freeze({ ...sensor, scoresFor })] : [];
  }));
}

export interface SoccerPhysicsState {
  homeScore: number;
  awayScore: number;
  occupiedGoals: readonly string[];
  lastGoal: {
    scoringTeam: SoccerScoringTeam;
    ball: ThreeDRuntimeMarkerIdentity;
    goal: ThreeDRuntimeMarkerIdentity;
    occurredAt: string;
  } | null;
}

export function readSoccerGoalScoresFor(metadata: unknown): SoccerScoringTeam | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>).soccerGoalScoresFor;
  return value === 'home' || value === 'away' ? value : null;
}

export function createInitialSoccerPhysicsState(): Readonly<SoccerPhysicsState> {
  return Object.freeze({
    homeScore: 0,
    awayScore: 0,
    occupiedGoals: Object.freeze([]),
    lastGoal: null,
  });
}

function occupancyKey(event: ThreeDPhysicsEventV1): string | null {
  if (!event.target) return null;
  const sensorTag = event.tags?.find((tag) => tag.startsWith('sensor:')) ?? '';
  return `${createThreeDRuntimeMarkerKey(event.source)}>${createThreeDRuntimeMarkerKey(event.target)}:${sensorTag}`;
}

function scoringTeam(event: ThreeDPhysicsEventV1): SoccerScoringTeam | null {
  if (
    !event.tags?.includes('soccer')
    || !event.tags.includes('goal')
    || !event.tags.includes('movable_ball')
  ) return null;
  if (event.tags.includes('scores_home')) return 'home';
  if (event.tags.includes('scores_away')) return 'away';
  return null;
}

export function reduceSoccerPhysicsEvent(
  state: SoccerPhysicsState,
  event: ThreeDPhysicsEventV1,
): Readonly<SoccerPhysicsState> {
  const key = occupancyKey(event);
  const team = scoringTeam(event);
  if (!key || !team) return state;

  if (event.kind === 'sensor-exit') {
    if (!state.occupiedGoals.includes(key)) return state;
    return Object.freeze({
      ...state,
      occupiedGoals: Object.freeze(state.occupiedGoals.filter((value) => value !== key)),
    });
  }
  if (event.kind !== 'sensor-enter' || state.occupiedGoals.includes(key) || !event.target) {
    return state;
  }

  return Object.freeze({
    homeScore: state.homeScore + (team === 'home' ? 1 : 0),
    awayScore: state.awayScore + (team === 'away' ? 1 : 0),
    occupiedGoals: Object.freeze([...state.occupiedGoals, key]),
    lastGoal: Object.freeze({
      scoringTeam: team,
      ball: Object.freeze({ ...event.source }),
      goal: Object.freeze({ ...event.target }),
      occurredAt: event.occurredAt,
    }),
  });
}
