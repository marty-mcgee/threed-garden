import Prando from 'prando';
import { Box2, Matrix3, Vector2 } from 'three';
import { LeafSplineSegment, LeafStamp, TwigStem } from './leaf';

interface LeafProps {
  length: number;
  baseWidth: number;
  baseTaper: number;
  tipWidth: number;
  tipTaper: number;
  numSegments: number;
  rake: number;
  serration: number;
  jitter: number;
}

/** Class which generates a collection of meshes and geometry for the tree model. */
// Create a leaf path
export function buildLeafPath(props: LeafProps, rnd: Prando): LeafSplineSegment[] {
  const { length, baseWidth, baseTaper, tipWidth, tipTaper, numSegments } = props;

  const segment: LeafSplineSegment = {
    x0: 0,
    y0: 0,
    x1: length * baseWidth,
    y1: length * baseTaper,
    x2: length * tipWidth,
    y2: length * (1 - tipTaper),
    x3: 0,
    y3: length,
  };

  const segments: LeafSplineSegment[] = divideSegments(segment, numSegments);
  addSerration(segments, length, props, rnd);
  return segments;
}

function divideSegments(segment: LeafSplineSegment, numDivisions: number): LeafSplineSegment[] {
  const { x0, y0, x1, y1, x2, y2, x3, y3 } = segment;

  if (numDivisions < 2) {
    return [segment];
  }

  const result: LeafSplineSegment[] = [];

  let t0: number;
  let t1 = 0;
  do {
    t0 = t1;
    t1 += 1 / numDivisions;

    if (t1 >= 0.99) {
      t1 = 1;
    }

    const u0 = 1.0 - t0;
    const u1 = 1.0 - t1;

    const qxa = x0 * u0 * u0 + x1 * 2 * t0 * u0 + x2 * t0 * t0;
    const qxb = x0 * u1 * u1 + x1 * 2 * t1 * u1 + x2 * t1 * t1;
    const qxc = x1 * u0 * u0 + x2 * 2 * t0 * u0 + x3 * t0 * t0;
    const qxd = x1 * u1 * u1 + x2 * 2 * t1 * u1 + x3 * t1 * t1;

    const qya = y0 * u0 * u0 + y1 * 2 * t0 * u0 + y2 * t0 * t0;
    const qyb = y0 * u1 * u1 + y1 * 2 * t1 * u1 + y2 * t1 * t1;
    const qyc = y1 * u0 * u0 + y2 * 2 * t0 * u0 + y3 * t0 * t0;
    const qyd = y1 * u1 * u1 + y2 * 2 * t1 * u1 + y3 * t1 * t1;

    const newSegment: LeafSplineSegment = {
      x0: qxa * u0 + qxc * t0,
      y0: qya * u0 + qyc * t0,

      x1: qxa * u1 + qxc * t1,
      y1: qya * u1 + qyc * t1,

      x2: qxb * u0 + qxd * t0,
      y2: qyb * u0 + qyd * t0,

      x3: qxb * u1 + qxd * t1,
      y3: qyb * u1 + qyd * t1,
    };

    result.push(newSegment);
  } while (t1 < 1);

  return result;
}

function addSerration(
  segments: LeafSplineSegment[],
  length: number,
  props: LeafProps,
  rnd: Prando
) {
  const { rake, serration, jitter } = props;
  const pointyness = 40 * serration;

  for (let i = 0; i < segments.length - 1; i += 1) {
    const s = segments[i];

    // The tangent of the curve at the end of the segment.
    const tangent = new Vector2(s.x3 - s.x2, s.y3 - s.y2).normalize();
    const normal = new Vector2(tangent.y, -tangent.x);
    const displacement = normal
      .clone()
      .multiplyScalar(pointyness)
      .add(tangent.clone().multiplyScalar((rake * length * 2) / segments.length));
    displacement.x += rnd.next(-10, 10) * jitter;
    displacement.y += rnd.next(-10, 10) * jitter;

    const p0 = new Vector2(s.x0, s.y0);
    const d3 = new Vector2(s.x3, s.y3).sub(p0).dot(tangent);
    const d1 = new Vector2(s.x1, s.y1).sub(p0).dot(tangent) / d3;
    const d2 = new Vector2(s.x2, s.y2).sub(p0).dot(tangent) / d3;

    s.x1 += d1 * displacement.x;
    s.x2 += d2 * displacement.x;
    s.x3 += displacement.x;

    s.y1 += d1 * displacement.y;
    s.y2 += d2 * displacement.y;
    s.y3 += displacement.y;
  }

  segments[segments.length - 1].y3 += pointyness;
  segments[segments.length - 1].y2 += pointyness;
}

export function calcLeafBounds(leaf: LeafSplineSegment[], stamps: LeafStamp[], stems: TwigStem[]) {
  const bounds = new Box2();
  const transform = new Matrix3();
  const v = new Vector2();

  for (const stamp of stamps) {
    transform.identity();
    transform.scale(stamp.scale, stamp.scale);
    transform.rotate(-stamp.angle);
    transform.translate(stamp.translate.x, stamp.translate.y);

    for (const segment of leaf) {
      bounds.expandByPoint(v.set(segment.x0, segment.y0).applyMatrix3(transform));
      bounds.expandByPoint(v.set(-segment.x0, segment.y0).applyMatrix3(transform));

      bounds.expandByPoint(v.set(segment.x1, segment.y1).applyMatrix3(transform));
      bounds.expandByPoint(v.set(-segment.x1, segment.y1).applyMatrix3(transform));

      bounds.expandByPoint(v.set(segment.x2, segment.y2).applyMatrix3(transform));
      bounds.expandByPoint(v.set(-segment.x2, segment.y2).applyMatrix3(transform));

      bounds.expandByPoint(v.set(segment.x3, segment.y3).applyMatrix3(transform));
      bounds.expandByPoint(v.set(-segment.x3, segment.y3).applyMatrix3(transform));
    }
  }

  for (const stem of stems) {
    bounds.expandByPoint(v.set(stem.x0, stem.y0));
    bounds.expandByPoint(v.set(-stem.x0, stem.y0));

    bounds.expandByPoint(v.set(stem.x1, stem.y1));
    bounds.expandByPoint(v.set(-stem.x1, stem.y1));
  }

  bounds.expandByScalar(2);

  // Make the bounding-box square while still surrounding the figure.
  const size = bounds.getSize(v);
  if (size.x > size.y) {
    const yOver = (size.x - size.y) / 2;
    bounds.min.y -= yOver;
    bounds.max.y += yOver;
  } else {
    const xOver = (size.y - size.x) / 2;
    bounds.min.x -= xOver;
    bounds.max.x += xOver;
  }

  // Snap to integer coordinates.
  bounds.min.x = Math.floor(bounds.min.x);
  bounds.min.y = Math.floor(bounds.min.y);
  bounds.max.x = Math.ceil(bounds.max.x);
  bounds.max.y = Math.ceil(bounds.max.y);

  return bounds;
}
