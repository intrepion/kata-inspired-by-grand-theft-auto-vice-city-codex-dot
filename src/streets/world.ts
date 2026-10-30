export type Point = { x: number; z: number };
export type Block = Point & {
  w: number;
  d: number;
  h: number;
  color: string;
  name: string;
};
export const HOME = { x: 0, z: -4 };
export const CONTACT = { x: 0, z: 4 };
export const TAPE = { x: 0, z: 49 };
export const GARAGE = { x: 44, z: 0 };
export const BOUNDS = { left: -76, right: 76, bottom: -76, top: 106 };
export const roadsX = [-44, 0, 44];
export const roadsZ = [-44, 0, 44, 88];
const names = [
  "LIDO MOTEL",
  "ORBIT RECORDS",
  "WAVE FM",
  "SUNSET CLUB",
  "BAY MARKET",
  "PORT STORAGE",
];
export const blocks: Block[] = [-22, 22, 66].flatMap((z, row) =>
  [-22, 22].map((x, col) => ({
    x,
    z,
    w: 25,
    d: 25,
    h: 7 + ((row + col) % 3) * 3,
    color: ["#d3879b", "#6fa4a4", "#daaf80"][(row + col) % 3],
    name: names[row * 2 + col],
  })),
);
export const covers: Block[] = [
  {
    x: -5,
    z: 35,
    w: 3.5,
    d: 1.2,
    h: 0.7,
    color: "#d9bc84",
    name: "LOW BARRIER",
  },
  {
    x: 5,
    z: 51,
    w: 3.5,
    d: 1.2,
    h: 0.7,
    color: "#d9bc84",
    name: "LOW BARRIER",
  },
];
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.z - b.z);
export const angleDifference = (a: number, b: number) =>
  Math.atan2(Math.sin(a - b), Math.cos(a - b));
export function blocked(x: number, z: number, radius = 0, y = 0): boolean {
  if (
    x < BOUNDS.left + radius ||
    x > BOUNDS.right - radius ||
    z < BOUNDS.bottom + radius ||
    z > BOUNDS.top - radius
  )
    return true;
  return [...blocks, ...covers].some(
    (b) =>
      y < b.h &&
      Math.abs(x - b.x) < b.w / 2 + radius &&
      Math.abs(z - b.z) < b.d / 2 + radius,
  );
}
export function sight(a: Point, b: Point, height = 1.3): boolean {
  const steps = Math.ceil(distance(a, b) / 0.5);
  for (let i = 1; i < steps; i++) {
    if (
      blocked(
        a.x + ((b.x - a.x) * i) / steps,
        a.z + ((b.z - a.z) * i) / steps,
        0,
        height,
      )
    )
      return false;
  }
  return true;
}
export const nodes = roadsZ.flatMap((z) => roadsX.map((x) => ({ x, z })));
export function nearestNode(p: Point): number {
  return nodes.reduce(
    (best, point, i) =>
      distance(p, point) < distance(p, nodes[best]) ? i : best,
    0,
  );
}
export function towardNode(from: number, to: number): number {
  const col = from % 3,
    targetCol = to % 3;
  return col !== targetCol
    ? from + Math.sign(targetCol - col)
    : from + 3 * Math.sign(Math.floor(to / 3) - Math.floor(from / 3));
}

/** First obstruction on the camera segment, with a small clearance around scenery. */
export function cameraFraction(
  focus: Point & { y: number },
  eye: Point & { y: number },
): number {
  let closest = 1;
  for (const block of [...blocks, ...covers]) {
    let enter = 0,
      exit = 1,
      inside = true;
    const extents = {
      x: [block.x - block.w / 2 - 0.25, block.x + block.w / 2 + 0.25],
      z: [block.z - block.d / 2 - 0.25, block.z + block.d / 2 + 0.25],
      y: [-0.25, block.h + 0.25],
    };
    for (const axis of ["x", "y", "z"] as const) {
      const [min, max] = extents[axis],
        start = focus[axis],
        delta = eye[axis] - start;
      if (start < min || start > max) inside = false;
      if (Math.abs(delta) < 1e-9) {
        if (start < min || start > max) {
          enter = 2;
          break;
        }
        continue;
      }
      const a = (min - start) / delta,
        b = (max - start) / delta;
      enter = Math.max(enter, Math.min(a, b));
      exit = Math.min(exit, Math.max(a, b));
    }
    if (!inside && enter <= exit && enter >= 0 && enter < closest)
      closest = Math.max(0.16, enter - 0.06);
  }
  // Keep the camera inside the playable district even when looking outwards.
  for (const [axis, min, max] of [
    ["x", BOUNDS.left + 0.25, BOUNDS.right - 0.25],
    ["z", BOUNDS.bottom + 0.25, BOUNDS.top - 0.25],
  ] as const) {
    const delta = eye[axis] - focus[axis];
    if (delta > 0 && eye[axis] > max)
      closest = Math.min(closest, Math.max(0.16, (max - focus[axis]) / delta));
    if (delta < 0 && eye[axis] < min)
      closest = Math.min(closest, Math.max(0.16, (min - focus[axis]) / delta));
  }
  return closest;
}
