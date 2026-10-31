import type { RuntimeMarker } from '@/libraries/types/map';
import type { ThreeDPhysicsEventV1 } from '../physics/physics-event-core';
import { planThreeDInteractionApproach } from '../orchestration/interaction-core';
import { projectMultimediaCommandSchema, type ProjectMultimediaCommand, type ProjectMultimediaPreview, type ProjectMultimediaPreviewQuery } from '@/libraries/services/project/multimedia-preview-contract';
import {
  sceneMultimediaCommandSchema,
  type SceneMultimediaCommand,
  type SceneMultimediaQuery,
  type SceneMultimediaResponse,
  type SceneMultimediaTrack,
} from './scene-multimedia-contract';

export type MultimediaScene = {
  projectId: number;
  ready: boolean;
  busy: boolean;
  markers: readonly RuntimeMarker[];
  layers: ReadonlySet<string>;
  visibleMarkerIds?: ReadonlySet<string>;
  controlledCharacterId?: number | null;
  settledCharacters: ReadonlySet<string>;
  position: (markerId: string) => {
    x: number;
    y: number;
    z: number
  } | undefined;
};
export type ScenePlaybackState = {
  markerId: string | null;
  albumId: number;
  albumTitle: string;
  track: SceneMultimediaTrack;
  offset: number;
  playing: boolean;
  status: 'loading' | 'playing' | 'paused' | 'stopped' | 'ended' | 'error';
};
type Media = Pick<HTMLMediaElement, 'src' | 'currentTime' | 'paused' | 'play' | 'pause' | 'load' | 'removeAttribute'>;
type Port = {
  read: (query: SceneMultimediaQuery, signal: AbortSignal) => Promise<SceneMultimediaResponse>;
  readProject?: (query: ProjectMultimediaPreviewQuery, signal: AbortSignal) => Promise<ProjectMultimediaPreview>;
  projectId?: () => number;
  media: () => Media | null;
  scene: () => MultimediaScene | null;
  update: (state: ScenePlaybackState | null, busy: boolean, error: string) => void;
};
type PlaybackCommand = Omit<SceneMultimediaCommand, 'markerId'> & { markerId: string | null };
type PlaybackRead = (trackId: number | null, offset: number, signal: AbortSignal) => Promise<Pick<SceneMultimediaResponse, 'albums' | 'tracks' | 'offset' | 'hasMore'>>;

export function multimediaParticipant(scene: MultimediaScene, markerId: string) {
  return scene.markers.find(marker => marker.id === markerId && marker.isActive !== false && marker.isVisible !== false
    && marker.data?.visible !== false && marker.data?.status !== 'inactive' && scene.layers.has(marker.type)
    && (scene.visibleMarkerIds?.has(markerId) ?? true));
}

/** One Scene media element. Commands revalidate read authority before touching it. */
export class SceneMultimediaPlayer {
  private state: ScenePlaybackState | null = null;
  private pending: {
    id: string;
    abort: AbortController
  } | null = null;
  private lastRequest = '';
  private error = '';
  private collisions = new Map<string, {
    command: SceneMultimediaCommand;
    occupied: Set<string>;
    last: number
  }>();
  private eventIds = new Set<string>();
  private commands = new Set<(command: PlaybackCommand, requestId: string) => void>();
  constructor(private readonly port: Port) {}

  private publish() { this.port.update(this.state, !!this.pending, this.error); }
  private validate(command: SceneMultimediaCommand, collision = false) {
    const scene = this.port.scene();
    if (!scene || scene.projectId !== command.projectId || !scene.ready || scene.busy) throw Error('Wait for the Project Scene and finish placement or editing.');
    const target = multimediaParticipant(scene, command.markerId);
    if (!target) throw Error('The target is not available in this Scene.');
    if (command.actorMarkerId) {
      const actor = multimediaParticipant(scene, command.actorMarkerId);
      if (!actor || actor.type !== 'characters' || actor.data?.isMovable !== true
        || Number(actor.data?.id) !== scene.controlledCharacterId || !scene.settledCharacters.has(actor.id)
        || scene.markers.filter(marker => marker.type === 'characters' && Number(marker.data?.id) === scene.controlledCharacterId).length !== 1) {
        throw Error('Take Control of the saved Character and wait for its model and body.');
      }
      const from = scene.position(actor.id), to = scene.position(target.id);
      if (!from || !to || (!collision && !planThreeDInteractionApproach({
        characterPosition: from,
        targetPosition: to
      }).arrived)) {
        throw Error('Move the Character within interaction range of this object.');
      }
    }
    return scene;
  }

  async execute(input: SceneMultimediaCommand, requestId: string, signal?: AbortSignal, collision = false) {
    const command = sceneMultimediaCommandSchema.parse(input);
    return this.executePlayback(command, requestId, () => { this.validate(command, collision); }, (trackId, offset, abort) => this.port.read({
      projectId: command.projectId,
      markerId: command.markerId,
      actorMarkerId: command.actorMarkerId,
      albumId: command.albumId,
      trackId,
      offset,
    }, abort), signal);
  }

