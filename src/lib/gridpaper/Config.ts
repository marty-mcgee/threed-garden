import { Rect } from './Rect';

// Configurations
export interface Config {
  /** Div ID */
  elementID: string,
  /** 
   * A list of ordered pairs, indicating the grid units of the grid paper.
   * The ordered pairs start with the major grid unit, and end with the minor.
   * The list should be ranked in increasing order of the major grid units.
   */
  gridSeries?: number[][],
  /** Coordinate limits */
  bound?: Rect,
  /** Maximum major grid density */
  majorGridDensity?: number,
  /** Aspect locked */
  aspeckLocked?: true,
  /** Show grid */
  showGrid?: true
};

export var defaultConfig: Config = {
  elementID: 'planCanvas',
  gridSeries: [[10, 2], [50, 10], [100, 10]],
  bound: { minX: -500, maxX: 1500, minY: -500, maxY: 1500 },
  majorGridDensity: 0.02,
  aspeckLocked: true,
  showGrid: true
};
