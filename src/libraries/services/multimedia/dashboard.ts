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
