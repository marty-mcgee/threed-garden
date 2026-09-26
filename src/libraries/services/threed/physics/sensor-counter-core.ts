import type { ThreeDPhysicsEventV1 } from './physics-event-core';
import { createThreeDRuntimeMarkerKey } from '../markers/runtime-marker-core';

export type SensorMember = { ownerMarkerId: number; id: string; name: string; groupId: string | null; behavior: 'trigger' | 'counter' };
export type SensorCounterState = { counts: Readonly<Record<string, number>>; occupied: readonly string[] };
export const sensorMemberKey = (member: Pick<SensorMember, 'ownerMarkerId' | 'id'>) => `${member.ownerMarkerId}:${member.id}`;
export function createSensorCounterState(): SensorCounterState { return { counts: {}, occupied: [] }; }
export function reduceSensorCounterEvent(state: SensorCounterState, event: ThreeDPhysicsEventV1, projectId: number, members: readonly SensorMember[]): SensorCounterState {
  if (event.projectId !== projectId || !event.sensor) return state;
  const memberKey = sensorMemberKey(event.sensor);
  if (!members.some(member => sensorMemberKey(member) === memberKey && member.behavior === 'counter')) return state;
  const occupancy = `${memberKey}|${createThreeDRuntimeMarkerKey(event.source)}`;
  if (event.kind === 'sensor-exit') return { ...state, occupied: state.occupied.filter(key => key !== occupancy) };
  if (event.kind !== 'sensor-enter' || state.occupied.includes(occupancy)) return state;
  return { counts: { ...state.counts, [memberKey]: (state.counts[memberKey] ?? 0) + 1 }, occupied: [...state.occupied, occupancy] };
}
/** Membership changes discard deleted counters/occupancy; renaming preserves both. */
export function reconcileSensorCounters(state: SensorCounterState, members: readonly SensorMember[]): SensorCounterState {
  const keys = new Set(members.filter(member => member.behavior === 'counter').map(sensorMemberKey));
  return { counts: Object.fromEntries(Object.entries(state.counts).filter(([key]) => keys.has(key))),
    occupied: state.occupied.filter(key => keys.has(key.split('|')[0])) };
}
/** Reset counts without allowing an already occupying object to count again. */
export function resetSensorCounts(state: SensorCounterState): SensorCounterState { return { ...state, counts: {} }; }
