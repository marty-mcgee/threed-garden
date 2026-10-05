// Shared by the controller and placement clearance policy; saved physics is separate.
export const CHARACTER_CAPSULE_RADIUS = 0.3;
export const CHARACTER_CAPSULE_HALF_HEIGHT = 0.6;
export const CHARACTER_SPAWN_CLEARANCE = CHARACTER_CAPSULE_RADIUS * 2;
// Bounds of Garden's retained fallback cylinder (radii 0.3/0.4, height 0.8).
export const GARDEN_CHARACTER_COLLIDER_HALF_EXTENTS: [number, number, number] = [0.4, 0.4, 0.4];
export const GARDEN_CHARACTER_COLLIDER_CENTER_Y = 0.4;