  async executeProject(input: ProjectMultimediaCommand, requestId: string, signal?: AbortSignal) {
    return this.projectPlayback(input, requestId, signal, false);
  }

  /** Restore a validated Project selection paused; never request browser playback. */
  async restoreProject(input: ProjectMultimediaCommand, requestId: string, signal?: AbortSignal) {
    if (input.action !== 'playMultimedia') throw Error('Restore requires a Track selection.');
    return this.projectPlayback(input, requestId, signal, true);
  }

  private projectPlayback(input: ProjectMultimediaCommand, requestId: string, signal: AbortSignal | undefined, paused: boolean) {
    const command = projectMultimediaCommandSchema.parse(input);
    return this.executePlayback({ ...command, markerId: null }, requestId, () => {
      if (!this.port.readProject || this.port.projectId?.() !== command.projectId) throw Error('Project changed or Multimedia is not ready.');
    }, (trackId, offset, abort) => this.port.readProject!({
      projectId: command.projectId,
      albumId: command.albumId,
      trackId,
      offset,
    }, abort), signal, paused);
  }

  private async executePlayback(command: PlaybackCommand, requestId: string, validate: () => void, read: PlaybackRead, signal?: AbortSignal, restorePaused = false) {
    validate();
    if (signal?.aborted) throw Error('Multimedia Action cancelled.');
    if (command.action !== 'playMultimedia' && (this.state?.markerId !== command.markerId || this.state.albumId !== command.albumId)) throw Error('Start playback on this object and Album first.');
    if (!restorePaused) this.commands.forEach(listener => listener(command, requestId));
    const wasPlaying = this.state?.playing === true;
    const retryFailed = this.state?.status === 'error';
    this.cancel();
    const operation = {
      id: requestId,
      abort: new AbortController()
    };
    this.pending = operation;
    this.lastRequest = requestId;
    this.error = '';
    const cancel = () => this.cancel(requestId);
    signal?.addEventListener('abort', cancel, { once: true });
    this.publish();
    const current = () => {
      if (operation.abort.signal.aborted || this.pending !== operation) throw Error('Multimedia Action cancelled.');
      validate();
    };
    try {
      const same = this.state?.markerId === command.markerId && this.state.albumId === command.albumId;
      if (command.action !== 'playMultimedia' && !same) throw Error('Start playback on this object and Album first.');
      let data = await read(command.trackId ?? (same ? this.state!.track.id : null), same ? this.state!.offset : 0, operation.abort.signal);
      current();
      const media = this.port.media();
      if (!media) throw Error('Scene playback is not ready.');
      let track = command.trackId ? data.tracks.find(item => item.id === command.trackId)
        : same ? data.tracks.find(item => item.id === this.state!.track.id) : data.tracks[0];
      if (!track) throw Error('No playable active Track is available.');
      if (restorePaused) {
        media.pause();
        this.state = {
          markerId: null,
          albumId: command.albumId,
          albumTitle: data.albums.find(album => album.id === command.albumId)?.title ?? '',
          track,
          offset: data.offset,
          playing: false,
          status: 'paused',
        };
        return;
      }
      if (command.action === 'nextTrack') {
        const index = data.tracks.findIndex(item => item.id === track!.id);
        track = data.tracks[index + 1];
        if (!track && data.hasMore) {
          data = await read(null, data.offset + 50, operation.abort.signal);
          current();
          track = data.tracks[0];
        }
        if (!track) throw Error('There is no next playable Track on this Album page.');
      }
      if (command.action === 'pauseMultimedia' || command.action === 'stopMultimedia') media.pause();
      if (command.action === 'stopMultimedia' || command.action === 'rewindMultimedia') media.currentTime = 0;
      if (command.action === 'rewindMultimedia' && wasPlaying) { await media.play(); current(); }
      if (command.action === 'playMultimedia' || command.action === 'nextTrack') {
        if (retryFailed || !same || this.state!.track.id !== track.id || media.src !== new URL(track.fileUrl, typeof location === 'undefined' ? 'https://threed.invalid' : location.href).href) {
          media.pause();
          media.src = track.fileUrl;
          media.load();
        }
        // Retain the requested Track even if the browser refuses playback.
        // Retry must address this Track, not the previously playing one.
        this.state = {
          markerId: command.markerId,
          albumId: command.albumId,
          albumTitle: data.albums.find(album => album.id === command.albumId)?.title ?? '',
          track,
          offset: data.offset,
          playing: false,
          status: 'loading',
        };
        this.publish();
        await media.play();
        current();
        if (media.paused) throw Error('Playback did not start. Click Play to enable Scene audio.');
      }
      this.state = {
        markerId: command.markerId,
        albumId: command.albumId,
        albumTitle: data.albums.find(album => album.id === command.albumId)?.title ?? '',
        track,
        offset: data.offset,
        playing: !media.paused,
        status: command.action === 'stopMultimedia' ? 'stopped' : media.paused ? 'paused' : 'playing',
      };
    } catch (error) {
      if (this.pending === operation && !operation.abort.signal.aborted) {
        this.port.media()?.pause();
        if (this.state) this.state = {
          ...this.state,
          playing: false,
          status: 'error',
        };
        this.error = error instanceof Error && error.name === 'NotAllowedError' ? 'Click Play to enable Scene audio.' : error instanceof Error ? error.message : 'Playback failed.';
      }
      throw error;
    } finally {
      signal?.removeEventListener('abort', cancel);
      if (this.pending === operation) this.pending = null;
      this.publish();
    }
  }

