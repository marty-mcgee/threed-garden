/**
 * A simple data structure containing a rectangle's geometric properties
 */
export interface Rect {
    minX: number, maxX: number, minY: number, maxY: number;
}

// TODO: Enable custom callbacks
/**
 * Extended rectangle that allows distinctions between callback setters and
 * non-callback setters (functions)
 */
export interface GeometricRect extends Rect {
  _minx: number, _maxx: number, _miny: number, _maxy: number,
  // Set minX property without calling any callbacks
  setMinX?: (newVal: number) => void,
  // Set maxX property without calling any callbacks
  setMaxX?: (newVal: number) => void,
  // Set minY property without calling any callbacks
  setMinY?: (newVal: number) => void,
  // Set maxY property without calling any callbacks
  setMaxY?: (newVal: number) => void
}
