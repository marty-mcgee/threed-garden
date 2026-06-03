// Enums for type safety
export enum MusicLinkType {
  EXTERNAL = 'external',
  SOCIAL = 'social',
  BUY = 'buy',
  STREAM = 'stream',
  VIDEO = 'video',
}

export enum MusicLinkStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  EXPIRED = 'expired',
}

export enum AlbumStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum TrackStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PROCESSING = 'processing',
}

export enum MusicPollingType {
  METADATA = 'metadata',
  STATS = 'stats',
  SYNC = 'sync',
}

// Interfaces
export interface MusicAlbum {
  id: number;
  userId: string;
  title: string;
  artist: string;
  coverArt: string;
  releaseYear: number | null;
  description: string | null;
  status: AlbumStatus;
  isPublic: boolean;
  metadata: MusicAlbumMetadata | null;
  createdAt: Date;
  updatedAt: Date;
  tracks?: MusicTrack[];
  links?: MusicLink[];
}

export interface MusicTrack {
  id: number;
  albumId: number;
  title: string;
  duration: number | null;
  trackNumber: number | null;
  publicUrl: string;
  status: TrackStatus;
  lyrics: string | null;
  metadata: MusicTrackMetadata | null;
  playCount: number;
  createdAt: Date;
  album?: MusicAlbum;
  links?: MusicLink[];
}

export interface MusicLink {
  id: number;
  userId: string;
  title: string;
  url: string;
  type: MusicLinkType;
  icon: string | null;
  description: string | null;
  status: MusicLinkStatus;
  displayOrder: number;
  metadata: MusicLinkMetadata | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlbumLink {
  id: number;
  albumId: number | null;
  linkId: number;
  linkType: 'album' | 'track';
  trackId: number | null;
  createdAt: Date;
  link?: MusicLink;
  album?: MusicAlbum;
  track?: MusicTrack;
}

// Metadata interfaces
export interface MusicAlbumMetadata {
  genre?: string[];
  mood?: string[];
  bpm?: number;
  key?: string;
  label?: string;
  producer?: string[];
  engineer?: string[];
  recordingLocation?: string;
  artworkCredit?: string;
  upc?: string;
  isrc?: string;
}

export interface MusicTrackMetadata {
  genre?: string[];
  mood?: string[];
  bpm?: number;
  key?: string;
  composer?: string[];
  lyricist?: string[];
  isrc?: string;
  explicit?: boolean;
  instrumental?: boolean;
}

export interface MusicLinkMetadata {
  analyticsId?: string;
  campaign?: string;
  medium?: string;
  source?: string;
  embedCode?: string;
  thumbnail?: string;
}

// Poller stats interfaces
export interface MusicPollStats {
  totalAlbums: number;
  totalTracks: number;
  totalLinks: number;
  totalPlayCount: number;
  publishedAlbums: number;
  draftAlbums: number;
  activeTracks: number;
  activeLinks: number;
  recentUploads: number;
  storageUsed: string;
  lastPollTime: Date | null;
  pollStatus: 'idle' | 'polling' | 'error';
  error?: string;
}

export interface MusicMetadataSyncResult {
  syncedAlbums: number;
  syncedTracks: number;
  errors: string[];
  timestamp: Date;
}

// DTOs for API
export interface CreateMusicAlbumDTO {
  title: string;
  artist: string;
  coverArt: string;
  releaseYear?: number;
  description?: string;
  isPublic?: boolean;
  metadata?: MusicAlbumMetadata;
}

export interface UpdateMusicAlbumDTO extends Partial<CreateMusicAlbumDTO> {
  status?: AlbumStatus;
}

export interface CreateMusicTrackDTO {
  albumId: number;
  title: string;
  duration?: number;
  trackNumber?: number;
  publicUrl: string;
  lyrics?: string;
  metadata?: MusicTrackMetadata;
}

export interface UpdateMusicTrackDTO extends Partial<CreateMusicTrackDTO> {
  status?: TrackStatus;
  playCount?: number;
}

export interface CreateMusicLinkDTO {
  title: string;
  url: string;
  type: MusicLinkType;
  icon?: string;
  description?: string;
  displayOrder?: number;
  metadata?: MusicLinkMetadata;
}

export interface UpdateMusicLinkDTO extends Partial<CreateMusicLinkDTO> {
  status?: MusicLinkStatus;
}

// Query filters
export interface MusicAlbumFilters {
  status?: AlbumStatus;
  isPublic?: boolean;
  userId?: string;
  search?: string;
  genre?: string;
  yearStart?: number;
  yearEnd?: number;
}

export interface MusicTrackFilters {
  albumId?: number;
  status?: TrackStatus;
  search?: string;
  minDuration?: number;
  maxDuration?: number;
}

export interface MusicLinkFilters {
  type?: MusicLinkType;
  status?: MusicLinkStatus;
  userId?: string;
  associatedOnly?: boolean;
  independentOnly?: boolean;
}

// Poller configuration
export interface MusicPollerConfig {
  pollInterval: number; // in milliseconds
  autoSyncMetadata: boolean;
  metadataSyncInterval: number;
  maxRetries: number;
  retryDelay: number;
  s3Bucket: string;
  s3Region: string;
}

// Events
export interface MusicEvent {
  type: 'album_created' | 'album_updated' | 'album_deleted' |
         'track_created' | 'track_updated' | 'track_deleted' |
         'track_played' | 'link_created' | 'link_updated' | 'link_deleted' |
         'metadata_synced' | 'poll_completed' | 'poll_error';
  data: any;
  timestamp: Date;
  userId?: string;
}







// lib/types/music.ts - Add these interfaces

export interface PlaylistQueue {
  id: string;
  tracks: MusicTrack[];
  currentIndex: number;
  createdAt: Date;
}

export interface RecentlyPlayed {
  trackId: number;
  playedAt: Date;
  track: MusicTrack;
}

export interface FavoriteTrack {
  userId: string;
  trackId: number;
  createdAt: Date;
  track?: MusicTrack;
}







