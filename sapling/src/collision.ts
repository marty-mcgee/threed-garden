import Prando from "prando";

const PI2 = Math.PI * 2;

/** Normalize an angle in the range -PI to +PI. */
export function wrapAngle(angle: number): number {
  angle = angle % PI2;
  if (angle > Math.PI) {
    angle -= PI2;
  } else if (angle < -Math.PI) {
    angle += PI2;
  }
  return angle;
}

export function diffAngle(angle1: number, angle2: number) {
  return Math.abs(wrapAngle(angle1 - angle2));
}

/** Rather than doing an expensive calculation to determine which branches are
    occluding sunlight from other branches, we have a simple model.

    First, because we generate branches outward from root to leaf, we calculate
    how much the new branch would have shadowed older branches, rather than how much
    it would be shadowed by later ones.

    We generate several possible angles and compute how much it would have shadowed
    earlier branches. The shadowing effect is reduced for branches further down
    the trunk.
*/
export function computeShadowEffect(angle: number, prev: number[]): number {
  const shadowArc = Math.PI / 2;
  let shadowSum = 0;
  let coeff = 1;
  for (let i = 0; i < prev.length; i += 1) {
    shadowSum += Math.max(0, 1 - diffAngle(angle, prev[i]) / shadowArc) * coeff;
    coeff *= 0.8;
  }
  return shadowSum;
}

export function minimizeShadow(rnd: Prando, prev: number[]): number {
  let resultAngle = 0;
  let resultShadow = Infinity;
  for (let i = 0; i < 5; i += 1) {
    const angle = rnd.next() * Math.PI * 2;
    const shadow = computeShadowEffect(angle, prev);
    if (shadow < resultShadow) {
      resultShadow = shadow;
      resultAngle = angle;
    }
  }
  return resultAngle;
}
