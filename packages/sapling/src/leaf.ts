import { Vector2 } from "three";

export interface LeafSplineSegment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
}

export interface TwigStem {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  width: number;
}

export interface LeafStamp {
  angle: number;
  scale: number;
  translate: Vector2;
}
