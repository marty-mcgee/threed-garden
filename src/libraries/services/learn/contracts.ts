/** ThreeD Module Learn: shared App guides, edited only by active Super Admins. */
export interface LearnGuideInput {
  title: string;
  slug: string;
  summary: string;
  content: string;
  sortOrder: number;
  isActive: boolean;
  isPublished: boolean;
}

export interface LearnGuide extends LearnGuideInput {
  id: number;
  revision: string;
  createdAt: string;
  updatedAt: string;
}

export type LearnGuideRow = Omit<LearnGuide, 'content'>;
export type PublicLearnGuide = Pick<LearnGuide, 'title' | 'slug' | 'summary' | 'content' | 'updatedAt'>;
export type PublicLearnGuideRow = Omit<PublicLearnGuide, 'content'>;
export interface LearnGuidePage<T> {
  data: T[];
  pagination: { total: number; limit: number; offset: number };
}

export const learnGuideSorts = ['title', 'slug', 'sortOrder', 'isActive', 'isPublished', 'updatedAt'] as const;
export type LearnGuideSort = typeof learnGuideSorts[number];
export const LEARN_CONTENT_LIMIT = 100_000;
export const LEARN_SUMMARY_LIMIT = 500;
export const LEARN_TITLE_LIMIT = 255;
export const LEARN_SLUG_LIMIT = 120;
export const LEARN_SEARCH_LIMIT = 200;