  cancel(requestId?: string) {
    if (requestId && this.pending?.id !== requestId && this.lastRequest !== requestId) return;
    this.pending?.abort.abort();
    this.pending = null;
    this.port.media()?.pause();
    if (this.state) this.state = {
      ...this.state,
      playing: false,
      status: this.state.status === 'ended' || this.state.status === 'stopped' ? this.state.status : 'paused',
    };
    this.publish();
  }

  mediaChanged(error = '', ended = false) {
    // A command owns intermediate pause/load/play events until it settles.
    if (this.pending && !error) return;
    const paused = this.port.media()?.paused ?? true;
    const retainedStatus = this.state && ['stopped', 'ended', 'error'].includes(this.state.status) ? this.state.status : 'paused';
    if (this.state) this.state = {
      ...this.state,
      playing: !error && !ended && !paused,
      status: error ? 'error' : ended ? 'ended' : paused ? retainedStatus : 'playing',
    };
    if (error) this.error = error;
    this.publish();
  }

  checkScene() {
    if (!this.state) return;
    if (this.state.markerId === null) return; // Project previews have no Scene participant or Layer owner.
    const scene = this.port.scene();
    if (!scene || !scene.ready || !multimediaParticipant(scene, this.state.markerId)) this.clear();
  }

  armCollision(command: SceneMultimediaCommand | null, markerId: string) {
    if (!command) { this.collisions.delete(markerId); this.publish(); return; }
    const parsed = sceneMultimediaCommandSchema.parse(command);
    if (!parsed.actorMarkerId || parsed.action !== 'playMultimedia') throw Error('Choose the controlled Character for collision playback.');
    this.validate(parsed, true);
    if (!this.collisions.has(markerId) && this.collisions.size >= 32) throw Error('At most 32 objects can have collision playback in this session.');
    this.collisions.set(markerId, {
      command: parsed,
      occupied: new Set(),
      last: 0
    });
    this.publish();
  }

  isCollisionArmed(markerId: string) { return this.collisions.has(markerId); }
  subscribeCommands(listener: (command: PlaybackCommand, requestId: string) => void) {
    this.commands.add(listener);
    return () => { this.commands.delete(listener); };
  }

  observe(event: Readonly<ThreeDPhysicsEventV1>) {
    const scene = this.port.scene();
    if (!scene || event.projectId !== scene.projectId || !['sensor-enter', 'sensor-exit', 'contact-start', 'contact-end'].includes(event.kind) || this.eventIds.has(event.sceneEventId)) return;
    this.eventIds.add(event.sceneEventId);
    if (this.eventIds.size > 256) this.eventIds.delete(this.eventIds.values().next().value!);
    const identityMatches = (marker: RuntimeMarker, identity: ThreeDPhysicsEventV1['source']) => marker.type === identity.moduleType && Number(marker.data?.id) === identity.assetId;
    for (const binding of this.collisions.values()) {
      const target = multimediaParticipant(scene, binding.command.markerId);
      const actor = multimediaParticipant(scene, binding.command.actorMarkerId!);
      if (!target || !actor || !event.target) continue;
      const sources = scene.markers.filter(marker => identityMatches(marker, event.source)
        && (!event.sourceMarkerId || Number(marker.data?.projectMarkerId ?? marker.data?.instanceId) === event.sourceMarkerId));
      const targets = scene.markers.filter(marker => identityMatches(marker, event.target!));
      // An event with only a catalog identity cannot select between duplicate instances.
      if (sources.length !== 1 || targets.length !== 1 || !((sources[0].id === target.id && targets[0].id === actor.id) || (sources[0].id === actor.id && targets[0].id === target.id))) continue;
      const key = `${event.source.moduleType}:${event.source.assetId}:${event.sourceMarkerId ?? ''}:${event.sensor?.id ?? 'contact'}`;
      if (event.kind === 'sensor-exit' || event.kind === 'contact-end') { binding.occupied.delete(key); continue; }
      const occupied = binding.occupied.size > 0;
      binding.occupied.add(key);
      if (occupied || this.pending || Date.now() - binding.last < 1000) continue;
      binding.last = Date.now();
      void this.execute(binding.command, `collision:${event.sceneEventId}`, undefined, true).catch(() => {});
    }
  }

  clear() {
    this.cancel();
    const media = this.port.media();
    if (media) { media.removeAttribute('src'); media.load(); }
    this.state = null;
    this.error = '';
    this.collisions.clear();
    this.eventIds.clear();
    this.publish();
  }
}
