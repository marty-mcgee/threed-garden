export interface DashboardTrack {
  id: number; title: string; duration: number | null; trackNumber: number | null; fileUrl: string; fileType?: string;
}
export interface DashboardLink {
  id: number; title: string; url: string; type: string; icon: string | null; description: string | null;
}
export interface DashboardMedia {
  id: number; fileName: string; fileUrl: string; fileType: string; isPrimary: boolean;
}
export interface DashboardAlbum {
  id: number; title: string; artist: string; coverArt: string;
  releaseYear: number | null; description: string | null;
  tracks?: DashboardTrack[]; links?: DashboardLink[]; media?: DashboardMedia[];
}

export interface DashboardSelection { albumId: number | null; trackId: number | null; trackNumber: number | null; error: string }
export function readDashboardSelection(search: string): DashboardSelection {
  const params = new URLSearchParams(search);
  const positive = (key: string) => {
    const value = params.get(key);
    return value !== null && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : null;
  };
  const albumId = positive('albumId'), trackId = positive('trackId');
  const number = params.get('trackNumber');
  const trackNumber = number !== null && /^-?\d+$/.test(number) && Number.isInteger(Number(number)) && Math.abs(Number(number)) <= 10000 ? Number(number) : null;
  const invalid = ['albumId', 'trackId', 'trackNumber'].some(key => params.getAll(key).length > 1) ||
    (params.has('albumId') && albumId === null) || (params.has('trackId') && trackId === null) ||
    (params.has('trackNumber') && trackNumber === null) || ((params.has('trackId') || params.has('trackNumber')) && albumId === null) ||
    (params.has('trackId') && params.has('trackNumber'));
  return { albumId, trackId, trackNumber, error: invalid ? 'This Album or Track link is invalid.' : '' };
}

export function dashboardSelectionUrl(albumId: number, trackId?: number) {
  return `/dashboard/multimedia?albumId=${albumId}${trackId === undefined ? '' : `&trackId=${trackId}`}`;
}

// Abort saves work; identity also rejects late responses from transports that ignore abort.
export class LatestDashboardRequest {
  private controller?: AbortController;
  begin() {
    this.cancel();
    const controller = new AbortController();
    this.controller = controller;
    return { signal: controller.signal, current: () => this.controller === controller && !controller.signal.aborted };
  }
  cancel() { this.controller?.abort(); this.controller = undefined; }
}

async function read(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal, cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to load Album data. Please retry.');
  const body = await response.json();
  if (!body.success) throw new Error('Unable to load Album data. Please retry.');
  return body;
}

export async function loadDashboardAlbums(offset: number, signal: AbortSignal) {
  const body = await read(`/api/multimedia/albums?scope=public&includeTracks=true&limit=50&offset=${offset}`, signal);
  const total = Number(body.pagination?.total);
  if (!Array.isArray(body.data) || !Number.isSafeInteger(total) || total < 0) throw new Error('Invalid Album list response. Please retry.');
  return { albums: body.data as DashboardAlbum[], total };
}

export async function loadDashboardAlbum(id: number, signal: AbortSignal): Promise<DashboardAlbum> {
  const body = await read(`/api/multimedia/albums?scope=public&id=${id}&includeTracks=true&includeLinks=true&includeMedia=true`, signal);
  if (body.data?.id !== id || !Array.isArray(body.data.tracks) || !Array.isArray(body.data.links) || !Array.isArray(body.data.media)) {
    throw new Error('Invalid Album details response. Please retry.');
  }
  return body.data;
}
