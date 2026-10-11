export type Point = { x: number; y: number };
export type Building = Point & {
  w: number;
  h: number;
  color: string;
  name: string;
  height: number;
};
export const WORLD = { w: 1800, h: 1400 };
export const ROAD_X = [180, 500, 820, 1140, 1460];
export const ROAD_Y = [180, 500, 820, 1140];
export const SAFE = { x: 180, y: 1140 };
export const buildings: Building[] = [];
const names = [
  "SOLAR MOTEL",
  "CASA AZUL",
  "ORBIT RECORDS",
  "PALM ARCADE",
  "SUNSET CLUB",
  "LIDO CINEMA",
  "MARLIN CAFE",
  "WAVE FM",
  "GLASS HOUSE",
  "CORAL COURT",
  "BAY MARKET",
  "PORT STORAGE",
];
for (let row = 0; row < 3; row++)
  for (let col = 0; col < 4; col++) {
    const x = ROAD_X[col] + 65,
      y = ROAD_Y[row] + 65;
    buildings.push({
      x,
      y,
      w: 190,
      h: 190,
      color: row === 0 ? "#d991a1" : col > 2 ? "#678d9b" : "#7998b5",
      name: names[row * 4 + col],
      height: 18 + ((col + row) % 3) * 12,
    });
  }
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);
export function solid(x: number, y: number, r: number): boolean {
  if (x < 75 + r || x > 1600 - r || y < 75 + r || y > 1290 - r) return true;
  return buildings.some(
    (b) => x > b.x - r && x < b.x + b.w + r && y > b.y - r && y < b.y + b.h + r,
  );
}
export const nodes = ROAD_Y.flatMap((y) => ROAD_X.map((x) => ({ x, y })));
export function nearestNode(p: Point): number {
  let best = 0;
  for (let i = 1; i < nodes.length; i++)
    if (distance(p, nodes[i]) < distance(p, nodes[best])) best = i;
  return best;
}
export function nextNode(from: number, to: number): number {
  const fx = from % 5,
    fy = Math.floor(from / 5),
    tx = to % 5,
    ty = Math.floor(to / 5);
  return fx !== tx
    ? from + Math.sign(tx - fx)
    : fy !== ty
      ? from + 5 * Math.sign(ty - fy)
      : from;
}
export function visible(a: Point, b: Point): boolean {
  const n = Math.ceil(distance(a, b) / 16);
  for (let i = 1; i < n; i++)
    if (solid(a.x + ((b.x - a.x) * i) / n, a.y + ((b.y - a.y) * i) / n, 0))
      return false;
  return true;
}
