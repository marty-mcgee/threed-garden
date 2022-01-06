import { computeShadowEffect, diffAngle, wrapAngle } from './collision';

test('wrapAngle', () => {
  expect(wrapAngle(0)).toBe(0);
  expect(wrapAngle(0.1)).toBe(0.1);
  expect(wrapAngle(-0.1)).toBe(-0.1);
  expect(wrapAngle(Math.PI - 0.1)).toBe(Math.PI - 0.1);
  expect(wrapAngle(Math.PI)).toBe(Math.PI);
  expect(wrapAngle(Math.PI + 0.1)).toBe(-Math.PI + 0.1);
  expect(wrapAngle(-Math.PI - 0.1)).toBe(Math.PI - 0.1);
  expect(wrapAngle(Math.PI * 2)).toBeCloseTo(0);
  expect(wrapAngle(-Math.PI * 2)).toBeCloseTo(0);
});

test('diffAngle', () => {
  expect(diffAngle(0, 0)).toBe(0);
  expect(diffAngle(0, 0.1)).toBeCloseTo(0.1);
  expect(diffAngle(0, -0.1)).toBeCloseTo(0.1);
  expect(diffAngle(0.1, 0)).toBeCloseTo(0.1);
  expect(diffAngle(-0.1, 0)).toBeCloseTo(0.1);
  expect(diffAngle(Math.PI, -Math.PI)).toBe(0);
  expect(diffAngle(-Math.PI, Math.PI)).toBe(0);
  expect(diffAngle(Math.PI + 0.1, -Math.PI)).toBeCloseTo(0.1);
  expect(diffAngle(Math.PI - 0.1, -Math.PI)).toBeCloseTo(0.1);
  expect(diffAngle(Math.PI, -Math.PI + 0.1)).toBeCloseTo(0.1);
  expect(diffAngle(Math.PI, -Math.PI - 0.1)).toBeCloseTo(0.1);
});

describe('computeShadowEffect', () => {
  test('[0]', () => {
    expect(computeShadowEffect(0, [])).toBeCloseTo(0);
    expect(computeShadowEffect(0.1, [])).toBeCloseTo(0);
    expect(computeShadowEffect(Math.PI, [])).toBeCloseTo(0);
    expect(computeShadowEffect(-Math.PI, [])).toBeCloseTo(0);
    expect(computeShadowEffect(Math.PI * 2, [])).toBeCloseTo(0);
  });

  test('[1]', () => {
    const prev = [0];
    expect(computeShadowEffect(0, prev)).toBeCloseTo(1);
    expect(computeShadowEffect(Math.PI / 4, prev)).toBeCloseTo(0.5);
    expect(computeShadowEffect(-Math.PI / 4, prev)).toBeCloseTo(0.5);
    expect(computeShadowEffect(Math.PI / 2, prev)).toBeCloseTo(0);
    expect(computeShadowEffect(Math.PI, prev)).toBeCloseTo(0);
    expect(computeShadowEffect(-Math.PI, prev)).toBeCloseTo(0);
  });

  test('[2] symmetrical', () => {
    const prev = [0, Math.PI];
    expect(computeShadowEffect(0, prev)).toBeCloseTo(1);
    expect(computeShadowEffect(Math.PI, prev)).toBeCloseTo(0.8);
    // expect(computeShadowEffect(-Math.PI / 4, prev)).toBeCloseTo(0.5);
    // expect(computeShadowEffect(Math.PI / 2, prev)).toBeCloseTo(0);
    // expect(computeShadowEffect(Math.PI, prev)).toBeCloseTo(0);
    // expect(computeShadowEffect(-Math.PI, prev)).toBeCloseTo(0);
  });

  test('[2]', () => {
    const prev = [0, Math.PI / 2];
    expect(computeShadowEffect(0, prev)).toBeCloseTo(1);
    expect(computeShadowEffect(Math.PI / 4, prev)).toBeCloseTo(0.9);
    expect(computeShadowEffect(-Math.PI / 4, prev)).toBeCloseTo(0.5);
    // expect(computeShadowEffect(Math.PI / 2, prev)).toBeCloseTo(0);
    // expect(computeShadowEffect(Math.PI, prev)).toBeCloseTo(0);
    expect(computeShadowEffect(-Math.PI, prev)).toBeCloseTo(0);
  });
});
